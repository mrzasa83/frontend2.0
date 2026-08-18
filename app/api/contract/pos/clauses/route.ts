import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

// POST -> manually relate a clause to a PO. Program + Admin (module readers) can add.
// Body: { po_number, customer, clause_id }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'contract')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const b = await request.json()
    const po_number = String(b?.po_number ?? '').trim()
    const customer = String(b?.customer ?? '').trim()
    const clause_id = Number(b?.clause_id)
    if (!po_number || !customer || !clause_id || isNaN(clause_id)) {
      return NextResponse.json({ error: 'po_number, customer, clause_id required' }, { status: 400 })
    }
    const user = (session.user as any)?.username || 'unknown'

    const clause = await queryPrimary<any[]>(
      'SELECT standard, clause_number FROM contract_clauses WHERE id = ? LIMIT 1', [clause_id]
    )
    if (!clause?.length) return NextResponse.json({ error: 'Clause not found' }, { status: 404 })

    // how_added = the username for manual adds (auto scan uses 'auto').
    await queryPrimary(
      `INSERT INTO contract_po_clauses
         (po_number, customer, clause_id, standard, clause_number, how_added, confidence, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'manual', ?)
       ON DUPLICATE KEY UPDATE how_added = VALUES(how_added)`,
      [po_number, customer, clause_id, clause[0].standard, clause[0].clause_number, user, user]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add PO clause error:', error)
    return NextResponse.json({ error: 'Failed to add clause', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// DELETE ?id=..  -> remove a PO⇄clause relation. Module readers can remove.
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'contract')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  try {
    const id = Number(new URL(request.url).searchParams.get('id'))
    if (!id || isNaN(id)) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await queryPrimary('DELETE FROM contract_po_clauses WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete PO clause error:', error)
    return NextResponse.json({ error: 'Failed to delete', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
