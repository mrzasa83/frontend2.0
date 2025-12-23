import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// PUT - Update user's roles
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
    const { roles } = await request.json()
    const userId = parseInt(params.id)

    console.log('Role update requested for user ID:', userId, 'Roles:', roles)

    if (isNaN(userId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID',
        received: params.id,
        parsed: userId
      }, { status: 400 })
    }

    if (!Array.isArray(roles)) {
      return NextResponse.json({ error: 'Roles must be an array' }, { status: 400 })
    }

    // Remove all existing roles for this user
    await queryPrimary(
      'DELETE FROM user_roles WHERE userId = ?',
      [userId]
    )

    // Add new roles
    if (roles.length > 0) {
      // Get role IDs for the provided role names
      const placeholders = roles.map(() => '?').join(',')
      const roleRecords = await queryPrimary<any[]>(
        `SELECT id, name FROM roles WHERE name IN (${placeholders})`,
        roles
      )

      console.log('Found roles:', roleRecords)

      if (roleRecords.length !== roles.length) {
        const foundRoles = roleRecords.map(r => r.name)
        const missingRoles = roles.filter(r => !foundRoles.includes(r))
        return NextResponse.json({ 
          error: 'One or more roles not found',
          missing: missingRoles
        }, { status: 400 })
      }

      // Insert new user_roles records
      for (const role of roleRecords) {
        await queryPrimary(
          'INSERT INTO user_roles (userId, roleId) VALUES (?, ?)',
          [userId, role.id]
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User roles updated successfully'
    })
  } catch (error) {
    console.error('Error updating user roles:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update user roles',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}