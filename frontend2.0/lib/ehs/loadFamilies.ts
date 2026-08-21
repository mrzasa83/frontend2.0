import { queryPrimary } from '@/lib/db/mysql-primary'
import type { Family } from '@/lib/ehs/familyMatch'

/**
 * Load every part family with its criteria attached.
 * Lives here rather than in a route file: Next.js route modules may only export
 * request handlers, so shared helpers have to sit outside them.
 */
export async function loadFamilies(): Promise<Family[]> {
  const fams = await queryPrimary<any[]>(
    `SELECT id, family_name, description, reach_status, rohs_status, prop65_status,
            inherit_compliance, sort_order, active
     FROM ehs_part_families
     ORDER BY sort_order, family_name`
  )
  if (!fams?.length) return []
  const crits = await queryPrimary<any[]>(
    'SELECT id, family_id, field, operator, pattern, seq FROM ehs_family_criteria ORDER BY family_id, seq, id'
  )
  const byFamily = new Map<number, any[]>()
  for (const c of crits || []) {
    if (!byFamily.has(c.family_id)) byFamily.set(c.family_id, [])
    byFamily.get(c.family_id)!.push(c)
  }
  return fams.map(f => ({ ...f, criteria: byFamily.get(f.id) || [] }))
}
