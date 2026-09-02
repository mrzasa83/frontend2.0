import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/mssql'

// Search Paradigm departments (DATA0034) by code or name. Feeds the Admin
// Config "MDI dept-interest" picker. Any authenticated user may read.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim()
    const like = `%${q.replace(/[[%_]/g, (c) => `[${c}]`)}%`

    // Mirrors frontend2.0 Work Center Management: real work-center departments
    // only (ttype = 1). Returns the full list (ordered by name) so the picker
    // can show a searchable list; the optional q narrows server-side too.
    const rows = await queryMSSQL<any>(`
      SELECT
        RTRIM(DEPT_CODE) AS deptCode,
        RTRIM(DEPT_NAME) AS deptName
      FROM DATA0034 WITH (NOLOCK)
      WHERE ttype = 1
        AND DEPT_CODE IS NOT NULL AND RTRIM(DEPT_CODE) <> ''
        AND (@q = '' OR DEPT_CODE LIKE @like OR DEPT_NAME LIKE @like)
      ORDER BY DEPT_NAME ASC
    `, { q, like })

    return NextResponse.json({ departments: rows })
  } catch (error) {
    console.error('Dept search error:', error)
    return NextResponse.json(
      { error: 'Failed to search departments', details: String(error) },
      { status: 500 }
    )
  }
}
