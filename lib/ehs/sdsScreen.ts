/**
 * SDS screening — read an HSI ingredient table against the regulated-substance
 * list and say what can be said.
 *
 * What this is for: catching the M-188 case automatically. Tin/Lead solder
 * discloses Lead (CAS 7439-92-1) at 36-41%, RoHS restricts lead at 0.1% by
 * weight, so that material is over the limit by roughly two and a half orders
 * of magnitude. That is arithmetic, not judgement, and nobody should have to
 * open 300 PDFs to find it.
 *
 * What this is NOT for: clearing anything. See VERDICTS below.
 */

import { normalizeCas } from './casNumber'

/**
 * Screen verdicts, deliberately distinct from the human classification values
 * in familyMatch.ts (Compliant | Non-Compliant | Exempt | Unknown).
 *
 * NON_COMPLIANT  a listed substance is disclosed at or above its threshold.
 *                Checkable from the data; safe to assert.
 * REVIEW         something a person has to look at: a hit close to a
 *                threshold, a withheld ingredient, an empty ingredient table,
 *                or a Prop 65 listing (which turns on exposure, not
 *                concentration, so no arithmetic settles it).
 * UNKNOWN        no linked SDS at all — nothing to go on.
 *
 * There is deliberately no COMPLIANT verdict. SDS ingredient tables disclose
 * only down to a threshold (typically 1%, or 0.1% for carcinogens) and may
 * withhold constituents entirely as trade secret — the Properties tab has a
 * Trade Secret column for exactly that. So an ingredient list with no hits
 * means "nothing listed was disclosed", which is not the same claim as
 * "nothing listed is present". REACH SVHC is restricted at 0.1% w/w, right at
 * the disclosure boundary, so this gap is widest precisely where it matters.
 *
 * Clearing a material stays a human signoff with evidence on file.
 */
export const VERDICTS = ['Non-Compliant', 'Review', 'Unknown'] as const
export type Verdict = (typeof VERDICTS)[number]

export const REGULATIONS = ['RoHS', 'REACH', 'Prop65'] as const
export type Regulation = (typeof REGULATIONS)[number]

export type Ingredient = {
  hsi_material_number: string
  chemical_name: string
  cas_number: string
  pct_min: number | null
  pct_max: number | null
  pct_stated: string
  trade_secret: boolean | number
}

export type RegulatedSubstance = {
  cas_number: string
  regulation: string
  substance_name: string
  threshold_pct: number | null
  list_version: string
  notes?: string
}

export type MaterialInput = {
  hsi_material_number: string
  /** False when the sheet came back with no ingredient rows at all. */
  ingredients_known: boolean | number
  is_archived?: boolean | number
}

export type Finding = {
  regulation: Regulation
  verdict: Verdict
  reason: string
  hsi_material_number: string | null
  cas_number: string | null
  pct_max: number | null
  threshold_pct: number | null
  list_version: string
}

/**
 * A hit within this factor of the threshold is flagged for review rather than
 * called outright, because the difference between 0.09% and 0.1% is inside the
 * measurement noise of a stated range on an SDS.
 */
const NEAR_THRESHOLD_FACTOR = 0.5

const truthy = (v: boolean | number | undefined) => v === true || v === 1

/**
 * Screen one regulation across every SDS linked to a family or part.
 *
 * `materials` is every linked sheet — one for an ordinary material, several
 * for a two-part system where both halves have to be looked at, none when
 * nothing is linked yet.
 */
export function screenRegulation(
  regulation: Regulation,
  materials: MaterialInput[],
  ingredients: Ingredient[],
  regulated: RegulatedSubstance[],
): Finding {
  const listVersion = regulated.find(r => r.regulation === regulation)?.list_version || ''
  const base = {
    regulation,
    hsi_material_number: null,
    cas_number: null,
    pct_max: null,
    threshold_pct: null,
    list_version: listVersion,
  }

  if (materials.length === 0) {
    return { ...base, verdict: 'Unknown', reason: 'No SDS linked.' }
  }

  // An SDS whose ingredient table never came back tells us nothing, and must
  // not read as a clean sheet.
  const blank = materials.filter(m => !truthy(m.ingredients_known))
  if (blank.length === materials.length) {
    return {
      ...base,
      verdict: 'Review',
      reason: `No ingredient data on ${blank.map(m => m.hsi_material_number).join(', ')}. `
        + 'The sheet may predate ingredient indexing — check it by hand.',
      hsi_material_number: blank[0].hsi_material_number,
    }
  }

  const byCas = new Map<string, RegulatedSubstance>()
  for (const r of regulated) {
    if (r.regulation !== regulation) continue
    const cas = normalizeCas(r.cas_number)
    if (cas) byCas.set(cas, r)
  }

  const reviews: Finding[] = []

  for (const ing of ingredients) {
    const cas = normalizeCas(ing.cas_number)
    const hit = cas ? byCas.get(cas) : undefined

    // A withheld ingredient is itself a reason to look, whether or not it
    // matched anything — by definition we cannot see what it is.
    if (truthy(ing.trade_secret)) {
      reviews.push({
        ...base,
        verdict: 'Review',
        reason: `${ing.chemical_name || 'An ingredient'} is withheld as trade secret, `
          + 'so the disclosed list is incomplete.',
        hsi_material_number: ing.hsi_material_number,
        cas_number: cas || null,
        pct_max: ing.pct_max,
      })
      continue
    }

    if (!hit) continue

    const threshold = hit.threshold_pct
    const pctMax = ing.pct_max

    // Prop 65 turns on exposure rather than concentration, so a listing is a
    // flag for a person, never an arithmetic verdict.
    if (threshold === null || threshold === undefined) {
      reviews.push({
        ...base,
        verdict: 'Review',
        reason: `${hit.substance_name || ing.chemical_name} (CAS ${cas}) is listed under `
          + `${regulation}${pctMax !== null ? ` at up to ${pctMax}%` : ''}. `
          + 'No concentration threshold applies — needs an exposure judgement.',
        hsi_material_number: ing.hsi_material_number,
        cas_number: cas,
        pct_max: pctMax,
      })
      continue
    }

    // Listed substance, but the sheet gave no number.
    if (pctMax === null || pctMax === undefined) {
      reviews.push({
        ...base,
        verdict: 'Review',
        reason: `${hit.substance_name || ing.chemical_name} (CAS ${cas}) is listed under `
          + `${regulation} at ${threshold}%, but the sheet states no concentration`
          + `${ing.pct_stated ? ` ("${ing.pct_stated}")` : ''}.`,
        hsi_material_number: ing.hsi_material_number,
        cas_number: cas,
        threshold_pct: threshold,
      })
      continue
    }

    // Over the limit on the conservative (max) reading — the assertable case.
    if (pctMax >= threshold) {
      return {
        ...base,
        verdict: 'Non-Compliant',
        reason: `${hit.substance_name || ing.chemical_name} (CAS ${cas}) at up to ${pctMax}% `
          + `exceeds the ${regulation} limit of ${threshold}%`
          + `${ing.pct_stated ? ` (sheet states ${ing.pct_stated})` : ''}.`,
        hsi_material_number: ing.hsi_material_number,
        cas_number: cas,
        pct_max: pctMax,
        threshold_pct: threshold,
      }
    }

    // Under, but close enough that a stated range shouldn't decide it.
    if (pctMax >= threshold * NEAR_THRESHOLD_FACTOR) {
      reviews.push({
        ...base,
        verdict: 'Review',
        reason: `${hit.substance_name || ing.chemical_name} (CAS ${cas}) at up to ${pctMax}% `
          + `is close to the ${regulation} limit of ${threshold}%.`,
        hsi_material_number: ing.hsi_material_number,
        cas_number: cas,
        pct_max: pctMax,
        threshold_pct: threshold,
      })
    }
  }

  if (reviews.length > 0) {
    // Several things to look at collapse into one finding; the detail is in
    // the per-ingredient rows the caller already has.
    return reviews.length === 1
      ? reviews[0]
      : { ...reviews[0], reason: `${reviews[0].reason} (+${reviews.length - 1} more to review)` }
  }

  // Nothing disclosed that is on the list. Note the wording: this is not a
  // pass, and it is not written into the family's classification.
  const partial = blank.length > 0
    ? ` Ingredient data is missing for ${blank.map(m => m.hsi_material_number).join(', ')}.`
    : ''
  return {
    ...base,
    verdict: 'Review',
    reason: `No ${regulation} substance disclosed above its threshold on `
      + `${materials.map(m => m.hsi_material_number).join(', ')}.${partial} `
      + 'Disclosure limits mean this is not a clearance — sign off with evidence.',
    hsi_material_number: materials[0].hsi_material_number,
  }
}

/** Screen all three regulations at once. */
export function screenAll(
  materials: MaterialInput[],
  ingredients: Ingredient[],
  regulated: RegulatedSubstance[],
): Record<Regulation, Finding> {
  return {
    RoHS: screenRegulation('RoHS', materials, ingredients, regulated),
    REACH: screenRegulation('REACH', materials, ingredients, regulated),
    Prop65: screenRegulation('Prop65', materials, ingredients, regulated),
  }
}

/** Badge colour for a screen verdict, matching the module's existing palette. */
export function verdictBadge(v: Verdict | string): string {
  if (v === 'Non-Compliant') return 'bg-red-100 text-red-700'
  if (v === 'Review') return 'bg-amber-50 text-amber-600'
  return 'bg-slate-100 text-slate-600'
}
