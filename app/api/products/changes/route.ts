import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMySQLPrimaryPool } from '@/lib/db/mysql-primary'

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

    // Query MySQL frontEnd2.0 database for MCN change history
    const pool = getMySQLPrimaryPool()
    const query = `
      SELECT 
        disposition AS Status,
        request,
        toolnum,
        reason,
        \`change\`,
        closeddate,
        pe
      FROM MCN
      WHERE partnum LIKE ? 
        AND mcn_status = 1
      ORDER BY closeddate DESC
    `

    const [rows] = await pool.execute(query, [`${apcPN}%`])
    const allData = rows as any[]

    // Filter for accepted only
    const acceptedData = allData.filter((row: any) => {
      const status = (row.Status || '').toLowerCase()
      return status === 'accepted'
    })

    return NextResponse.json({
      success: true,
      apcPN,
      count: acceptedData.length,
      totalCount: allData.length,
      data: acceptedData,
      allData: allData
    })
  } catch (error) {
    console.error('Error fetching changes:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch changes', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
