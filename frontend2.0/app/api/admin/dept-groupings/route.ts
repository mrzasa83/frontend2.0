import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// GET — list all groupings
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const groupings = await queryPrimary(
      `SELECT id, prefix, discipline, description, sort_order, active
       FROM dept_groupings
       ORDER BY sort_order ASC, prefix ASC`
    )
    return NextResponse.json({ groupings })
  } catch (error) {
    console.error('Error fetching dept groupings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groupings', details: String(error) },
      { status: 500 }
    )
  }
}

// POST — create a new grouping
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prefix, discipline, description, sort_order } = await request.json()

    if (!prefix || !discipline) {
      return NextResponse.json(
        { error: 'prefix and discipline are required' },
        { status: 400 }
      )
    }

    await queryPrimary(
      `INSERT INTO dept_groupings (prefix, discipline, description, sort_order)
       VALUES (?, ?, ?, ?)`,
      [prefix.toUpperCase().charAt(0), discipline, description || null, sort_order || 0]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: `Prefix '${(await request.clone().json()).prefix}' already exists` },
        { status: 409 }
      )
    }
    console.error('Error creating dept grouping:', error)
    return NextResponse.json(
      { error: 'Failed to create grouping', details: String(error) },
      { status: 500 }
    )
  }
}

// PUT — update a grouping
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, discipline, description, sort_order, active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await queryPrimary(
      `UPDATE dept_groupings
       SET discipline = ?, description = ?, sort_order = ?, active = ?
       WHERE id = ?`,
      [discipline, description || null, sort_order || 0, active ?? 1, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating dept grouping:', error)
    return NextResponse.json(
      { error: 'Failed to update grouping', details: String(error) },
      { status: 500 }
    )
  }
}
