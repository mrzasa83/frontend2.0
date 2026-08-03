import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export const dynamic = 'force-dynamic'

// GET ?workOrder=C-76220-01/02
//   Returns the work order's general info plus its full route (all DATA0038
//   steps for the work order source, TTYPE=2, joined to DATA0034 for dept).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workOrder = (new URL(request.url).searchParams.get('workOrder') || '').trim()
  if (!workOrder) return NextResponse.json({ error: 'workOrder required' }, { status: 400 })

  try {
    // General info for the work order
    const genRows = await queryMSSQL<any[]>('1', `
      SELECT
        wo.WORK_ORDER_NUMBER AS WORK_ORDER,
        d50.CUSTOMER_PART_NUMBER AS CUSTOMER_PN,
        d17.INV_PART_NUMBER AS INVENTORY_PN,
        d17.INV_PART_DESCRIPTION AS DESCRIPTION,
        d10.ABBR_NAME AS CUSTOMER,
        wo.PRIORITY_CODE AS PTY,
        wo.QUAN_SCH AS QTY_SCHEDULED,
        wo.SCH_COMPL_DATE AS SCH_COMPLETE,
        wo.PARTS_PER_PANEL AS PARTS_PER_PANEL,
        wo.ANALYSIS_CODE_3 AS ANALYSIS_CODE_3,
        wo.ANALYSIS_CODE_5 AS ANALYSIS_CODE_5,
        CASE wo.PROD_STATUS
          WHEN 2   THEN 'RELEASED'
          WHEN 3   THEN 'IN PRODUCTION'
          WHEN 206 THEN 'ON HOLD (UNRELEASED)'
          WHEN 306 THEN 'ON HOLD (RELEASED)'
          ELSE 'UNKNOWN'
        END AS WO_STATUS
      FROM DATA0006 wo
      LEFT JOIN DATA0050 d50 ON d50.RKEY = wo.CUST_PART_PTR
      LEFT JOIN DATA0010 d10 ON d10.RKEY = d50.CUSTOMER_PTR
      LEFT JOIN DATA0017 d17 ON d17.RKEY = wo.INVENTORY_PTR
      WHERE wo.WORK_ORDER_NUMBER = @wo
    `, { wo: workOrder })

    // Full route: every step for this work order source
    const routeRows = await queryMSSQL<any[]>('1', `
      SELECT
        d38.STEP_NUMBER AS STEP_NUMBER,
        LTRIM(RTRIM(d34.DEPT_CODE)) AS DEPT_CODE,
        d34.DEPT_NAME AS DEPT_NAME,
        d38.PERCENT_COMPLETE AS PERCENT_COMPLETE
      FROM DATA0006 wo
      INNER JOIN DATA0038 d38 ON d38.SOURCE_PTR = wo.RKEY AND d38.TTYPE = 2
      INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
      WHERE wo.WORK_ORDER_NUMBER = @wo
      ORDER BY d38.STEP_NUMBER
    `, { wo: workOrder })

    return NextResponse.json({
      success: true,
      general: genRows?.[0] || null,
      route: routeRows || [],
    })
  } catch (error) {
    console.error('Work order detail error:', error)
    return NextResponse.json({
      error: 'Failed to load work order',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
