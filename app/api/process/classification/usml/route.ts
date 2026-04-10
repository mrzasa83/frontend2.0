import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary, getMySQLPrimaryPool } from '@/lib/db/mysql-primary'

const ECFR_URL = 'https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-121'

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
       FROM usml_classification
       ORDER BY id ASC`
    )

    const meta = await queryPrimary<any[]>(
      `SELECT last_refreshed, record_count, source_url FROM usml_metadata WHERE id = 1`
    )

    return NextResponse.json({
      success: true,
      data,
      metadata: meta[0] || { last_refreshed: null, record_count: 0, source_url: ECFR_URL },
    })
  } catch (error) {
    console.error('Error fetching USML data:', error)
    return NextResponse.json({
      error: 'Failed to fetch USML data',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// ─── POST: refresh from eCFR ────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action

    if (action !== 'refresh') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    // Fetch from eCFR
    console.log('Fetching USML data from eCFR...')
    const res = await fetch(ECFR_URL, {
      headers: { 'Accept': 'text/html' },
    })

    if (!res.ok) {
      throw new Error(`eCFR returned ${res.status}: ${res.statusText}`)
    }

    const html = await res.text()
    const records = parseUSMLFromHTML(html)

    if (records.length === 0) {
      throw new Error('Parser returned 0 records — eCFR page format may have changed')
    }

    console.log(`Parsed ${records.length} USML records`)

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
        [records.length, ECFR_URL, records.length, ECFR_URL]
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
      message: `Refreshed ${records.length} USML records from eCFR`,
      count: records.length,
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
// Parses the eCFR HTML page for § 121.1 content into a flat
// table with parent-child relationships via parentId.

type ParsedRecord = {
  id: number
  category: string
  parentId: number
  level: number
  cDescription: string
  SME: string | null
}

function parseUSMLFromHTML(html: string): ParsedRecord[] {
  const records: ParsedRecord[] = []
  let nextId = 1

  // Extract text content — strip HTML tags, normalize whitespace
  // We look for section 121.1 content between the Category headers
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8212;/g, '—')
    .replace(/\r\n/g, '\n')

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Roman numeral map for categories
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']

  let currentCategoryId = 0   // ID of current top-level category
  let currentLetterId = 0     // ID of current letter-level item
  let currentNumberId = 0     // ID of current number-level item
  let inSection121 = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect start of § 121.1 content
    if (line.includes('121.1') && line.includes('Munitions List')) {
      inSection121 = true
      continue
    }

    if (!inSection121) continue

    // Stop if we hit § 121.2 or another section
    if (/§\s*121\.[2-9]/.test(line) || /§§\s*121\.2/.test(line)) break

    // ── Category line: "Category I—Firearms and Related Articles"
    const catMatch = line.match(/^Category\s+(I{1,3}|IV|V?I{0,3}|VI{1,3}|IX|X{1,3}|XI{1,3}|XII{1,3}|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI)\s*[—–-]\s*(.+)/i)
    if (catMatch) {
      const rec: ParsedRecord = {
        id: nextId++,
        category: catMatch[1],
        parentId: 0,
        level: 0,
        cDescription: catMatch[2].trim(),
        SME: null,
      }
      records.push(rec)
      currentCategoryId = rec.id
      currentLetterId = 0
      currentNumberId = 0
      continue
    }

    if (currentCategoryId === 0) continue // skip until first category

    // ── Starred or unstarred letter item: "* (a) text" or "(a) text"
    const letterMatch = line.match(/^(\*\s*)?\(([a-z])\)\s+(.+)/i)
    if (letterMatch && !/^\(\d/.test(line)) {
      // Make sure it's a single letter (not a number in parens)
      const letter = letterMatch[2].toLowerCase()
      if (letter.length === 1 && letter >= 'a' && letter <= 'z') {
        const sme = letterMatch[1] ? 'YES' : null
        let desc = letterMatch[3].trim()

        // Skip [Reserved] items
        if (/^\[Reserved\]$/i.test(desc)) continue
        // Skip ranges like (j)-(w) [Reserved]
        if (/^\([a-z]\)\s*\[Reserved\]/i.test(desc)) continue

        const rec: ParsedRecord = {
          id: nextId++,
          category: letter,
          parentId: currentCategoryId,
          level: 1,
          cDescription: desc,
          SME: sme,
        }
        records.push(rec)
        currentLetterId = rec.id
        currentNumberId = 0
        continue
      }
    }

    // ── Starred reserved range like "* (j)-(w) [Reserved]" — skip
    if (/^\*?\s*\([a-z]\)-\([a-z]\)\s*\[Reserved\]/i.test(line)) continue

    // ── Numbered sub-item: "* (1) text" or "(1) text"
    const numMatch = line.match(/^(\*\s*)?\((\d+)\)\s+(.+)/)
    if (numMatch && currentLetterId > 0) {
      const sme = numMatch[1] ? 'YES' : null
      const desc = numMatch[3].trim()

      const rec: ParsedRecord = {
        id: nextId++,
        category: numMatch[2],
        parentId: currentLetterId,
        level: 2,
        cDescription: desc,
        SME: sme,
      }
      records.push(rec)
      currentNumberId = rec.id
      continue
    }

    // ── Roman numeral sub-sub-item: "(i) text" or "(ii) text"
    const romanSubMatch = line.match(/^(\*\s*)?\((i{1,3}|iv|v|vi{0,3})\)\s+(.+)/i)
    if (romanSubMatch && currentNumberId > 0) {
      const sme = romanSubMatch[1] ? 'YES' : null
      const desc = romanSubMatch[3].trim()
      const romanVal = romanSubMatch[2].toLowerCase()

      // Avoid matching single (i) as a letter item at level 1
      if (['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'].includes(romanVal)) {
        const rec: ParsedRecord = {
          id: nextId++,
          category: romanVal,
          parentId: currentNumberId,
          level: 3,
          cDescription: desc,
          SME: sme,
        }
        records.push(rec)
        continue
      }
    }
  }

  return records
}
