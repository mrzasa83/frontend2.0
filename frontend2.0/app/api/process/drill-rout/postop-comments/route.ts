import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// GET — fetch comments for one or many MCN IDs
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const mcnId = searchParams.get('mcnId')
    const mcnIds = searchParams.get('mcnIds') // comma-separated

    if (mcnId) {
      const rows = await queryPrimary(
        `SELECT id, mcn_id, comment, created_by, created_at, updated_at
         FROM mcn_postop_comments WHERE mcn_id = ? ORDER BY created_at DESC`, [mcnId]
      )
      return NextResponse.json({ success: true, comments: rows })
    }

    if (mcnIds) {
      const ids = mcnIds.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
      if (ids.length === 0) return NextResponse.json({ success: true, comments: [] })

      const placeholders = ids.map(() => '?').join(',')
      const rows = await queryPrimary(
        `SELECT id, mcn_id, comment, created_by, created_at
         FROM mcn_postop_comments WHERE mcn_id IN (${placeholders})
         ORDER BY mcn_id, created_at DESC`, ids
      )
      // Group by mcn_id: { mcnId: latestComment }
      const byMcn: Record<number, string> = {}
      for (const r of rows as any[]) {
        if (!byMcn[r.mcn_id]) {
          byMcn[r.mcn_id] = r.comment
        }
      }
      return NextResponse.json({ success: true, commentMap: byMcn })
    }

    return NextResponse.json({ error: 'mcnId or mcnIds required' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching postop comments:', error)
    return NextResponse.json({ error: 'Failed to fetch', details: String(error) }, { status: 500 })
  }
}

// POST — add a comment
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { mcnId, comment } = await request.json()
    if (!mcnId || !comment?.trim()) {
      return NextResponse.json({ error: 'mcnId and comment required' }, { status: 400 })
    }

    await queryPrimary(
      `INSERT INTO mcn_postop_comments (mcn_id, comment, created_by) VALUES (?, ?, ?)`,
      [mcnId, comment.trim(), session.user?.username || 'unknown']
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding postop comment:', error)
    return NextResponse.json({ error: 'Failed to add', details: String(error) }, { status: 500 })
  }
}

// PUT — update a comment
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, comment } = await request.json()
    if (!id || !comment?.trim()) {
      return NextResponse.json({ error: 'id and comment required' }, { status: 400 })
    }

    await queryPrimary(
      `UPDATE mcn_postop_comments SET comment = ? WHERE id = ?`,
      [comment.trim(), id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating postop comment:', error)
    return NextResponse.json({ error: 'Failed to update', details: String(error) }, { status: 500 })
  }
}
