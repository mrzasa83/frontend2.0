import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export const dynamic = 'force-dynamic'

/**
 * Resolve a part number — APC or customer — to the product record(s).
 *
 * Takes either, because the sales order list carries both and which one is
 * populated varies: the APC number comes off the DATA0050 production row and
 * is always there, while the customer number comes off a sales row and is not.
 * An APC match is exact and sorts first; a customer-number match is the
 * fallback, since one customer number can sit on several APC parts. Every
 * match is returned so the caller can choose rather than guess.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const part = (new URL(request.url).searchParams.get('part') || '').trim()
  if (!part) return NextResponse.json({ error: 'A part is required' }, { status: 400 })

  try {
    const items = await queryPrimary<any[]>(
      `SELECT
         i.id, i.apcPN, i.customer, i.customerPN, i.buildRev, i.currentRev,
         i.description, i.fullPath, i.createdAt,
         i.m_item_type_id, i.item_type_id, it.name AS item_type_name
       FROM items i
       LEFT JOIN item_types it ON i.item_type_id = it.id
       WHERE i.m_item_type_id = 1
         AND (TRIM(i.apcPN) = ? OR TRIM(i.customerPN) = ?)
       ORDER BY
         -- An APC-number match is exact and wins; a customer-number match is
         -- the fallback, since the same customer number can sit on several
         -- APC parts.
         CASE WHEN TRIM(i.apcPN) = ? THEN 0 ELSE 1 END,
         i.apcPN
       LIMIT 50`,
      [part, part, part])
    return NextResponse.json({ success: true, part, items: items || [] })
  } catch (error) {
    return NextResponse.json({
      error: 'Lookup failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
