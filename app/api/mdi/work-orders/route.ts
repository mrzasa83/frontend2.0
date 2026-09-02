import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/mssql'

/**
 * List active work orders from the daily plan for the MDI XML flow.
 *
 * Two modes (POST body):
 *   { deptCodes: string[] } — WOs whose CURRENT step dept (DATA9469.WORK_CENTER)
 *                             is in the interest list. This is the primary
 *                             "generate my list" path.
 *   { search: string }      — free-text WO-number search (the "add more" path).
 *
 * Active = DATA0006.PROD_STATUS IN (2,3,206,306), matching frontend2.0's Daily
 * Plan. Current step comes from DATA9469 (STEP_NO / WORK_CENTER).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const deptCodes: string[] = Array.isArray(body.deptCodes) ? body.deptCodes : []
    const search: string = (body.search || '').trim()

    if (!deptCodes.length && !search) {
      return NextResponse.json({ workOrders: [] })
    }

    // Base SELECT — the columns the MDI flow needs downstream.
    // Current step now comes from DATA9469 (the live production-transaction
    // table), not DATA0146 — DATA0146 was found sparse/unreliable (many active
    // WOs have no row), which left the current step / dept blank. DATA9469 has
    // the authoritative current step. For split lots a WO can have several
    // active step rows; take MIN(STEP_NO) (the tail lot) as the current step,
    // matching frontend2.0's Daily Plan. Join is on WORK_ORDER_NO with
    // COLLATE DATABASE_DEFAULT (collation-safe).
    const baseSelect = `
      ;WITH CurrentStep AS (
        SELECT WORK_ORDER_NO, MIN(STEP_NO) AS CUR_STEP
        FROM DATA9469 WITH (NOLOCK)
        GROUP BY WORK_ORDER_NO
      )
      SELECT TOP 500
        RTRIM(wo.WORK_ORDER_NUMBER) AS workOrder,
        RTRIM(d9469.WORK_CENTER) AS stepDeptCode,
        RTRIM(d9469.WORK_CENTER_NAME) AS stepDeptName,
        d9469.STEP_NO AS stepNo,
        RTRIM(ISNULL(d50.CUSTOMER_PART_NUMBER, '')) AS customerPart,
        RTRIM(ISNULL(d17.INV_PART_NUMBER, '')) AS invPart,
        RTRIM(ISNULL(d10.ABBR_NAME, '')) AS customerName
      FROM DATA0006 wo WITH (NOLOCK)
      LEFT JOIN CurrentStep cs
        ON wo.WORK_ORDER_NUMBER COLLATE DATABASE_DEFAULT = cs.WORK_ORDER_NO COLLATE DATABASE_DEFAULT
      LEFT JOIN DATA9469 d9469 WITH (NOLOCK)
        ON d9469.WORK_ORDER_NO COLLATE DATABASE_DEFAULT = cs.WORK_ORDER_NO COLLATE DATABASE_DEFAULT
        AND d9469.STEP_NO = cs.CUR_STEP
      LEFT JOIN DATA0050 d50 WITH (NOLOCK) ON wo.CUST_PART_PTR = d50.RKEY
      LEFT JOIN DATA0010 d10 WITH (NOLOCK) ON d50.CUSTOMER_PTR = d10.RKEY
      LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON wo.INVENTORY_PTR = d17.RKEY
      WHERE wo.PROD_STATUS IN (2,3,206,306)
    `

    let rows: any[]
    if (deptCodes.length) {
      // Parameterize the IN list to avoid injection.
      const params: Record<string, any> = {}
      const placeholders = deptCodes.map((code, i) => {
        params[`d${i}`] = code
        return `@d${i}`
      })
      const query = `${baseSelect}
        AND RTRIM(d9469.WORK_CENTER) IN (${placeholders.join(', ')})
        ORDER BY wo.WORK_ORDER_NUMBER`
      rows = await queryMSSQL(query, params)
    } else {
      const like = `%${search.replace(/[[%_]/g, (c) => `[${c}]`)}%`
      const query = `${baseSelect}
        AND wo.WORK_ORDER_NUMBER LIKE @like
        ORDER BY wo.WORK_ORDER_NUMBER`
      rows = await queryMSSQL(query, { like })
    }

    return NextResponse.json({ workOrders: rows })
  } catch (error) {
    console.error('Daily plan WO list error:', error)
    return NextResponse.json(
      { error: 'Failed to list work orders', details: String(error) },
      { status: 500 }
    )
  }
}
