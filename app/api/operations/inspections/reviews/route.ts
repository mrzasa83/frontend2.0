import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export const dynamic = 'force-dynamic'

const EDIT_ROLES = ['Admin', 'Quality Control', 'Operations', 'Production Control']
const canEdit = (roles: string[]) => roles.some(r => EDIT_ROLES.includes(r))

// GET ?inspectionId= : actions (with their notes) for an inspection
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const inspectionId = searchParams.get('inspectionId')
  if (!inspectionId) return NextResponse.json({ error: 'inspectionId required' }, { status: 400 })

  try {
    const actions = await queryPrimary(
      'SELECT * FROM inspection_actions WHERE inspection_id = ? ORDER BY created_at DESC',
      [inspectionId]
    )
    const ids = (actions || []).map((a: any) => a.id)
    let notes: any[] = []
    if (ids.length) {
      notes = await queryPrimary(
        `SELECT * FROM inspection_action_notes WHERE action_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`,
        ids
      )
    }
    const byAction: Record<number, any[]> = {}
    for (const n of notes) (byAction[n.action_id] ||= []).push(n)
    const withNotes = (actions || []).map((a: any) => ({ ...a, notes: byAction[a.id] || [] }))
    return NextResponse.json({ success: true, actions: withNotes })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// POST : create action | add note | toggle action status
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  const username = (session.user as any)?.username || session.user?.name || 'unknown'
  if (!canEdit(roles)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

  try {
    const body = await request.json()
    const { op } = body

    if (op === 'addAction') {
      const { inspectionId, actionText, assignedTo } = body
      if (!inspectionId || !actionText?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      const res: any = await queryPrimary(
        'INSERT INTO inspection_actions (inspection_id, action_text, assigned_to, created_by) VALUES (?,?,?,?)',
        [inspectionId, actionText.trim(), assignedTo || null, username]
      )
      return NextResponse.json({ success: true, id: res.insertId })
    }

    if (op === 'addNote') {
      const { actionId, noteText } = body
      if (!actionId || !noteText?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      const res: any = await queryPrimary(
        'INSERT INTO inspection_action_notes (action_id, note_text, created_by) VALUES (?,?,?)',
        [actionId, noteText.trim(), username]
      )
      return NextResponse.json({ success: true, id: res.insertId })
    }

    if (op === 'setStatus') {
      const { actionId, status } = body
      if (!actionId || !['Open', 'Closed'].includes(status)) return NextResponse.json({ error: 'Bad status' }, { status: 400 })
      await queryPrimary('UPDATE inspection_actions SET status = ? WHERE id = ?', [status, actionId])
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown op' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
