/**
 * Reading panel size (and the rest) out of material names.
 *
 * Board material carries its spec in the part number, and has for decades:
 *
 *     TEA0030R1R12418     TE A  .0030  R1R1   24 x 18
 *     LBA0020HHHH2824     LB A  .0020  HHHH   28 x 24
 *     YSB0080TC25HRH2418  YS B  .0080  TC25HRH 24 x 18
 *     AL0100CU1OZ1925     AL    .0100  CU1OZ  19 x 25
 *     FCCU4KUT.HOZ18H24H  copper foil        18.5 x 24.5
 *
 * The shape is: letters, a four-digit thickness in ten-thousandths of an inch,
 * a copper-weight code, then the panel size as two two-digit numbers. A
 * trailing H on a dimension means a half inch — 18H24H is 18.5 x 24.5, which
 * is why the size runs four to six characters rather than always four.
 *
 * The description carries the same size independently ("28GRX24"), so both are
 * parsed and compared. Agreement is the confidence signal; disagreement is the
 * naming drift worth looking at, and is reported rather than resolved.
 *
 * Nothing here decides what IS a board material — that is a separate question,
 * and these functions deliberately answer only "does this name carry a panel
 * size". Hardware, chemicals and tooling simply fail to parse.
 */

export type PanelSize = { grain: number; cross: number }

export type MaterialName = {
  /** Leading letters: the material/brand code, e.g. TE, MYA, ASVA. */
  code: string
  /** Thickness in inches, from the four-digit group. */
  thicknessIn: number | null
  /** Copper-weight code between thickness and size, e.g. R1R1, TC25HRH. */
  copper: string
  size: PanelSize | null
}

/**
 * Panels run roughly 12" to 54". The bound is what stops a thickness, a
 * catalogue number or a date that happens to end in digits from being read as
 * a panel — it is the only thing separating a size from any other number.
 */
const MIN_DIM = 10
const MAX_DIM = 60

const inRange = (n: number) => n >= MIN_DIM && n <= MAX_DIM

/** Two 2-digit dimensions at the end, each optionally H for +0.5". */
const PN_TAIL = /(\d{2})(H?)(\d{2})(H?)$/

/**
 * Letters then a zero-padded counter: HDW0000011063, CSM0000005512,
 * PCK8010000001. These are sequence numbers, and their last four digits are
 * not a size — CSM0000005512 otherwise reads as a 55 x 12 panel, across 3,353
 * hardware parts. A spec number never pads with four zeros straight after its
 * letters; the first digit group is a thickness (ALFLT0200..., EB0025...).
 */
const SERIAL = /^[A-Z_]+0{4,}\d*$/

/** <letters><4-digit thickness><copper><size>, the laminate/prepreg grammar. */
const FULL = /^([A-Z]{2,8})(\d{4})([A-Z0-9]*?)(\d{2})(H?)(\d{2})(H?)$/

/** Size from the tail of a part number, whatever precedes it. */
export function sizeFromPartNumber(pn: string): PanelSize | null {
  const s = String(pn ?? '').trim().toUpperCase()
  if (SERIAL.test(s)) return null
  const m = PN_TAIL.exec(s)
  if (!m) return null
  const grain = Number(m[1]) + (m[2] ? 0.5 : 0)
  const cross = Number(m[3]) + (m[4] ? 0.5 : 0)
  return inRange(grain) && inRange(cross) ? { grain, cross } : null
}

/** The full grammar: code, thickness, copper and size. Null if it doesn't fit. */
export function parseMaterialName(pn: string): MaterialName | null {
  const s = String(pn ?? '').trim().toUpperCase()
  const m = FULL.exec(s)
  if (m) {
    const grain = Number(m[4]) + (m[5] ? 0.5 : 0)
    const cross = Number(m[6]) + (m[7] ? 0.5 : 0)
    if (inRange(grain) && inRange(cross)) {
      return {
        code: m[1],
        thicknessIn: Number(m[2]) / 10000,
        copper: m[3] || '',
        size: { grain, cross },
      }
    }
  }
  // Didn't fit the grammar, but may still end in a size — the copper-foil
  // numbers (FCCU4KUT.HOZ18H24H) carry punctuation and no thickness group.
  const size = sizeFromPartNumber(s)
  if (!size) return null
  return { code: (s.match(/^[A-Z]+/) || [''])[0], thicknessIn: null, copper: '', size }
}

/** "28GRX24", "24GX36", "19X25", "18HX24H". */
const DESC_SIZE = /(\d{1,3}(?:\.\d+)?)\s*(H?)\s*(GR|G|R)?\s*X\s*(\d{1,3}(?:\.\d+)?)\s*(H?)/gi

export function sizeFromDescription(desc: string): PanelSize | null {
  const s = String(desc ?? '').trim().toUpperCase()
  // Every candidate, not the first: "DS-7409DV 1-1035 .0020 X2X1 24GRX36"
  // matches "020 X2" long before it reaches the real callout, and stopping
  // there loses the size altogether.
  let best: { grain: number; cross: number; score: number } | null = null
  for (const m of s.matchAll(DESC_SIZE)) {
    const grain = Number(m[1]) + (m[2] ? 0.5 : 0)
    const cross = Number(m[4]) + (m[5] ? 0.5 : 0)
    if (!isFinite(grain) || !isFinite(cross)) continue
    if (!inRange(grain) || !inRange(cross)) continue
    // An explicit grain marker is the real panel callout; a bare 19X25 counts
    // but loses to one when both appear.
    const score = m[3] ? 2 : 1
    if (!best || score > best.score) best = { grain, cross, score }
  }
  return best ? { grain: best.grain, cross: best.cross } : null
}

export const formatSize = (s: PanelSize | null): string =>
  s ? `${s.grain} x ${s.cross}` : ''

export type SizeVerdict = {
  fromPart: PanelSize | null
  fromDesc: PanelSize | null
  /** The size to use: the part number's, falling back to the description's. */
  size: PanelSize | null
  /** 'agree' | 'part-only' | 'desc-only' | 'conflict' | 'none' */
  confidence: 'agree' | 'part-only' | 'desc-only' | 'conflict' | 'none'
}

/**
 * Both readings, and whether they match.
 *
 * The part number wins a conflict, because it is the thing people search and
 * order by — but the conflict is reported, since a description that disagrees
 * with its own part number is a data-quality finding, not noise to swallow.
 */
export function panelSizeOf(pn: string, desc: string): SizeVerdict {
  const fromPart = sizeFromPartNumber(pn)
  const fromDesc = sizeFromDescription(desc)
  let confidence: SizeVerdict['confidence'] = 'none'
  if (fromPart && fromDesc) {
    confidence = (fromPart.grain === fromDesc.grain && fromPart.cross === fromDesc.cross)
      ? 'agree' : 'conflict'
  } else if (fromPart) confidence = 'part-only'
  else if (fromDesc) confidence = 'desc-only'
  return { fromPart, fromDesc, size: fromPart || fromDesc, confidence }
}
