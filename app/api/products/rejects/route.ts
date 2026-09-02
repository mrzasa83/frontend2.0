import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { canReadModule } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

/**
 * Rejects and defects for a customer part.
 *
 * Driven from DATA0058 (the reject transactions) rather than DATA0311, walking
 * out to the throughput record and its work order, then to the customer part,
 * the inventory part (via the work order's BOM), the reject code and the
 * employee.
 *
 * COST depends on what kind of record it is, per DATA0039.REJECT_DEFECT_FLAG:
 *   'D' (defect)  the reject value carried on the transaction
 *   otherwise     cost applied at the work centre, less direct material,
 *                 plus the material actually issued
 * The DATA0311 join is therefore keyed on all four pointers — work order, work
 * centre, throughput and reject — so the cost lines up with this exact
 * transaction rather than any other reject on the same order.
 */
const REJECT_SQL = `
  SELECT
      LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) AS CUSTOMER_PART_NUMBER,
      LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS INV_PART_NUMBER,
      LTRIM(RTRIM(d6.WORK_ORDER_NUMBER))     AS WORK_ORDER_NUMBER,
      LTRIM(RTRIM(d39.REJ_CODE))             AS REJ_CODE,
      LTRIM(RTRIM(d39.REJECT_DESCRIPTION))   AS REJECT_DESCRIPTION,
      LTRIM(RTRIM(d39.REJECT_DEFECT_FLAG))   AS REJECT_DEFECT_FLAG,
      LTRIM(RTRIM(d5.EMPL_CODE))             AS EMPLOYEE_CODE,
      LTRIM(RTRIM(d5.EMPLOYEE_NAME))         AS EMPLOYEE_NAME,
      d58.TDATE      AS REJECT_DATE,
      d58.TTIME      AS REJECT_TIME,
      d58.QTY_REJECT AS QUANTITY,
      CASE
          WHEN d39.REJECT_DEFECT_FLAG = 'D' THEN d58.REJ_VALUE
          ELSE (d311.TOT_ACT_COST_APPLIED - d311.APPLIED_DIRECT_MTRL) + d311.ACTUAL_MTRL_ISSUED
      END AS REJECT_COST
  FROM DATA0058 d58 WITH (NOLOCK)
  -- Throughput -> Work Order
  LEFT JOIN DATA0056 d56 WITH (NOLOCK)
      ON d56.RKEY = d58.TPUT_PTR
  LEFT JOIN DATA0006 d6 WITH (NOLOCK)
      ON d6.RKEY = d56.WO_PTR
  -- Customer Part
  LEFT JOIN DATA0050 d50 WITH (NOLOCK)
      ON d50.RKEY = d6.CUST_PART_PTR
  -- Inventory part, through the work order's BOM
  LEFT JOIN DATA0025 d25 WITH (NOLOCK)
      ON d25.RKEY = d6.BOM_PTR
  LEFT JOIN DATA0017 d17 WITH (NOLOCK)
      ON d17.RKEY = d25.INVENTORY_PTR
  -- Reject code
  LEFT JOIN DATA0039 d39 WITH (NOLOCK)
      ON d39.RKEY = d58.REJECT_PTR
  -- Employee
  LEFT JOIN DATA0005 d5 WITH (NOLOCK)
      ON d5.RKEY = d58.EMPL_PTR
  -- Cost applied for this exact transaction
  LEFT JOIN DATA0311 d311 WITH (NOLOCK)
      ON d311.WORK_ORDER_PTR = d6.RKEY
     AND d311.DATA_34_PTR = d58.W_C_PTR
     AND d311.DATA_56_PTR = d56.RKEY
     AND d311.DATA_58_PTR = d58.RKEY
  WHERE d50.CUSTOMER_PART_NUMBER LIKE @part
  ORDER BY d58.TDATE DESC, d58.TTIME DESC`

// GET ?part=75336 -> reject transactions for that customer part.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const part = (new URL(request.url).searchParams.get('part') || '').trim()
  if (!part) return NextResponse.json({ error: 'part is required' }, { status: 400 })

  try {
    const rows = await queryMSSQL<any[]>('1', REJECT_SQL, { part: `${part}%` })

    // TTIME is stored as an HHMMSS integer, the same convention as the
    // production transactions used on the Daily Plan.
    const fmtTime = (v: any) => {
      const n = Number(v)
      if (!isFinite(n) || n < 0) return ''
      const s = String(Math.trunc(n)).padStart(6, '0')
      return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4, 6)}`
    }

    const mapped = (rows || []).map(r => ({
      customer_part: r.CUSTOMER_PART_NUMBER || '',
      inv_part: r.INV_PART_NUMBER || '',
      work_order: r.WORK_ORDER_NUMBER || '',
      reject_code: r.REJ_CODE || '',
      reject_description: r.REJECT_DESCRIPTION || '',
      // 'D' marks a defect; anything else is a reject. The two are costed
      // differently, so the distinction is worth showing.
      is_defect: String(r.REJECT_DEFECT_FLAG || '').toUpperCase() === 'D',
      defect_flag: r.REJECT_DEFECT_FLAG || '',
      cost: r.REJECT_COST === null || r.REJECT_COST === undefined ? null : Number(r.REJECT_COST),
      employee_code: r.EMPLOYEE_CODE || '',
      employee_name: r.EMPLOYEE_NAME || '',
      reject_date: r.REJECT_DATE || null,
      reject_time: fmtTime(r.REJECT_TIME),
      quantity: r.QUANTITY ?? null,
    }))

    const totalQty = mapped.reduce((a, r) => a + (Number(r.quantity) || 0), 0)
    const totalCost = mapped.reduce((a, r) => a + (Number(r.cost) || 0), 0)
    return NextResponse.json({
      success: true, rows: mapped, count: mapped.length, totalQty, totalCost,
    })
  } catch (error) {
    console.error('Reject query error:', error)
    return NextResponse.json({
      error: 'Failed to load rejects',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
