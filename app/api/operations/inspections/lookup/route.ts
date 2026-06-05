import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

const READ_CONN = '1'

// Where-used: given an inventory part number, find customer parts that use it
async function whereUsed(partNumber: string): Promise<{ customerPart: string; desc: string }[]> {
  const rows = await queryMSSQL<any[]>(READ_CONN, `
    DECLARE @INV_PART VARCHAR(50) = @p0;
    ;WITH StartPart AS (
        SELECT RKEY, INV_PART_NUMBER FROM DATA0017 WHERE INV_PART_NUMBER LIKE @INV_PART
    ),
    RecursiveBOM AS (
        SELECT d17.RKEY AS CHILD_RKEY, d17.RKEY AS CURRENT_RKEY, d17.INV_PART_NUMBER, 0 AS LVL
        FROM StartPart d17
        UNION ALL
        SELECT rb.CHILD_RKEY, d25.INVENTORY_PTR AS CURRENT_RKEY, d17p.INV_PART_NUMBER, rb.LVL + 1
        FROM RecursiveBOM rb
        INNER JOIN DATA0026 d26 ON d26.INVENTORY_PTR = rb.CURRENT_RKEY
        INNER JOIN DATA0025 d25 ON d25.RKEY = d26.PARENT_NODE_INVENT
        INNER JOIN DATA0017 d17p ON d17p.RKEY = d25.INVENTORY_PTR
    )
    SELECT DISTINCT d50.CUSTOMER_PART_NUMBER, d50.CUSTOMER_PART_DESC
    FROM RecursiveBOM rb
    INNER JOIN DATA0025 d25 ON d25.INVENTORY_PTR = rb.CURRENT_RKEY
    INNER JOIN DATA0050 d50 ON d50.BOM_PTR = d25.RKEY
    ORDER BY d50.CUSTOMER_PART_NUMBER
  `, [`%${partNumber}%`])
  return rows.map((r: any) => ({
    customerPart: (r.CUSTOMER_PART_NUMBER || '').trim(),
    desc: (r.CUSTOMER_PART_DESC || '').trim(),
  }))
}

// Work orders for a customer part (open, last 12 months)
async function workOrders(customerPart: string): Promise<any[]> {
  const rows = await queryMSSQL<any[]>(READ_CONN, `
    SELECT
      RTRIM(d6.WORK_ORDER_NUMBER) AS WORK_ORDER_NUMBER,
      d50.CUSTOMER_PART_NUMBER,
      d17.INV_PART_NUMBER,
      d146.STEP_NO AS CURRENT_STEP,
      RTRIM(d146.WORK_CENTER) AS CURRENT_DEPT,
      d6.QUAN_SCH AS QTY_ORDERED,
      d6.QUAN_PROD AS QTY_COMPLETE,
      CASE WHEN d6.ACT_COMPL_DATE IS NOT NULL THEN 'Complete'
           WHEN d6.PROD_STATUS = 0 THEN 'Open' ELSE 'In Progress' END AS STATUS,
      SUBSTRING(wh.WAREHOUSE_NAME,1,6) AS SITE
    FROM DATA0006 d6 WITH (NOLOCK)
    INNER JOIN DATA0050 d50 WITH (NOLOCK) ON d50.RKEY = d6.CUST_PART_PTR
    LEFT JOIN DATA0146 d146 WITH (NOLOCK) ON d146.WORK_ORDER_NO = d6.WORK_ORDER_NUMBER
    INNER JOIN DATA0017 d17 WITH (NOLOCK) ON d6.INVENTORY_PTR = d17.RKEY
    LEFT JOIN DATA0015 wh WITH (NOLOCK) ON d6.WHOUSE_PTR = wh.RKEY
    WHERE d50.CUSTOMER_PART_NUMBER = @p0
      AND d6.ACT_COMPL_DATE IS NULL
      AND d6.RELEASE_DATE >= DATEADD(MONTH, -12, GETDATE())
    ORDER BY d6.WORK_ORDER_NUMBER
  `, [customerPart])
  return mapWorkOrders(rows)
}

// Work orders by work-order number LIKE search
async function workOrdersByNumber(woNumber: string): Promise<any[]> {
  const rows = await queryMSSQL<any[]>(READ_CONN, `
    SELECT
      RTRIM(d6.WORK_ORDER_NUMBER) AS WORK_ORDER_NUMBER,
      d50.CUSTOMER_PART_NUMBER,
      d17.INV_PART_NUMBER,
      d146.STEP_NO AS CURRENT_STEP,
      RTRIM(d146.WORK_CENTER) AS CURRENT_DEPT,
      d6.QUAN_SCH AS QTY_ORDERED,
      d6.QUAN_PROD AS QTY_COMPLETE,
      CASE WHEN d6.ACT_COMPL_DATE IS NOT NULL THEN 'Complete'
           WHEN d6.PROD_STATUS = 0 THEN 'Open' ELSE 'In Progress' END AS STATUS,
      SUBSTRING(wh.WAREHOUSE_NAME,1,6) AS SITE
    FROM DATA0006 d6 WITH (NOLOCK)
    INNER JOIN DATA0050 d50 WITH (NOLOCK) ON d50.RKEY = d6.CUST_PART_PTR
    LEFT JOIN DATA0146 d146 WITH (NOLOCK) ON d146.WORK_ORDER_NO = d6.WORK_ORDER_NUMBER
    INNER JOIN DATA0017 d17 WITH (NOLOCK) ON d6.INVENTORY_PTR = d17.RKEY
    LEFT JOIN DATA0015 wh WITH (NOLOCK) ON d6.WHOUSE_PTR = wh.RKEY
    WHERE d6.WORK_ORDER_NUMBER LIKE @p0
      AND d6.ACT_COMPL_DATE IS NULL
      AND d6.RELEASE_DATE >= DATEADD(MONTH, -12, GETDATE())
    ORDER BY d6.WORK_ORDER_NUMBER
  `, [`%${woNumber}%`])
  return mapWorkOrders(rows)
}

function mapWorkOrders(rows: any[]): any[] {
  return rows.map((r: any) => ({
    workOrder: (r.WORK_ORDER_NUMBER || '').trim(),
    customerPart: (r.CUSTOMER_PART_NUMBER || '').trim(),
    invPartNumber: (r.INV_PART_NUMBER || '').trim(),
    currentStep: r.CURRENT_STEP,
    currentDept: (r.CURRENT_DEPT || '').trim(),
    qtyOrdered: r.QTY_ORDERED,
    qtyComplete: r.QTY_COMPLETE,
    status: r.STATUS,
    site: (r.SITE || '').trim(),
  }))
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const partNumber = searchParams.get('partNumber')
  const workOrder = searchParams.get('workOrder')

  if (!partNumber && !workOrder) {
    return NextResponse.json({ error: 'partNumber or workOrder required' }, { status: 400 })
  }

  try {
    // Work order direct LIKE search
    if (workOrder) {
      const wos = await workOrdersByNumber(workOrder)
      return NextResponse.json({ success: true, mode: 'workOrder', workOrders: wos })
    }

    // Part number → where-used → work orders
    const customerParts = await whereUsed(partNumber!)

    // Exclude Z-prefix customer parts (e.g. Z11130)
    const valid = customerParts.filter(c => c.customerPart && !/^z/i.test(c.customerPart))

    // Work order search for each valid customer part
    const allWorkOrders: any[] = []
    for (const cp of valid) {
      const wos = await workOrders(cp.customerPart)
      allWorkOrders.push(...wos)
    }

    return NextResponse.json({
      success: true,
      mode: 'partNumber',
      partNumber,
      customerParts: valid,
      workOrders: allWorkOrders,
    })
  } catch (error) {
    console.error('Error in lookup:', error)
    return NextResponse.json({
      error: 'Lookup failed', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
