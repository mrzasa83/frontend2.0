import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export const dynamic = 'force-dynamic'

/**
 * Resolve a customer part number to the APC product record(s).
 *
 * Used by Contract ▸ Sales Orders, where the list is keyed on the customer's
 * number and clicking one should open our product. The mapping is not
 * guaranteed one-to-one — the same customer number can be built as more than
 * one APC part — so this returns every match and lets the caller choose
 * rather than silently picking the first.
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
       WHERE i.m_item_type_id = 1 AND TRIM(i.customerPN) = ?
       ORDER BY i.apcPN
       LIMIT 50`,
      [part])
    return NextResponse.json({ success: true, part, items: items || [] })
  } catch (error) {
    return NextResponse.json({
      error: 'Lookup failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
