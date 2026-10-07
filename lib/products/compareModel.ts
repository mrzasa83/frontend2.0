/**
 * One card shape both sides of a comparison can be read in, plus the text
 * rendering the diff runs over.
 *
 * The two sides arrive differently: the gold standard is rows out of MySQL
 * (gold_standard_cards and friends), the part being compared is built live
 * from Paradigm by buildCardSet(). Diffing them directly would mean the diff
 * knowing about both, so they are normalised here first.
 *
 * Deliberately free of any database import: the client pairs and diffs the
 * cards itself, so changing a tolerance re-pairs instantly instead of
 * re-reading a deep assembly out of Paradigm.
 */

export type CompareBomLine = {
  partNumber: string
  description: string
  unit: string
  requiredPer: string
  qtyRequired: string
  isManufactured: boolean
}

export type CompareRouteStep = {
  step: number
  dept: string
  deptCode: string
  instructionCodes: string
  instructions: string[]
  params: { name: string; value: string }[]
}

export type CompareCard = {
  /** Unique within its own side. */
  key: string
  level: number
  kind: string
  partNumber: string
  description: string
  revision: string
  bomNumber: string
  bomDescription: string
  routeCode: string
  routeName: string
  productCode: string
  productName: string
  catalogNumber: string
  bom: CompareBomLine[]
  route: CompareRouteStep[]
  notes: string[]
  comments: string[]
  parameters: { name: string; value: string }[]
  specs: { name: string; value: string }[]
  units: { code: string; description: string; value: string }[]
}

const s = (v: any) => String(v ?? '').trim()

/** A card as stored for a gold standard (getGoldStandard().cards). */
export function fromStoredCard(c: any, i: number): CompareCard {
  return {
    key: `gs-${c.id ?? i}`,
    level: Number(c.level) || 0,
    kind: s(c.kind) || 'manufactured',
    partNumber: s(c.partNumber),
    description: s(c.description),
    revision: s(c.revision),
    bomNumber: s(c.bomNumber),
    bomDescription: s(c.bomDescription),
    routeCode: s(c.routeCode),
    routeName: s(c.routeName),
    productCode: s(c.productCode),
    productName: s(c.productName),
    catalogNumber: s(c.catalogNumber),
    bom: (c.bom || []).map((b: any) => ({
      partNumber: s(b.partNumber), description: s(b.description), unit: s(b.unit),
      requiredPer: s(b.requiredPer), qtyRequired: s(b.qtyRequired),
      isManufactured: !!b.isManufactured,
    })),
    route: (c.route || []).map((r: any) => ({
      step: Number(r.step) || 0, dept: s(r.dept), deptCode: s(r.deptCode),
      instructionCodes: s(r.instructionCodes),
      instructions: (r.instructions || []).map(s),
      params: (r.params || []).map((p: any) => ({ name: s(p.name), value: s(p.value) })),
    })),
    notes: (c.notes || []).map(s),
    comments: (c.comments || []).map(s),
    parameters: (c.parameters || []).map((p: any) => ({ name: s(p.name), value: s(p.value) })),
    specs: (c.specs || []).map((p: any) => ({ name: s(p.name), value: s(p.value) })),
    units: (c.units || []).map((u: any) => ({
      code: s(u.code), description: s(u.description), value: s(u.value) })),
  }
}

/** A card as built live from Paradigm (CardData from batchCardData). */
export function fromCardData(c: any, i: number): CompareCard {
  return {
    key: `live-${c.sourceRkey || i}-${i}`,
    level: Number(c.level) || 0,
    kind: s(c.kind) || 'manufactured',
    partNumber: s(c.partNumber),
    description: s(c.description),
    revision: s(c.revision),
    bomNumber: s(c.bomNumber),
    bomDescription: s(c.bomDescription),
    routeCode: s(c.routeCode),
    routeName: s(c.routeName),
    productCode: s(c.productCode),
    productName: s(c.productName),
    catalogNumber: s(c.catalogNumber),
    bom: (c.bom || []).map((b: any) => ({
      partNumber: s(b.partNumber), description: s(b.description), unit: s(b.unit),
      requiredPer: s(b.requiredPer), qtyRequired: s(b.qtyRequired),
      isManufactured: !!b.isManufactured,
    })),
    route: (c.route || []).map((r: any) => ({
      step: Number(r.step) || 0, dept: s(r.dept), deptCode: s(r.deptCode),
      instructionCodes: s(r.instructionCodes),
      instructions: (r.instructions || []).map(s),
      params: (r.params || []).map((p: any) => ({ name: s(p.name), value: s(p.value) })),
    })),
    notes: (c.notes || []).map(s),
    comments: (c.comments || []).map(s),
    parameters: (c.parameters || []).map((p: any) => ({ name: s(p.name), value: s(p.value) })),
    specs: (c.specs || []).map((p: any) => ({ name: s(p.name), value: s(p.value) })),
    units: (c.units || []).map((u: any) => ({
      code: s(u.code), description: s(u.description), value: s(u.value) })),
  }
}

/* ───────────────────────── text for the diff ───────────────────────── */

export type CompareSection = 'route' | 'bom' | 'general'

/**
 * The route as lines.
 *
 * The step NUMBER is deliberately left out of the line text and the
 * department carries the identity instead. Paradigm renumbers steps freely —
 * an inserted operation pushes 20/30/40 to 30/40/50 — and numbering every
 * line would report a whole route as changed because one step was added at
 * the top. The number is still shown in the UI, alongside the diff rather
 * than inside it.
 */
export function routeLines(card: CompareCard | null): string[] {
  if (!card) return []
  const out: string[] = []
  for (const r of card.route) {
    out.push(`${r.dept}${r.deptCode ? ` (${r.deptCode})` : ''}`)
    if (r.instructionCodes) out.push(`    codes: ${r.instructionCodes}`)
    for (const t of r.instructions) {
      // A multi-line instruction becomes several lines, so a change inside a
      // long paragraph highlights that paragraph and not the whole step.
      for (const piece of String(t).split(/\r?\n/)) {
        if (piece.trim()) out.push(`    • ${piece.trim()}`)
      }
    }
    // A parameter's value can be multi-line — an Additional Route Step
    // Parameter carries its note text — so each line is its own diff line and
    // a change inside a long note highlights that line, not the whole step.
    for (const p of r.params) out.push(...paramLines(p))
  }
  return out
}

/**
 * One parameter as the lines the diff sees. The first carries the name, any
 * continuation is indented under it.
 *
 * Shared with routeLineSteps() so the two walks cannot drift: the gutter
 * reads the step number by line index, and a parameter that produced two
 * lines here must produce two entries there.
 */
function paramLines(p: { name: string; value: string }): string[] {
  const parts = String(p.value ?? '').split('\n')
  const head = `    ${p.name} = ${parts[0] ?? ''}`
  return [head, ...parts.slice(1).map(l => `        ${l}`)]
}

/** One BOM line as the text the diff highlights. */
export function bomLineText(b: CompareBomLine): string {
  const bits = [b.partNumber]
  if (b.description) bits.push(b.description)
  const qty = [b.qtyRequired && `qty ${b.qtyRequired}`, b.requiredPer && `per ${b.requiredPer}`,
    b.unit && b.unit].filter(Boolean).join(' · ')
  if (qty) bits.push(qty)
  bits.push(b.isManufactured ? '[M]' : '[P]')
  return bits.join('  |  ')
}

/** The BOM as lines, in BOM order. */
export function bomLines(card: CompareCard | null): string[] {
  if (!card) return []
  return card.bom.map(bomLineText)
}

/** Header fields, notes, comments, parameters, specs and units as lines. */
export function generalLines(card: CompareCard | null): string[] {
  if (!card) return []
  const out: string[] = []
  const field = (label: string, v: string) => { if (v) out.push(`${label}: ${v}`) }
  field('Description', card.description)
  field('Revision', card.revision)
  field('Catalog', card.catalogNumber)
  field('Product', [card.productCode, card.productName].filter(Boolean).join(' — '))
  field('BOM', [card.bomNumber, card.bomDescription].filter(Boolean).join(' — '))
  field('Route', [card.routeCode, card.routeName].filter(Boolean).join(' — '))

  const block = (title: string, lines: string[]) => {
    if (!lines.length) return
    out.push('')
    out.push(`── ${title} ──`)
    out.push(...lines)
  }
  block('Notes', card.notes.filter(Boolean))
  block('Comments', card.comments.filter(Boolean))
  block('Parameters', card.parameters.map(p => `${p.name} = ${p.value}`))
  block('Specifications', card.specs.map(p => `${p.name} = ${p.value}`))
  block('Units', card.units.map(u => `${u.code}${u.description ? ` (${u.description})` : ''} = ${u.value}`))
  return out
}

export function sectionLines(card: CompareCard | null, section: CompareSection): string[] {
  return section === 'route' ? routeLines(card)
    : section === 'bom' ? bomLines(card)
      : generalLines(card)
}

/**
 * Step numbers for the route pane gutter.
 *
 * routeLines() emits a header line per step followed by its detail lines, so
 * walking the same structure gives the step number each rendered line belongs
 * to. Returned separately because the numbers must not take part in the diff.
 */
export function routeLineSteps(card: CompareCard | null): (number | null)[] {
  if (!card) return []
  const out: (number | null)[] = []
  for (const r of card.route) {
    out.push(r.step)
    if (r.instructionCodes) out.push(null)
    for (const t of r.instructions) {
      for (const piece of String(t).split(/\r?\n/)) if (piece.trim()) out.push(null)
    }
    // One entry per line routeLines() emitted for this parameter.
    for (const p of r.params) for (const _ of paramLines(p)) out.push(null)
  }
  return out
}
