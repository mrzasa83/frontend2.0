import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { canReadModule } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

/**
 * Reject history for a customer part.
 *
 * DATA0311 links a work order to a reject transaction (DATA0058), which carries
 * the reject code (DATA0039), the employee (DATA0005), the date/time and the
 * quantity. Searched by customer part number, so it covers every work order
 * built for that part.
 */
const REJECT_SQL = `
  SELECT
      LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) AS CUSTOMER_PART_NUMBER,
      LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS INV_PART_NUMBER,
      LTRIM(RTRIM(d6.WORK_ORDER_NUMBER))     AS WORK_ORDER_NUMBER,
      LTRIM(RTRIM(d39.REJ_CODE))             AS REJ_CODE,
      LTRIM(RTRIM(d39.REJECT_DESCRIPTION))   AS REJECT_DESCRIPTION,
      LTRIM(RTRIM(d5.EMPL_CODE))             AS EMPLOYEE_CODE,
      LTRIM(RTRIM(d5.EMPLOYEE_NAME))         AS EMPLOYEE_NAME,
      d58.TDATE      AS REJECT_DATE,
      d58.TTIME      AS REJECT_TIME,
      d58.QTY_REJECT AS QUANTITY
  FROM DATA0311 d311 WITH (NOLOCK)
  LEFT JOIN DATA0006 d6  WITH (NOLOCK) ON d6.RKEY  = d311.WORK_ORDER_PTR
  LEFT JOIN DATA0058 d58 WITH (NOLOCK) ON d58.RKEY = d311.DATA_58_PTR
  LEFT JOIN DATA0039 d39 WITH (NOLOCK) ON d39.RKEY = d58.REJECT_PTR
  LEFT JOIN DATA0056 d56 WITH (NOLOCK) ON d56.RKEY = d311.DATA_56_PTR
  LEFT JOIN DATA0034 d34 WITH (NOLOCK) ON d34.RKEY = d311.DATA_34_PTR
  LEFT JOIN DATA0005 d5  WITH (NOLOCK) ON d5.RKEY  = d58.EMPL_PTR
  LEFT JOIN DATA0050 d50 WITH (NOLOCK) ON d50.RKEY = d6.CUST_PART_PTR
  LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d6.INVENTORY_PTR
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
      employee_code: r.EMPLOYEE_CODE || '',
      employee_name: r.EMPLOYEE_NAME || '',
      reject_date: r.REJECT_DATE || null,
      reject_time: fmtTime(r.REJECT_TIME),
      quantity: r.QUANTITY ?? null,
    }))

    const totalQty = mapped.reduce((a, r) => a + (Number(r.quantity) || 0), 0)
    return NextResponse.json({
      success: true, rows: mapped, count: mapped.length, totalQty,
    })
  } catch (error) {
    console.error('Reject query error:', error)
    return NextResponse.json({
      error: 'Failed to load rejects',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
