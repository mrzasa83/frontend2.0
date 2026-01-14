import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// GET - List audit records
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const auditId = searchParams.get('audit_id')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = `
      SELECT 
        ar.id, ar.audit_def_id, ar.recorded_by, ar.recorded_at, ar.values_json, ar.notes,
        ad.name as audit_name,
        u.name as recorded_by_name, u.username as recorded_by_username
      FROM audit_record ar
      LEFT JOIN audit_def ad ON ar.audit_def_id = ad.id
      LEFT JOIN users u ON ar.recorded_by = u.id
    `
    const params: any[] = []

    if (auditId) {
      query += ' WHERE ar.audit_def_id = ?'
      params.push(auditId)
    }

    query += ' ORDER BY ar.recorded_at DESC LIMIT ?'
    params.push(limit)

    const records = await queryPrimary(query, params) as any[]

    // Parse JSON values
    const parsedRecords = records.map(record => {
      let values = {}
      try {
        values = JSON.parse(record.values_json || '{}')
      } catch (e) {
        values = {}
      }

      return {
        id: record.id,
        audit_def_id: record.audit_def_id,
        audit_name: record.audit_name,
        recorded_by: record.recorded_by,
        recorded_by_name: record.recorded_by_name || record.recorded_by_username,
        recorded_at: record.recorded_at,
        values,
        notes: record.notes
      }
    })

    return NextResponse.json({
      success: true,
      records: parsedRecords
    })
  } catch (error) {
    console.error('Audit Records GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    )
  }
}

// POST - Create new audit record
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { audit_def_id, values, notes } = body

    if (!audit_def_id || !values) {
      return NextResponse.json(
        { error: 'audit_def_id and values are required' },
        { status: 400 }
      )
    }

    // Check if user is authorized for this audit
    const audits = await queryPrimary(
      'SELECT authorized_users_json FROM audit_def WHERE id = ? AND active = 1',
      [audit_def_id]
    ) as any[]

    if (audits.length === 0) {
      return NextResponse.json(
        { error: 'Audit not found or inactive' },
        { status: 404 }
      )
    }

    let authorizedUsers: number[] = []
    try {
      authorizedUsers = JSON.parse(audits[0].authorized_users_json || '[]')
    } catch (e) {
      authorizedUsers = []
    }

    if (!authorizedUsers.includes(Number(session.user.id))) {
      return NextResponse.json(
        { error: 'You are not authorized to submit records for this audit' },
        { status: 403 }
      )
    }

    const result = await queryPrimary(
      `INSERT INTO audit_record (audit_def_id, recorded_by, values_json, notes)
       VALUES (?, ?, ?, ?)`,
      [
        audit_def_id,
        session.user.id,
        JSON.stringify(values),
        notes || null
      ]
    ) as any

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Record submitted successfully'
    })
  } catch (error) {
    console.error('Audit Records POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    )
  }
}
