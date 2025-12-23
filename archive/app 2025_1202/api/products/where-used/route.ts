import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export async function POST(request: NextRequest) {
  console.log('🔍 Where Used API called')
  
  const session = await getServerSession(authOptions)
  
  if (!session) {
    console.log('❌ No session - unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { partNumber } = await request.json()

    if (!partNumber) {
      return NextResponse.json(
        { error: 'partNumber is required' },
        { status: 400 }
      )
    }

    console.log(`🔎 Finding where ${partNumber} is used`)

    // Simpler approach: Find all customer parts that directly or indirectly use this part
    // Step 1: Find the inventory part RKEY
    // Step 2: Find all BOM headers (data0025) where this part appears as a component
    // Step 3: Trace those back to customer parts (data0050)
    
    const query = `
      SELECT DISTINCT
        D50.CUSTOMER_PART_NUMBER,
        D50.CUSTOMER_PART_DESC
      FROM DATA0017 D17
      INNER JOIN DATA0026 D26 ON D17.RKEY = D26.INVENTORY_PTR
      INNER JOIN DATA0025 D25 ON D26.PARENT_NODE_INVENT = D25.RKEY
      INNER JOIN DATA0050 D50 ON D50.BOM_PTR = D25.RKEY
      WHERE D17.INV_PART_NUMBER LIKE @partNumberPattern
      
      UNION
      
      SELECT DISTINCT
        D50.CUSTOMER_PART_NUMBER,
        D50.CUSTOMER_PART_DESC
      FROM DATA0017 D17
      INNER JOIN DATA0026 D26 ON D17.RKEY = D26.INVENTORY_PTR
      INNER JOIN DATA0025 D25 ON D26.PARENT_NODE_INVENT = D25.RKEY
      INNER JOIN DATA0017 D17_parent ON D25.INVENTORY_PTR = D17_parent.RKEY
      INNER JOIN DATA0026 D26_2 ON D17_parent.RKEY = D26_2.INVENTORY_PTR
      INNER JOIN DATA0025 D25_2 ON D26_2.PARENT_NODE_INVENT = D25_2.RKEY
      INNER JOIN DATA0050 D50 ON D50.BOM_PTR = D25_2.RKEY
      WHERE D17.INV_PART_NUMBER LIKE @partNumberPattern
      
      UNION
      
      SELECT DISTINCT
        D50.CUSTOMER_PART_NUMBER,
        D50.CUSTOMER_PART_DESC
      FROM DATA0017 D17
      INNER JOIN DATA0026 D26 ON D17.RKEY = D26.INVENTORY_PTR
      INNER JOIN DATA0025 D25 ON D26.PARENT_NODE_INVENT = D25.RKEY
      INNER JOIN DATA0017 D17_2 ON D25.INVENTORY_PTR = D17_2.RKEY
      INNER JOIN DATA0026 D26_2 ON D17_2.RKEY = D26_2.INVENTORY_PTR
      INNER JOIN DATA0025 D25_2 ON D26_2.PARENT_NODE_INVENT = D25_2.RKEY
      INNER JOIN DATA0017 D17_3 ON D25_2.INVENTORY_PTR = D17_3.RKEY
      INNER JOIN DATA0026 D26_3 ON D17_3.RKEY = D26_3.INVENTORY_PTR
      INNER JOIN DATA0025 D25_3 ON D26_3.PARENT_NODE_INVENT = D25_3.RKEY
      INNER JOIN DATA0050 D50 ON D50.BOM_PTR = D25_3.RKEY
      WHERE D17.INV_PART_NUMBER LIKE @partNumberPattern
      
      ORDER BY CUSTOMER_PART_NUMBER ASC
    `

    console.log('🗄️ Executing where-used query for:', partNumber)

    const results = await queryMSSQL('1', query, {
      partNumberPattern: `%${partNumber}%`
    })

    console.log(`✅ Query successful! Found ${results.length} parent assemblies`)

    return NextResponse.json({
      success: true,
      partNumber,
      count: results.length,
      results
    })
  } catch (error) {
    console.error('💥 Where Used API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch where-used data', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
