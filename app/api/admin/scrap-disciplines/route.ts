import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary, getMySQLPrimaryPool } from '@/lib/db/mysql-primary'

interface Discipline {
  id: number
  name: string
  description: string | null
  sort_order: number
  active: number
  patterns?: DeptPattern[]
}

interface DeptPattern {
  id: number
  discipline_id: number
  dept_code_pattern: string
  note: string | null
}

// GET — list all disciplines with their patterns
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const disciplines = await queryPrimary<Discipline[]>(
      `SELECT id, name, description, sort_order, active
       FROM scrap_disciplines
       ORDER BY sort_order, name`
    )

    const patterns = await queryPrimary<DeptPattern[]>(
      `SELECT id, discipline_id, dept_code_pattern, note
       FROM scrap_discipline_depts
       ORDER BY dept_code_pattern`
    )

    // Attach patterns to each discipline
    const patternMap = new Map<number, DeptPattern[]>()
    for (const p of patterns) {
      if (!patternMap.has(p.discipline_id)) patternMap.set(p.discipline_id, [])
      patternMap.get(p.discipline_id)!.push(p)
    }

    const result = disciplines.map(d => ({
      ...d,
      patterns: patternMap.get(d.id) || []
    }))

    return NextResponse.json({ disciplines: result })
  } catch (error) {
    console.error('Error fetching disciplines:', error)
    return NextResponse.json(
      { error: 'Failed to fetch disciplines', details: String(error) },
      { status: 500 }
    )
  }
}

// POST — create discipline or add pattern
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'addDiscipline') {
      const { name, description, sort_order } = body
      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      }

      const pool = getMySQLPrimaryPool()
      const [result]: any = await pool.execute(
        `INSERT INTO scrap_disciplines (name, description, sort_order) VALUES (?, ?, ?)`,
        [name, description || null, sort_order || 0]
      )

      return NextResponse.json({ success: true, id: result.insertId })
    }

    if (action === 'addPattern') {
      const { discipline_id, dept_code_pattern, note } = body
      if (!discipline_id || !dept_code_pattern) {
        return NextResponse.json({ error: 'discipline_id and dept_code_pattern are required' }, { status: 400 })
      }

      const pool = getMySQLPrimaryPool()
      const [result]: any = await pool.execute(
        `INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES (?, ?, ?)`,
        [discipline_id, dept_code_pattern, note || null]
      )

      return NextResponse.json({ success: true, id: result.insertId })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error creating discipline:', error)
    return NextResponse.json(
      { error: 'Failed to create', details: String(error) },
      { status: 500 }
    )
  }
}

// PUT — update discipline
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, name, description, sort_order, active } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const pool = getMySQLPrimaryPool()
    await pool.execute(
      `UPDATE scrap_disciplines SET name = ?, description = ?, sort_order = ?, active = ? WHERE id = ?`,
      [name, description || null, sort_order || 0, active ?? 1, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating discipline:', error)
    return NextResponse.json(
      { error: 'Failed to update', details: String(error) },
      { status: 500 }
    )
  }
}

// DELETE — remove discipline or pattern
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const pool = getMySQLPrimaryPool()

    if (type === 'pattern') {
      await pool.execute('DELETE FROM scrap_discipline_depts WHERE id = ?', [id])
    } else {
      // Delete discipline (cascade deletes patterns)
      await pool.execute('DELETE FROM scrap_disciplines WHERE id = ?', [id])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting:', error)
    return NextResponse.json(
      { error: 'Failed to delete', details: String(error) },
      { status: 500 }
    )
  }
}
