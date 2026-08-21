import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// GET - List all audit definitions
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all audits with creator info and record counts
    const audits = await queryPrimary(`
      SELECT 
        ad.id, ad.name, ad.description, ad.created_by, ad.created_at, ad.active,
        ad.fields_json, ad.authorized_users_json,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM audit_record ar WHERE ar.audit_def_id = ad.id) as record_count
      FROM audit_def ad
      LEFT JOIN users u ON ad.created_by = u.id
      ORDER BY ad.created_at DESC
    `) as any[]

    // Parse JSON fields and get authorized user names
    const parsedAudits = await Promise.all(audits.map(async (audit) => {
      let fields = []
      let authorized_users: number[] = []
      
      try {
        fields = JSON.parse(audit.fields_json || '[]')
      } catch (e) {
        fields = []
      }
      
      try {
        authorized_users = JSON.parse(audit.authorized_users_json || '[]')
      } catch (e) {
        authorized_users = []
      }

      // Get authorized user names
      let authorized_user_names: string[] = []
      if (authorized_users.length > 0) {
        const userResult = await queryPrimary(
          `SELECT id, name, username FROM Users WHERE id IN (${authorized_users.map(() => '?').join(',')})`,
          authorized_users
        ) as any[]
        authorized_user_names = userResult.map(u => u.name || u.username)
      }

      return {
        id: audit.id,
        name: audit.name,
        description: audit.description,
        created_by: audit.created_by,
        created_by_name: audit.created_by_name,
        created_at: audit.created_at,
        active: audit.active,
        fields,
        authorized_users,
        authorized_user_names,
        record_count: audit.record_count
      }
    }))

    // Filter audits this user is authorized to submit records to
    const userId = Number(session.user.id)
    const authorizedAudits = parsedAudits.filter(
      audit => audit.active && audit.authorized_users.includes(userId)
    )

    return NextResponse.json({
      success: true,
      audits: parsedAudits,
      authorizedAudits
    })
  } catch (error) {
    console.error('Audits GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audits' },
      { status: 500 }
    )
  }
}

// POST - Create new audit definition
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has permission (Admin, ProcessEng, or ProductEng)
  const userRoles = session.user.roles || []
  const canCreate = userRoles.some(role => 
    ['Admin', 'ProcessEng', 'ProductEng'].includes(role)
  )
  
  if (!canCreate) {
    return NextResponse.json({ error: 'Not authorized to create audits' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, description, active, fields, authorized_users } = body

    if (!name || !fields || !authorized_users) {
      return NextResponse.json(
        { error: 'Name, fields, and authorized_users are required' },
        { status: 400 }
      )
    }

    const result = await queryPrimary(
      `INSERT INTO audit_def (name, description, created_by, active, fields_json, authorized_users_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        session.user.id,
        active ?? 1,
        JSON.stringify(fields),
        JSON.stringify(authorized_users)
      ]
    ) as any

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Audit created successfully'
    })
  } catch (error) {
    console.error('Audits POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create audit' },
      { status: 500 }
    )
  }
}
