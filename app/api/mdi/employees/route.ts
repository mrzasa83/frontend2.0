import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/mssql'

// The name-formatting expression (Last, First proper-case) reused for SELECT
// and ORDER BY, per the operator's provided query.
const NAME_FORMAT = `
  CASE
    WHEN CHARINDEX(',', LTRIM(RTRIM(EMPLOYEE_NAME))) > 0 THEN
      UPPER(LTRIM(RTRIM(SUBSTRING(LTRIM(RTRIM(EMPLOYEE_NAME)), CHARINDEX(',', LTRIM(RTRIM(EMPLOYEE_NAME))) + 1, LEN(LTRIM(RTRIM(EMPLOYEE_NAME)))))))
      + ', ' +
      UPPER(LEFT(LTRIM(RTRIM(SUBSTRING(LTRIM(RTRIM(EMPLOYEE_NAME)), 1, CHARINDEX(',', LTRIM(RTRIM(EMPLOYEE_NAME))) - 1))), 1)) +
      LOWER(SUBSTRING(LTRIM(RTRIM(SUBSTRING(LTRIM(RTRIM(EMPLOYEE_NAME)), 1, CHARINDEX(',', LTRIM(RTRIM(EMPLOYEE_NAME))) - 1))), 2, LEN(LTRIM(RTRIM(EMPLOYEE_NAME)))))
    ELSE
      UPPER(LEFT(LTRIM(RTRIM(EMPLOYEE_NAME)), 1)) + LOWER(SUBSTRING(LTRIM(RTRIM(EMPLOYEE_NAME)), 2, LEN(LTRIM(RTRIM(EMPLOYEE_NAME)))))
  END`

// Search active Nashua employees. Optional ?q= filters by id or name; ?id=
// fetches a single employee (used to resolve a typed badge number).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim()
    const id = (request.nextUrl.searchParams.get('id') || '').trim()
    const like = `%${q.replace(/[[%_]/g, (c) => `[${c}]`)}%`

    const rows = await queryMSSQL<any>(`
      SELECT
        RTRIM(EMPLOYEE_ID) AS employeeId,
        ${NAME_FORMAT} AS employeeName
      FROM DATA0005 WITH (NOLOCK)
      WHERE ACTIVE_FLAG = 'Y'
        AND LOWER(TPOSTION) = 'nashua'
        ${id ? `AND RTRIM(EMPLOYEE_ID) COLLATE DATABASE_DEFAULT = @id` : ''}
        ${q ? `AND (RTRIM(EMPLOYEE_ID) COLLATE DATABASE_DEFAULT LIKE @like OR EMPLOYEE_NAME COLLATE DATABASE_DEFAULT LIKE @like)` : ''}
      ORDER BY ${NAME_FORMAT}
    `, { id, like })

    return NextResponse.json({ employees: rows })
  } catch (error) {
    console.error('Employee search error:', error)
    return NextResponse.json({ error: 'Failed to search employees', details: String(error) }, { status: 500 })
  }
}
