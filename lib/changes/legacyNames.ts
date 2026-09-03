import { queryPrimary } from '@/lib/db/mysql-primary'
import { hasColumn } from '@/lib/db/schemaProbe'

/**
 * Bridging the legacy MCN data to current users.
 *
 * The legacy app recorded people as "Surname:Firstname" with no link back to a
 * login, so there's nothing to join on. Users.legacy_mcn_name is that link,
 * set by hand on the Engineer Roles tab, and once it's set an MCN's PE can be
 * resolved to a user — and from the user, to an office location.
 *
 * Short TTL: the mapping changes when someone edits a user, which is rare, but
 * the MCN list resolves it for thousands of rows at a time.
 */

const TTL_MS = 5 * 60 * 1000

export type LegacyNameOption = {
  name: string
  uses: number            // how often it appears in the MCN data
  mappedTo: string | null // username already claiming it, if any
}

let locCache: { map: Map<string, string>; at: number } | null = null

/** legacy_mcn_name (lowercased) -> office_location */
export async function getPeLocationMap(): Promise<Map<string, string>> {
  if (locCache && Date.now() - locCache.at < TTL_MS) return locCache.map
  const map = new Map<string, string>()
  try {
    if (!(await hasColumn('Users', 'legacy_mcn_name')) ||
        !(await hasColumn('Users', 'office_location'))) {
      // Migration hasn't run yet — no mapping, and the caller falls back.
      locCache = { map, at: Date.now() }
      return map
    }
    const rows = await queryPrimary<any[]>(
      `SELECT legacy_mcn_name, office_location
       FROM Users
       WHERE legacy_mcn_name IS NOT NULL AND legacy_mcn_name <> ''
         AND office_location IS NOT NULL AND office_location <> ''`
    )
    for (const r of rows || []) {
      map.set(String(r.legacy_mcn_name).trim().toLowerCase(), String(r.office_location).trim())
    }
  } catch {
    // Leave the map empty; location simply won't resolve.
  }
  locCache = { map, at: Date.now() }
  return map
}

export function clearPeLocationCache(): void {
  locCache = null
}

/** Office location for a legacy name, '' when unmapped. */
export function locationForPe(map: Map<string, string>, peName: any): string {
  const key = String(peName ?? '').trim().toLowerCase()
  if (!key) return ''
  return map.get(key) || ''
}

/**
 * The legacy names that actually appear in the MCN data, most-used first, so
 * the dropdown offers real values rather than free text. Includes who has
 * already claimed each one, to make a double-assignment obvious.
 */
export async function getLegacyNameOptions(): Promise<LegacyNameOption[]> {
  const claimed = new Map<string, string>()
  try {
    if (await hasColumn('Users', 'legacy_mcn_name')) {
      const rows = await queryPrimary<any[]>(
        `SELECT username, legacy_mcn_name FROM Users
         WHERE legacy_mcn_name IS NOT NULL AND legacy_mcn_name <> ''`
      )
      for (const r of rows || []) {
        claimed.set(String(r.legacy_mcn_name).trim().toLowerCase(), r.username)
      }
    }
  } catch { /* fall through with nothing claimed */ }

  const counts = new Map<string, number>()
  try {
    // PE and PPE are the roles that matter for ownership; initiator is included
    // so the list covers everyone who appears on a record.
    for (const col of ['pe', 'ppe', 'initiator']) {
      const rows = await queryPrimary<any[]>(
        `SELECT \`${col}\` AS n, COUNT(*) AS c
         FROM mcn
         WHERE \`${col}\` IS NOT NULL AND TRIM(\`${col}\`) <> ''
         GROUP BY \`${col}\``
      )
      for (const r of rows || []) {
        const name = String(r.n).trim()
        if (!name) continue
        counts.set(name, (counts.get(name) || 0) + Number(r.c || 0))
      }
    }
  } catch { /* mcn table unavailable — return whatever we have */ }

  return Array.from(counts.entries())
    .map(([name, uses]) => ({
      name, uses,
      mappedTo: claimed.get(name.toLowerCase()) || null,
    }))
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
}
