import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

const READ_CONN = '1'

// ─── Customer Parts (Sales Part → Production Part) ──────────────
const CUSTOMER_PARTS_SQL = `
SELECT
    pp.RKEY AS ProdPartRKEY,
    sp.RKEY AS SalesPartRKEY,
    CASE
        WHEN pp.CUSTOMER_PART_NUMBER LIKE 'Z%' THEN
            CASE 
                WHEN CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) > 0 THEN
                    SUBSTRING(pp.CUSTOMER_PART_NUMBER, 2, CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) - 2)
                ELSE
                    SUBSTRING(pp.CUSTOMER_PART_NUMBER, 2, LEN(pp.CUSTOMER_PART_NUMBER))
            END
        WHEN pp.CUSTOMER_PART_NUMBER LIKE 'R%' THEN
            LEFT(pp.CUSTOMER_PART_NUMBER, 6)
        ELSE
            CASE
                WHEN CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) > 0 THEN
                    LEFT(pp.CUSTOMER_PART_NUMBER, CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) - 1)
                ELSE
                    pp.CUSTOMER_PART_NUMBER
            END
    END AS ProdPartNum,
    sp.CUSTOMER_PART_NUMBER,
    sp.ANALYSIS_CODE_4 AS Program,
    CASE
        WHEN pp.CUSTOMER_PART_NUMBER LIKE 'Z%' THEN 'OBSOLETE'
        ELSE
            CASE
                WHEN CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) = 0 THEN 'Released'
                WHEN LTRIM(SUBSTRING(
                        pp.CUSTOMER_PART_NUMBER,
                        CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER),
                        LEN(pp.CUSTOMER_PART_NUMBER)
                    )) = '' THEN 'Released'
                ELSE LTRIM(SUBSTRING(
                        pp.CUSTOMER_PART_NUMBER,
                        CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER),
                        LEN(pp.CUSTOMER_PART_NUMBER)
                    ))
            END
    END AS Status,
    cust.CUST_CODE,
    cust.CUSTOMER_NAME
FROM data0050 sp
JOIN data0050 pp ON sp.PRODUCTION_PART_PTR = pp.RKEY
JOIN data0010 cust ON sp.CUSTOMER_PTR = cust.RKEY
WHERE sp.PLAN_INNER_LAYER = 1
ORDER BY
    CASE
        WHEN pp.CUSTOMER_PART_NUMBER LIKE 'Z%' THEN
            CASE 
                WHEN CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) > 0 THEN
                    SUBSTRING(pp.CUSTOMER_PART_NUMBER, 2, CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) - 2)
                ELSE
                    SUBSTRING(pp.CUSTOMER_PART_NUMBER, 2, LEN(pp.CUSTOMER_PART_NUMBER))
            END
        WHEN pp.CUSTOMER_PART_NUMBER LIKE 'R%' THEN
            LEFT(pp.CUSTOMER_PART_NUMBER, 6)
        ELSE
            CASE
                WHEN CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) > 0 THEN
                    LEFT(pp.CUSTOMER_PART_NUMBER, CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) - 1)
                ELSE
                    pp.CUSTOMER_PART_NUMBER
            END
    END ASC
`

// ─── Inventory Parts ────────────────────────────────────────────
const INVENTORY_PARTS_SQL = `
SELECT
    RKEY,
    INV_PART_NUMBER,
    INV_PART_DESCRIPTION,
    MANUFACTURER_NAME,
    P_M
FROM data0017
ORDER BY INV_PART_NUMBER ASC
`

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'customer' or 'inventory'

  try {
    if (type === 'customer') {
      const rows = await queryMSSQL<any[]>(READ_CONN, CUSTOMER_PARTS_SQL)
      const data = rows.map(r => ({
        id: r.SalesPartRKEY,
        apcPN: (r.ProdPartNum || '').trim(),
        customerPN: (r.CUSTOMER_PART_NUMBER || '').trim(),
        customer: (r.CUSTOMER_NAME || '').trim(),
        custCode: (r.CUST_CODE || '').trim(),
        program: (r.Program || '').trim(),
        status: (r.Status || '').trim(),
        currentRev: null,
        buildRev: null,
        description: null,
        fullPath: null,
        item_type_name: 'Customer Part',
        item_type_id: -1,
        partSource: 'customer',
        prodPartRkey: r.ProdPartRKEY,
        createdAt: '',
      }))
      return NextResponse.json({ success: true, count: data.length, data })
    }

    if (type === 'inventory') {
      const rows = await queryMSSQL<any[]>(READ_CONN, INVENTORY_PARTS_SQL)
      const data = rows.map(r => ({
        id: r.RKEY,
        apcPN: (r.INV_PART_NUMBER || '').trim(),
        customerPN: null,
        customer: (r.MANUFACTURER_NAME || '').trim(),
        custCode: null,
        program: null,
        status: r.P_M === 'P' ? 'Purchase' : r.P_M === 'M' ? 'Manufacture' : (r.P_M || ''),
        currentRev: null,
        buildRev: null,
        description: (r.INV_PART_DESCRIPTION || '').trim(),
        fullPath: null,
        item_type_name: 'Inventory Part',
        item_type_id: -2,
        partSource: 'inventory',
        createdAt: '',
      }))
      return NextResponse.json({ success: true, count: data.length, data })
    }

    return NextResponse.json({ error: 'type parameter required (customer or inventory)' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching paradigm products:', error)
    return NextResponse.json({
      error: 'Failed to query Paradigm',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
