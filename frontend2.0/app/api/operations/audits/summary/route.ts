import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// GET - Get audit summary statistics
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get total audits
    const totalAuditsResult = await queryPrimary(
      'SELECT COUNT(*) as count FROM audit_def'
    ) as any[]
    const totalAudits = totalAuditsResult[0]?.count || 0

    // Get active audits
    const activeAuditsResult = await queryPrimary(
      'SELECT COUNT(*) as count FROM audit_def WHERE active = 1'
    ) as any[]
    const activeAudits = activeAuditsResult[0]?.count || 0

    // Get total records
    const totalRecordsResult = await queryPrimary(
      'SELECT COUNT(*) as count FROM audit_record'
    ) as any[]
    const totalRecords = totalRecordsResult[0]?.count || 0

    // Get records in last 7 days
    const recentRecordsResult = await queryPrimary(
      'SELECT COUNT(*) as count FROM audit_record WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    ) as any[]
    const recentRecords = recentRecordsResult[0]?.count || 0

    return NextResponse.json({
      totalAudits,
      activeAudits,
      totalRecords,
      recentRecords
    })
  } catch (error) {
    console.error('Audit Summary Error:', error)
    // Return zeros if tables don't exist yet
    return NextResponse.json({
      totalAudits: 0,
      activeAudits: 0,
      totalRecords: 0,
      recentRecords: 0
    })
  }
}
