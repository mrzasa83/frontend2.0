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

    // Query Paradigm MS SQL database for discrepancy notes
    const query = `
      SELECT 
        DATA0211_1.SEQUENCE_NUMBER,
        DATA0211_1.NOTEPAD_TEXT
      FROM DATA0010 DATA0010_1 WITH (NOLOCK) 
      RIGHT OUTER JOIN DATA0050 DATA0050_1 WITH (NOLOCK) ON DATA0010_1.RKEY = DATA0050_1.CUSTOMER_PTR
      RIGHT OUTER JOIN DATA0211 DATA0211_1 WITH (NOLOCK) ON DATA0050_1.RKEY = DATA0211_1.SOURCE_POINTER
      WHERE DATA0211_1.SOURCE_TYPE = 1 
        AND DATA0050_1.CUSTOMER_PART_NUMBER LIKE @partNumber
      ORDER BY DATA0211_1.SOURCE_TYPE, DATA0211_1.SOURCE_POINTER, DATA0211_1.SEQUENCE_NUMBER
    `

    const results = await queryMSSQL('1', query, {
      partNumber: `${apcPN}%`
    })

    return NextResponse.json({
      success: true,
      apcPN,
      count: results.length,
      data: results
    })
  } catch (error) {
    console.error('Error fetching discrepancy data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch discrepancy data', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
