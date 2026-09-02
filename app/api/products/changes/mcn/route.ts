import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { getLocationMap, locationsFor } from '@/lib/changes/mcnLocation'

export const dynamic = 'force-dynamic'

/**
 * Product Changes (MCN) — read-only port of the legacy app.
 *
 * STATUS
 * ------
 * The legacy record carries mcn_status plus a disposition and a submission
 * type, and the four states we want are derived from the combination:
 *
 *   Pending      still open — no disposition recorded yet
 *   Approved     dispositioned Accepted, but not yet closed out
 *   Implemented  Accepted and closed (closeddate present / "Close MCN")
 *   Rejected     dispositioned Rejected
 *
 * This mapping is a first pass — the same position the ECO port started from.
 * The endpoint returns a `statusAudit` breakdown of the raw combinations so the
 * mapping can be checked against reality and corrected, rather than quietly
 * mis-labelling records.
 *
 * ON HOLD is deliberately separate: a record can be on hold in any state, so
 * it's a flag rather than a status.
 */

const STATUS_CASE = `
  CASE
    WHEN LOWER(COALESCE(disposition,'')) LIKE 'reject%' THEN 'Rejected'
    WHEN LOWER(COALESCE(disposition,'')) LIKE 'accept%'
         AND (COALESCE(closeddate,'') <> '' OR mcn_status = 1) THEN 'Implemented'
    WHEN LOWER(COALESCE(disposition,'')) LIKE 'accept%' THEN 'Approved'
    WHEN mcn_status = 1 AND COALESCE(closeddate,'') <> '' THEN 'Implemented'
    ELSE 'Pending'
  END`

// hold_status is free-form in the legacy data; anything non-empty that isn't a
// negative counts as on hold.
const HOLD_CASE = `
  CASE
    WHEN hold_status IS NULL OR hold_status = '' THEN 0
    WHEN LOWER(hold_status) IN ('no','none','n','0','false','off') THEN 0
    ELSE 1
  END`

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const id = sp.get('id')

  try {
    // ---- Single record ----
    if (id) {
      const rows = await queryPrimary<any[]>(
        `SELECT *, ${STATUS_CASE} AS status, ${HOLD_CASE} AS on_hold FROM mcn WHERE id = ? LIMIT 1`,
        [id]
      )
      if (!rows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const record = rows[0]
      const locMap = await getLocationMap()
      record.locations = locationsFor(locMap, record.toolnum)
      return NextResponse.json({ success: true, record })
    }

    // ---- List ----
    const rows = await queryPrimary<any[]>(`
      SELECT
        id, request, mcn_status, toolnum, partnum, customer,
        initiator, requester, otherrequester, pe, closedby,
        \`change\`, reason, chngreason, chngeffect, disposition,
        submission_type, hold_status, hold_status_reason, urgent,
        eco, to_eco, software, wip, batchcard,
        subdate, subtime, closeddate, closedtime,
        STR_TO_DATE(CONCAT(NULLIF(subdate,''), ' ', NULLIF(subtime,'')), '%d%b%Y %H:%i:%s') AS submitted_at,
        STR_TO_DATE(CONCAT(NULLIF(closeddate,''), ' ', NULLIF(closedtime,'')), '%d%b%Y %H:%i:%s') AS closed_at,
        ${STATUS_CASE} AS status,
        ${HOLD_CASE} AS on_hold
      FROM mcn
      ORDER BY submitted_at DESC, id DESC
    `)

    // Attach build location from the Paradigm route.
    const locMap = await getLocationMap()
    const data = (rows || []).map(r => {
      const locations = locationsFor(locMap, r.toolnum)
      return { ...r, locations, location: locations.join(', ') }
    })

    // How the raw values actually combine — so the mapping above can be checked
    // rather than trusted.
    const audit = await queryPrimary<any[]>(`
      SELECT mcn_status,
             COALESCE(disposition,'(null)')     AS disposition,
             COALESCE(submission_type,'(null)') AS submission_type,
             CASE WHEN COALESCE(closeddate,'') <> '' THEN 'closed' ELSE 'open' END AS closed,
             COUNT(*) AS n
      FROM mcn
      GROUP BY mcn_status, disposition, submission_type, closed
      ORDER BY n DESC
      LIMIT 40
    `).catch(() => [])

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      statusAudit: audit || [],
      locations: Array.from(new Set(data.flatMap(d => d.locations))).sort(),
    })
  } catch (error) {
    console.error('MCN query error:', error)
    return NextResponse.json({
      error: 'Failed to load product changes',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
