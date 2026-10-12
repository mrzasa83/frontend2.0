import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

/**
 * Where the clock goes wrong between MySQL, Node and the browser.
 *
 * A history row's timestamp passes through three layers, and each can apply
 * its own timezone:
 *
 *   1. MySQL writes CURRENT_TIMESTAMP. A TIMESTAMP column stores UTC
 *      internally and converts on the way in and out using the SESSION
 *      time_zone.
 *   2. mysql2 reads back a wall-clock string ("2026-09-29 07:20:12") and
 *      builds a JS Date from it. With no `timezone` option set it uses the
 *      NODE PROCESS's zone, which in a container is usually UTC.
 *   3. JSON serialisation turns that Date into an ISO string in UTC, and the
 *      browser renders it with toLocaleString() in the viewer's zone.
 *
 * Steps 1 and 2 have to agree. If MySQL hands back Eastern wall-clock and Node
 * reads it as UTC, every timestamp lands four hours early — which is what a
 * 7:20am entry showing as 3:20am means.
 *
 * This endpoint measures all three rather than assuming any of them. The
 * number that matters is roundTrip.skewMinutes: zero means the stack agrees.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canReadModule((session.user as any)?.roles || [], 'admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  const node = {
    envTZ: process.env.TZ || '(unset)',
    resolvedZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    nowISO: new Date().toISOString(),
    nowLocal: new Date().toString(),
    offsetMinutesFromUTC: -new Date().getTimezoneOffset(),
  }

  try {
    /**
     * NOW() is the session clock; UTC_TIMESTAMP() is true UTC. The difference
     * between them IS the session offset, read rather than assumed.
     *
     * Both are also returned as plain strings via DATE_FORMAT, because the
     * driver would otherwise convert them on the way out and hide the very
     * thing being measured.
     */
    const clock = await queryPrimary<any[]>(`
      SELECT
        @@global.time_zone                                      AS globalTZ,
        @@session.time_zone                                     AS sessionTZ,
        @@system_time_zone                                      AS systemTZ,
        DATE_FORMAT(NOW(),            '%Y-%m-%d %H:%i:%s')      AS nowSessionStr,
        DATE_FORMAT(UTC_TIMESTAMP(),  '%Y-%m-%d %H:%i:%s')      AS nowUtcStr,
        TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), NOW())           AS sessionOffsetMinutes,
        @@version                                               AS version
    `)

    /**
     * The round trip, on a real row. The same column is read twice: once as a
     * plain string (what MySQL thinks it is) and once normally (what the
     * driver makes of it). If those two disagree, the gap is the bug.
     */
    const sample = await queryPrimary<any[]>(`
      SELECT
        id,
        changed_at                                              AS asDriverParsesIt,
        DATE_FORMAT(changed_at, '%Y-%m-%d %H:%i:%s')            AS asStoredString,
        DATE_FORMAT(CONVERT_TZ(changed_at, @@session.time_zone, '+00:00'),
                    '%Y-%m-%d %H:%i:%s')                        AS asUtcString
      FROM inspection_history
      ORDER BY id DESC
      LIMIT 1
    `)

    const row = sample?.[0]
    let roundTrip: any = { note: 'No inspection_history rows to check.' }

    if (row) {
      const stored = String(row.asStoredString || '')
      // What the driver produced, expressed the same way: the UTC wall clock
      // of the Date it built.
      const parsedUtc = row.asDriverParsesIt instanceof Date
        ? row.asDriverParsesIt.toISOString().replace('T', ' ').slice(0, 19)
        : String(row.asDriverParsesIt ?? '')

      const ms = (s: string) => Date.parse(s.replace(' ', 'T') + 'Z')
      const skew = Number.isFinite(ms(stored)) && Number.isFinite(ms(parsedUtc))
        ? Math.round((ms(parsedUtc) - ms(stored)) / 60000)
        : null

      roundTrip = {
        rowId: row.id,
        storedWallClock: stored,
        mysqlSaysUTC: String(row.asUtcString || ''),
        driverProducedUTC: parsedUtc,
        browserWouldShow: row.asDriverParsesIt instanceof Date
          ? row.asDriverParsesIt.toISOString() : null,
        skewMinutes: skew,
        verdict: skew === null ? 'could not compare'
          : skew === 0 ? 'OK — MySQL and Node agree'
            : `OFF BY ${skew / 60} hour(s) — the driver is reading MySQL's wall clock as ${
              skew > 0 ? 'UTC when it is local' : 'local when it is UTC'}`,
      }
    }

    const c = clock?.[0] || {}
    return NextResponse.json({
      success: true,
      node,
      mysql: {
        globalTZ: c.globalTZ,
        sessionTZ: c.sessionTZ,
        systemTZ: c.systemTZ,
        version: c.version,
        nowSession: c.nowSessionStr,
        nowUTC: c.nowUtcStr,
        sessionOffsetMinutes: Number(c.sessionOffsetMinutes),
      },
      roundTrip,
      // The one line to read first.
      summary: roundTrip?.verdict || 'no sample row',
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Time check failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
