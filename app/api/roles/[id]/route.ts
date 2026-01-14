import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// DELETE - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params
    const roleId = parseInt(id)

    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
    }

    // Check if role exists
    const roleExists = await queryPrimary<any[]>(
      'SELECT id, name FROM roles WHERE id = ?',
      [roleId]
    )

    if (roleExists.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const roleName = roleExists[0].name

    // Prevent deletion of admin role
    if (roleName === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin role' },
        { status: 403 }
      )
    }

    // Check if role is assigned to any users
    const usersWithRole = await queryPrimary<any[]>(
      'SELECT COUNT(*) as count FROM user_roles WHERE roleId = ?',
      [roleId]
    )

    if (usersWithRole[0].count > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete role that is assigned to users',
          userCount: usersWithRole[0].count
        },
        { status: 409 }
      )
    }

    // Delete the role
    await queryPrimary('DELETE FROM roles WHERE id = ?', [roleId])

    return NextResponse.json({
      success: true,
      message: `Role "${roleName}" deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete role',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}