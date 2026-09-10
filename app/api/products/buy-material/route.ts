import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { canReadModule } from '@/lib/config/access'
import { loadFamilies } from '@/lib/ehs/loadFamilies'
import { familyForPart, type PartRow } from '@/lib/ehs/familyMatch'
import { notepadBatchSql, assembleNotepadByRkey } from '@/lib/products/notepad'

export const dynamic = 'force-dynamic'

/**
 * Buy Material — the purchased leaves of a product's full BOM, with quantity.
 *
 * Same recursive traversal as EHS ▸ Product Compliance, which already resolves
 * purchased parts to their family. Two things differ, both because this list is
 * a purchasing document rather than a compliance roll-up:
 *
 *  1. QUANTITY IS EXTENDED, NOT RAW.
 *     DATA0026.QTY_BOM is the quantity per unit of its immediate parent. On a
 *     nested BOM the raw figure is meaningless on its own: 4 screws per bracket
 *     with 3 brackets per assembly is 12 screws, not 4. The recursion therefore
 *     carries a running multiplier down the tree, and the buy quantity is the
 *     SUM of the extended quantities across every place the part appears.
 *
 *     The compliance view takes MAX(quantity) after grouping, which is fine
 *     there — it only ever needed the distinct set of materials, and quantity
 *     was incidental. It would understate a buy list.
 *
 *  2. Notepad is included. Compliance doesn't show it; a buyer wants it.
 *
 * Descends only into manufactured ('M') components — a purchased part is a
 * leaf. Effectivity is honoured at every level and a visited-path guard stops a
 * self-referencing BOM from recursing forever.
 */
const BUY_MATERIAL_SQL = `
  WITH BomTree AS (
    -- Level 1: components of the customer part's BOM.
    -- ext_qty starts as the node's own QTY_BOM: one unit of the top-level part.
    SELECT
      d17.RKEY                 AS component_rkey,
      d17.INV_PART_NUMBER      AS part_number,
      d17.INV_PART_DESCRIPTION AS description,
      d17.MANUFACTURER_NAME    AS manufacturer,
      d17.P_M                  AS pm,
      d17.ACTIVE_FLAG          AS active_flag,
      d26.QTY_BOM              AS qty_per_parent,
      CAST(ISNULL(d26.QTY_BOM, 0) AS DECIMAL(18,6)) AS ext_qty,
      1                        AS lvl,
      CAST(d50.CUSTOMER_PART_NUMBER AS NVARCHAR(400)) AS parent_part,
      CAST('|' + CAST(d17.RKEY AS NVARCHAR(20)) + '|' AS NVARCHAR(4000)) AS visited
    FROM data0050 d50
    JOIN data0025 d25 ON d50.BOM_PTR = d25.RKEY
    JOIN data0026 d26 ON d25.RKEY = d26.PARENT_NODE_INVENT
    JOIN data0017 d17 ON d17.RKEY = d26.INVENTORY_PTR
    WHERE d50.CUSTOMER_PART_NUMBER LIKE @partNumber
      AND (d25.EFF_END IS NULL OR d25.EFF_END > GETDATE())

    UNION ALL

    -- Deeper levels: the child's extended quantity is its per-parent quantity
    -- multiplied by however many of the parent this product needs.
    SELECT
      c17.RKEY, c17.INV_PART_NUMBER, c17.INV_PART_DESCRIPTION,
      c17.MANUFACTURER_NAME, c17.P_M, c17.ACTIVE_FLAG,
      c26.QTY_BOM,
      CAST(t.ext_qty * ISNULL(c26.QTY_BOM, 0) AS DECIMAL(18,6)),
      t.lvl + 1,
      CAST(t.part_number AS NVARCHAR(400)),
      CAST(t.visited + CAST(c17.RKEY AS NVARCHAR(20)) + '|' AS NVARCHAR(4000))
    FROM BomTree t
    JOIN data0025 c25 ON c25.INVENTORY_PTR = t.component_rkey
    JOIN data0026 c26 ON c26.PARENT_NODE_INVENT = c25.RKEY
    JOIN data0017 c17 ON c17.RKEY = c26.INVENTORY_PTR
    WHERE t.pm = 'M'
      AND t.lvl < 20
      AND (c25.EFF_END IS NULL OR c25.EFF_END > GETDATE())
      AND t.visited NOT LIKE '%|' + CAST(c17.RKEY AS NVARCHAR(20)) + '|%'
  )
  SELECT
    component_rkey,
    part_number,
    description,
    manufacturer,
    active_flag,
    MIN(lvl)          AS lvl,           -- shallowest place it appears
    SUM(ext_qty)      AS qty_extended,  -- total per unit of the product
    MAX(qty_per_parent) AS qty_per_parent,
    COUNT(*)          AS occurrences,   -- how many BOM positions it sits in
    MIN(parent_part)  AS parent_part
  FROM BomTree
  WHERE pm = 'P'
  GROUP BY component_rkey, part_number, description, manufacturer, active_flag
  ORDER BY MIN(lvl), part_number
  OPTION (MAXRECURSION 32)`

/**
 * Header: the APC part number and the customer's own part number.
 * CUSTOMER_PART_NUMBER is the APC number; CUSTOMER_PART_DESC holds the
 * customer's, which is the naming Product Compliance already relies on.
 */
const HEADER_SQL = `
  SELECT TOP 1
    d50.CUSTOMER_PART_NUMBER AS apc_part,
    d50.CUSTOMER_PART_DESC   AS customer_part
  FROM data0050 d50
  WHERE d50.CUSTOMER_PART_NUMBER LIKE @partNumber
  ORDER BY d50.CUSTOMER_PART_NUMBER`

// GET ?part=APCPN -> purchased materials with extended quantity, family, notepad.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const part = (sp.get('part') || '').trim()
  if (!part) return NextResponse.json({ error: 'part is required' }, { status: 400 })

  try {
    const [rows, families] = await Promise.all([
      queryMSSQL<any[]>('1', BUY_MATERIAL_SQL, { partNumber: `${part}%` }),
      loadFamilies(),
    ])
    const purchased = rows || []

    // Notepad for every purchased part in one round trip rather than one call
    // per line. Chunked so a large BOM doesn't build an unbounded IN list.
    const notepadByRkey = new Map<string, string>()
    const rkeys = purchased
      .map(r => r.component_rkey)
      .filter(v => v !== null && v !== undefined)
    for (let i = 0; i < rkeys.length; i += 200) {
      const batch = rkeys.slice(i, i + 200)
      const names = batch.map((_, j) => `@r${j}`)
      const params: Record<string, any> = {}
      batch.forEach((rk, j) => { params[`r${j}`] = rk })
      try {
        const noteRows = await queryMSSQL<any[]>('1', notepadBatchSql(names), params)
        for (const [k, v] of assembleNotepadByRkey(noteRows || [])) {
          notepadByRkey.set(k, v)
        }
      } catch (e) {
        // Best-effort: a buy list without notes still beats no buy list.
        console.error('Buy material notepad query failed for', part, e)
      }
    }

    const materials = purchased.map(r => {
      const asPart: PartRow = {
        RKEY: r.component_rkey ?? 0,
        INV_PART_NUMBER: String(r.part_number || '').trim(),
        INV_PART_DESCRIPTION: String(r.description || '').trim(),
        MANUFACTURER_NAME: String(r.manufacturer || '').trim(),
        ACTIVE_FLAG: String(r.active_flag || '').trim(),
      }
      const fam = familyForPart(asPart, families)
      const qty = r.qty_extended === null || r.qty_extended === undefined
        ? null : Number(r.qty_extended)
      return {
        part_number: asPart.INV_PART_NUMBER,
        description: asPart.INV_PART_DESCRIPTION,
        manufacturer: asPart.MANUFACTURER_NAME,
        level: r.lvl ?? 1,
        quantity: qty,
        // Kept so the raw figure can be checked against Paradigm when an
        // extended quantity looks wrong.
        qty_per_parent: r.qty_per_parent ?? null,
        occurrences: r.occurrences ?? 1,
        family_id: fam?.id ?? null,
        family_name: fam?.family_name || '',
        notepad: notepadByRkey.get(String(r.component_rkey ?? '')) || '',
        parent_part: String(r.parent_part || '').trim(),
      }
    })

    // Customer part number, best-effort — its absence shouldn't fail the list.
    let customer_part = ''
    try {
      const hdr = await queryMSSQL<any[]>('1', HEADER_SQL, { partNumber: `${part}%` })
      customer_part = String(hdr?.[0]?.customer_part ?? '').trim()
    } catch (e) {
      console.error('Buy material header query failed for', part, e)
    }

    return NextResponse.json({
      success: true,
      apc_part: part,
      customer_part,
      materials,
      count: materials.length,
    })
  } catch (error) {
    console.error('Buy material error:', error)
    return NextResponse.json({
      error: 'Failed to load the buy material list',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
