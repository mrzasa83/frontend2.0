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

    // Query Paradigm MS SQL database for inventory
    const query = `
      SELECT 
        D50.CP_REV, 
        D53.QTY_ON_HAND, 
        D53.QTY_ALLOC, 
        D6.WORK_ORDER_NUMBER, 
        D53.MFG_DATE, 
        D15.WAREHOUSE_CODE, 
        D16.LOCATION 
      FROM 
        DATA0050 D50 RIGHT OUTER JOIN
        DATA0006 D6 RIGHT OUTER JOIN
        DATA0053 D53 ON D6.RKEY = D53.WORK_ORDER_PTR
        LEFT OUTER JOIN DATA0016 D16 ON D53.LOC_PTR = D16.RKEY
        LEFT OUTER JOIN DATA0015 D15 ON D53.WHSE_PTR = D15.RKEY
        ON D50.RKEY = D53.CUST_PART_PTR
      WHERE 
        D50.CUSTOMER_PART_NUMBER LIKE @partNumber
      ORDER BY 
        D53.RKEY
    `

    const results = await queryMSSQL('1', query, {
      partNumber: `${apcPN}%`
    })

    // Filter out rows where QTY_ON_HAND is 0 or null for the filtered set
    const filteredResults = results.filter((row: any) => {
      const qty = row.QTY_ON_HAND
      return qty !== null && qty !== undefined && qty !== 0
    })

    return NextResponse.json({
      success: true,
      apcPN,
      count: filteredResults.length,
      totalCount: results.length,
      data: filteredResults,
      allData: results  // Include all data for the toggle
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch inventory', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
