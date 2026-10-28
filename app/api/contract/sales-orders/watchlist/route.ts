import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule } from '@/lib/config/access'
import { queryPrimary } from '@/lib/db/mysql-primary'

export const dynamic = 'force-dynamic'

/**
 * The caller's own watched customer parts.
 *
 * Always scoped to the session user — the user id is never taken from the
 * request, so one person cannot read or edit another's list.
 */
async function requireUser(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'contract') && !canReadModule(roles, 'products')) {
    return { error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) }
  }
  const uid = Number((session.user as any)?.id)
  if (!uid) {
    return { error: NextResponse.json({ error: 'No user id on the session' }, { status: 400 }) }
  }
  return { uid }
}

export async function GET(request: NextRequest) {
  const u = await requireUser(request)
  if ('error' in u) return u.error
  try {
    const rows: any[] = await queryPrimary(
      'SELECT customer_part FROM so_watchlist WHERE user_id = ? ORDER BY customer_part', [u.uid])
    return NextResponse.json({
      success: true,
      parts: rows.map(r => String(r.customer_part || '').trim()).filter(Boolean),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read the watchlist',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

/** Tick a part. Idempotent — ticking twice is not an error. */
export async function POST(request: NextRequest) {
  const u = await requireUser(request)
  if ('error' in u) return u.error
  try {
    const body = await request.json().catch(() => ({}))
    const part = String(body?.part ?? '').trim()
    if (!part) return NextResponse.json({ error: 'A part is required' }, { status: 400 })
    if (part.length > 100) return NextResponse.json({ error: 'Part too long' }, { status: 400 })
    await queryPrimary(
      'INSERT IGNORE INTO so_watchlist (user_id, customer_part) VALUES (?, ?)',
      [u.uid, part])
    return NextResponse.json({ success: true, part })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to add to the watchlist',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const u = await requireUser(request)
  if ('error' in u) return u.error
  try {
    const part = (new URL(request.url).searchParams.get('part') || '').trim()
    if (!part) return NextResponse.json({ error: 'A part is required' }, { status: 400 })
    await queryPrimary(
      'DELETE FROM so_watchlist WHERE user_id = ? AND customer_part = ?', [u.uid, part])
    return NextResponse.json({ success: true, part })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to remove from the watchlist',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
