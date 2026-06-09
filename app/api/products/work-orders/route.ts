import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { apcPN } = await request.json()

    if (!apcPN) {
      return NextResponse.json({ error: 'apcPN is required' }, { status: 400 })
    }

    // Resolve the inventory part the SAME way the DailyPlan report does:
    //   - normal WOs (not -000): via D6.INVENTORY_PTR            -> D17_1
    //   - W%-000 WOs:            via D50.BOM_PTR -> D25_2 -> D17  -> D17_3
    //   - other -000 WOs:        via D6.BOM_PTR  -> D25_1 -> D17  -> D17_2
    // All joins are LEFT OUTER so -000 work orders (whose INVENTORY_PTR does
    // not resolve to a DATA0017 row) are not dropped. Current WIP step comes
    // from DATA0146 via OUTER APPLY so each WO yields exactly one row.
    const query = `
      SELECT
        D6.WORK_ORDER_NUMBER,
        CASE
          WHEN D6.WORK_ORDER_NUMBER NOT LIKE '%-000' THEN D17_1.INV_PART_NUMBER
          WHEN D6.WORK_ORDER_NUMBER LIKE 'W%-000'    THEN D17_3.INV_PART_NUMBER
          WHEN D6.WORK_ORDER_NUMBER LIKE '%-000'     THEN D17_2.INV_PART_NUMBER
        END AS INV_PART_NUMBER,
        D6.PROD_STATUS,
        CASE
          WHEN WIP.STEP_NO IS NULL THEN 'Complete'
          ELSE CAST(WIP.STEP_NO AS VARCHAR(10))
        END AS STEP_NO,
        CASE
          WHEN WIP.STEP_NO IS NULL THEN D6.ACT_COMPL_DATE
          ELSE D6.PROJ_COMPL_DATE
        END AS COMPLETE_DATE
      FROM DATA0006 D6 WITH (NOLOCK)
      LEFT OUTER JOIN DATA0050 D50  WITH (NOLOCK) ON D6.CUST_PART_PTR = D50.RKEY
      LEFT OUTER JOIN DATA0017 D17_1 WITH (NOLOCK) ON D6.INVENTORY_PTR = D17_1.RKEY
      LEFT OUTER JOIN DATA0025 D25_1 WITH (NOLOCK) ON D25_1.RKEY = D6.BOM_PTR
      LEFT OUTER JOIN DATA0017 D17_2 WITH (NOLOCK) ON D17_2.RKEY = D25_1.INVENTORY_PTR
      LEFT OUTER JOIN DATA0025 D25_2 WITH (NOLOCK) ON D25_2.RKEY = D50.BOM_PTR
      LEFT OUTER JOIN DATA0017 D17_3 WITH (NOLOCK) ON D17_3.RKEY = D25_2.INVENTORY_PTR
      OUTER APPLY (
        SELECT TOP 1 D146.STEP_NO
        FROM DATA0146 D146 WITH (NOLOCK)
        WHERE D146.WORK_ORDER_NO = D6.WORK_ORDER_NUMBER
        ORDER BY D146.STEP_NO ASC
      ) WIP
      WHERE D50.CUSTOMER_PART_NUMBER LIKE @partNumber
      ORDER BY D6.WORK_ORDER_NUMBER DESC
    `

    const results = await queryMSSQL('1', query, { partNumber: `${apcPN}%` })

    // Open orders = still in WIP (a current step exists)
    const openOrders = results.filter((row: any) => row.STEP_NO !== 'Complete')

    return NextResponse.json({
      success: true,
      apcPN,
      count: openOrders.length,
      totalCount: results.length,
      data: openOrders,
      allData: results,
    })
  } catch (error) {
    console.error('Error fetching work orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work orders', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
