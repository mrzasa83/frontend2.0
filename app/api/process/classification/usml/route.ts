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

// ─── GET: serve stored data + metadata ──────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

// ─── POST: refresh from eCFR XML API ────────────────────────────
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

    // Fetch from eCFR XML API — try today, then back up to 14 days
    console.log('Fetching USML data from eCFR XML API...')
    let xmlText = ''
    let apiDate = ''

    for (let daysBack = 0; daysBack <= 14; daysBack++) {
      const d = new Date()
      d.setDate(d.getDate() - daysBack)
      const dateStr = d.toISOString().slice(0, 10)
      const url = `${ECFR_API_BASE}/${dateStr}/title-22.xml?part=121`

      console.log(`  Trying ${dateStr}...`)
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(60000) })
        if (res.ok) {
          xmlText = await res.text()
          apiDate = dateStr
          console.log(`  OK — ${xmlText.length.toLocaleString()} chars from ${dateStr}`)
          break
        } else if (res.status === 404) {
          console.log(`  404 for ${dateStr}`)
        } else {
          console.log(`  ${res.status} for ${dateStr}`)
        }
      } catch (err) {
        console.log(`  Error for ${dateStr}: ${err}`)
      }
    }

    if (!xmlText) {
      throw new Error('Could not fetch from eCFR XML API for any recent date (tried 15 days)')
    }

    // Parse XML text into records
    const records = parseUSML(xmlText)

    if (records.length === 0) {
      throw new Error(`Parser returned 0 records from ${apiDate} data — format may have changed`)
    }

    console.log(`Parsed ${records.length} USML records from ${apiDate}`)

    // Replace all data in a transaction
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

function parseUSML(xmlText: string): ParsedRecord[] {
  // Strip all XML/HTML tags to get plain text lines
  const text = xmlText
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8217;/g, '\u2019')

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  const records: ParsedRecord[] = []
  let nextId = 1
  let currentCatId = 0
  let currentLetterId = 0
  let currentNumberId = 0
  let inSection = false

  const catRe = /Category\s+(I{1,3}|IV|V?I{0,3}|VI{1,3}|IX|X{1,3}|XI{1,3}|XII{1,3}|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI)\s*[\u2014\u2013\-]\s*(.+)/i
  const letterRe = /^(\*\s*)?\(([a-z])\)\s+(.+)/i
  const numberRe = /^(\*\s*)?\((\d+)\)\s+(.+)/
  const romanSubRe = /^(\*\s*)?\((i{1,3}|iv|vi{0,3}|v)\)\s+(.+)/i
  const reservedRangeRe = /^\*?\s*\([a-z]\)\s*-\s*\([a-z]\)\s*\[Reserved\]/i

  for (const line of lines) {
    if (line.includes('121.1') && (line.includes('Munitions') || line.includes('United States'))) {
      inSection = true
      continue
    }
    if (!inSection) continue
    if (/§\s*121\.[2-9]/.test(line) || /§§\s*121\.2/.test(line)) break
    if (line.startsWith('Note ') || line.startsWith('Note:')) continue

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
