import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { logHistory } from '@/lib/products/goldStandard'
import { canManageGoldStandardParts } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

/**
 * Attaches a part to a gold standard as a "like part".
 *
 * Attaching is a claim that someone believes these should match, which is why
 * the list is explicit rather than derived from technology or program. A part
 * that appeared automatically would make the set look reviewed when nobody
 * had looked at it.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageGoldStandardParts((session.user as any)?.roles || [])) {
    return NextResponse.json(
      { error: 'Attaching or removing a like part requires the ProductEng or NPIeng role' },
      { status: 403 })
  }
  const user = (session.user as any)?.name || (session.user as any)?.email || 'unknown'

  let body: any
  try { body = await request.json() } catch { body = null }

  const gsId = Number(body?.goldStandardId)
  const customerPart = String(body?.customerPartNumber || '').trim()
  if (!gsId || !customerPart) {
    return NextResponse.json(
      { error: 'goldStandardId and customerPartNumber are required' }, { status: 400 })
  }

  try {
    const gs = await queryPrimary<any[]>(
      'SELECT customer_part_number FROM gold_standards WHERE id = ?', [gsId])
    if (!gs?.length) return NextResponse.json({ error: 'Gold standard not found' }, { status: 404 })

    // A standard compared against itself always matches, which would read as
    // a clean result and mean nothing.
    if (String(gs[0].customer_part_number || '').trim() === customerPart) {
      return NextResponse.json(
        { error: 'That is the gold standard itself' }, { status: 400 })
    }

    await queryPrimary(
      `INSERT INTO gold_standard_like_parts
         (gold_standard_id, apc_part_number, customer_part_number, program,
          customer_name, description, notes, added_by)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         apc_part_number = VALUES(apc_part_number),
         program         = VALUES(program),
         customer_name   = VALUES(customer_name),
         description     = VALUES(description)`,
      [gsId,
       String(body?.apcPartNumber || '').trim().slice(0, 191),
       customerPart.slice(0, 191),
       String(body?.program || '').trim().slice(0, 191),
       String(body?.customerName || '').trim().slice(0, 191),
       String(body?.description || '').trim().slice(0, 500),
       String(body?.notes || '') || null,
       user]
    )
    await logHistory(gsId, 'like-part-added', user, {
      target: 'gold_standard_like_parts', detail: customerPart })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to attach the part',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageGoldStandardParts((session.user as any)?.roles || [])) {
    return NextResponse.json(
      { error: 'Attaching or removing a like part requires the ProductEng or NPIeng role' },
      { status: 403 })
  }
  const user = (session.user as any)?.name || (session.user as any)?.email || 'unknown'

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    const rows = await queryPrimary<any[]>(
      'SELECT gold_standard_id, customer_part_number FROM gold_standard_like_parts WHERE id = ?', [id])
    await queryPrimary('DELETE FROM gold_standard_like_parts WHERE id = ?', [id])
    if (rows?.length) {
      await logHistory(Number(rows[0].gold_standard_id), 'like-part-removed', user, {
        target: 'gold_standard_like_parts',
        detail: String(rows[0].customer_part_number || ''),
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to remove the part',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
