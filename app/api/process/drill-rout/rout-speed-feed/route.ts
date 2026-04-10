import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// List query: rout speed/feed related MCN records
const LIST_QUERY = `
  SELECT 
    id,
    initiator,
    STR_TO_DATE(subdate, '%d%b%Y') as subDate,
    toolnum,
    partnum,
    \`change\`,
    reason,
    chngeffect
  FROM mcn
  WHERE LOWER(\`change\`) LIKE '%feed%rout%'
     OR LOWER(\`change\`) LIKE '%rout%feed%'
     OR chngeffect LIKE '%Rout Prog%'
  ORDER BY STR_TO_DATE(subdate, '%d%b%Y') DESC
`

// Detail query: get all columns for a single MCN record
const DETAIL_QUERY = `
  SELECT *
  FROM mcn
  WHERE id = ?
`

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Detail mode — single record
      const rows = await queryPrimary(DETAIL_QUERY, [id])
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, record: rows[0] })
    }

    // List mode
    const rows = await queryPrimary(LIST_QUERY)
    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('Error fetching rout speed/feed data:', error)
    return NextResponse.json({
      error: 'Failed to fetch MCN data',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
