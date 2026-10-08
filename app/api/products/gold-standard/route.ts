import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { listGoldStandards, captureGoldStandard, logHistory } from '@/lib/products/goldStandard'
import { canManageGoldStandards, canManageGoldStandardParts } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

/** The Gold Standard list. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  try {
    return NextResponse.json({
      success: true,
      standards: await listGoldStandards(),
      // What this user may do, so the page can hide controls it would only
      // get a 403 from. The API checks are the actual gate; these are for
      // the interface, never a substitute.
      can: {
        manageStandards: canManageGoldStandards(roles),
        manageParts: canManageGoldStandardParts(roles),
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to list gold standards',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

/**
 * Creates a gold standard and captures it from Paradigm in one go.
 *
 * The row is inserted BEFORE the capture runs. A capture of a deep assembly
 * is slow, and a half-finished one that left no trace would be invisible — a
 * row with captured_at still null says plainly "this exists but has no cards
 * yet", which the list can show and the user can retry.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageGoldStandards((session.user as any)?.roles || [])) {
    return NextResponse.json(
      { error: 'Creating a gold standard requires the NPIeng role' }, { status: 403 })
  }
  const user = (session.user as any)?.name || (session.user as any)?.email || 'unknown'

  let body: any
  try { body = await request.json() } catch { body = null }

  const customerPart = String(body?.customerPartNumber || '').trim()
  if (!customerPart) {
    return NextResponse.json({ error: 'customerPartNumber is required' }, { status: 400 })
  }

  try {
    const existing = await queryPrimary<any[]>(
      'SELECT id FROM gold_standards WHERE customer_part_number = ?', [customerPart])
    if (existing?.length) {
      return NextResponse.json({
        error: `${customerPart} already has a gold standard`,
        id: Number(existing[0].id),
      }, { status: 409 })
    }

    const res: any = await queryPrimary(
      `INSERT INTO gold_standards
         (technology_id, apc_part_number, customer_part_number, program,
          customer_code, customer_name, revision, title, notes,
          status, created_by, updated_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [body?.technologyId ? Number(body.technologyId) : null,
       String(body?.apcPartNumber || '').trim().slice(0, 191),
       customerPart.slice(0, 191),
       String(body?.program || '').trim().slice(0, 191),
       String(body?.customerCode || '').trim().slice(0, 60),
       String(body?.customerName || '').trim().slice(0, 191),
       String(body?.revision || '').trim().slice(0, 30),
       String(body?.title || '').trim().slice(0, 255),
       String(body?.notes || '') || null,
       'draft', user, user]
    )
    const id = Number(res?.insertId)
    if (!id) throw new Error('Insert did not return an id')
    await logHistory(id, 'created', user, { detail: `Created from ${customerPart}` })

    // Capture failing is NOT a failed create. The row stands, uncaptured, and
    // the message says so — losing the row too would hide the attempt.
    let captured = { cards: 0, expected: 0 }
    let captureError = ''
    try {
      captured = await captureGoldStandard(id, customerPart, user)
    } catch (e) {
      captureError = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json({
      success: true, id, captured,
      partial: !captureError && captured.cards < captured.expected,
      captureError: captureError || undefined,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to create the gold standard',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
