import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { loadFamilies } from '@/lib/ehs/loadFamilies'
import { familyForPart, type PartRow } from '@/lib/ehs/familyMatch'
import { productTypeFromPart, rollUpAll, type MaterialLine } from '@/lib/ehs/productCompliance'

export const dynamic = 'force-dynamic'

/**
 * Purchased materials on a product's BOM.
 * Mirrors the existing BOM traversal: the customer part (DATA0050) points at a
 * BOM header (DATA0025), whose lines (DATA0026) reference inventory parts
 * (DATA0017). Only P_M = 'P' rows are material — 'M' rows are sub-assemblies.
 */
const BOM_SQL = `
  SELECT
    d17.INV_PART_NUMBER      AS part_number,
    d17.INV_PART_DESCRIPTION AS description,
    d17.MANUFACTURER_NAME    AS manufacturer,
    d17.P_M                  AS pm,
    d17.ACTIVE_FLAG          AS active_flag,
    d26.QTY_BOM              AS quantity
  FROM data0050 d50
  JOIN data0025 d25 ON d50.BOM_PTR = d25.RKEY
  JOIN data0026 d26 ON d25.RKEY = d26.PARENT_NODE_INVENT
  JOIN data0017 d17 ON d17.RKEY = d26.INVENTORY_PTR
  WHERE d50.CUSTOMER_PART_NUMBER LIKE @partNumber
    AND (d25.EFF_END IS NULL OR d25.EFF_END > GETDATE())
  ORDER BY d17.INV_PART_NUMBER`

/** The customer's own part number, held in DATA0050.CUSTOMER_PART_DESC. */
const HEADER_SQL = `
  SELECT TOP 1
    d50.CUSTOMER_PART_NUMBER AS apc_part,
    d50.CUSTOMER_PART_DESC   AS customer_part
  FROM data0050 d50
  WHERE d50.CUSTOMER_PART_NUMBER LIKE @partNumber
  ORDER BY d50.CUSTOMER_PART_NUMBER`

/** Released route with departments, instructions and parameters. */
const ROUTE_SQL = `
  SELECT
    d38.STEP_NUMBER,
    d34.DEPT_CODE,
    d34.DEPT_NAME,
    i1.PROD_ROUT_INST_1 AS INST_1,
    i2.PROD_ROUT_INST_1 AS INST_2,
    p1.PRODUCTION_PARAMETER AS PARAM_1,
    p2.PRODUCTION_PARAMETER AS PARAM_2,
    d38.PARAMETER_1, d38.PARAMETER_2, d38.PARAMETER_3, d38.PARAMETER_4, d38.PARAMETER_5
  FROM DATA0038 d38
  INNER JOIN DATA0050 d50 ON d50.RKEY = d38.SOURCE_PTR
  INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
  LEFT JOIN DATA0036 i1 ON i1.RKEY = d38.DEF_ROUT_INST_1_PTR
  LEFT JOIN DATA0036 i2 ON i2.RKEY = d38.DEF_ROUT_INST_2_PTR
  LEFT JOIN DATA0035 p1 ON p1.RKEY = d38.DEF_ROUT_PARA_1_PTR
  LEFT JOIN DATA0035 p2 ON p2.RKEY = d38.DEF_ROUT_PARA_2_PTR
  WHERE d38.TTYPE = 4
    AND d50.CUSTOMER_PART_NUMBER LIKE @partNumber
  ORDER BY d38.STEP_NUMBER`

// GET ?part=APCPN -> BOM materials with family/compliance, route and history.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'ehs')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const part = (sp.get('part') || '').trim()
  if (!part) return NextResponse.json({ error: 'part is required' }, { status: 400 })

  try {
    const [bom, families] = await Promise.all([
      queryMSSQL<any[]>('1', BOM_SQL, { partNumber: `${part}%` }),
      loadFamilies(),
    ])

    // Purchased items only — sub-assemblies are not material in themselves.
    const purchased = (bom || []).filter(r => String(r.pm || '').trim().toUpperCase() === 'P')

    const materials: MaterialLine[] = purchased.map(r => {
      const asPart: PartRow = {
        RKEY: 0,
        INV_PART_NUMBER: r.part_number,
        INV_PART_DESCRIPTION: r.description,
        MANUFACTURER_NAME: r.manufacturer,
        ACTIVE_FLAG: r.active_flag,
      }
      const fam = familyForPart(asPart, families)
      const inherits = fam ? (fam.inherit_compliance ?? 1) : 1
      return {
        part_number: r.part_number,
        description: r.description,
        manufacturer: r.manufacturer,
        quantity: r.quantity ?? null,
        family_id: fam?.id ?? null,
        family_name: fam?.family_name || '',
        reach_status: inherits ? (fam?.reach_status || '') : '',
        rohs_status: inherits ? (fam?.rohs_status || '') : '',
        prop65_status: inherits ? (fam?.prop65_status || '') : '',
        per_part_evidence: fam ? !inherits : false,
      }
    })

    // Customer part number, best-effort.
    let customer_part = ''
    try {
      const hdr = await queryMSSQL<any[]>('1', HEADER_SQL, { partNumber: `${part}%` })
      customer_part = String(hdr?.[0]?.customer_part ?? '').trim()
    } catch (e) {
      console.error('EHS header query failed for', part, e)
    }

    // Route, best-effort: a product without a released route still assesses.
    let route: any[] = []
    try {
      route = await queryMSSQL<any[]>('1', ROUTE_SQL, { partNumber: `${part}%` }) || []
    } catch (e) {
      console.error('EHS route query failed for', part, e)
    }

    const history = await queryPrimary<any[]>(
      `SELECT id, apc_part, customer_part, reach_status, rohs_status, prop65_status,
              material_count, covered_count, notes, assessed_by, assessed_at
       FROM ehs_product_assessments
       WHERE apc_part = ?
       ORDER BY assessed_at DESC`, [part]
    )

    return NextResponse.json({
      success: true,
      apc_part: part,
      customer_part,
      part_type: productTypeFromPart(part),
      materials,
      bom_total: bom?.length ?? 0,
      purchased_count: purchased.length,
      rollup: rollUpAll(materials),
      route,
      history: history || [],
    })
  } catch (error) {
    console.error('EHS product detail error:', error)
    return NextResponse.json({
      error: 'Failed to load the product',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
