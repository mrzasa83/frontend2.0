import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { getGoldStandard, captureGoldStandard, logHistory } from '@/lib/products/goldStandard'
import { canManageGoldStandards, canManageGoldStandardParts } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  const { id } = await ctx.params
  try {
    const data = await getGoldStandard(Number(id))
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      success: true,
      ...data,
      can: {
        manageStandards: canManageGoldStandards(roles),
        manageParts: canManageGoldStandardParts(roles),
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to load the gold standard',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

/** Header edits, and re-capture. */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Re-capturing REPLACES every card under the standard, and a header edit
  // changes what it claims to be. Both are changes to the blessed copy, so
  // they sit with creating and deleting rather than with attaching a part.
  if (!canManageGoldStandards((session.user as any)?.roles || [])) {
    return NextResponse.json(
      { error: 'Changing a gold standard requires the NPIeng role' }, { status: 403 })
  }
  const user = (session.user as any)?.name || (session.user as any)?.email || 'unknown'
  const { id } = await ctx.params
  const gsId = Number(id)

  let body: any
  try { body = await request.json() } catch { body = null }

  try {
    if (body?.action === 'recapture') {
      const rows = await queryPrimary<any[]>(
        'SELECT customer_part_number FROM gold_standards WHERE id = ?', [gsId])
      if (!rows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const captured = await captureGoldStandard(
        gsId, String(rows[0].customer_part_number || ''), user)
      return NextResponse.json({
        success: true, captured,
        // A re-capture that wrote fewer levels than Paradigm offered is a
        // partial result. Saying so beats a success message over a short copy.
        partial: captured.cards < captured.expected,
      })
    }

    // Only these are editable from the header; the captured card data is
    // edited through its own endpoints so every change lands in history
    // against the row it actually touched.
    const fields: Record<string, string> = {
      technology_id: 'technologyId', apc_part_number: 'apcPartNumber',
      program: 'program', revision: 'revision', title: 'title',
      notes: 'notes', status: 'status',
    }
    const sets: string[] = []
    const vals: any[] = []
    for (const [col, key] of Object.entries(fields)) {
      if (body?.[key] === undefined) continue
      sets.push(`${col} = ?`)
      vals.push(col === 'technology_id'
        ? (body[key] ? Number(body[key]) : null)
        : String(body[key] ?? ''))
    }
    if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    sets.push('updated_by = ?'); vals.push(user)
    vals.push(gsId)
    await queryPrimary(`UPDATE gold_standards SET ${sets.join(', ')} WHERE id = ?`, vals)
    await logHistory(gsId, body?.status !== undefined ? 'status' : 'edited', user, {
      target: 'gold_standards', targetId: gsId,
      detail: `Updated ${Object.keys(fields).filter(c => sets.some(s => s.startsWith(c))).join(', ')}`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to update the gold standard',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Deleting a standard discards every comparison made against it, so it
  // belongs to NPI (and to Admin, as everything does). Previously this tested
  // roles.includes('Admin') directly, which is case-sensitive and would have
  // denied an "admin" spelled any other way.
  if (!canManageGoldStandards((session.user as any)?.roles || [])) {
    return NextResponse.json(
      { error: 'Deleting a gold standard requires the NPIeng role' }, { status: 403 })
  }
  const { id } = await ctx.params
  try {
    await queryPrimary('DELETE FROM gold_standards WHERE id = ?', [Number(id)])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to delete', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
