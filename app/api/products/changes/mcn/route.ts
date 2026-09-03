import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule, hasRole } from '@/lib/config/access'
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
    -- mcn_status 0: open, and it's the PE disposition that decides
    WHEN mcn_status = 0 AND (pe_disposition IS NULL OR TRIM(pe_disposition) = '') THEN 'Pending'
    WHEN mcn_status = 0 AND LOWER(TRIM(pe_disposition)) LIKE 'approv%' THEN 'Approved'
    WHEN mcn_status = 0 THEN 'Pending'

    -- mcn_status 1: closed out, and the disposition decides how.
    -- NULL and empty string mean DIFFERENT things here, so the NULL test has to
    -- come first: TRIM(NULL) is NULL, not '', and would fall through.
    WHEN mcn_status = 1 AND disposition IS NULL THEN 'Rejected (PPE)'
    WHEN mcn_status = 1 AND TRIM(disposition) = '' THEN 'Implemented'
    WHEN mcn_status = 1 AND LOWER(TRIM(disposition)) LIKE 'accept%' THEN 'Implemented'
    WHEN mcn_status = 1 AND LOWER(TRIM(disposition)) LIKE 'reject%' THEN 'Rejected'
    WHEN mcn_status = 1 AND LOWER(TRIM(disposition)) LIKE 'cancel%' THEN 'Canceled'
    WHEN mcn_status = 1 THEN 'Implemented'

    WHEN mcn_status = 2 THEN 'Rejected (PE)'
    WHEN mcn_status = 3 THEN 'Test'
    ELSE 'Unknown'
  END`

/**
 * Coarse grouping for the chart and filter chips: the three rejected variants
 * differ by who rejected it, which matters on the record but would fragment the
 * summary into near-empty bars.
 */
const STATUS_GROUP_CASE = `
  CASE
    WHEN mcn_status = 0 AND LOWER(TRIM(COALESCE(pe_disposition,''))) LIKE 'approv%' THEN 'Approved'
    WHEN mcn_status = 0 THEN 'Pending'
    WHEN mcn_status = 1 AND disposition IS NULL THEN 'Rejected'
    WHEN mcn_status = 1 AND LOWER(TRIM(disposition)) LIKE 'reject%' THEN 'Rejected'
    WHEN mcn_status = 1 AND LOWER(TRIM(disposition)) LIKE 'cancel%' THEN 'Canceled'
    WHEN mcn_status = 1 THEN 'Implemented'
    WHEN mcn_status = 2 THEN 'Rejected'
    WHEN mcn_status = 3 THEN 'Test'
    ELSE 'Unknown'
  END`

// hold_status is free-form in the legacy data; anything non-empty that isn't a
// negative counts as on hold. Hold is independent of status — a record can be
// held in any state.
const HOLD_CASE = `
  CASE
    WHEN hold_status IS NULL OR TRIM(hold_status) = '' THEN 0
    WHEN LOWER(TRIM(hold_status)) IN ('no','none','n','0','false','off') THEN 0
    ELSE 1
  END`

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // mcn_status = 3 is a test record. Hidden from everyone but Admin, so it
  // can't skew counts or turn up in a search for real changes.
  const isAdmin = hasRole(roles, 'Admin')
  const testFilter = isAdmin ? '' : 'WHERE mcn_status <> 3'

  const sp = new URL(request.url).searchParams
  const id = sp.get('id')

  try {
    // ---- Single record ----
    if (id) {
      const rows = await queryPrimary<any[]>(
        `SELECT *, ${STATUS_CASE} AS status, ${STATUS_GROUP_CASE} AS status_group,
                ${HOLD_CASE} AS on_hold
         FROM mcn WHERE id = ? ${isAdmin ? '' : 'AND mcn_status <> 3'} LIMIT 1`,
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
        initiator, requester, otherrequester, pe, ppe, closedby,
        \`change\`, reason, chngreason, chngeffect, disposition,
        submission_type, hold_status, hold_status_reason, urgent,
        eco, to_eco, software, wip, batchcard,
        subdate, subtime, closeddate, closedtime,
        STR_TO_DATE(CONCAT(NULLIF(subdate,''), ' ', NULLIF(subtime,'')), '%d%b%Y %H:%i:%s') AS submitted_at,
        STR_TO_DATE(CONCAT(NULLIF(closeddate,''), ' ', NULLIF(closedtime,'')), '%d%b%Y %H:%i:%s') AS closed_at,
        pe_disposition,
        ${STATUS_CASE} AS status,
        ${STATUS_GROUP_CASE} AS status_group,
        ${HOLD_CASE} AS on_hold
      FROM mcn
      ${testFilter}
      ORDER BY submitted_at DESC, id DESC
    `)

    /**
     * Who owns the record right now — it moves with the state:
     *   Draft      the initiator (state not defined yet; branch is here so it
     *              works the moment a Draft status starts being emitted)
     *   Pending    the PE, who has it to disposition
     *   Approved   the PPE, who has it to implement
     * Anything closed out has no active owner.
     */
    const ownerOf = (r: any): string => {
      const pick = (v: any) => String(v ?? '').trim()
      if (r.status === 'Draft') return pick(r.initiator)
      if (r.status_group === 'Approved') return pick(r.ppe)
      if (r.status_group === 'Pending') return pick(r.pe)
      return ''
    }

    // Attach build location from the Paradigm route.
    const locMap = await getLocationMap()
    const data = (rows || []).map(r => {
      const locations = locationsFor(locMap, r.toolnum)
      const owner = ownerOf(r)
      return {
        ...r,
        locations,
        location: locations.join(', '),
        owner,
        // Unowned open work is worth being able to see, so it gets a label
        // rather than an empty cell.
        owner_label: owner || (r.status_group === 'Pending' || r.status_group === 'Approved' ? 'Unassigned' : ''),
      }
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
      ${testFilter}
      GROUP BY mcn_status, disposition, submission_type, closed
      ORDER BY n DESC
      LIMIT 40
    `).catch(() => [])

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      statusAudit: audit || [],
      isAdmin,
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
