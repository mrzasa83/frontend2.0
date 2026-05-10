import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { queryMSSQL } from '@/lib/db/mssql'

const READ_CONN = '1'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Distinct ESCF departments from MySQL
    const escfDepts = await queryPrimary(
      `SELECT DISTINCT department FROM escf WHERE department IS NOT NULL AND department != '' ORDER BY department ASC`
    )

    // 2. Paradigm departments from MSSQL
    const paradigmDepts = await queryMSSQL<any[]>(READ_CONN,
      `SELECT DEPT_CODE, DEPT_NAME FROM data0034 WHERE ttype = 1 ORDER BY DEPT_NAME ASC`
    )

    // 3. Current mappings from MySQL
    const mappings = await queryPrimary(
      `SELECT id, escf_department, paradigm_dept_code, paradigm_dept_name, created_by, created_at
       FROM wc_dept_mapping ORDER BY escf_department, paradigm_dept_name`
    )

    return NextResponse.json({
      success: true,
      escfDepartments: escfDepts.map((r: any) => r.department),
      paradigmDepartments: paradigmDepts.map((r: any) => ({
        code: (r.DEPT_CODE || '').trim(),
        name: (r.DEPT_NAME || '').trim(),
      })),
      mappings,
    })
  } catch (error) {
    console.error('Error fetching work centers:', error)
    return NextResponse.json({
      error: 'Failed to fetch',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST — add mapping(s)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  try {
    const { escfDepartment, paradigmDepts } = await request.json()
    // paradigmDepts: [{ code, name }]

    if (!escfDepartment || !paradigmDepts?.length) {
      return NextResponse.json({ error: 'escfDepartment and paradigmDepts required' }, { status: 400 })
    }

    const username = (session.user as any)?.username || session.user?.name || 'unknown'
    let added = 0

    for (const dept of paradigmDepts) {
      try {
        await queryPrimary(
          `INSERT IGNORE INTO wc_dept_mapping (escf_department, paradigm_dept_code, paradigm_dept_name, created_by)
           VALUES (?, ?, ?, ?)`,
          [escfDepartment, dept.code, dept.name, username]
        )
        added++
      } catch {
        // Duplicate — skip
      }
    }

    return NextResponse.json({ success: true, added })
  } catch (error) {
    console.error('Error adding mapping:', error)
    return NextResponse.json({
      error: 'Failed to add',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// DELETE — remove a mapping
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await queryPrimary('DELETE FROM wc_dept_mapping WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mapping:', error)
    return NextResponse.json({
      error: 'Failed to delete',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
