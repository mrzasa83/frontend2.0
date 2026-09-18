/**
 * EHS product compliance helpers.
 *
 * A product's position in each category is only as good as the weakest material
 * on its BOM. A material contributes a verdict through the family it resolves
 * to; a material with no family, or one whose family doesn't flow its
 * classification down, cannot be vouched for from the family definitions alone.
 */

export type Category = 'reach' | 'rohs' | 'prop65' | 'pfas'

export type MaterialLine = {
  part_number: string
  description: string
  manufacturer: string
  quantity?: number | null
  family_id: number | null
  family_name: string
  reach_status: string
  rohs_status: string
  prop65_status: string
  pfas_status: string
  per_part_evidence: boolean
}

/** PCB vs ASM from the APC part number (7 = PCB, 1 = ASM), as used elsewhere. */
export function productTypeFromPart(part: string): string {
  const p = (part || '').trim()
  if (p.startsWith('7')) return 'PCB'
  if (p.startsWith('1')) return 'ASM'
  return 'PCB'
}

/**
 * Does one material clear a category?
 *
 * Compliant and Exempt clear it; Unknown, Non-Compliant and an unassigned
 * material do not.
 *
 * How the material was qualified — by its family, or on its own record — does
 * NOT enter into it. An earlier version failed every material in a per-part
 * family outright, which made sense only while such materials had no
 * classification to read: the status was always blank, so treating the
 * qualification route as the verdict happened to give the right answer.
 *
 * It no longer does. Once a part carries its own Compliant record, a
 * part-level qualification is the MORE precise of the two — it is evidence
 * about that exact material rather than an inherited family position — and
 * failing it was rejecting the better data.
 */
export function materialPasses(m: MaterialLine, cat: Category): boolean {
  if (!m.family_name) return false
  const v = String(
    cat === 'reach' ? m.reach_status
      : cat === 'rohs' ? m.rohs_status
        : cat === 'prop65' ? m.prop65_status
          : m.pfas_status
  ).toLowerCase()
  return v === 'compliant' || v === 'exempt'
}

/** Pass only when every material clears the category. */
export function rollUp(materials: MaterialLine[], cat: Category): 'Pass' | 'Fail' {
  if (!materials.length) return 'Fail'
  return materials.every(m => materialPasses(m, cat)) ? 'Pass' : 'Fail'
}

/** The materials blocking a category, for showing why a product fails. */
export function blockers(materials: MaterialLine[], cat: Category): MaterialLine[] {
  return materials.filter(m => !materialPasses(m, cat))
}

export function rollUpAll(materials: MaterialLine[]) {
  return {
    reach: rollUp(materials, 'reach'),
    rohs: rollUp(materials, 'rohs'),
    prop65: rollUp(materials, 'prop65'),
    pfas: rollUp(materials, 'pfas'),
  }
}
