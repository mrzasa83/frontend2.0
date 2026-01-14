import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// Engineer role types
export type EngineerRole = 'HDW' | 'CAM' | 'PCB' | 'ASM'

export type UserEngineerRoles = {
  userId: number
  username: string
  name: string | null
  ccName: string | null
  roles: EngineerRole[]
}

// GET - Fetch all users with their engineer role assignments
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role') as EngineerRole | null

    // Get users with their engineer roles
    const usersQuery = `
      SELECT 
        id,
        username,
        name,
        cc_name,
        engineer_roles
      FROM Users
      WHERE active = 1
      ORDER BY name, username
    `
    const users = await queryPrimary(usersQuery) as any[]

    // Transform and filter results
    let result: UserEngineerRoles[] = users.map(user => ({
      userId: user.id,
      username: user.username,
      name: user.name,
      ccName: user.cc_name,
      roles: user.engineer_roles ? JSON.parse(user.engineer_roles) : []
    }))

    // Filter by role if specified
    if (roleFilter) {
      result = result.filter(u => u.roles.includes(roleFilter))
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      users: result
    })

  } catch (error) {
    console.error('Engineer Roles API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch engineer roles', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

// PUT - Update engineer roles for a user
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId, roles, ccName } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Validate roles
    const validRoles: EngineerRole[] = ['HDW', 'CAM', 'PCB', 'ASM']
    const cleanRoles = (roles || []).filter((r: string) => validRoles.includes(r as EngineerRole))

    // Update user with CC name and engineer roles
    const updateQuery = `
      UPDATE Users 
      SET cc_name = ?, engineer_roles = ?
      WHERE id = ?
    `
    await queryPrimary(updateQuery, [
      ccName || null,
      JSON.stringify(cleanRoles),
      userId
    ])

    return NextResponse.json({
      success: true,
      userId,
      ccName,
      roles: cleanRoles
    })

  } catch (error) {
    console.error('Engineer Roles PUT Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update engineer roles', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

// GET users by specific role (for dropdowns)
// Usage: /api/admin/engineer-roles?role=CAM or ?role=HDW
