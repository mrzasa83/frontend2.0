import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mysql from 'mysql2/promise'

// Secondary MySQL Database Connection (read-only)
const secondaryPool = mysql.createPool({
  host: process.env.DB_MYSQL_SECONDARY_HOST || 'apceng03',
  port: parseInt(process.env.DB_MYSQL_SECONDARY_PORT || '3306'),
  user: process.env.DB_MYSQL_SECONDARY_USER || '',
  password: process.env.DB_MYSQL_SECONDARY_PASSWORD || '',
  database: 'amph_cc',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const query = `
      SELECT 
        ps.id, 
        j.name,
        j.job_type,
        r.name as routeType,
        j.cust_pn,
        j.rev,
        j.build_spec_pdigm,
        ps.proc_id,
        ps.group_id,
        ps.status_id,
        CONVERT_TZ(FROM_UNIXTIME(ps.start), '+00:00', '-01:00') as startTime,
        CONVERT_TZ(FROM_UNIXTIME(ps.end), '+00:00', '-01:00') as endTime
      FROM amph_cc.procstatus ps
      INNER JOIN amph_cc.job j ON j.id = ps.job_id
      INNER JOIN amph_cc.route r ON j.route = r.id
      WHERE ps.group_id = 0 
        AND ps.proc_id = 0 
        AND j.job_type NOT LIKE 'QUOTE' 
        AND j.route != 63
        AND YEAR(CONVERT_TZ(FROM_UNIXTIME(ps.start), '+00:00', '-01:00')) >= YEAR(NOW()) - 3
      ORDER BY endTime DESC
    `

    const [rows] = await secondaryPool.query(query)

    return NextResponse.json({
      success: true,
      results: rows,
      count: (rows as any[]).length
    })
  } catch (error) {
    console.error('Error fetching team backlog:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch team backlog',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}