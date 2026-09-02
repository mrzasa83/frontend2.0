// Transformation helpers for building the MDI XML from the various data sources.
// Kept pure + unit-testable; the API route wires the data sources to these.

export const FILM_TYPES = [
  'LDI 7330',
  'LDI 7262',
  'FX 930',
  'PSR-4000 BN',
  'PSR-4000 BN DI',
  'PSR-4000 BN DI Blue',
] as const

/**
 * Copper thickness parse.
 *
 * Source: Paradigm DATA0045.PROD_SPEC_01, a string shaped like "LD HH/HH"
 * (e.g. "LD HH/1H", "LD 2T/34"). We care only about the SECOND character of
 * each group — the group before "/" is the top layer, after "/" the bottom.
 * Mapping for that char: H = 1/2 (0.5), T = 3/8 (0.375), any digit = itself.
 *
 * Returns { top, bottom } as strings (matching the XML sample, which uses
 * values like "0.67", "1", "2", "3.5"). Unparseable input yields ''.
 */
export function parseCuThickness(prodSpec: string | null | undefined): { top: string; bottom: string } {
  const empty = { top: '', bottom: '' }
  if (!prodSpec) return empty

  // Find the "HH/HH" portion: two groups separated by a slash. Grab the last
  // whitespace-delimited token that contains a slash, to tolerate the "LD "
  // prefix (and any other leading tokens).
  const token = prodSpec.trim().split(/\s+/).find(t => t.includes('/'))
  if (!token) return empty

  const [topGroup, bottomGroup] = token.split('/')
  return {
    top: cuCharToValue(secondChar(topGroup)),
    bottom: cuCharToValue(secondChar(bottomGroup)),
  }
}

function secondChar(group: string | undefined): string {
  if (!group) return ''
  // The 2nd character of the group (e.g. "HH" -> "H", "1H" -> "H", "34" -> "4").
  return group.length >= 2 ? group.charAt(1) : group.charAt(0)
}

function cuCharToValue(ch: string): string {
  if (!ch) return ''
  const c = ch.toUpperCase()
  if (c === 'H') return '0.5'
  if (c === 'T') return '0.375'
  if (/[0-9]/.test(c)) return c
  return ''
}

/**
 * Panel type from the part number prefix:
 *   L- -> Layer ; S- or C- -> Comp/Sub. Anything else defaults to Layer.
 */
export function panelTypeFromPart(partNumber: string | null | undefined): 'Layer' | 'Comp/Sub' {
  const p = (partNumber || '').trim().toUpperCase()
  if (p.startsWith('S-') || p.startsWith('C-')) return 'Comp/Sub'
  return 'Layer'
}

/**
 * Serialization from a route parameter value: "Yes" (case-insensitive) -> Yes,
 * anything else -> No.
 */
export function serializationFromParam(value: string | null | undefined): 'Yes' | 'No' {
  return (value || '').trim().toLowerCase() === 'yes' ? 'Yes' : 'No'
}

/** Ensure a layer name carries the .gbr extension exactly once. */
export function toGbr(layerName: string | null | undefined): string {
  const n = (layerName || '').trim()
  if (!n) return ''
  return n.toLowerCase().endsWith('.gbr') ? n : `${n}.gbr`
}

// ---- XML shape ----------------------------------------------------------

export interface MdiLayer {
  file_name: string
  fiducial_type: string
  polarity: string
  cu_thickness: string
  serialization: string
}

export interface MdiWorkOrder {
  wo: string
  job_num: string
  film_type: string
  panel_type: string
  reg_type: string
  panel_thickness?: string
  panel_count?: string
  top_layer: MdiLayer
  bottom_layer: MdiLayer
}

function esc(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function layerXml(tag: string, l: MdiLayer): string {
  return [
    `        <${tag}>`,
    `            <file_name>${esc(l.file_name)}</file_name>`,
    `            <fiducial_type>${esc(l.fiducial_type)}</fiducial_type>`,
    `            <polarity>${esc(l.polarity)}</polarity>`,
    `            <cu_thickness>${esc(l.cu_thickness)}</cu_thickness>`,
    `            <serialization>${esc(l.serialization)}</serialization>`,
    `        </${tag}>`,
  ].join('\r\n')
}

/** Render the full <work_orders> document from a list of work orders. */
export function buildMdiXml(workOrders: MdiWorkOrder[]): string {
  const body = workOrders.map(wo => {
    const lines = [
      `    <work_order wo='${esc(wo.wo)}'>`,
      `        <job_num>${esc(wo.job_num)}</job_num>`,
      `        <film_type>${esc(wo.film_type)}</film_type>`,
      `        <panel_type>${esc(wo.panel_type)}</panel_type>`,
      `        <reg_type>${esc(wo.reg_type)}</reg_type>`,
    ]
    if (wo.panel_thickness) lines.push(`        <panel_thickness>${esc(wo.panel_thickness)}</panel_thickness>`)
    if (wo.panel_count) lines.push(`        <panel_count>${esc(wo.panel_count)}</panel_count>`)
    lines.push(layerXml('top_layer', wo.top_layer))
    lines.push(layerXml('bottom_layer', wo.bottom_layer))
    lines.push(`    </work_order>`)
    return lines.join('\r\n')
  }).join('\r\n\r\n')

  return `<?xml version="1.0" encoding="utf-8"?>\r\n<work_orders>\r\n${body}\r\n</work_orders>\r\n`
}
