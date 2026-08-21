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

    // Query Paradigm MS SQL database for route data
    const query = `
      SELECT 
        d38.STEP_NUMBER,
        d34.DEPT_CODE,
        d34.DEPT_NAME
      FROM DATA0038 d38 
      INNER JOIN DATA0050 d50 ON d50.RKEY = d38.SOURCE_PTR 
      INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
      WHERE d38.TTYPE = 4 
        AND d50.CUSTOMER_PART_NUMBER LIKE @partNumber
      ORDER BY d38.STEP_NUMBER
    `

    const results = await queryMSSQL('1', query, {
      partNumber: `${apcPN}%`
    })

    // Determine build location from first step's dept_code
    let buildLocation = 'Nashua' // Default
    if (results.length > 0) {
      const firstDeptCode = (results[0].DEPT_CODE || '').trim().toUpperCase()
      if (firstDeptCode.startsWith('N-')) {
        buildLocation = 'Nogales'
      } else if (firstDeptCode.startsWith('M-')) {
        buildLocation = 'Mesa'
      }
    }

    return NextResponse.json({
      success: true,
      apcPN,
      count: results.length,
      data: results,
      buildLocation
    })
  } catch (error) {
    console.error('Error fetching route data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch route data', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
