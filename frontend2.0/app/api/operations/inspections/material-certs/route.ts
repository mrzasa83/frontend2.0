import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

const READ_CONN = '1'

// Material certs (purchased parts with lot/PO/supplier) for a work order BOM
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workOrder = searchParams.get('workOrder')
  if (!workOrder) return NextResponse.json({ error: 'workOrder required' }, { status: 400 })

  try {
    const rows = await queryMSSQL<any[]>(READ_CONN, `
      WITH BomCTE AS (
          SELECT d26.INVENTORY_PTR AS component_rkey, d26.QTY_BOM, 1 AS level
          FROM DATA0006 wo
          JOIN DATA0025 d25 ON d25.RKEY = wo.BOM_PTR
          JOIN DATA0026 d26 ON d26.PARENT_NODE_INVENT = d25.RKEY
          WHERE wo.WORK_ORDER_NUMBER LIKE @wo
          UNION ALL
          SELECT d26.INVENTORY_PTR AS component_rkey, d26.QTY_BOM, c.level + 1 AS level
          FROM BomCTE c
          JOIN DATA0025 d25 ON d25.INVENTORY_PTR = c.component_rkey
          JOIN DATA0026 d26 ON d26.PARENT_NODE_INVENT = d25.RKEY
          JOIN DATA0017 d17 ON d17.RKEY = c.component_rkey
          WHERE d17.P_M = 'M'
      )
      SELECT DISTINCT
          d17.INV_PART_NUMBER      AS PurchasedPart,
          d17.INV_PART_DESCRIPTION AS Description,
          lot.BATCH_NO             AS BatchSerial,
          lot.EXPIRED_DATE         AS ExpDate,
          po.PO_NUMBER             AS PONumber,
          po.PO_DATE               AS PODate,
          supp.SUPPLIER_NAME       AS SupplierName,
          supp.CODE                AS SupplierCode,
          supp.BILLING_ADDRESS_1   AS SupplierAddr1,
          supp.BILLING_ADDRESS_2   AS SupplierAddr2,
          supp.STATE               AS SupplierState,
          supp.ZIP                 AS SupplierZip
      FROM BomCTE c
      JOIN DATA0017 d17 ON d17.RKEY = c.component_rkey
      JOIN DATA0020 lot ON lot.INVENTORY_POINTER = d17.RKEY
      JOIN DATA0070 po  ON po.RKEY = lot.PO_PTR
      JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
      WHERE d17.P_M = 'P'
      ORDER BY d17.INV_PART_NUMBER
    `, { wo: `%${workOrder}%` })

    const certs = rows.map((r: any) => ({
      purchasedPart: (r.PurchasedPart || '').trim(),
      description: (r.Description || '').trim(),
      batchSerial: (r.BatchSerial || '').trim(),
      expDate: r.ExpDate,
      poNumber: (r.PONumber || '').trim(),
      poDate: r.PODate,
      supplierName: (r.SupplierName || '').trim(),
      supplierCode: (r.SupplierCode || '').trim(),
      supplierState: (r.SupplierState || '').trim(),
      supplierZip: (r.SupplierZip || '').trim(),
    }))

    return NextResponse.json({ success: true, certs })
  } catch (error) {
    console.error('Error fetching material certs:', error)
    return NextResponse.json({
      error: 'Failed to fetch material certs', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
