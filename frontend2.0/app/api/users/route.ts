import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import bcrypt from 'bcryptjs'

// GET - Fetch all users
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch users with their roles
    const users = await queryPrimary<any[]>(
      `SELECT 
        u.id,
        u.username,
        u.name,
        u.email,
        u.nickname,
        u.phone,
        u.mobile,
        u.title,
        u.role,
        u.active,
        u.createdAt,
        u.cc_name,
        u.engineer_roles,
        GROUP_CONCAT(r.name) as role_names
      FROM Users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      WHERE u.active = 1
      GROUP BY u.id
      ORDER BY u.name ASC`
    )

    // Transform role_names string to roles array and parse engineer_roles JSON
    const usersWithRoles = users.map(user => ({
      ...user,
      roles: user.role_names ? user.role_names.split(',') : [],
      engineer_roles: user.engineer_roles ? JSON.parse(user.engineer_roles) : []
    }))

    return NextResponse.json(usersWithRoles)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Check if user has admin role

  try {
    const data = await request.json()

    // Validate required fields
    if (!data.username || !data.name || !data.email || !data.password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await queryPrimary<any[]>(
      'SELECT id FROM Users WHERE username = ?',
      [data.username]
    )

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    // Check if email already exists
    const existingEmail = await queryPrimary<any[]>(
      'SELECT id FROM Users WHERE email = ?',
      [data.email]
    )

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Insert new user
    const result = await queryPrimary(
      `INSERT INTO Users (
        username,
        name,
        email,
        nickname,
        phone,
        mobile,
        password,
        title,
        active,
        role,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.username,
        data.name,
        data.email,
        data.nickname || null,
        data.phone || null,
        data.mobile || null,
        hashedPassword,
        data.title || null,
        data.active !== undefined ? data.active : 1,
        data.role || null
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId: (result as any).insertId
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: String(error) },
      { status: 500 }
    )
  }
}