import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('Admin')) return null
  return session
}

// GET: list machines
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  try {
    const rows = await queryPrimary(
      'SELECT id, hostname, label, enabled, sort_order FROM cad_workstations ORDER BY sort_order ASC, hostname ASC'
    )
    return NextResponse.json({ success: true, machines: rows || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed', details: String(e) }, { status: 500 })
  }
}

// POST: add a machine
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  try {
    const { hostname, label } = await request.json()
    const host = (hostname || '').trim()
    if (!host) return NextResponse.json({ error: 'hostname required' }, { status: 400 })
    const username = (session.user as any)?.username || session.user?.name || 'admin'
    await queryPrimary(
      'INSERT INTO cad_workstations (hostname, label, created_by) VALUES (?,?,?)',
      [host, (label || '').trim() || null, username]
    )
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (String(e).includes('Duplicate')) {
      return NextResponse.json({ error: 'That hostname is already in the list' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Add failed', details: String(e) }, { status: 500 })
  }
}

// DELETE: remove a machine (?id=)
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    await queryPrimary('DELETE FROM cad_workstations WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Delete failed', details: String(e) }, { status: 500 })
  }
}
