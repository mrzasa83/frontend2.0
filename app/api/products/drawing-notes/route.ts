import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

/**
 * GET — the Drawing Notes master list.
 *
 * One row per note with the wording from whichever version is in force, plus
 * a rolled-up part list. The part count and the codes come from a correlated
 * subquery rather than a JOIN, because joining sightings would multiply the
 * note rows and 5.6 has no window function to collapse them back.
 *
 * A note may have no Active version at all — that is the normal state for a
 * freshly scanned one — so the text falls back to the latest version.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const customer = (sp.get('customer') || '').trim()
  const status = (sp.get('status') || '').trim()
  const search = (sp.get('search') || '').trim()

  try {
    const where: string[] = []
    const params: any[] = []
    if (customer) { where.push('n.customer = ?'); params.push(customer) }
    if (search) {
      where.push('(n.note_code LIKE ? OR n.name LIKE ? OR v.note_text LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like)
    }
    if (status) { where.push('COALESCE(v.status, \'Pending\') = ?'); params.push(status) }

    const rows = await queryPrimary<any[]>(
      `SELECT
         n.id, n.note_code, n.customer, n.name AS master_name, n.created_at,
         v.id AS version_id, v.version_no, v.status, v.name, v.description,
         v.note_text, v.approved_at,
         (SELECT COUNT(DISTINCT s.apc_part_number)
            FROM drawing_note_sources s WHERE s.note_id = n.id) AS part_count,
         (SELECT GROUP_CONCAT(DISTINCT s.apc_part_number
                              ORDER BY s.apc_part_number SEPARATOR ', ')
            FROM drawing_note_sources s WHERE s.note_id = n.id) AS part_numbers,
         (SELECT COUNT(*) FROM drawing_note_versions vv
           WHERE vv.note_id = n.id) AS version_count
       FROM drawing_notes n
       -- The version in force, else the newest. COALESCE on active_version_id
       -- can't be expressed as a join condition on 5.6 without a subquery.
       LEFT JOIN drawing_note_versions v
         ON v.id = COALESCE(
              n.active_version_id,
              (SELECT id FROM drawing_note_versions x
                WHERE x.note_id = n.id ORDER BY x.version_no DESC LIMIT 1))
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY n.note_code`,
      params
    )

    // GROUP_CONCAT truncates at group_concat_max_len (1024 by default), so a
    // note on many parts would show a clipped list. The count is authoritative
    // and the full list lives on the APC Parts tab.
    const notes = (rows || []).map(r => ({
      id: r.id,
      note_code: r.note_code,
      name: r.name || r.master_name || '',
      description: r.description || '',
      text: r.note_text || '',
      customer: r.customer || '',
      status: r.status || 'Pending',
      version_no: r.version_no || 0,
      version_count: r.version_count || 0,
      part_count: Number(r.part_count || 0),
      part_numbers: String(r.part_numbers || ''),
      approved_at: r.approved_at,
      created_at: r.created_at,
    }))

    return NextResponse.json({ success: true, notes, count: notes.length })
  } catch (error) {
    console.error('Drawing notes list error:', error)
    return NextResponse.json({
      error: 'Failed to load drawing notes',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
