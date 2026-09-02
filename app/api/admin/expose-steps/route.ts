import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/require-admin'
import { queryMySQL } from '@/lib/mysql'

// GET — list all dept mappings with their expose flag.
// Any authenticated user may READ (the route resolver needs it); only admins
// may WRITE via PUT below.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await queryMySQL(
      `SELECT id, escf_department, paradigm_rkey, paradigm_dept_code,
              paradigm_dept_name, is_expose_step
       FROM wc_dept_mapping
       ORDER BY escf_department ASC, paradigm_dept_code ASC`
    )
    return NextResponse.json({ mappings: rows })
  } catch (error) {
    console.error('Error fetching dept mappings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dept mappings', details: String(error) },
      { status: 500 }
    )
  }
}

// PUT — toggle is_expose_step for one mapping (admin only).
export async function PUT(request: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 403 ? 'Admin access required' : 'Unauthorized' },
      { status: gate.status }
    )
  }

  try {
    const { id, is_expose_step } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await queryMySQL(
      `UPDATE wc_dept_mapping SET is_expose_step = ? WHERE id = ?`,
      [is_expose_step ? 1 : 0, id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating expose flag:', error)
    return NextResponse.json(
      { error: 'Failed to update expose flag', details: String(error) },
      { status: 500 }
    )
  }
}
