import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await queryPrimary(
      `SELECT id, name, description, conditions, created_by, created_at, active
       FROM drill_rout_searches WHERE active = 1 ORDER BY name ASC`
    )
    // Parse JSON conditions
    const searches = rows.map((r: any) => ({
      ...r,
      conditions: typeof r.conditions === 'string' ? JSON.parse(r.conditions) : r.conditions,
    }))
    return NextResponse.json({ success: true, searches })
  } catch (error) {
    console.error('Error fetching searches:', error)
    return NextResponse.json({ error: 'Failed to fetch', details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, description, conditions } = await request.json()
    if (!name || !conditions || !Array.isArray(conditions) || conditions.length === 0) {
      return NextResponse.json({ error: 'name and conditions required' }, { status: 400 })
    }

    const result = await queryPrimary(
      `INSERT INTO drill_rout_searches (name, description, conditions, created_by) VALUES (?, ?, ?, ?)`,
      [name, description || null, JSON.stringify(conditions), session.user?.username || 'unknown']
    )
    return NextResponse.json({ success: true, id: (result as any).insertId })
  } catch (error) {
    console.error('Error creating search:', error)
    return NextResponse.json({ error: 'Failed to create', details: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, name, description, conditions } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await queryPrimary(
      `UPDATE drill_rout_searches SET name = ?, description = ?, conditions = ? WHERE id = ?`,
      [name, description || null, JSON.stringify(conditions), id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating search:', error)
    return NextResponse.json({ error: 'Failed to update', details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await queryPrimary(`UPDATE drill_rout_searches SET active = 0 WHERE id = ?`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting search:', error)
    return NextResponse.json({ error: 'Failed to delete', details: String(error) }, { status: 500 })
  }
}
