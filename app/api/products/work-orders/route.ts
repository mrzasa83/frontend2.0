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
      return NextResponse.json(
        { error: 'apcPN is required' },
        { status: 400 }
      )
    }

    // Query Paradigm MS SQL database for work orders
    const query = `
      SELECT 
        D6.WORK_ORDER_NUMBER,
        D17.INV_PART_NUMBER,
        CASE 
          WHEN D146.STEP_NO IS NULL THEN 'Complete'
          ELSE CAST(D146.STEP_NO AS VARCHAR(10))
        END AS STEP_NO,
        CASE
          WHEN D146.STEP_NO IS NULL THEN D6.ACT_COMPL_DATE
          ELSE D6.PROJ_COMPL_DATE
        END AS COMPLETE_DATE
      FROM DATA0006 D6
      JOIN DATA0050 D50 
        ON D6.CUST_PART_PTR = D50.RKEY
      JOIN DATA0017 D17 
        ON D6.INVENTORY_PTR = D17.RKEY
      LEFT JOIN DATA0146 D146 
        ON D6.WORK_ORDER_NUMBER = D146.WORK_ORDER_NO
      WHERE D50.CUSTOMER_PART_NUMBER LIKE @partNumber
      ORDER BY D6.WORK_ORDER_NUMBER DESC
    `

    const results = await queryMSSQL('1', query, {
      partNumber: `${apcPN}%`
    })

    // Filter for open orders only (STEP_NO is not 'Complete')
    const openOrders = results.filter((row: any) => {
      return row.STEP_NO !== 'Complete'
    })

    return NextResponse.json({
      success: true,
      apcPN,
      count: openOrders.length,
      totalCount: results.length,
      data: openOrders,
      allData: results
    })
  } catch (error) {
    console.error('Error fetching work orders:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch work orders', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
