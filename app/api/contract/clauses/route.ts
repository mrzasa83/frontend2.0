import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

// GET -> all standardized clauses. Viewable by Program (Program Manager) and Admin.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'contract')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const rows = await queryPrimary<any[]>(
      `SELECT id, standard, clause_number, title, clause_text, effective_date,
              classification, reviewer, date_reviewed, comments, sources, updated_by, updated_at
       FROM contract_clauses
       ORDER BY standard, clause_number`
    )
    return NextResponse.json({ success: true, rows: rows || [], count: rows?.length ?? 0 })
  } catch (error) {
    console.error('Contract clauses query error:', error)
    return NextResponse.json({
      error: 'Failed to load clauses',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// PUT -> update a clause's classification. ADMIN ONLY. Journaled to history.
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin')) {
    return NextResponse.json({ error: 'Only an Admin can change a clause classification' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const id = Number(body?.id)
    const classification = String(body?.classification ?? '').trim().slice(0, 40)
    if (!id || isNaN(id)) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const user = (session.user as any)?.username || (session.user as any)?.name || 'unknown'

    const existing = await queryPrimary<any[]>(
      'SELECT classification FROM contract_clauses WHERE id = ? LIMIT 1', [id]
    )
    if (!existing?.length) return NextResponse.json({ error: 'Clause not found' }, { status: 404 })
    const oldValue = existing[0].classification ?? ''

    if (oldValue === classification) {
      return NextResponse.json({ success: true, unchanged: true, classification })
    }

    await queryPrimary(
      'UPDATE contract_clauses SET classification = ?, updated_by = ? WHERE id = ?',
      [classification, user, id]
    )
    await queryPrimary(
      'INSERT INTO contract_clause_history (clause_id, old_value, new_value, changed_by) VALUES (?, ?, ?, ?)',
      [id, oldValue, classification, user]
    )

    return NextResponse.json({ success: true, id, classification, updated_by: user })
  } catch (error) {
    console.error('Contract clause update error:', error)
    return NextResponse.json({
      error: 'Failed to update classification',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
