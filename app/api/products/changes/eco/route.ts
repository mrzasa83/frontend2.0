import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// eco_status meanings TBD — placeholder mapping until workflow is understood
function statusLabel(s: number, submissionType: string | null): string {
  const st = (submissionType || '').trim()
  if (s === 3) return 'Removed'
  if (s === 0) return 'Requested'
  if ((s === 1 || s === 2) && st === 'Cancel') return 'Canceled'
  if (s === 1 && ['Close', 'Close ECO', 'Edit Archive'].includes(st)) return 'Completed'
  return 'Other'
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    if (id) {
      // Single record
      const rows = await queryPrimary('SELECT * FROM eco WHERE id = ?', [id])
      if (!rows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const record = rows[0]

      const combineDateTime = (d: string | null, t: string | null): string | null => {
        if (!d) return null
        try {
          const months: Record<string, string> = {
            Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
            Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'
          }
          const m = d.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/)
          if (m) return new Date(`${m[3]}-${months[m[2]] || '01'}-${m[1].padStart(2,'0')}T${t || '00:00:00'}`).toISOString()
        } catch {}
        return d + (t ? ' ' + t : '')
      }

      record.submitted_at = combineDateTime(record.subdate, record.subtime)
      record.closed_at = combineDateTime(record.closeddate, record.closedtime)
      record.status = statusLabel(Number(record.eco_status), record.submission_type)

      return NextResponse.json({ success: true, record })
    }

    // List view
    const rows = await queryPrimary(`
      SELECT
        id, request, eco_status, change_status, partnum, customer, toolnum,
        software, submission_type, disposition, action_required, comments,
        cam_operator, job_type, urgent, support_type, support_requester,
        subdate, subtime, closeddate, closedtime,
        STR_TO_DATE(CONCAT(NULLIF(subdate,''), ' ', NULLIF(subtime,'')), '%d%b%Y %H:%i:%s') AS submitted_at,
        STR_TO_DATE(CONCAT(NULLIF(closeddate,''), ' ', NULLIF(closedtime,'')), '%d%b%Y %H:%i:%s') AS closed_at,
        CASE
          WHEN eco_status = 3 THEN 'Removed'
          WHEN eco_status = 0 THEN 'Requested'
          WHEN eco_status IN (1,2) AND submission_type = 'Cancel' THEN 'Canceled'
          WHEN eco_status = 1 AND submission_type IN ('Close','Close ECO','Edit Archive') THEN 'Completed'
          ELSE 'Other'
        END AS status
      FROM eco
      ORDER BY submitted_at DESC, id DESC
    `)

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error('Error fetching ECO:', error)
    return NextResponse.json({
      error: 'Failed to fetch', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// Format current date/time as ddMMMyyyy / HH:MM:SS for DB storage
function formatDateForDB(): string {
  const d = new Date()
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${String(d.getDate()).padStart(2,'0')}${months[d.getMonth()]}${d.getFullYear()}`
}
function formatTimeForDB(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

// POST: complete, cancel, or revise an ECO
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const username = (session.user as any)?.username || session.user?.name || 'unknown'

  try {
    const body = await request.json()
    const { action, ecoId } = body
    if (!ecoId) return NextResponse.json({ error: 'ecoId required' }, { status: 400 })

    const dateStr = formatDateForDB()
    const timeStr = formatTimeForDB()

    if (action === 'complete') {
      const { timeSpent } = body
      await queryPrimary(`
        UPDATE eco SET
          eco_status = 1,
          submission_type = 'Close ECO',
          disposition = '',
          closeddate = ?, closedtime = ?,
          actual_time_spent = ?,
          cam_operator = ?
        WHERE id = ?
      `, [dateStr, timeStr, timeSpent || null, username, ecoId])
      return NextResponse.json({ success: true })
    }

    if (action === 'cancel') {
      const { timeSpent } = body
      await queryPrimary(`
        UPDATE eco SET
          eco_status = 1,
          submission_type = 'Cancel',
          disposition = 'Cancel',
          closeddate = ?, closedtime = ?,
          actual_time_spent = ?,
          cam_operator = ?
        WHERE id = ?
      `, [dateStr, timeStr, timeSpent || null, username, ecoId])
      return NextResponse.json({ success: true })
    }

    if (action === 'revise') {
      const { revisionNote } = body
      // Append revision note to comments, stamp revised_on
      const rows = await queryPrimary('SELECT comments FROM eco WHERE id = ?', [ecoId])
      const existing = rows?.[0]?.comments || ''
      const stamp = `[Revised ${dateStr} by ${username}] ${revisionNote || ''}`
      const newComments = existing ? `${existing}\n${stamp}` : stamp
      await queryPrimary(`
        UPDATE eco SET revised_on = ?, comments = ? WHERE id = ?
      `, [dateStr, newComments, ecoId])
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating ECO:', error)
    return NextResponse.json({
      error: 'Failed to update', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
