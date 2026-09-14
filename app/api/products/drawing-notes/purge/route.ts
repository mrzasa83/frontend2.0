import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export const dynamic = 'force-dynamic'

/**
 * POST — delete every drawing note.
 *
 * Admin only, and deliberately NOT gated on canReadModule: everyone who can
 * open the Drawing Notes app can read it, and read access must never imply the
 * ability to empty it.
 *
 * This exists because the catalogue is still being shaped — the extraction
 * rules changed twice in one afternoon — so wipe-and-rescan is the normal way
 * to work right now. It is not a feature that ages well. Once real approvals
 * are on file, narrow it to Pending-only or drop it.
 *
 * Two modes:
 *   { codes: ["N0000000001", ...] }      delete just those notes
 *   { confirm: "DELETE ALL NOTES" }      empty the catalogue
 *
 * The all-notes path needs the confirmation phrase because a destructive
 * endpoint reachable by an empty POST is one stray fetch away from an
 * accident. The selective path doesn't: the codes ARE the confirmation, and
 * they can only have come from someone looking at the list.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles: string[] = (session.user as any)?.roles || []
  if (!roles.includes('Admin')) {
    return NextResponse.json({
      error: 'Only an Admin can delete the drawing note catalogue.',
    }, { status: 403 })
  }
  const user = (session.user as any)?.username || 'unknown'

  try {
    const body = await request.json().catch(() => ({}))
    const codes: string[] = Array.isArray(body?.codes)
      ? body.codes.map((c: any) => String(c).trim()).filter(Boolean)
      : []

    if (codes.length) {
      // Parameterised IN list — the codes come off the wire, so they are never
      // interpolated into the SQL even though they look like fixed-width keys.
      const marks = codes.map(() => '?').join(', ')
      const rows = await queryPrimary<any[]>(
        `SELECT id, note_code FROM drawing_notes WHERE note_code IN (${marks})`, codes)
      const ids = (rows || []).map(r => Number(r.id))
      if (!ids.length) {
        return NextResponse.json({ error: 'None of those notes exist.' }, { status: 404 })
      }
      const idMarks = ids.map(() => '?').join(', ')

      // Same ordering constraint as the full purge: the RESTRICT foreign key on
      // drawing_note_sources means children first, and active_version_id has to
      // be cleared before its version row can go.
      await queryPrimary(
        `DELETE FROM drawing_note_approvals WHERE note_id IN (${idMarks})`, ids)
      await queryPrimary(
        `DELETE FROM drawing_note_sources WHERE note_id IN (${idMarks})`, ids)
      await queryPrimary(
        `UPDATE drawing_notes SET active_version_id = NULL WHERE id IN (${idMarks})`, ids)
      await queryPrimary(
        `DELETE FROM drawing_note_versions WHERE note_id IN (${idMarks})`, ids)
      await queryPrimary(
        `DELETE FROM drawing_notes WHERE id IN (${idMarks})`, ids)

      // The sequence is NOT reset here. Codes already handed out stay retired,
      // so a deleted N0000000007 can never be reused for a different note —
      // anyone holding a printout of the old one would otherwise be reading
      // about something else entirely.
      console.warn(`Drawing notes deleted by ${user}: ${codes.join(', ')}`)
      return NextResponse.json({
        success: true, deleted: { notes: ids.length },
        codes: (rows || []).map(r => r.note_code),
      })
    }

    if (String(body?.confirm || '') !== 'DELETE ALL NOTES') {
      return NextResponse.json({ error: 'Confirmation phrase required.' }, { status: 400 })
    }

    const before = await queryPrimary<any[]>(
      `SELECT
         (SELECT COUNT(*) FROM drawing_notes) AS notes,
         (SELECT COUNT(*) FROM drawing_note_versions) AS versions,
         (SELECT COUNT(*) FROM drawing_note_sources) AS sources,
         (SELECT COUNT(*) FROM drawing_note_approvals) AS approvals`
    )
    const counts = before?.[0] || {}

    // Order matters. drawing_note_sources carries a RESTRICT foreign key to
    // drawing_notes — put there so a sync could never orphan a link — which
    // means the children must go first; a plain DELETE FROM drawing_notes is
    // refused. active_version_id is cleared before the versions go, for the
    // same reason.
    await queryPrimary('DELETE FROM drawing_note_approvals')
    await queryPrimary('DELETE FROM drawing_note_sources')
    await queryPrimary('UPDATE drawing_notes SET active_version_id = NULL')
    await queryPrimary('DELETE FROM drawing_note_versions')
    await queryPrimary('DELETE FROM drawing_notes')
    await queryPrimary('DELETE FROM drawing_note_scans')

    // Note codes restart at N0000000001. Safe only because every row that
    // referenced the old codes is gone. If this ever becomes a partial delete,
    // these two lines must not come with it.
    await queryPrimary('DELETE FROM drawing_note_seq')
    await queryPrimary('ALTER TABLE drawing_note_seq AUTO_INCREMENT = 1')

    console.warn(`Drawing note catalogue purged by ${user}:`, counts)
    return NextResponse.json({
      success: true,
      deleted: {
        notes: Number(counts.notes || 0),
        versions: Number(counts.versions || 0),
        sources: Number(counts.sources || 0),
        approvals: Number(counts.approvals || 0),
      },
    })
  } catch (error) {
    console.error('Drawing note purge error:', error)
    return NextResponse.json({
      error: 'Purge failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
