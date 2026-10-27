import { queryMSSQL } from '@/lib/db/mssql'
import { loadFamilies } from '@/lib/ehs/loadFamilies'
import { familyForPart, allFamiliesForPart, type PartRow } from '@/lib/ehs/familyMatch'
import {
  parseMaterialName, panelSizeOf, materialKind, standardWidthLength,
  type MaterialKind,
} from '@/lib/materials/panelSize'

/**
 * Purchased parts with their resolved family, cached in memory.
 *
 * Why cache rather than push the work into SQL: family assignment can't be done
 * in SQL at all. The parts live in Paradigm (MSSQL, read-only) and the family
 * definitions live in MySQL, so there's no join to write — the matching has to
 * happen in the app. That means every request was doing a full cross-database
 * fetch plus a match over every part, which is what made typing in the filter
 * feel like wading through treacle.
 *
 * Paradigm's purchased-part list changes a few times a day at most, so a short
 * TTL is plenty. Filtering then runs over an in-memory array, which is fast
 * enough that the delay disappears.
 *
 * The cache is invalidated explicitly whenever a family or its criteria change,
 * so an edit shows up immediately rather than after the TTL expires.
 */

const TTL_MS = 5 * 60 * 1000

export type ResolvedPart = {
  RKEY: number | string
  INV_PART_NUMBER: string
  INV_PART_DESCRIPTION: string
  MANUFACTURER_NAME: string
  ACTIVE_FLAG: string
  PRODUCT_FAMILY: string
  family_id: number | null
  reach_status: string
  rohs_status: string
  prop65_status: string
  pfas_status: string
  per_part_evidence: boolean
  overlap: string[] | null

  // Parsed out of the name. Board material carries its spec in the part
  // number, so this is derived once here rather than on every request.
  material_kind: MaterialKind
  material_code: string
  thickness_in: number | null
  copper_code: string
  panel_grain: number | null
  panel_cross: number | null
  /** Narrow side first, grain ignored — the machine constraint. */
  panel_width: number | null
  panel_length: number | null
  size_check: string
}

const BASE_SQL = `
  select
      RKEY,
      INV_PART_NUMBER,
      INV_PART_DESCRIPTION,
      MANUFACTURER_NAME,
      ACTIVE_FLAG
  from data0017 WITH (NOLOCK)
  where
      P_M = 'P' and
      ACTIVE_FLAG = 'Y' and
      INV_PART_NUMBER not like 'Z%'
  order by INV_PART_NUMBER`

let cache: { rows: ResolvedPart[]; at: number } | null = null
let inFlight: Promise<ResolvedPart[]> | null = null

/** Drop the cache — call after any change to families or their criteria. */
export function invalidatePartsCache(): void {
  cache = null
}

export function partsCacheAge(): number | null {
  return cache ? Date.now() - cache.at : null
}

async function build(): Promise<ResolvedPart[]> {
  const [parts, families] = await Promise.all([
    queryMSSQL<PartRow[]>('1', BASE_SQL),
    loadFamilies(),
  ])

  return (parts || []).map(p => {
    const clean = (v: any) => String(v ?? '').trim()
    const part: PartRow = {
      RKEY: p.RKEY,
      INV_PART_NUMBER: clean(p.INV_PART_NUMBER),
      INV_PART_DESCRIPTION: clean(p.INV_PART_DESCRIPTION),
      MANUFACTURER_NAME: clean(p.MANUFACTURER_NAME),
      ACTIVE_FLAG: clean(p.ACTIVE_FLAG),
    }
    const fam = familyForPart(part, families)
    const all = allFamiliesForPart(part, families)
    const inherits = fam ? (fam.inherit_compliance ?? 1) : 1
    const parsed = parseMaterialName(part.INV_PART_NUMBER)
    const v = panelSizeOf(part.INV_PART_NUMBER, part.INV_PART_DESCRIPTION)
    const wl = standardWidthLength(v.size)

    return {
      ...part,
      material_kind: materialKind(part.INV_PART_NUMBER, part.INV_PART_DESCRIPTION),
      material_code: parsed?.code || '',
      thickness_in: parsed?.thicknessIn ?? null,
      copper_code: parsed?.copper || '',
      panel_grain: v.size?.grain ?? null,
      panel_cross: v.size?.cross ?? null,
      panel_width: wl?.width ?? null,
      panel_length: wl?.length ?? null,
      size_check: v.confidence,
      PRODUCT_FAMILY: fam?.family_name || '',
      family_id: fam?.id ?? null,
      reach_status: inherits ? (fam?.reach_status || '') : '',
      rohs_status: inherits ? (fam?.rohs_status || '') : '',
      prop65_status: inherits ? (fam?.prop65_status || '') : '',
      pfas_status: inherits ? (fam?.pfas_status || '') : '',
      per_part_evidence: fam ? !inherits : false,
      overlap: all.length > 1 ? all.map(f => f.family_name) : null,
    }
  })
}

export async function getPartsWithFamilies(force = false): Promise<ResolvedPart[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.rows
  // Collapse concurrent misses into one build — several users hitting a cold
  // cache shouldn't each start their own cross-database fetch.
  if (!inFlight) {
    inFlight = build()
      .then(rows => { cache = { rows, at: Date.now() }; return rows })
      .finally(() => { inFlight = null })
  }
  return inFlight
}
