import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary, getMySQLPrimaryPool } from '@/lib/db/mysql-primary'

// Format current date as ddMMMyyyy for DB storage
function formatDateForDB(): string {
  const d = new Date()
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${String(d.getDate()).padStart(2,'0')}${months[d.getMonth()]}${d.getFullYear()}`
}
function formatTimeForDB(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

// GET: fetch actions + comments for an ESCF
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const escfId = searchParams.get('escfId')
  if (!escfId) return NextResponse.json({ error: 'escfId required' }, { status: 400 })

  try {
    const actions = await queryPrimary(
      'SELECT * FROM escf_actions WHERE escf_id = ? ORDER BY created_at DESC', [escfId]
    )
    const comments = await queryPrimary(
      'SELECT * FROM escf_action_comments WHERE escf_id = ? AND action_id > 0 ORDER BY created_at ASC', [escfId]
    )
    const notes = await queryPrimary(
      'SELECT * FROM escf_action_comments WHERE escf_id = ? AND action_id = 0 ORDER BY created_at DESC', [escfId]
    )
    const users = await queryPrimary(
      'SELECT username, name FROM Users WHERE active = 1 ORDER BY name ASC'
    )
    return NextResponse.json({ success: true, actions, comments, notes, users })
  } catch (error) {
    console.error('Error fetching actions:', error)
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// POST: create action, add comment, approve, disapprove, implement
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const username = (session.user as any)?.username || session.user?.name || 'unknown'

  try {
    const body = await request.json()
    const { action: actionType, escfId } = body

    if (!escfId) return NextResponse.json({ error: 'escfId required' }, { status: 400 })

    const pool = getMySQLPrimaryPool()
    const conn = await pool.getConnection()

    try {
      await conn.beginTransaction()

      if (actionType === 'createAction') {
        const { actionText, owner, assignedTo, dueDate } = body
        await conn.execute(
          'INSERT INTO escf_actions (escf_id, action_text, owner, assigned_to, due_date, created_by) VALUES (?,?,?,?,?,?)',
          [escfId, actionText, owner || null, assignedTo || null, dueDate || null, username]
        )
        // Log to history
        await conn.execute(
          'INSERT INTO escf_history (escf_id, field_name, old_value, new_value, changed_by) VALUES (?,?,?,?,?)',
          [escfId, 'Action Added', '', actionText, username]
        )
        await conn.commit()
        return NextResponse.json({ success: true })
      }

      if (actionType === 'addComment') {
        const { actionId, commentText } = body
        await conn.execute(
          'INSERT INTO escf_action_comments (action_id, escf_id, comment_text, created_by) VALUES (?,?,?,?)',
          [actionId, escfId, commentText, username]
        )
        await conn.execute(
          'INSERT INTO escf_history (escf_id, field_name, old_value, new_value, changed_by) VALUES (?,?,?,?,?)',
          [escfId, 'Comment Added', `Action #${actionId}`, commentText, username]
        )
        await conn.commit()
        return NextResponse.json({ success: true })
      }

      if (actionType === 'addNote') {
        const { noteText } = body
        await conn.execute(
          'INSERT INTO escf_action_comments (action_id, escf_id, comment_text, created_by) VALUES (0,?,?,?)',
          [escfId, noteText, username]
        )
        await conn.execute(
          'INSERT INTO escf_history (escf_id, field_name, old_value, new_value, changed_by) VALUES (?,?,?,?,?)',
          [escfId, 'Note Added', '', noteText, username]
        )
        await conn.commit()
        return NextResponse.json({ success: true })
      }

      if (actionType === 'updateActionStatus') {
        const { actionId, status } = body
        await conn.execute('UPDATE escf_actions SET status = ? WHERE id = ?', [status, actionId])
        await conn.execute(
          'INSERT INTO escf_history (escf_id, field_name, old_value, new_value, changed_by) VALUES (?,?,?,?,?)',
          [escfId, 'Action Status', `Action #${actionId}`, status, username]
        )
        await conn.commit()
        return NextResponse.json({ success: true })
      }

      if (actionType === 'approve' || actionType === 'disapprove') {
        const { comment, peCostImpact, peCostAmount, prevTooledDis } = body
        const disposition = actionType === 'approve' ? 'Approved' : 'Disapproved'
        const dateStr = formatDateForDB()
        const timeStr = formatTimeForDB()

        // Fetch current values for history
        const [current] = await conn.execute('SELECT pe_disposition, rejection_reason, is_pe_cost_impact, prev_tooled_dis FROM escf WHERE id = ?', [escfId]) as any[]
        const old = current[0] || {}

        // Update escf record
        await conn.execute(`
          UPDATE escf SET
            pe_disposition = ?,
            pe_disposition_date = ?,
            pe_disposition_time = ?,
            rejection_reason = ?,
            is_pe_cost_impact = ?,
            pe_cost_impact_description = ?,
            prev_tooled_dis = ?,
            review_date = ?,
            pem = ?,
            escf_status = ?
          WHERE id = ?
        `, [
          disposition,
          dateStr, timeStr,
          comment || null,
          peCostImpact ? 'Yes' : 'No',
          peCostAmount || null,
          prevTooledDis || null,
          dateStr,
          username,
          actionType === 'disapprove' ? 2 : 0,
          escfId
        ])

        // Log history for each changed field
        const changes = [
          ['pe_disposition', old.pe_disposition, disposition],
          ['rejection_reason', old.rejection_reason, comment],
          ['is_pe_cost_impact', old.is_pe_cost_impact, peCostImpact ? 'Yes' : 'No'],
          ['prev_tooled_dis', old.prev_tooled_dis, prevTooledDis],
        ]
        for (const [field, oldVal, newVal] of changes) {
          if (String(oldVal || '') !== String(newVal || '')) {
            await conn.execute(
              'INSERT INTO escf_history (escf_id, field_name, old_value, new_value, changed_by) VALUES (?,?,?,?,?)',
              [escfId, field, String(oldVal || ''), String(newVal || ''), username]
            )
          }
        }

        await conn.commit()
        return NextResponse.json({ success: true, disposition })
      }

      if (actionType === 'implement') {
        const { software, comment, ppeCostImpact, ppeCostAmount } = body
        const dateStr = formatDateForDB()
        const timeStr = formatTimeForDB()

        const [current] = await conn.execute('SELECT escf_status, software, completedby FROM escf WHERE id = ?', [escfId]) as any[]
        const old = current[0] || {}

        await conn.execute(`
          UPDATE escf SET
            escf_status = 1,
            closeddate = ?,
            closedtime = ?,
            completedby = ?,
            software = ?,
            is_ppe_cost_impact = ?,
            ppe_cost_impact = ?
          WHERE id = ?
        `, [
          dateStr, timeStr, username,
          software || null,
          ppeCostImpact ? 'Yes' : 'No',
          ppeCostAmount || null,
          escfId
        ])

        const implChanges = [
          ['escf_status', String(old.escf_status), '1'],
          ['software', old.software, software],
          ['completedby', old.completedby, username],
        ]
        for (const [field, oldVal, newVal] of implChanges) {
          if (String(oldVal || '') !== String(newVal || '')) {
            await conn.execute(
              'INSERT INTO escf_history (escf_id, field_name, old_value, new_value, changed_by) VALUES (?,?,?,?,?)',
              [escfId, field, String(oldVal || ''), String(newVal || ''), username]
            )
          }
        }

        await conn.commit()
        return NextResponse.json({ success: true })
      }

      await conn.rollback()
      return NextResponse.json({ error: 'Unknown action type' }, { status: 400 })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (error) {
    console.error('Error in action:', error)
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// PUT: update action fields
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, status } = await request.json()
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    await queryPrimary('UPDATE escf_actions SET status = ? WHERE id = ?', [status, id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
