import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSecondaryConfigured } from '@/lib/mysql-secondary'
import { resolveWorkOrder, ResolveInput } from '@/lib/mdi-resolve'

/**
 * Resolve/sync one or more work orders — pulls the latest fiducial/polarity/
 * cu_thickness/etc. for the given WO(s) without generating XML. Used by the
 * table's per-row "sync" button and the initial populate after building the
 * WO list.
 *
 * Body: { workOrders: ResolveInput[] }  (one or many)
 * Returns { rows: MdiWorkOrder[], warnings: string[] }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const inputs: ResolveInput[] = Array.isArray(body.workOrders)
      ? body.workOrders
      : (body.workOrder ? [body] : [])

    if (!inputs.length) {
      return NextResponse.json({ error: 'No work orders provided' }, { status: 400 })
    }
    if (!isSecondaryConfigured()) {
      return NextResponse.json(
        { error: 'Secondary (amph_cc) database is not configured — set DB_MYSQL_SECONDARY_* in the environment.' },
        { status: 500 }
      )
    }

    const rows = []
    const warnings: string[] = []
    for (const inp of inputs) {
      const { row, warnings: w } = await resolveWorkOrder(inp)
      rows.push(row)
      warnings.push(...w)
    }

    return NextResponse.json({ rows, warnings })
  } catch (error) {
    console.error('MDI resolve error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve work orders', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
