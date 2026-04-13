import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary, getMySQLPrimaryPool } from '@/lib/db/mysql-primary'

const ECFR_API_BASE = 'https://www.ecfr.gov/api/versioner/v1/full'
const ECFR_DISPLAY_URL = 'https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-121'

type USMLRow = {
  id: number
  category: string
  parentId: number
  level: number
  cDescription: string
  SME: string | null
}

// ─── GET: serve stored data (or debug XML with ?debug=1) ────────
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  // Debug mode: fetch XML and show what the parser sees
  if (searchParams.get('debug') === '1') {
    try {
      const { xmlText, apiDate } = await fetchECFR()
      const lines = stripToLines(xmlText)

      // Find lines containing "Category" or "121"
      const interesting = lines
        .map((l, i) => ({ i, l }))
        .filter(({ l }) => /category/i.test(l) || /121/.test(l) || /firearms/i.test(l))
        .slice(0, 50)

      return NextResponse.json({
        debug: true,
        apiDate,
        totalChars: xmlText.length,
        totalLines: lines.length,
        first50Lines: lines.slice(0, 50),
        interestingLines: interesting,
        rawFirst500: xmlText.slice(0, 500),
      })
    } catch (error) {
      return NextResponse.json({
        error: 'Debug fetch failed',
        details: error instanceof Error ? error.message : String(error),
      }, { status: 500 })
    }
  }

  try {
    const data = await queryPrimary<USMLRow[]>(
      `SELECT id, category, parentId, level, cDescription, SME
       FROM usml_classification ORDER BY id ASC`
    )

    const meta = await queryPrimary<any[]>(
      `SELECT last_refreshed, record_count, source_url FROM usml_metadata WHERE id = 1`
    )

    return NextResponse.json({
      success: true,
      data,
      metadata: meta[0] || { last_refreshed: null, record_count: 0, source_url: ECFR_DISPLAY_URL },
    })
  } catch (error) {
    console.error('Error fetching USML data:', error)
    return NextResponse.json({
      error: 'Failed to fetch USML data',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// ─── Fetch from eCFR XML API ────────────────────────────────────
async function fetchECFR(): Promise<{ xmlText: string; apiDate: string }> {
  for (let daysBack = 0; daysBack <= 14; daysBack++) {
    const d = new Date()
    d.setDate(d.getDate() - daysBack)
    const dateStr = d.toISOString().slice(0, 10)
    const url = `${ECFR_API_BASE}/${dateStr}/title-22.xml?part=121`

    console.log(`  Trying ${dateStr}...`)
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) })
      if (res.ok) {
        const xmlText = await res.text()
        console.log(`  OK — ${xmlText.length.toLocaleString()} chars from ${dateStr}`)
        return { xmlText, apiDate: dateStr }
      }
      console.log(`  ${res.status} for ${dateStr}`)
    } catch (err) {
      console.log(`  Error for ${dateStr}: ${err}`)
    }
  }
  throw new Error('Could not fetch from eCFR XML API for any recent date')
}

// ─── Strip XML to text lines ────────────────────────────────────
function stripToLines(xmlText: string): string[] {
  let text = xmlText
    // Strip tags
    .replace(/<[^>]+>/g, '\n')
    // Decode XML/HTML entities
    .replace(/&#x2014;/gi, '\u2014')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#x2013;/gi, '\u2013')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#xA7;/gi, '\u00A7')
    .replace(/&#167;/g, '\u00A7')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&#\d+;/g, '')  // strip remaining numeric entities
    .replace(/&#x[0-9a-f]+;/gi, '')  // strip remaining hex entities

  return text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
}

// ─── POST: refresh from eCFR ────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    if (body.action !== 'refresh') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    console.log('Fetching USML data from eCFR XML API...')
    const { xmlText, apiDate } = await fetchECFR()
    const lines = stripToLines(xmlText)
    console.log(`  ${lines.length} text lines after stripping`)

    const records = parseLines(lines)

    if (records.length === 0) {
      // Log debug info
      const catLines = lines.filter(l => /category/i.test(l)).slice(0, 10)
      console.error('Parser found 0 records. Lines containing "category":')
      catLines.forEach(l => console.error(`  "${l}"`))
      console.error('First 20 lines:')
      lines.slice(0, 20).forEach(l => console.error(`  "${l}"`))

      throw new Error(
        `Parser returned 0 records from ${apiDate} data. ` +
        `${lines.length} lines extracted. ` +
        `Found ${catLines.length} lines containing "category". ` +
        `Use ?debug=1 on GET to inspect.`
      )
    }

    console.log(`Parsed ${records.length} USML records from ${apiDate}`)

    // Replace in transaction
    const pool = getMySQLPrimaryPool()
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.execute('DELETE FROM usml_classification')

      for (const rec of records) {
        await conn.execute(
          `INSERT INTO usml_classification (id, category, parentId, level, cDescription, SME)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [rec.id, rec.category, rec.parentId, rec.level, rec.cDescription, rec.SME]
        )
      }

      await conn.execute(
        `INSERT INTO usml_metadata (id, last_refreshed, record_count, source_url)
         VALUES (1, NOW(), ?, ?)
         ON DUPLICATE KEY UPDATE last_refreshed = NOW(), record_count = ?, source_url = ?`,
        [records.length, ECFR_DISPLAY_URL, records.length, ECFR_DISPLAY_URL]
      )

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    return NextResponse.json({
      success: true,
      message: `Refreshed ${records.length} USML records from eCFR (${apiDate})`,
      count: records.length,
      apiDate,
    })
  } catch (error) {
    console.error('Error refreshing USML data:', error)
    return NextResponse.json({
      error: 'Failed to refresh from eCFR',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// ─── Parser ─────────────────────────────────────────────────────

type ParsedRecord = {
  id: number
  category: string
  parentId: number
  level: number
  cDescription: string
  SME: string | null
}

function parseLines(lines: string[]): ParsedRecord[] {
  const records: ParsedRecord[] = []
  let nextId = 1
  let currentCatId = 0
  let currentLetterId = 0
  let currentNumberId = 0
  let inSection = false

  // Broad category regex: handles em-dash, en-dash, hyphen, and various whitespace
  const catRe = /Category\s+(I{1,3}|IV|V?I{0,3}|VI{1,3}|IX|X{1,3}|XI{1,3}|XII{1,3}|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI)\s*[\u2014\u2013\-\u2012\u2015]+\s*(.+)/i
  const letterRe = /^(\*\s*)?\(([a-z])\)\s+(.+)/
  const numberRe = /^(\*\s*)?\((\d+)\)\s+(.+)/
  const romanSubRe = /^(\*\s*)?\((i{1,3}|iv|vi{0,3}|v)\)\s+(.+)/
  const reservedRangeRe = /^\*?\s*\([a-z]\)\s*[\-\u2013\u2014]\s*\([a-z]\)\s*\[Reserved\]/i

  for (const line of lines) {
    // Broad detection for § 121.1 — handle § as unicode or text
    if (!inSection) {
      if (
        (line.includes('121.1') && (line.includes('Munitions') || line.includes('United States'))) ||
        (line.includes('121.1') && line.includes('List'))
      ) {
        inSection = true
        console.log(`  Parser: entering section at: "${line.slice(0, 80)}"`)
        continue
      }
      // Also check for the actual category start without the section header
      if (catRe.test(line) && /Category\s+I\b/i.test(line)) {
        inSection = true
        console.log(`  Parser: entering section via first category: "${line.slice(0, 80)}"`)
        // Don't continue — let it fall through to category matching below
      }
    }

    if (!inSection) continue

    // Stop at next section
    if (/121\.[2-9]/.test(line) && /Reserved/.test(line)) break

    // Skip notes
    if (/^Note\s+\d/i.test(line) || line.startsWith('Note:')) continue

    // Category
    const catMatch = catRe.exec(line)
    if (catMatch) {
      records.push({
        id: nextId, category: catMatch[1], parentId: 0,
        level: 0, cDescription: catMatch[2].trim(), SME: null,
      })
      currentCatId = nextId
      currentLetterId = 0
      currentNumberId = 0
      nextId++
      continue
    }

    if (currentCatId === 0) continue
    if (reservedRangeRe.test(line)) continue

    // Letter
    const letterMatch = letterRe.exec(line)
    if (letterMatch) {
      const letter = letterMatch[2].toLowerCase()
      if (letter.length === 1 && letter >= 'a' && letter <= 'z') {
        const desc = letterMatch[3].trim()
        if (/^\[Reserved\]$/i.test(desc)) continue
        records.push({
          id: nextId, category: letter, parentId: currentCatId,
          level: 1, cDescription: desc,
          SME: letterMatch[1] ? 'YES' : null,
        })
        currentLetterId = nextId
        currentNumberId = 0
        nextId++
        continue
      }
    }

    // Number
    const numMatch = numberRe.exec(line)
    if (numMatch && currentLetterId > 0) {
      records.push({
        id: nextId, category: numMatch[2], parentId: currentLetterId,
        level: 2, cDescription: numMatch[3].trim(),
        SME: numMatch[1] ? 'YES' : null,
      })
      currentNumberId = nextId
      nextId++
      continue
    }

    // Roman sub-item
    const romanMatch = romanSubRe.exec(line)
    if (romanMatch && currentNumberId > 0) {
      const rv = romanMatch[2].toLowerCase()
      if (['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'].includes(rv)) {
        records.push({
          id: nextId, category: rv, parentId: currentNumberId,
          level: 3, cDescription: romanMatch[3].trim(),
          SME: romanMatch[1] ? 'YES' : null,
        })
        nextId++
        continue
      }
    }
  }

  return records
}
