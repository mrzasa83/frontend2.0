import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { canReadModule } from '@/lib/config/access'
import { productTypeFromPart } from '@/lib/ehs/productCompliance'

export const dynamic = 'force-dynamic'

// Customer parts that actually carry a BOM — the products worth assessing.
const SEARCH_SQL = `
  SELECT TOP 50
    d50.CUSTOMER_PART_NUMBER AS apc_part,
    d50.CUSTOMER_PART_DESC   AS customer_part,
    d10.ABBR_NAME            AS customer,
    d50.RKEY                 AS rkey
  FROM data0050 d50
  LEFT JOIN data0010 d10 ON d10.RKEY = d50.CUSTOMER_PTR
  WHERE d50.CUSTOMER_PART_NUMBER LIKE @q
  ORDER BY d50.CUSTOMER_PART_NUMBER`

// GET ?q=123 -> products matching the search, for the "assess a product" picker.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'ehs')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const q = (new URL(request.url).searchParams.get('q') || '').trim()
  if (q.length < 2) return NextResponse.json({ success: true, rows: [] })

  try {
    const rows = await queryMSSQL<any[]>('1', SEARCH_SQL, { q: `${q}%` })
    return NextResponse.json({
      success: true,
      rows: (rows || []).map(r => ({
        // CUSTOMER_PART_NUMBER holds the APC part number; the customer's own
        // number lives in CUSTOMER_PART_DESC.
        apc_part: String(r.apc_part || '').trim(),
        customer_part: String(r.customer_part || '').trim(),
        customer: r.customer || '',
        part_type: productTypeFromPart(String(r.apc_part || '')),
      })),
    })
  } catch (error) {
    console.error('EHS product search error:', error)
    return NextResponse.json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
