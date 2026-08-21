import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export async function POST(request: NextRequest) {
  console.log('🔍 BOM API called')
  
  const session = await getServerSession(authOptions)
  
  if (!session) {
    console.log('❌ No session - unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    console.log('📦 Request body:', body)
    
    const { apcPN, level = 0, isInventoryPart = false } = body

    if (!apcPN) {
      console.log('❌ No apcPN provided')
      return NextResponse.json(
        { error: 'apcPN is required' },
        { status: 400 }
      )
    }

    console.log(`🔎 Fetching BOM for: ${apcPN}, isInventoryPart: ${isInventoryPart}, level: ${level}`)

    let query: string
    let params: any

    // Two different queries depending on if this is a customer part or inventory part
    if (isInventoryPart) {
      console.log('📋 Using inventory part query')
      // For inventory parts (manufactured parts from data0017)
      // Find BOM via data0017.RKEY -> data0025.INVENTORY_PTR
      query = `
        SELECT 
          d17.INV_PART_NUMBER AS parent_part,
          d17.P_M AS parent_type,
          d25.RKEY AS bom_header_key,
          d25.EFF_END AS eff_end,
          d26.QTY_BOM AS quantity,
          d26.UNIT_PTR AS unit_ptr,
          d17_1.INV_PART_NUMBER AS component_part,
          d17_1.P_M AS component_type,
          d17_1.RKEY AS component_rkey,
          CASE WHEN d17_1.P_M = 'M' THEN 1 ELSE 0 END AS has_children
        FROM data0017 d17
        JOIN data0025 d25 ON d17.RKEY = d25.INVENTORY_PTR
        JOIN data0026 d26 ON d25.RKEY = d26.PARENT_NODE_INVENT
        JOIN data0017 d17_1 ON d17_1.RKEY = d26.INVENTORY_PTR
        WHERE d17.INV_PART_NUMBER = @partNumber
          AND d17.P_M = 'M'
          AND (d25.EFF_END IS NULL OR d25.EFF_END > GETDATE())
        ORDER BY d17_1.INV_PART_NUMBER
      `
      params = { partNumber: apcPN }
    } else {
      console.log('📋 Using customer part query')
      // For customer parts (from data0050)
      // Find BOM via data0050.BOM_PTR -> data0025.RKEY
      query = `
        SELECT 
          d50.CUSTOMER_PART_NUMBER AS parent_part,
          'C' AS parent_type,
          d25.RKEY AS bom_header_key,
          d25.EFF_END AS eff_end,
          d26.QTY_BOM AS quantity,
          d26.UNIT_PTR AS unit_ptr,
          d17.INV_PART_NUMBER AS component_part,
          d17.P_M AS component_type,
          d17.RKEY AS component_rkey,
          CASE WHEN d17.P_M = 'M' THEN 1 ELSE 0 END AS has_children
        FROM data0050 d50
        JOIN data0025 d25 ON d50.BOM_PTR = d25.RKEY
        JOIN data0026 d26 ON d25.RKEY = d26.PARENT_NODE_INVENT
        JOIN data0017 d17 ON d26.INVENTORY_PTR = d17.RKEY
        WHERE d50.CUSTOMER_PART_NUMBER LIKE @partNumber
          AND (d25.EFF_END IS NULL OR d25.EFF_END > GETDATE())
        ORDER BY d17.INV_PART_NUMBER
      `
      params = { partNumber: `${apcPN}%` }
    }

    console.log('🗄️ Executing query with params:', params)

    // Query using existing MSSQL connector
    const rows = await queryMSSQL('1', query, params)

    console.log(`✅ Query successful! Found ${rows.length} components`)

    // Transform results to match BOMItem type
    const results = rows.map((row: any, index: number) => ({
      id: `${row.component_part}-${level}-${index}`,
      part_number: row.component_part,
      description: row.description || '',
      quantity: parseFloat(row.quantity) || 0,
      ref_des: row.ref_des || '',
      unit: row.unit_ptr || '',
      level: level,
      has_children: Boolean(row.has_children),
      parent_part: row.parent_part,
      component_type: row.component_type,
      eff_end: row.eff_end
    }))

    console.log('📤 Returning results:', results.length)

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      debug: {
        partNumber: apcPN,
        isInventoryPart,
        level
      }
    })
  } catch (error) {
    console.error('💥 BOM API Error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch BOM data',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}

/* ============================================
   SCHEMA UNDERSTANDING
   ============================================
   
   TWO TYPES OF PARTS:
   
   1. CUSTOMER PARTS (data0050)
      - CUSTOMER_PART_NUMBER (unique ID)
      - BOM_PTR → points to data0025.RKEY
   
   2. INVENTORY PARTS (data0017)
      - INV_PART_NUMBER (unique ID)
      - P_M flag: 'P' = Purchased, 'M' = Manufactured
      - RKEY (primary key)
   
   BOM STRUCTURE:
   
   data0025 - BOM Headers
     - RKEY (primary key)
     - INVENTORY_PTR → points to data0017.RKEY
     - EFF_END (effectivity date)
   
   data0026 - BOM Line Items
     - PARENT_NODE_INVENT → points to data0025.RKEY
     - INVENTORY_PTR → points to data0017.RKEY
     - QTY_BOM, REFERENCE_DESIGNATORS, SEQUENCE
   
   RELATIONSHIPS:
   
   Customer Part BOM:
   data0050 → data0025 → data0026 → data0017
   
   Manufactured Part BOM:
   data0017 → data0025 → data0026 → data0017
   
   ============================================ */