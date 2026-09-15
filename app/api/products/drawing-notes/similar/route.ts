import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { similarity } from '@/lib/products/drawingNotes'

export const dynamic = 'force-dynamic'

/**
 * GET ?code=N0000000001[&q=free text]
 *
 * Candidates for grouping with the given note: either a free-text search, or —
 * with no query — the notes whose wording overlaps it most.
 *
 * Exact-wording duplicates never appear here; they were already collapsed into
 * one note by the text hash at scan time. What is left is the case a hash
 * cannot settle: the same requirement worded differently. Scoring happens in
 * the app rather than in SQL because 5.6 has no similarity function worth
 * using, and the note catalogue is small enough that reading it is cheap.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const code = (sp.get('code') || '').trim()
  const q = (sp.get('q') || '').trim()
  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 })

  try {
    const all = await queryPrimary<any[]>(
      `SELECT n.id, n.note_code, n.customer, n.name,
              v.note_text, v.status,
              (SELECT COUNT(DISTINCT s.apc_part_number)
                 FROM drawing_note_sources s WHERE s.note_id = n.id) AS part_count
         FROM drawing_notes n
         LEFT JOIN drawing_note_versions v
           ON v.id = COALESCE(n.active_version_id,
                (SELECT id FROM drawing_note_versions x
                  WHERE x.note_id = n.id ORDER BY x.version_no DESC LIMIT 1))`
    )
    const rows = all || []
    const me = rows.find(r => r.note_code === code)
    if (!me) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    // Notes already grouped with this one aren't candidates.
    const grouped = await queryPrimary<any[]>(
      `SELECT DISTINCT m2.note_id
         FROM drawing_note_group_members m1
         JOIN drawing_note_group_members m2 ON m2.group_id = m1.group_id
        WHERE m1.note_id = ?`, [me.id])
    const already = new Set((grouped || []).map(r => Number(r.note_id)))

    const term = q.toLowerCase()
    const candidates = rows
      .filter(r => r.note_code !== code && !already.has(Number(r.id)))
      .map(r => ({
        note_code: r.note_code,
        name: r.name || '',
        text: r.note_text || '',
        customer: r.customer || '',
        status: r.status || 'Pending',
        part_count: Number(r.part_count || 0),
        score: similarity(me.note_text || '', r.note_text || ''),
      }))
      .filter(r => (term
        ? [r.note_code, r.name, r.text, r.customer].some(v => v.toLowerCase().includes(term))
        : r.score > 0.2))
      .sort((a, b) => b.score - a.score)
      .slice(0, 25)

    return NextResponse.json({ success: true, candidates, searched: !!q })
  } catch (error) {
    console.error('Drawing note similar error:', error)
    return NextResponse.json({
      error: 'Failed to find similar notes',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
