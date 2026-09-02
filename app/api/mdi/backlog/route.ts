import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMySQL } from '@/lib/mysql'

// GET — list saved backlog work orders.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await queryMySQL<{ id: number; work_order: string; created_at: string; created_by: string }>(
      `SELECT id, work_order, created_at, created_by FROM mdi_workorder ORDER BY created_at DESC, work_order ASC`
    )
    return NextResponse.json({ workOrders: rows })
  } catch (error) {
    console.error('Backlog GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load backlog', details: 'Ensure the mdi_workorder table exists (run sql/create_mdi_workorder.sql).' },
      { status: 500 }
    )
  }
}

// POST — save work orders to the backlog. Body: { workOrders: string[] }.
// Upserts (skips duplicates via unique key); doesn't clear existing rows unless
// `replace: true` is passed.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { workOrders, replace } = await request.json()
    const list: string[] = Array.isArray(workOrders)
      ? workOrders.map((w: any) => String(w).trim()).filter(Boolean)
      : []
    if (!list.length) return NextResponse.json({ error: 'No work orders to save' }, { status: 400 })

    const user = (session.user as any)?.name || (session.user as any)?.email || null

    if (replace) {
      await queryMySQL(`DELETE FROM mdi_workorder`)
    }
    // Insert-ignore each (unique key on work_order de-dupes).
    for (const wo of list) {
      await queryMySQL(
        `INSERT INTO mdi_workorder (work_order, created_by) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE created_by = VALUES(created_by), created_at = created_at`,
        [wo, user]
      )
    }
    return NextResponse.json({ success: true, saved: list.length })
  } catch (error) {
    console.error('Backlog POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save backlog', details: 'Ensure the mdi_workorder table exists (run sql/create_mdi_workorder.sql).' },
      { status: 500 }
    )
  }
}

// DELETE — remove one WO (?workOrder=) or all (?all=1).
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const wo = request.nextUrl.searchParams.get('workOrder')
    const all = request.nextUrl.searchParams.get('all')
    if (all === '1') {
      await queryMySQL(`DELETE FROM mdi_workorder`)
    } else if (wo) {
      await queryMySQL(`DELETE FROM mdi_workorder WHERE work_order = ?`, [wo])
    } else {
      return NextResponse.json({ error: 'workOrder or all=1 required' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Backlog DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete from backlog' }, { status: 500 })
  }
}
