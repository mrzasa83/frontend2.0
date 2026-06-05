import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

const READ_CONN = '1'

// Where-used: given an inventory part number, find customer parts that use it
async function whereUsed(partNumber: string): Promise<{ customerPart: string; desc: string }[]> {
  const rows = await queryMSSQL<any[]>(READ_CONN, `
    ;WITH StartPart AS (
        SELECT RKEY, INV_PART_NUMBER FROM DATA0017 WHERE INV_PART_NUMBER LIKE @part
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
  `, { part: `%${partNumber}%` })
  return rows.map((r: any) => ({
    customerPart: (r.CUSTOMER_PART_NUMBER || '').trim(),
    desc: (r.CUSTOMER_PART_DESC || '').trim(),
  }))
}

// Work orders for a customer part (uses prod-status / -000 BOM logic)
async function workOrders(customerPart: string): Promise<any[]> {
  const rows = await queryMSSQL<any[]>(READ_CONN, woSql('CUSTOMER_PART_NUMBER LIKE @cp'), { cp: `${customerPart}%` })
  return mapWorkOrders(rows)
}

// Work orders by work-order number LIKE search
async function workOrdersByNumber(woNumber: string): Promise<any[]> {
  const rows = await queryMSSQL<any[]>(READ_CONN, woSql('WORK_ORDER LIKE @wo'), { wo: `%${woNumber}%` })
  return mapWorkOrders(rows)
}

// Shared work-order SQL; caller supplies the WHERE predicate
function woSql(whereClause: string): string {
  return `
    WITH WO_BASE AS (
        SELECT
            D6.RKEY AS D6_RKEY, D6.WORK_ORDER_NUMBER, D6.QUAN_PROD,
            D6.INVENTORY_PTR, D6.BOM_PTR, D6.WHOUSE_PTR, D6.PROD_STATUS,
            D50.RKEY AS D50_RKEY, D50.CUSTOMER_PART_NUMBER, D50.BOM_PTR AS D50_BOM_PTR,
            WH.WAREHOUSE_NAME
        FROM DATA0006 D6 WITH (NOLOCK)
        LEFT JOIN DATA0050 D50 WITH (NOLOCK) ON D6.CUST_PART_PTR = D50.RKEY
        LEFT JOIN DATA0015 WH WITH (NOLOCK) ON D6.WHOUSE_PTR = WH.RKEY
        WHERE D6.PROD_STATUS IN (2,3,206,306)
    ),
    INV_STD AS (SELECT RKEY, INV_PART_NUMBER FROM DATA0017 WITH (NOLOCK)),
    BOM_STD AS (SELECT RKEY, INVENTORY_PTR FROM DATA0025 WITH (NOLOCK)),
    INV_BOM AS (
        SELECT B.RKEY, I.INV_PART_NUMBER FROM BOM_STD B
        JOIN DATA0017 I WITH (NOLOCK) ON B.INVENTORY_PTR = I.RKEY
    ),
    MAIN AS (
        SELECT
            B.WORK_ORDER_NUMBER AS WORK_ORDER,
            B.CUSTOMER_PART_NUMBER,
            CASE
                WHEN B.WORK_ORDER_NUMBER NOT LIKE '%-000' THEN IS1.INV_PART_NUMBER
                WHEN B.WORK_ORDER_NUMBER LIKE '%-000'     THEN IB.INV_PART_NUMBER
            END AS INV_PART_NUMBER,
            SUBSTRING(B.WAREHOUSE_NAME,1,6) AS Site,
            CASE
                WHEN B.PROD_STATUS = 2   THEN 'Unreleased'
                WHEN B.PROD_STATUS = 206 THEN 'On Hold (Unreleased)'
                WHEN B.PROD_STATUS = 306 THEN 'On Hold (Released)'
                WHEN B.PROD_STATUS = 3   THEN 'In Progress'
                ELSE 'Open'
            END AS Status
        FROM WO_BASE B
        LEFT JOIN INV_STD IS1 ON B.INVENTORY_PTR = IS1.RKEY
        LEFT JOIN BOM_STD BS ON B.BOM_PTR = BS.RKEY
        LEFT JOIN INV_BOM IB ON BS.RKEY = IB.RKEY
    )
    SELECT WORK_ORDER, CUSTOMER_PART_NUMBER, INV_PART_NUMBER, Site, Status
    FROM MAIN
    WHERE ${whereClause}
    ORDER BY WORK_ORDER
  `
}

function mapWorkOrders(rows: any[]): any[] {
  return rows.map((r: any) => ({
    workOrder: (r.WORK_ORDER || '').trim(),
    customerPart: (r.CUSTOMER_PART_NUMBER || '').trim(),
    pcbNumber: (r.INV_PART_NUMBER || '').trim(),
    invPartNumber: (r.INV_PART_NUMBER || '').trim(),
    status: (r.Status || '').trim(),
    site: (r.Site || '').trim(),
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
