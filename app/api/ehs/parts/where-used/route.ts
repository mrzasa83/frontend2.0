import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { canReadModule } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

/**
 * Which products use this material?
 *
 * Walks the BOM UPWARD: from the inventory part, up through each parent
 * assembly, until it reaches the customer parts (DATA0050) whose BOM contains
 * it at any depth. The inverse of the downward expansion used by Product
 * Compliance.
 *
 * MAXRECURSION guards against a BOM that references itself; without it a
 * circular structure runs until SQL Server stops it at the default 100.
 */
const WHERE_USED_SQL = `
  ;WITH StartInv AS (
      SELECT RKEY, INV_PART_NUMBER
      FROM DATA0017 WITH (NOLOCK)
      WHERE INV_PART_NUMBER LIKE @part
  ),
  RecursiveBOM AS (
      -- Level 0: the part itself
      SELECT
          d17.RKEY AS CHILD_RKEY,
          d17.RKEY AS CURRENT_RKEY,
          d17.INV_PART_NUMBER,
          0 AS LVL
      FROM StartInv d17
      UNION ALL
      -- Level N: step up to whatever consumes the current node
      SELECT
          rb.CHILD_RKEY,
          d25.INVENTORY_PTR AS CURRENT_RKEY,
          d17p.INV_PART_NUMBER,
          rb.LVL + 1
      FROM RecursiveBOM rb
      INNER JOIN DATA0026 d26 WITH (NOLOCK)
          ON d26.INVENTORY_PTR = rb.CURRENT_RKEY
      INNER JOIN DATA0025 d25 WITH (NOLOCK)
          ON d25.RKEY = d26.PARENT_NODE_INVENT
      INNER JOIN DATA0017 d17p WITH (NOLOCK)
          ON d17p.RKEY = d25.INVENTORY_PTR
      WHERE rb.LVL < 20
  )
  SELECT DISTINCT
      LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) AS CUSTOMER_PART_NUMBER,
      LTRIM(RTRIM(d50.CUSTOMER_PART_DESC))   AS CUSTOMER_PART_DESC
  FROM RecursiveBOM rb
  INNER JOIN DATA0025 d25 WITH (NOLOCK)
      ON d25.INVENTORY_PTR = rb.CURRENT_RKEY
  INNER JOIN DATA0050 d50 WITH (NOLOCK)
      ON d50.BOM_PTR = d25.RKEY
  ORDER BY CUSTOMER_PART_NUMBER
  OPTION (MAXRECURSION 32)`

// GET ?part=AL0100CU1OZ1942 -> the customer parts this material rolls up into.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'ehs') && !canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const part = (new URL(request.url).searchParams.get('part') || '').trim()
  if (!part) return NextResponse.json({ error: 'part is required' }, { status: 400 })

  try {
    const rows = await queryMSSQL<any[]>('1', WHERE_USED_SQL, { part: `${part}%` })
    return NextResponse.json({
      success: true,
      part,
      rows: (rows || []).map(r => ({
        customer_part_number: r.CUSTOMER_PART_NUMBER || '',
        customer_part_desc: r.CUSTOMER_PART_DESC || '',
      })),
      count: rows?.length ?? 0,
    })
  } catch (error) {
    console.error('Where-used query error:', error)
    return NextResponse.json({
      error: 'Failed to load where-used',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
