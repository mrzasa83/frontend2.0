import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

const READ_CONN = '1'
export const dynamic = 'force-dynamic'

// Paradigm departments (DATA0034 ttype=1) used as the rework step picker source,
// same list as Work Center Management. Optional ?site= filters by location.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await queryMSSQL<any[]>(READ_CONN, `
      SELECT RKEY, DEPT_CODE, DEPT_NAME,
        CASE
          WHEN WAREHOUSE_PTR = 1 AND DEPT_CODE LIKE 'J%' THEN 'Nashua Assembly'
          WHEN WAREHOUSE_PTR = 1 AND DEPT_CODE NOT LIKE 'J%' THEN 'Nashua PCB'
          WHEN WAREHOUSE_PTR = 3 THEN 'Nogales'
          WHEN WAREHOUSE_PTR = 6 THEN 'Mesa'
          ELSE ''
        END AS Location,
        ACTIVE_FLAG
      FROM data0034
      WHERE ttype = 1
      ORDER BY DEPT_NAME ASC
    `)

    const departments = rows.map((r: any) => ({
      code: (r.DEPT_CODE || '').trim(),
      name: (r.DEPT_NAME || '').trim(),
      location: (r.Location || '').trim(),
      active: r.ACTIVE_FLAG === 0,  // 0 = active
    }))

    return NextResponse.json({ success: true, departments })
  } catch (error) {
    console.error('Step options error:', error)
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
