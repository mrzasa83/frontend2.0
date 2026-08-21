import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { JDRIVE } from '@/lib/config/drives'
import * as fs from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'

// ─── File location on the network share ─────────────────────────
const YIELD_DIR = () => `${JDRIVE()}/APC EngJobs/_admin/yield`

// Find the latest file matching a prefix pattern, with optional exclusion
function findLatestFile(dir: string, prefix: string, excludePrefix?: string): string | null {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith(prefix) && (f.endsWith('.xls') || f.endsWith('.xlsx')))
      .filter(f => !excludePrefix || !f.startsWith(excludePrefix))
      .sort()
      .reverse()
    return files.length > 0 ? path.join(dir, files[0]) : null
  } catch (err) {
    console.error(`Error reading yield directory ${dir}:`, err)
    return null
  }
}

// Parse .xls file — find header row with "YR Month", then read data rows
// Note: Using fs.readFileSync + XLSX.read instead of XLSX.readFile because
// the standalone Next.js bundle breaks XLSX's internal file access.
function parseExcelFile(filePath: string): any[] {
  const buffer = fs.readFileSync(filePath)
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // Find header row
  let headerIdx = -1
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    if (String(raw[i]?.[0]).trim().startsWith('YR Month')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) throw new Error(`Could not find header row in ${path.basename(filePath)}`)

  const headers = raw[headerIdx].map((h: any) => String(h).trim().replace(/\n/g, ' '))

  const rows: any[] = []
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i]
    if (!r || !r[0] || String(r[0]).trim() === '') continue
    const obj: any = {}
    headers.forEach((h: string, ci: number) => {
      obj[h] = r[ci] ?? ''
    })
    rows.push(obj)
  }
  return rows
}

function deptPrefix(deptCode: string): string {
  return (deptCode || '').charAt(0).toUpperCase()
}

type GroupingMap = Record<string, { discipline: string; sort_order: number }>

async function loadGroupings(): Promise<GroupingMap> {
  const rows = await queryPrimary<{ prefix: string; discipline: string; sort_order: number }[]>(
    `SELECT prefix, discipline, sort_order FROM dept_groupings WHERE active = 1`
  )
  const map: GroupingMap = {}
  for (const r of rows) {
    map[r.prefix] = { discipline: r.discipline, sort_order: r.sort_order }
  }
  return map
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { discipline, manufLevel } = body

    const yieldDir = YIELD_DIR()

    // ─── Find latest files ──────────────────────────────────────
    // Summary: "Net Yield_2026..." — exclude "Net Yield Detail_"
    const summaryFile = findLatestFile(yieldDir, 'Net Yield_', 'Net Yield Detail_')
    const detailFile = findLatestFile(yieldDir, 'Net Yield Detail_')

    if (!summaryFile) {
      return NextResponse.json({
        error: 'Net Yield summary file not found',
        details: `Looked in: ${yieldDir} for files starting with "Net Yield_..."`,
      }, { status: 404 })
    }
    if (!detailFile) {
      return NextResponse.json({
        error: 'Net Yield Detail file not found',
        details: `Looked in: ${yieldDir} for files starting with "Net Yield Detail_..."`,
      }, { status: 404 })
    }

    // ─── Parse both files ───────────────────────────────────────
    const summaryRows = parseExcelFile(summaryFile)
    const detailRows = parseExcelFile(detailFile)

    // ─── Load department groupings ──────────────────────────────
    const groupings = await loadGroupings()

    // ─── Filter summary by manuf level and completed WOs ────────
    const filteredSummary = summaryRows.filter(r => {
      if (manufLevel && String(r['Part (Manuf) Level']).trim().toUpperCase() !== manufLevel.toUpperCase()) return false
      return true
    })

    // ─── Filter detail: completed WOs, manuf level ──────────────
    const filteredDetail = detailRows.filter(r => {
      const status = String(r['WO Prod Status'] || 'COMPLETED').trim().toUpperCase()
      if (status !== 'COMPLETED') return false
      if (manufLevel && String(r['Part (Manuf) Level']).trim().toUpperCase() !== manufLevel.toUpperCase()) return false
      return true
    })

    // ─── Enrich detail with discipline ──────────────────────────
    const enrichedDetail = filteredDetail.map(row => {
      const dc = String(row['DEPT CODE'] || '').trim()
      const prefix = deptPrefix(dc)
      const group = groupings[prefix]
      return {
        yrMonth: String(row['YR Month']).trim(),
        deptCode: dc,
        discipline: group?.discipline || `Unknown (${prefix})`,
        disciplineSortOrder: group?.sort_order || 999,
        rejDescription: String(row['ROUTE STEP TRX REJECT DESCRIPTION'] || '').trim(),
        rejCode: String(row['TRX REJ CODE'] || '').trim(),
        pnlReject: parseFloat(row['TRX PNL REJECT']) || 0,
        glRejValue: parseFloat(row['GL REJ VALUE APPLIED']) || 0,
      }
    })

    // Apply discipline filter
    const discFiltered = discipline
      ? enrichedDetail.filter(r => r.discipline === discipline)
      : enrichedDetail

    // ═══════════════════════════════════════════════════════════════
    // RUN CHART (Slide 9): bars = Scrapped PNLs, line = Yield %
    // ═══════════════════════════════════════════════════════════════
    const monthlyAgg: Record<string, { scrapPnls: number; producedPnls: number; schedPnls: number }> = {}

    for (const row of filteredSummary) {
      const ym = String(row['YR Month']).trim()
      if (!ym || ym.length < 7) continue
      if (!monthlyAgg[ym]) monthlyAgg[ym] = { scrapPnls: 0, producedPnls: 0, schedPnls: 0 }
      monthlyAgg[ym].scrapPnls += parseFloat(row['Scrapped WO PNLs']) || 0
      monthlyAgg[ym].producedPnls += parseFloat(row['Produced WO PNLs']) || 0
      monthlyAgg[ym].schedPnls += parseFloat(row['Sched WO PNLs'] || row['Sched WO PNLS']) || 0
    }

    // When discipline is selected, use detail-sourced scrap for the bars
    const monthlyScrapByDisc: Record<string, number> = {}
    if (discipline) {
      for (const row of discFiltered) {
        if (!row.yrMonth) continue
        monthlyScrapByDisc[row.yrMonth] = (monthlyScrapByDisc[row.yrMonth] || 0) + row.pnlReject
      }
    }

    const allMonths = [...new Set([
      ...Object.keys(monthlyAgg),
      ...Object.keys(monthlyScrapByDisc),
    ])].sort()

    const runChartData = allMonths.map(m => {
      const agg = monthlyAgg[m] || { scrapPnls: 0, producedPnls: 0, schedPnls: 0 }
      const scrapBars = discipline ? (monthlyScrapByDisc[m] || 0) : agg.scrapPnls
      // Yield = (produced - total_scrap) / produced
      // Always use overall totals for yield (not discipline-filtered)
      const overallAgg = monthlyAgg[m] || { scrapPnls: 0, producedPnls: 0, schedPnls: 0 }
      const yieldPct = overallAgg.producedPnls > 0
        ? ((overallAgg.producedPnls - overallAgg.scrapPnls) / overallAgg.producedPnls) * 100
        : 0
      return {
        month: m,
        scrapPnls: Math.round(scrapBars * 100) / 100,
        throughputPnls: Math.round(agg.producedPnls * 100) / 100,
        yieldPct: Math.round(yieldPct * 100) / 100,
      }
    })

    // ═══════════════════════════════════════════════════════════════
    // PARETO (Slide 12): bars = Panels scrapped desc, line = cum %
    // ═══════════════════════════════════════════════════════════════
    const paretoMap: Record<string, { description: string; code: string; panels: number; value: number }> = {}
    for (const row of discFiltered) {
      const desc = row.rejDescription
      if (!desc) continue
      if (!paretoMap[desc]) {
        paretoMap[desc] = { description: desc, code: row.rejCode, panels: 0, value: 0 }
      }
      paretoMap[desc].panels += row.pnlReject
      paretoMap[desc].value += row.glRejValue
    }

    const paretoList = Object.values(paretoMap).sort((a, b) => b.panels - a.panels)
    const paretoTotal = paretoList.reduce((s, d) => s + d.panels, 0)
    let cumulative = 0
    const paretoData = paretoList.map(d => {
      cumulative += d.panels
      return {
        ...d,
        panels: Math.round(d.panels * 100) / 100,
        cumulativePct: paretoTotal > 0 ? Math.round((cumulative / paretoTotal) * 10000) / 100 : 0,
      }
    })

    // ─── Filter option lists ────────────────────────────────────
    const discSet = new Set<string>()
    for (const row of enrichedDetail) discSet.add(row.discipline)
    const disciplines = [...discSet].sort((a, b) => {
      const as = enrichedDetail.find(r => r.discipline === a)?.disciplineSortOrder || 999
      const bs = enrichedDetail.find(r => r.discipline === b)?.disciplineSortOrder || 999
      return as - bs
    })

    const manufLevels = [...new Set(
      summaryRows.map(r => String(r['Part (Manuf) Level']).trim()).filter(Boolean)
    )].sort()

    return NextResponse.json({
      success: true,
      files: {
        summary: path.basename(summaryFile),
        detail: path.basename(detailFile),
      },
      totalDetailRecords: discFiltered.length,
      totalScrapPnls: Math.round(paretoTotal * 100) / 100,
      disciplines,
      manufLevels,
      runChartData,
      paretoData,
    })
  } catch (error) {
    console.error('Error processing scrap data:', error)
    return NextResponse.json({
      error: 'Failed to process scrap data',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
