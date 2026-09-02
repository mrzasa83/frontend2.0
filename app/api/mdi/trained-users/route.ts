import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMySQL } from '@/lib/mysql'

const HINT = 'Ensure the mdi_trained_user table exists (run sql/create_mdi_trained_user.sql).'

// GET — list trained users, or ?check=<employeeId> to test one (returns {trained}).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const check = (request.nextUrl.searchParams.get('check') || '').trim()
    if (check) {
      const rows = await queryMySQL<any>(
        `SELECT employee_id, employee_name FROM mdi_trained_user WHERE employee_id = ? LIMIT 1`,
        [check]
      )
      const row = rows?.[0]
      return NextResponse.json({ trained: !!row, employeeName: row?.employee_name || '' })
    }

    const rows = await queryMySQL<any>(
      `SELECT employee_id, employee_name, trainer_id, trainer_name, created_at
       FROM mdi_trained_user ORDER BY employee_name, employee_id`
    )
    return NextResponse.json({
      trainedUsers: rows.map((r: any) => ({
        employeeId: r.employee_id, employeeName: r.employee_name || '',
        trainerId: r.trainer_id || '', trainerName: r.trainer_name || '',
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    console.error('trained_user GET error:', error)
    return NextResponse.json({ error: 'Failed to load trained users', details: HINT }, { status: 500 })
  }
}

// POST — add/update a trained user (unique on employee_id).
// Body: { employeeId, employeeName?, trainerId?, trainerName? }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { employeeId, employeeName, trainerId, trainerName } = await request.json()
    const eid = String(employeeId || '').trim()
    if (!eid) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })

    const user = (session.user as any)?.name || (session.user as any)?.email || null
    await queryMySQL(
      `INSERT INTO mdi_trained_user (employee_id, employee_name, trainer_id, trainer_name, created_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         employee_name = VALUES(employee_name),
         trainer_id = VALUES(trainer_id),
         trainer_name = VALUES(trainer_name)`,
      [eid, employeeName || null, trainerId ? String(trainerId).trim() : null, trainerName || null, user]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('trained_user POST error:', error)
    return NextResponse.json({ error: 'Failed to save trained user', details: HINT }, { status: 500 })
  }
}

// DELETE — remove one (?employeeId=).
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const eid = request.nextUrl.searchParams.get('employeeId')
    if (!eid) return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
    await queryMySQL(`DELETE FROM mdi_trained_user WHERE employee_id = ?`, [eid])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('trained_user DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove trained user' }, { status: 500 })
  }
}
