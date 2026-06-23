import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canWriteScope } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

// GET ?inspectionId= : load saved selections for an inspection
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const inspectionId = searchParams.get('inspectionId')
  if (!inspectionId) return NextResponse.json({ error: 'inspectionId required' }, { status: 400 })

  try {
    const rows = await queryPrimary(
      'SELECT purchased_part, po_number, batch_serial, file_path, selected_by, selected_at FROM inspection_cert_selections WHERE inspection_id = ?',
      [inspectionId]
    )
    // Keyed by part|po|batch for easy client merge
    const selections: Record<string, any> = {}
    for (const r of rows || []) {
      selections[`${r.purchased_part}|${r.po_number}|${r.batch_serial}`] = {
        filePath: r.file_path, selectedBy: r.selected_by, selectedAt: r.selected_at,
      }
    }
    return NextResponse.json({ success: true, selections })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// POST : save (or clear) a selection
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  const username = (session.user as any)?.username || session.user?.name || 'unknown'
  if (!canWriteScope(roles, 'operations/inspections')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { inspectionId, purchasedPart, poNumber, batchSerial, clear } = body
    if (!inspectionId || !purchasedPart) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    if (clear) {
      await queryPrimary(
        'DELETE FROM inspection_cert_selections WHERE inspection_id = ? AND purchased_part = ? AND po_number = ? AND batch_serial = ?',
        [inspectionId, purchasedPart, poNumber || '', batchSerial || '']
      )
      return NextResponse.json({ success: true, cleared: true })
    }

    const filePath = (body.filePath || '').toString()

    await queryPrimary(
      `INSERT INTO inspection_cert_selections
        (inspection_id, purchased_part, po_number, batch_serial, file_path, selected_by)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), selected_by = VALUES(selected_by)`,
      [inspectionId, purchasedPart, poNumber || '', batchSerial || '', filePath, username]
    )
    return NextResponse.json({ success: true, selectedBy: username })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
