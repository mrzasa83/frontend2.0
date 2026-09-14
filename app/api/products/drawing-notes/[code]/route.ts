import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { approveAspect } from '@/lib/products/drawingNotes'

export const dynamic = 'force-dynamic'

async function loadNote(code: string) {
  const rows = await queryPrimary<any[]>(
    'SELECT * FROM drawing_notes WHERE note_code = ? LIMIT 1', [code]
  )
  return rows?.[0] || null
}

/**
 * GET /api/products/drawing-notes/[code]
 *
 * Everything the detail tabs need in one round trip: versions (the Overview
 * dropdown), approvals (Approvals tab), sightings (APC Parts tab), and the
 * dated version transitions (History tab).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const { code } = await params
    const note = await loadNote(code)
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    const [versions, approvals, sources] = await Promise.all([
      queryPrimary<any[]>(
        `SELECT id, version_no, status, name, description, note_text,
                measure_description, measure_how_to, created_by, created_at,
                approved_at, approved_by, inactivated_at, superseded_by
           FROM drawing_note_versions
          WHERE note_id = ? ORDER BY version_no DESC`, [note.id]),
      queryPrimary<any[]>(
        `SELECT a.id, a.version_id, v.version_no, a.aspect, a.approved_by,
                a.approved_at, a.comment
           FROM drawing_note_approvals a
           JOIN drawing_note_versions v ON v.id = a.version_id
          WHERE a.note_id = ?
          ORDER BY v.version_no DESC, a.aspect`, [note.id]),
      queryPrimary<any[]>(
        `SELECT id, apc_part_number, customer_part_number, customer,
                pdf_path, pdf_name, page_no, zone_label,
                bbox_x0, bbox_y0, bbox_x1, bbox_y1, page_width, page_height,
                drawing_number, drawing_rev, drawing_rev_date, sheet_label,
                extraction_method, note_number, image_path, scanned_by, scanned_at
           FROM drawing_note_sources
          WHERE note_id = ?
          ORDER BY apc_part_number, page_no`, [note.id]),
    ])

    // History: one dated row per transition, built from the stamps written at
    // approval time. Derived here rather than stored so it can never disagree
    // with the versions themselves.
    const history: any[] = []
    for (const v of versions || []) {
      if (v.created_at) {
        history.push({
          version_no: v.version_no, event: 'Created',
          at: v.created_at, by: v.created_by,
        })
      }
      if (v.approved_at) {
        history.push({
          version_no: v.version_no, event: 'Approved / Active',
          at: v.approved_at, by: v.approved_by,
        })
      }
      if (v.inactivated_at) {
        const sup = (versions || []).find(x => x.id === v.superseded_by)
        history.push({
          version_no: v.version_no, event: 'Inactive',
          at: v.inactivated_at, by: '',
          detail: sup ? `superseded by v${sup.version_no}` : '',
        })
      }
    }
    history.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

    return NextResponse.json({
      success: true,
      note: {
        id: note.id, note_code: note.note_code, customer: note.customer,
        name: note.name, active_version_id: note.active_version_id,
        created_at: note.created_at, created_by: note.created_by,
      },
      versions: versions || [],
      approvals: approvals || [],
      sources: sources || [],
      history,
    })
  } catch (error) {
    console.error('Drawing note detail error:', error)
    return NextResponse.json({
      error: 'Failed to load the note',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

/**
 * POST /api/products/drawing-notes/[code]
 *
 * action: 'new_version' | 'save_version' | 'approve'
 *
 * A new version always starts Pending and copies the version it was raised
 * from, so the user edits a draft rather than starting blank. Approving both
 * aspects promotes it and stands the previous Active version down — see
 * approveAspect().
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const user = (session.user as any)?.username || 'unknown'

  try {
    const { code } = await params
    const note = await loadNote(code)
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    const b = await request.json()
    const action = String(b?.action || '')

    if (action === 'new_version') {
      const prev = await queryPrimary<any[]>(
        `SELECT * FROM drawing_note_versions
          WHERE note_id = ? ORDER BY version_no DESC LIMIT 1`, [note.id])
      const p = prev?.[0]

      // One open draft at a time. Two concurrent Pending versions would make
      // "which one am I approving" ambiguous on the Overview dropdown.
      if (p && p.status === 'Pending') {
        return NextResponse.json({
          error: `v${p.version_no} is already pending. Approve or edit that one first.`,
        }, { status: 409 })
      }

      const nextNo = Number(p?.version_no || 0) + 1
      const ins = await queryPrimary<any>(
        `INSERT INTO drawing_note_versions
           (note_id, version_no, status, name, description, note_text,
            measure_description, measure_how_to, created_by)
         VALUES (?, ?, 'Pending', ?, ?, ?, ?, ?, ?)`,
        [note.id, nextNo, p?.name || note.name || '', p?.description || null,
          p?.note_text || null, p?.measure_description || null,
          p?.measure_how_to || null, user]
      )
      return NextResponse.json({
        success: true, version_id: Number(ins?.insertId || 0), version_no: nextNo,
      })
    }

    if (action === 'save_version') {
      const versionId = Number(b?.version_id || 0)
      if (!versionId) return NextResponse.json({ error: 'version_id required' }, { status: 400 })
      const vRows = await queryPrimary<any[]>(
        'SELECT status FROM drawing_note_versions WHERE id = ? AND note_id = ?',
        [versionId, note.id])
      if (!vRows?.length) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

      // Active and Inactive versions are the record of what was signed off.
      // Editing them would rewrite history; raise a new version instead.
      if (vRows[0].status !== 'Pending') {
        return NextResponse.json({
          error: 'Only a Pending version can be edited. Create a new version to make changes.',
        }, { status: 409 })
      }

      await queryPrimary(
        `UPDATE drawing_note_versions
            SET name = ?, description = ?, note_text = ?,
                measure_description = ?, measure_how_to = ?
          WHERE id = ?`,
        [String(b?.name ?? ''), b?.description ?? null, b?.note_text ?? null,
          b?.measure_description ?? null, b?.measure_how_to ?? null, versionId]
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'approve') {
      const versionId = Number(b?.version_id || 0)
      const aspect = String(b?.aspect || '')
      if (!versionId || (aspect !== 'description' && aspect !== 'how_to')) {
        return NextResponse.json({
          error: "version_id and aspect ('description' or 'how_to') required",
        }, { status: 400 })
      }
      const out = await approveAspect(versionId, aspect, user, String(b?.comment || ''))
      return NextResponse.json({ success: true, ...out })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('Drawing note update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Update failed',
    }, { status: 500 })
  }
}
