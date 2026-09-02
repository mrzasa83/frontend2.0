import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSecondaryConfigured } from '@/lib/mysql-secondary'
import { buildMdiXml, MdiWorkOrder } from '@/lib/mdi-xml'
import { resolveWorkOrder, ResolveInput } from '@/lib/mdi-resolve'

/**
 * Generate the MDI XML.
 *
 * Body: { workOrders: [...], resolved?: MdiWorkOrder[] }
 *  - If `resolved` is provided (full rows the UI already has, including operator
 *    edits), build the XML straight from those — no re-query, so edits and
 *    per-row syncs are honored exactly.
 *  - Otherwise resolve each `workOrders` input from the data sources first.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Preferred path: the UI sends fully-resolved rows (its editable table).
    if (Array.isArray(body.resolved) && body.resolved.length) {
      const rows = body.resolved as MdiWorkOrder[]
      const xml = buildMdiXml(rows)
      return NextResponse.json({ xml, rows, warnings: [] })
    }

    // Fallback: resolve from inputs.
    const inputs: ResolveInput[] = Array.isArray(body.workOrders) ? body.workOrders : []
    if (!inputs.length) {
      return NextResponse.json({ error: 'No work orders provided' }, { status: 400 })
    }
    if (!isSecondaryConfigured()) {
      return NextResponse.json(
        { error: 'Secondary (amph_cc) database is not configured — set DB_MYSQL_SECONDARY_* in the environment.' },
        { status: 500 }
      )
    }

    const rows: MdiWorkOrder[] = []
    const warnings: string[] = []
    for (const inp of inputs) {
      const { row, warnings: w } = await resolveWorkOrder(inp)
      rows.push(row)
      warnings.push(...w)
    }

    const xml = buildMdiXml(rows)
    return NextResponse.json({ xml, rows, warnings })
  } catch (error) {
    console.error('MDI XML generate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate MDI XML', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
