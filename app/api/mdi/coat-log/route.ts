import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMySQL } from '@/lib/mysql'

const HINT = 'Ensure the mdi_coat_log table exists (run sql/create_mdi_coat_log.sql).'

// GET — recent COAT log entries (optionally ?workOrder= to filter).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const wo = (request.nextUrl.searchParams.get('workOrder') || '').trim()
    const rows = await queryMySQL<any>(
      `SELECT id, work_order, part_number, badge, user_id, lot_size, lam_roll_speed,
              film_type, washdown_defect_code, washdown_defect_desc, layers_washed_down,
              comments, created_at
       FROM mdi_coat_log
       ${wo ? 'WHERE work_order = ?' : ''}
       ORDER BY created_at DESC LIMIT 100`,
      wo ? [wo] : []
    )
    return NextResponse.json({ entries: rows })
  } catch (error) {
    console.error('coat_log GET error:', error)
    return NextResponse.json({ error: 'Failed to load COAT log', details: HINT }, { status: 500 })
  }
}

// POST — record a COAT washdown event.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    // Accept a single workOrder or a list (many mode). Each WO becomes its own
    // row with the same shared washdown fields.
    const woList: { wo: string; part: string }[] = []
    if (Array.isArray(body.workOrders) && body.workOrders.length) {
      for (const w of body.workOrders) {
        if (typeof w === 'string') { if (w.trim()) woList.push({ wo: w.trim(), part: '' }) }
        else if (w && w.workOrder) woList.push({ wo: String(w.workOrder).trim(), part: String(w.partNumber || '').trim() })
      }
    } else if (body.workOrder) {
      woList.push({ wo: String(body.workOrder).trim(), part: String(body.partNumber || '').trim() })
    }
    if (!woList.length) return NextResponse.json({ error: 'At least one work order is required' }, { status: 400 })

    // Lot Size #PNL range is 1..100.
    let lotSize: number | null = null
    if (body.lotSize !== undefined && body.lotSize !== null && body.lotSize !== '') {
      lotSize = parseInt(String(body.lotSize), 10)
      if (isNaN(lotSize) || lotSize < 1 || lotSize > 100) {
        return NextResponse.json({ error: 'Lot Size must be a number from 1 to 100' }, { status: 400 })
      }
    }

    // Layers washed down range is 0..50 (default 0). A washdown defect code is
    // only meaningful when layers > 0.
    let layers = 0
    if (body.layersWashedDown !== undefined && body.layersWashedDown !== '') {
      layers = parseInt(String(body.layersWashedDown), 10)
      if (isNaN(layers) || layers < 0 || layers > 50) {
        return NextResponse.json({ error: 'Layers Washed Down must be 0 to 50' }, { status: 400 })
      }
    }
    const defectCode = layers > 0 && body.washdownDefectCode ? String(body.washdownDefectCode).trim() : null
    const defectDesc = layers > 0 && body.washdownDefectDesc ? String(body.washdownDefectDesc).slice(0, 255) : null

    const lamSpeed = body.lamRollSpeed !== undefined && body.lamRollSpeed !== '' ? Number(body.lamRollSpeed) : null
    const comments = body.comments ? String(body.comments).slice(0, 500) : null
    const filmType = body.filmType ? String(body.filmType).trim() : null
    const badge = body.badge ? String(body.badge).trim() : null
    const userId = (session.user as any)?.name || (session.user as any)?.email || null

    // Insert one row per work order.
    for (const { wo, part } of woList) {
      await queryMySQL(
        `INSERT INTO mdi_coat_log
          (work_order, part_number, badge, user_id, lot_size, lam_roll_speed,
           film_type, washdown_defect_code, washdown_defect_desc, layers_washed_down, comments)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [wo, part || (body.partNumber ? String(body.partNumber).trim() : null), badge, userId,
         lotSize, lamSpeed, filmType, defectCode, defectDesc, layers, comments]
      )
    }
    return NextResponse.json({ success: true, count: woList.length })
  } catch (error) {
    console.error('coat_log POST error:', error)
    return NextResponse.json({ error: 'Failed to save COAT entry', details: HINT }, { status: 500 })
  }
}
