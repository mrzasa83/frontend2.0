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
        CASE
          WHEN job.job_status_id IN (3, 5) THEN 'On Hold'
          ELSE 'Active'
        END AS Status,
        job.name,
        job.customer, 
        job.job_type,
        job.shop_pn,
        job.cust_pn,
        job.prod_eng AS \`PCB Eng\`,
        u_job.assy_prod_eng AS \`ASM Eng\`,
        u_job.cam_eng AS \`CAM Eng\`,
        job.account_mngr,
        job.route,
        STR_TO_DATE(
          CONCAT(ujn.hdw_comp_year, '-', ujn.hdw_comp_month, '-', ujn.hdw_comp_day),
          '%Y-%b-%d'
        ) AS hdw_date,
        STR_TO_DATE(
          CONCAT(ujn.bom_comp_year, '-', ujn.bom_comp_month, '-', ujn.bom_comp_day),
          '%Y-%b-%d'
        ) AS bom_date,
        STR_TO_DATE(
          CONCAT(ujn.pcb_comp_year, '-', ujn.pcb_comp_month, '-', ujn.pcb_comp_day),
          '%Y-%b-%d'
        ) AS pcb_date,
        STR_TO_DATE(
          CONCAT(ujn.asm_comp_year, '-', ujn.asm_comp_month, '-', ujn.asm_comp_day),
          '%Y-%b-%d'
        ) AS asm_date
      FROM job
      JOIN u_job 
        ON job.id = u_job.job_id
      LEFT JOIN (
        SELECT job_id, MAX(id) AS latest_id
        FROM umr_job_status_notes
        GROUP BY job_id
      ) AS latest
        ON latest.job_id = job.id
      LEFT JOIN umr_job_status_notes ujn
        ON ujn.id = latest.latest_id
      WHERE job.job_status_id NOT IN (2, 4)
        AND (job.job_type IS NULL 
             OR job.job_type NOT IN ('Qualification', 'Quote'))
      ORDER BY job.name ASC
    `

    const [rows] = await secondaryPool.query(query)

    return NextResponse.json({
      success: true,
      results: rows,
      count: (rows as any[]).length
    })
  } catch (error) {
    console.error('Error fetching current jobs:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch current jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
