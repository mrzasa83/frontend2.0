import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as fs from 'fs'

const SCALE_FILE = () => process.env.SCALE_SUMMARY_PATH || '/mnt/scale/scale_summary.json'

type ScaleRecord = {
  Date: string
  Note: string
  PartNumber: string
  Version: string
  User: string
}

// Cache: re-read file at most every 60 seconds
let cache: { data: ScaleRecord[]; mtime: number; checkedAt: number } | null = null
const CACHE_TTL = 60_000

function loadScaleData(): ScaleRecord[] {
  const filePath = SCALE_FILE()

  // Check cache freshness
  if (cache) {
    const now = Date.now()
    if (now - cache.checkedAt < CACHE_TTL) return cache.data

    // Check if file changed
    try {
      const stat = fs.statSync(filePath)
      if (stat.mtimeMs === cache.mtime) {
        cache.checkedAt = now
        return cache.data
      }
    } catch {
      // File gone — clear cache
      cache = null
    }
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const data: ScaleRecord[] = JSON.parse(raw)
  const stat = fs.statSync(filePath)
  cache = { data, mtime: stat.mtimeMs, checkedAt: Date.now() }
  return data
}

// GET — full list (with optional ?partNumber= filter)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = loadScaleData()
    const { searchParams } = new URL(request.url)
    const partFilter = searchParams.get('partNumber')

    let filtered = data
    if (partFilter) {
      const pn = partFilter.trim()
      filtered = data.filter(r => r.PartNumber === pn)
    }

    // Sort: PartNumber asc, then Version desc (numeric)
    filtered.sort((a, b) => {
      const pnCmp = a.PartNumber.localeCompare(b.PartNumber, undefined, { numeric: true })
      if (pnCmp !== 0) return pnCmp
      return (parseInt(b.Version) || 0) - (parseInt(a.Version) || 0)
    })

    // Get file modification date
    const filePath = SCALE_FILE()
    const stat = fs.statSync(filePath)
    const fileDate = new Date(stat.mtimeMs).toLocaleDateString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

    return NextResponse.json({
      success: true,
      count: filtered.length,
      totalRecords: data.length,
      fileDate,
      data: filtered,
    })
  } catch (error) {
    console.error('Error reading scale data:', error)
    return NextResponse.json({
      error: 'Failed to read scale data',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
