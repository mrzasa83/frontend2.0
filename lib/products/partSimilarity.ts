/**
 * "Like part name" matching, for pairing a gold standard's batch cards against
 * another part's cards level by level.
 *
 * APC manufactured part numbers read PREFIX-BASE-IDX1/IDX2:
 *
 *     C-75123-01/23
 *     │  │     │  └── second index
 *     │  │     └───── first index
 *     │  └─────────── base: the part's own five-digit number
 *     └────────────── prefix: what KIND of card this is
 *
 * Two cards are the same thing in two different products when:
 *
 *   prefix  must be identical. A C is never an S.
 *   base    is ignored outright. This is the number that identifies the part,
 *           so it is guaranteed to differ between two different products —
 *           C-75123-01/23 and C-76234-01/23 are the same card.
 *   idx1    for an ANCHORED prefix (C by default) must be the anchor value on
 *           both sides: a C card leads with 1 or it is not the card we mean.
 *           For every other prefix the first index carries real information
 *           (an S leads with 2 or something else) and is compared with a
 *           tolerance, because it drifts by an increment or two between
 *           products.
 *   idx2    always compared with a tolerance.
 *
 * The tolerances and the anchor are parameters rather than constants because
 * the rule above is a description of how part numbers are used in practice,
 * not something enforced by Paradigm — the UI exposes them so a wrong pairing
 * can be corrected without a deploy.
 */

export type ParsedPartName = {
  raw: string
  /** Leading letters, upper-cased. Empty when the name doesn't parse. */
  prefix: string
  /** The part's own number. Deliberately NOT used for matching. */
  base: number | null
  idx1: number | null
  idx2: number | null
  /** Anything after the indices, kept so it can be shown but not matched on. */
  tail: string
  /** False when the name doesn't fit the pattern at all. */
  parsed: boolean
}

export type MatchRules = {
  /** Max difference allowed on the first index, for unanchored prefixes. */
  idx1Tolerance: number
  /** Max difference allowed on the second index. */
  idx2Tolerance: number
  /**
   * Prefixes whose first index is fixed, and the value it is fixed to.
   * A C card must read 01 on both sides.
   */
  anchors: Record<string, number>
}

export const DEFAULT_MATCH_RULES: MatchRules = {
  idx1Tolerance: 2,
  idx2Tolerance: 2,
  anchors: { C: 1 },
}

/**
 * PREFIX-BASE-IDX1[/IDX2][tail]
 *
 * Separators are loose (a dash, a slash or a space) because the same part
 * number is punctuated inconsistently across Paradigm's tables. The second
 * index is optional: plenty of cards are PREFIX-BASE-NN with nothing after.
 */
const PART_RE = /^([A-Za-z]+)\s*[-_ ]\s*(\d+)\s*[-_ ]\s*(\d+)(?:\s*[/\-_ ]\s*(\d+))?(.*)$/

export function parsePartName(raw: string): ParsedPartName {
  const s = String(raw ?? '').trim()
  const m = PART_RE.exec(s)
  if (!m) {
    return { raw: s, prefix: '', base: null, idx1: null, idx2: null, tail: '', parsed: false }
  }
  return {
    raw: s,
    prefix: m[1].toUpperCase(),
    base: Number(m[2]),
    idx1: Number(m[3]),
    idx2: m[4] != null ? Number(m[4]) : null,
    tail: (m[5] || '').trim(),
    parsed: true,
  }
}

export type MatchVerdict = {
  match: boolean
  /** Lower is a better pair. 0 means the part numbers are identical. */
  distance: number
  /** Plain-language reason, shown in the UI so a pairing can be judged. */
  reason: string
}

const NO: (reason: string) => MatchVerdict = reason => ({ match: false, distance: Infinity, reason })

/**
 * Do these two part names denote the same card in two different products?
 */
export function matchPartNames(
  goldName: string,
  otherName: string,
  rules: MatchRules = DEFAULT_MATCH_RULES
): MatchVerdict {
  const a = parsePartName(goldName)
  const b = parsePartName(otherName)

  // Identical names match whatever the rules say — nothing is more alike than
  // the same number, and the same purchased material does appear in both.
  if (a.raw && a.raw.toUpperCase() === b.raw.toUpperCase()) {
    return { match: true, distance: 0, reason: 'identical part number' }
  }

  if (!a.parsed || !b.parsed) {
    return NO(`unrecognised part number format (${!a.parsed ? a.raw || '(blank)' : b.raw || '(blank)'})`)
  }
  if (a.prefix !== b.prefix) {
    return NO(`prefix ${a.prefix} ≠ ${b.prefix}`)
  }

  const anchor = rules.anchors[a.prefix]
  if (anchor != null) {
    if (a.idx1 !== anchor || b.idx1 !== anchor) {
      return NO(`${a.prefix} must lead with ${String(anchor).padStart(2, '0')} on both sides `
        + `(${fmtIdx(a.idx1)} vs ${fmtIdx(b.idx1)})`)
    }
  } else {
    const d1 = Math.abs((a.idx1 ?? 0) - (b.idx1 ?? 0))
    if (d1 > rules.idx1Tolerance) {
      return NO(`first index off by ${d1}, tolerance ${rules.idx1Tolerance} `
        + `(${fmtIdx(a.idx1)} vs ${fmtIdx(b.idx1)})`)
    }
  }

  // A name with a second index is not the same card as one without.
  if ((a.idx2 == null) !== (b.idx2 == null)) {
    return NO('one side has a second index and the other does not')
  }

  const d2 = a.idx2 == null ? 0 : Math.abs((a.idx2 as number) - (b.idx2 as number))
  if (d2 > rules.idx2Tolerance) {
    return NO(`second index off by ${d2}, tolerance ${rules.idx2Tolerance} `
      + `(${fmtIdx(a.idx2)} vs ${fmtIdx(b.idx2)})`)
  }

  const d1 = Math.abs((a.idx1 ?? 0) - (b.idx1 ?? 0))
  // Index distance dominates; the base breaks ties between two candidates that
  // are equally close on the indices, so the nearer part number wins rather
  // than whichever happened to be read first.
  const baseGap = Math.abs((a.base ?? 0) - (b.base ?? 0))
  const distance = d1 * 1000 + d2 * 10 + Math.min(baseGap, 9) / 10

  const bits: string[] = []
  if (anchor != null) bits.push(`${a.prefix} anchored at ${String(anchor).padStart(2, '0')}`)
  else bits.push(d1 ? `first index off by ${d1}` : 'first index equal')
  if (a.idx2 != null) bits.push(d2 ? `second index off by ${d2}` : 'second index equal')
  return { match: true, distance, reason: `${a.prefix} prefix, ${bits.join(', ')}` }
}

const fmtIdx = (n: number | null) => n == null ? '—' : String(n).padStart(2, '0')

/* ───────────────────────── level-for-level pairing ───────────────────────── */

export type PairableCard = {
  /** Stable key within its own side. */
  key: string
  level: number
  partNumber: string
}

export type CardPair<L extends PairableCard, R extends PairableCard> = {
  level: number
  gold: L | null
  other: R | null
  /** Set on a real pair; null for an unmatched card. */
  verdict: MatchVerdict | null
}

/**
 * Pairs two card sets level for level.
 *
 * Level 0 is the product itself. Its two cards are paired unconditionally:
 * they are two different customer parts by definition, so their numbers are
 * SUPPOSED to differ and running the name rules over them would reject the
 * one pairing we are certain about.
 *
 * Below that, pairing is greedy on the best available match: every eligible
 * pair is scored, the closest is taken, both cards are consumed, repeat. A
 * card can therefore be left unmatched on either side, which is itself a
 * finding — a layer present in one product and not the other is exactly what
 * a comparison is for, so unmatched cards are returned rather than dropped.
 */
export function pairCardsByLevel<L extends PairableCard, R extends PairableCard>(
  goldCards: L[],
  otherCards: R[],
  rules: MatchRules = DEFAULT_MATCH_RULES
): CardPair<L, R>[] {
  const levels = Array.from(new Set([
    ...goldCards.map(c => c.level),
    ...otherCards.map(c => c.level),
  ])).sort((a, b) => a - b)

  const out: CardPair<L, R>[] = []

  for (const level of levels) {
    const left = goldCards.filter(c => c.level === level)
    const right = otherCards.filter(c => c.level === level)

    if (level === 0 && left.length === 1 && right.length === 1) {
      out.push({
        level,
        gold: left[0],
        other: right[0],
        verdict: { match: true, distance: 0, reason: 'the product itself' },
      })
      continue
    }

    type Cand = { l: L; r: R; v: MatchVerdict }
    const cands: Cand[] = []
    for (const l of left) {
      for (const r of right) {
        const v = matchPartNames(l.partNumber, r.partNumber, rules)
        if (v.match) cands.push({ l, r, v })
      }
    }
    cands.sort((x, y) => x.v.distance - y.v.distance
      || x.l.partNumber.localeCompare(y.l.partNumber))

    const usedL = new Set<string>()
    const usedR = new Set<string>()
    const pairs: CardPair<L, R>[] = []
    for (const c of cands) {
      if (usedL.has(c.l.key) || usedR.has(c.r.key)) continue
      usedL.add(c.l.key); usedR.add(c.r.key)
      pairs.push({ level, gold: c.l, other: c.r, verdict: c.v })
    }
    for (const l of left) {
      if (!usedL.has(l.key)) pairs.push({ level, gold: l, other: null, verdict: null })
    }
    for (const r of right) {
      if (!usedR.has(r.key)) pairs.push({ level, gold: null, other: r, verdict: null })
    }

    // Matched pairs first, then what only one side has — reading order that
    // puts the comparison before the exceptions.
    pairs.sort((a, b) => {
      const rank = (p: CardPair<L, R>) => (p.gold && p.other) ? 0 : p.gold ? 1 : 2
      return rank(a) - rank(b)
        || String(a.gold?.partNumber || a.other?.partNumber)
             .localeCompare(String(b.gold?.partNumber || b.other?.partNumber))
    })
    out.push(...pairs)
  }

  return out
}
