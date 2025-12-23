import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import bcrypt from 'bcryptjs'

// PUT - Reset user password
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const isAdmin = session.user?.roles?.includes('Admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const params = await context.params
    const { newPassword, confirmPassword } = await request.json()
    const userId = parseInt(params.id)

    console.log('Password reset requested for user ID:', userId, 'from params:', params)

    if (isNaN(userId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID',
        received: params.id,
        parsed: userId
      }, { status: 400 })
    }

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Both password fields are required' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user exists
    const userExists = await queryPrimary<any[]>(
      'SELECT id, username FROM users WHERE id = ?',
      [userId]
    )

    if (userExists.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password in database
    await queryPrimary(
      'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, userId]
    )

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}