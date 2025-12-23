import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// GET - Fetch current user's profile
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const query = `
      SELECT 
        id, username, name, email, nickname, phone, mobile, title, role
      FROM users 
      WHERE id = ?
    `
    const users = await queryPrimary(query, [session.user.id]) as any[]
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: users[0]
    })
  } catch (error) {
    console.error('Profile GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update current user's profile (limited fields)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { nickname, phone, mobile } = body

    // Only allow updating these specific fields
    const query = `
      UPDATE users 
      SET nickname = ?, phone = ?, mobile = ?
      WHERE id = ?
    `
    await queryPrimary(query, [
      nickname || null,
      phone || null,
      mobile || null,
      session.user.id
    ])

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Profile PUT Error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
