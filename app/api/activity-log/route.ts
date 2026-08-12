import { NextRequest, NextResponse } from 'next/server'
import { queryMySQL } from '@/lib/mysql'

interface ActivityLog {
  id: number
  operator: string
  work_order: string
  action: string
  machine: string | null
  data: string | null
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const query = `
      SELECT 
        id,
        operator,
        work_order,
        action,
        machine,
        data,
        created_at
      FROM activity_log_mdi
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `

    const logs = await queryMySQL<ActivityLog>(query, [limit, offset])

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM activity_log_mdi'
    const countResult = await queryMySQL<{ total: number }>(countQuery)
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      logs,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Activity Log API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
