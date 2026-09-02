import { queryMSSQL } from '@/lib/db/mssql'

/**
 * Build location for a part, derived from its route.
 *
 * There's no location field on an MCN — the record only carries the tool
 * number. The build location comes from the part's released route: each step
 * points at a department (DATA0034), and a department belongs to a warehouse.
 * The warehouse is what identifies the site.
 *
 * Warehouse mapping matches the Work Center admin screen:
 *     1 + dept code starting J  -> Nashua Assembly
 *     1                          -> Nashua PCB
 *     3                          -> Nogales
 *     6                          -> Mesa
 *
 * A route can cross sites (a board built in Nashua and assembled in Nogales),
 * so every distinct location on the route is returned rather than just the
 * first — filtering on "Nogales" should find a part that visits Nogales at all.
 *
 * Cached: this is a per-part route walk, and the MCN list needs it for
 * thousands of tool numbers at once.
 */

const TTL_MS = 10 * 60 * 1000

const LOCATION_SQL = `
  SELECT DISTINCT
    LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) AS part_number,
    CASE
      WHEN d34.WAREHOUSE_PTR = 1 AND d34.DEPT_CODE LIKE 'J%' THEN 'Nashua Assembly'
      WHEN d34.WAREHOUSE_PTR = 1 THEN 'Nashua PCB'
      WHEN d34.WAREHOUSE_PTR = 3 THEN 'Nogales'
      WHEN d34.WAREHOUSE_PTR = 6 THEN 'Mesa'
      ELSE ''
    END AS location
  FROM DATA0038 d38 WITH (NOLOCK)
  INNER JOIN DATA0050 d50 WITH (NOLOCK) ON d50.RKEY = d38.SOURCE_PTR
  INNER JOIN DATA0034 d34 WITH (NOLOCK) ON d34.RKEY = d38.DEPT_PTR
  WHERE d38.TTYPE = 4`

let cache: { map: Map<string, string[]>; at: number } | null = null
let inFlight: Promise<Map<string, string[]>> | null = null

async function build(): Promise<Map<string, string[]>> {
  const rows = await queryMSSQL<any[]>('1', LOCATION_SQL)
  const map = new Map<string, string[]>()
  for (const r of rows || []) {
    const part = String(r.part_number || '').trim().toUpperCase()
    const loc = String(r.location || '').trim()
    if (!part || !loc) continue
    const list = map.get(part)
    if (list) { if (!list.includes(loc)) list.push(loc) }
    else map.set(part, [loc])
  }
  return map
}

export async function getLocationMap(force = false): Promise<Map<string, string[]>> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.map
  if (!inFlight) {
    inFlight = build()
      .then(map => { cache = { map, at: Date.now() }; return map })
      .catch(e => {
        // Location is a nice-to-have; the MCN list must still render without it.
        console.error('Route location lookup failed:', e)
        return new Map<string, string[]>()
      })
      .finally(() => { inFlight = null })
  }
  return inFlight
}

/** Locations for one tool number, '' when the part has no released route. */
export function locationsFor(map: Map<string, string[]>, toolnum: string): string[] {
  const key = String(toolnum ?? '').trim().toUpperCase()
  if (!key) return []
  return map.get(key) || []
}
