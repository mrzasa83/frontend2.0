import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canWriteScope } from '@/lib/config/access'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const sha1 = (s: string) => crypto.createHash('sha1').update(s).digest('hex')

// GET ?inspectionId= : load the PO certs related to an inspection
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const inspectionId = new URL(request.url).searchParams.get('inspectionId')
  if (!inspectionId) return NextResponse.json({ error: 'inspectionId required' }, { status: 400 })

  try {
    const rows = await queryPrimary(
      `SELECT apc_part, customer_part, version_label, po_folder, file_path, selected_by, selected_at
       FROM inspection_po_cert_selections WHERE inspection_id = ?`,
      [inspectionId]
    )
    // Keyed by file path so the client can mark related rows
    const selections: Record<string, any> = {}
    for (const r of rows || []) {
      selections[r.file_path] = {
        apcPart: r.apc_part, customerPart: r.customer_part, version: r.version_label,
        folder: r.po_folder, selectedBy: r.selected_by, selectedAt: r.selected_at,
      }
    }
    return NextResponse.json({ success: true, selections })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST : relate (or clear) a PO cert file for an inspection
//   { inspectionId, filePath, apcPart?, customerPart?, versionLabel?, poFolder?, clear? }
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
    const { inspectionId, filePath, apcPart, customerPart, versionLabel, poFolder, clear } = body
    if (!inspectionId || !filePath) {
      return NextResponse.json({ error: 'inspectionId and filePath required' }, { status: 400 })
    }
    const hash = sha1(filePath)

    if (clear) {
      await queryPrimary(
        'DELETE FROM inspection_po_cert_selections WHERE inspection_id = ? AND path_hash = ?',
        [inspectionId, hash]
      )
      return NextResponse.json({ success: true, cleared: true })
    }

    await queryPrimary(
      `INSERT INTO inspection_po_cert_selections
        (inspection_id, apc_part, customer_part, version_label, po_folder, file_path, path_hash, selected_by)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE apc_part = VALUES(apc_part), customer_part = VALUES(customer_part),
         version_label = VALUES(version_label), po_folder = VALUES(po_folder), selected_by = VALUES(selected_by)`,
      [inspectionId, apcPart || '', customerPart || '', versionLabel || '', poFolder || '',
       String(filePath).substring(0, 700), hash, username]
    )
    return NextResponse.json({ success: true, selectedBy: username })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
