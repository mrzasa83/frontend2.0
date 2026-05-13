import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { queryMSSQL } from '@/lib/db/mssql'

const READ_CONN = '1'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const escfId = searchParams.get('escfId')
  const department = searchParams.get('department')

  if (!escfId && !department) {
    return NextResponse.json({ error: 'escfId or department required' }, { status: 400 })
  }

  try {
    // Get department from ESCF if not provided
    let dept = department
    if (!dept && escfId) {
      const rows = await queryPrimary('SELECT department FROM escf WHERE id = ?', [escfId])
      if (!rows?.length) return NextResponse.json({ error: 'ESCF not found' }, { status: 404 })
      dept = rows[0].department
    }

    if (!dept) return NextResponse.json({ error: 'No department found' }, { status: 400 })

    // Get mapped Paradigm dept codes from our mapping table
    const mappings = await queryPrimary(
      'SELECT paradigm_dept_code FROM wc_dept_mapping WHERE escf_department = ?',
      [dept]
    )

    if (!mappings?.length) {
      return NextResponse.json({
        success: true, department: dept, deptCodes: [],
        message: 'No Paradigm departments mapped for this work center',
        data: [],
      })
    }

    const deptCodes = mappings.map((m: any) => m.paradigm_dept_code)

    // Build the RouteFilter CTE dynamically
    const routeFilterUnion = deptCodes
      .map((code: string, i: number) => i === 0
        ? `SELECT '${code.replace(/'/g, "''")}' AS DEPT_CODE`
        : `SELECT '${code.replace(/'/g, "''")}'`)
      .join(' UNION ALL\n    ')

    const sql = `
WITH RouteFilter AS (
    ${routeFilterUnion}
),
InventoryRouting AS (
    SELECT
        d17.RKEY,
        d17.INV_PART_NUMBER AS INVENTORY_PART_NUMBER,
        STUFF((
            SELECT '; ' + LTRIM(RTRIM(d34.DEPT_CODE))
            FROM DATA0038 d38
            INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
            WHERE d38.SOURCE_PTR = d17.RKEY
              AND d38.TTYPE = 3
            ORDER BY d38.STEP_NUMBER
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS ROUTE_STEPS,
        STUFF((
            SELECT '; ' + LTRIM(RTRIM(d34.DEPT_CODE))
            FROM DATA0038 d38
            INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
            INNER JOIN RouteFilter rf ON rf.DEPT_CODE = LTRIM(RTRIM(d34.DEPT_CODE))
            WHERE d38.SOURCE_PTR = d17.RKEY
              AND d38.TTYPE = 3
            ORDER BY d38.STEP_NUMBER
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS HITS
    FROM DATA0017 d17
    WHERE d17.INV_PART_NUMBER NOT LIKE 'Z%'
),
CustomerRouting AS (
    SELECT
        d50.RKEY,
        d50.CUSTOMER_PART_NUMBER,
        STUFF((
            SELECT '; ' + LTRIM(RTRIM(d34.DEPT_CODE))
            FROM DATA0038 d38
            INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
            WHERE d38.SOURCE_PTR = d50.RKEY
              AND d38.TTYPE = 4
            ORDER BY d38.STEP_NUMBER
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS ROUTE_STEPS,
        STUFF((
            SELECT '; ' + LTRIM(RTRIM(d34.DEPT_CODE))
            FROM DATA0038 d38
            INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
            INNER JOIN RouteFilter rf ON rf.DEPT_CODE = LTRIM(RTRIM(d34.DEPT_CODE))
            WHERE d38.SOURCE_PTR = d50.RKEY
              AND d38.TTYPE = 4
            ORDER BY d38.STEP_NUMBER
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS HITS
    FROM DATA0050 d50
    WHERE d50.CUSTOMER_PART_NUMBER NOT LIKE 'Z%'
),
RecursiveBOM AS (
    SELECT
        d50.RKEY AS CUST_RKEY,
        d25.INVENTORY_PTR AS CHILD_RKEY,
        CAST(',' + CAST(d25.INVENTORY_PTR AS VARCHAR(20)) + ',' AS VARCHAR(MAX)) AS PATH
    FROM DATA0050 d50
    INNER JOIN DATA0025 d25 ON d25.RKEY = d50.BOM_PTR
    UNION ALL
    SELECT
        rb.CUST_RKEY,
        d25p.INVENTORY_PTR,
        rb.PATH + CAST(d25p.INVENTORY_PTR AS VARCHAR(20)) + ','
    FROM RecursiveBOM rb
    INNER JOIN DATA0026 d26 ON d26.INVENTORY_PTR = rb.CHILD_RKEY
    INNER JOIN DATA0025 d25p ON d25p.RKEY = d26.PARENT_NODE_INVENT
    WHERE rb.PATH NOT LIKE '%,' + CAST(d25p.INVENTORY_PTR AS VARCHAR(20)) + ',%'
),
InventoryFinal AS (
    SELECT DISTINCT
        cr.CUSTOMER_PART_NUMBER,
        ir.INVENTORY_PART_NUMBER,
        ir.ROUTE_STEPS
    FROM InventoryRouting ir
    INNER JOIN RecursiveBOM rb ON rb.CHILD_RKEY = ir.RKEY
    INNER JOIN CustomerRouting cr ON cr.RKEY = rb.CUST_RKEY
    WHERE ir.HITS IS NOT NULL AND ir.HITS <> ''
),
CustomerFinal AS (
    SELECT
        cr.CUSTOMER_PART_NUMBER,
        NULL AS INVENTORY_PART_NUMBER,
        cr.ROUTE_STEPS
    FROM CustomerRouting cr
    WHERE cr.HITS IS NOT NULL AND cr.HITS <> ''
)
SELECT * FROM CustomerFinal
UNION ALL
SELECT * FROM InventoryFinal
ORDER BY CUSTOMER_PART_NUMBER, INVENTORY_PART_NUMBER
`

    const rows = await queryMSSQL<any[]>(READ_CONN, sql)

    return NextResponse.json({
      success: true,
      department: dept,
      deptCodes,
      count: rows.length,
      data: rows.map((r: any) => ({
        customerPartNumber: (r.CUSTOMER_PART_NUMBER || '').trim(),
        inventoryPartNumber: (r.INVENTORY_PART_NUMBER || '').trim() || null,
        routeSteps: (r.ROUTE_STEPS || '').trim(),
      })),
    })
  } catch (error) {
    console.error('Error fetching related parts:', error)
    return NextResponse.json({
      error: 'Failed to fetch related parts',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
