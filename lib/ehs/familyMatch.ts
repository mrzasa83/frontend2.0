/**
 * EHS part-family matching.
 *
 * Families are defined as saved search criteria over the purchased-part list
 * from Paradigm (DATA0017). The base search is fixed:
 *
 *   P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
 *
 * A family adds one or more criteria which are AND'd together, mirroring how
 * the equivalent SQL would read, e.g. INV_PART_NUMBER LIKE 'PPGLB%'.
 *
 * Matching happens in the app layer rather than in SQL because the parts come
 * from MSSQL while the family definitions live in MySQL.
 */

export type Criterion = {
  id?: number
  field: string          // INV_PART_NUMBER | INV_PART_DESCRIPTION | MANUFACTURER_NAME
  operator: string       // LIKE | NOT LIKE
  pattern: string        // SQL LIKE pattern, e.g. PPGLB%
  seq?: number
}

export type Family = {
  id: number
  family_name: string
  description: string
  reach_status: string
  rohs_status: string
  prop65_status: string
  sort_order: number
  active: number | boolean
  criteria: Criterion[]
}

export type PartRow = {
  RKEY: number | string
  INV_PART_NUMBER: string
  INV_PART_DESCRIPTION: string
  MANUFACTURER_NAME: string
  ACTIVE_FLAG: string
}

export const CRITERIA_FIELDS = [
  'INV_PART_NUMBER',
  'INV_PART_DESCRIPTION',
  'MANUFACTURER_NAME',
] as const

export const CRITERIA_OPERATORS = ['LIKE', 'NOT LIKE'] as const

export const COMPLIANCE_VALUES = ['Compliant', 'Non-Compliant', 'Exempt', 'Unknown'] as const

/** Convert a SQL LIKE pattern into a case-insensitive regular expression. */
export function likeToRegExp(pattern: string): RegExp {
  // Escape regex metacharacters, then translate the SQL wildcards % and _.
  const escaped = String(pattern ?? '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '\u0000')   // placeholder so the escaping below is unambiguous
    .replace(/_/g, '\u0001')
  const body = escaped
    .replace(/\u0000/g, '.*')
    .replace(/\u0001/g, '.')
  return new RegExp(`^${body}$`, 'i')
}

/** Does a part satisfy every criterion of a family? */
export function partMatchesFamily(part: PartRow, family: Family): boolean {
  const crits = family.criteria || []
  if (!crits.length) return false          // an undefined family matches nothing
  return crits.every(c => {
    const value = String((part as any)[c.field] ?? '')
    const re = likeToRegExp(c.pattern)
    const hit = re.test(value)
    return String(c.operator).toUpperCase() === 'NOT LIKE' ? !hit : hit
  })
}

/**
 * Resolve which family a part belongs to. When a part matches more than one,
 * the lower sort_order wins; ties break on family name so the result is stable.
 * Returns null when nothing matches — those are the parts still to be bucketed.
 */
export function familyForPart(part: PartRow, families: Family[]): Family | null {
  const hits = families.filter(f => (f.active ?? 1) && partMatchesFamily(part, f))
  if (!hits.length) return null
  hits.sort((a, b) =>
    (a.sort_order - b.sort_order) || a.family_name.localeCompare(b.family_name))
  return hits[0]
}

/** All families a part matches — used to surface overlapping definitions. */
export function allFamiliesForPart(part: PartRow, families: Family[]): Family[] {
  return families.filter(f => (f.active ?? 1) && partMatchesFamily(part, f))
}

/** Render a family's criteria as the SQL it stands for (for the Definition tab). */
export function criteriaToSql(criteria: Criterion[]): string {
  const base = [
    'select',
    '    RKEY,',
    '    INV_PART_NUMBER,',
    '    INV_PART_DESCRIPTION,',
    '    MANUFACTURER_NAME,',
    '    ACTIVE_FLAG',
    'from data0017',
    'where',
    "    P_M = 'P' and",
    "    ACTIVE_FLAG = 'Y' and",
    "    INV_PART_NUMBER not like 'Z%'",
  ]
  const extra = (criteria || [])
    .slice()
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
    .map(c => `    and ${c.field} ${String(c.operator).toLowerCase()} '${c.pattern}'`)
  return [...base, ...extra].join('\n')
}
