import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMySQL } from '@/lib/mysql'

const TABLE_HINT = 'Ensure the mdi_department table exists (run sql/create_mdi_department.sql).'

// GET — list the saved departments of interest (ordered by code).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await queryMySQL<{ dept_code: string; dept_name: string | null }>(
      `SELECT dept_code, dept_name FROM mdi_department ORDER BY dept_code ASC`
    )
    return NextResponse.json({ departments: rows.map(r => ({ deptCode: r.dept_code, deptName: r.dept_name || '' })) })
  } catch (error) {
    console.error('mdi_department GET error:', error)
    return NextResponse.json({ error: 'Failed to load departments', details: TABLE_HINT }, { status: 500 })
  }
}

// POST — add a department. Body: { deptCode, deptName? }. Idempotent (unique key).
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { deptCode, deptName } = await request.json()
    const code = String(deptCode || '').trim()
    if (!code) return NextResponse.json({ error: 'deptCode is required' }, { status: 400 })

    const user = (session.user as any)?.name || (session.user as any)?.email || null
    await queryMySQL(
      `INSERT INTO mdi_department (dept_code, dept_name, created_by) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE dept_name = VALUES(dept_name)`,
      [code, deptName ? String(deptName).trim() : null, user]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('mdi_department POST error:', error)
    return NextResponse.json({ error: 'Failed to add department', details: TABLE_HINT }, { status: 500 })
  }
}

// DELETE — remove one dept (?deptCode=) or all (?all=1).
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const code = request.nextUrl.searchParams.get('deptCode')
    const all = request.nextUrl.searchParams.get('all')
    if (all === '1') {
      await queryMySQL(`DELETE FROM mdi_department`)
    } else if (code) {
      await queryMySQL(`DELETE FROM mdi_department WHERE dept_code = ?`, [code])
    } else {
      return NextResponse.json({ error: 'deptCode or all=1 required' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('mdi_department DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove department' }, { status: 500 })
  }
}
