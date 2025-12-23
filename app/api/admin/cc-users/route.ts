import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { querySecondary } from '@/lib/db/mysql-secondary'

// GET - Fetch distinct users from Control Center database
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const query = `SELECT DISTINCT User FROM user ORDER BY User`
    const results = await querySecondary(query)

    const users = (results as any[]).map(row => row.User).filter(u => u && u.trim() !== '')

    return NextResponse.json({
      success: true,
      count: users.length,
      users
    })

  } catch (error) {
    console.error('CC Users API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch Control Center users', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
