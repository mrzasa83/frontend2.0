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
  /**
   * How the bit after the base reads:
   *   'numeric'  L-76443-01/00, C-75123-01/23  → idx1 / idx2
   *   'suffix'   P-76443-UPA1, P-76443-UPC2    → suffixGroup / suffixNum
   *   'none'     didn't parse at all
   */
  form: 'numeric' | 'suffix' | 'none'
  idx1: number | null
  idx2: number | null
  /** The letter run of a suffix part: UPA, UPB, UPC. */
  suffixGroup: string
  /** The number after it: UPA1 -> 1. Null when there is none. */
  suffixNum: number | null
  /** Anything left over, kept so it can be shown but not matched on. */
  tail: string
  /** False when the name doesn't fit either pattern. */
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
  /**
   * Suffix parts: must the letter run be identical? UPA is adhesive and UPC is
   * coverlay, so by default an adhesive never pairs with a coverlay.
   */
  suffixGroupMustMatch: boolean
  /** Max difference on the suffix number. 0 means UPA1 pairs only with UPA1. */
  suffixNumTolerance: number
  /**
   * Pair whatever the name rules left over by DESCRIPTION instead, above this
   * similarity. Purchased lines carry opaque numbers (HDW0000010823 against
   * HDW0000010586) that no naming rule can relate, but their descriptions —
   * both "LABEL B33-…" — say plainly that they fill the same role.
   * Set to 0 to switch the fallback off.
   */
  descriptionFallback: number
}

export const DEFAULT_MATCH_RULES: MatchRules = {
  idx1Tolerance: 2,
  idx2Tolerance: 2,
  anchors: { C: 1 },
  suffixGroupMustMatch: true,
  suffixNumTolerance: 0,
  descriptionFallback: 0.5,
}

/**
 * PREFIX-BASE-REST. The separators are loose (a dash, an underscore or a
 * space) because the same number is punctuated inconsistently across
 * Paradigm's tables.
 */
const PART_RE = /^([A-Za-z]+)\s*[-_ ]\s*(\d+)\s*[-_ ]\s*(.+)$/
/** REST as two numbers: 01/00, 02/03, or a bare 01. */
const NUMERIC_REST_RE = /^(\d+)(?:\s*[/\-_ ]\s*(\d+))?(.*)$/
/** REST as a letter run and a number: UPA1, UPC2, UPB. */
const SUFFIX_REST_RE = /^([A-Za-z]+)\s*(\d*)(.*)$/

const EMPTY: Omit<ParsedPartName, 'raw'> = {
  prefix: '', base: null, form: 'none', idx1: null, idx2: null,
  suffixGroup: '', suffixNum: null, tail: '', parsed: false,
}

export function parsePartName(raw: string): ParsedPartName {
  const s = String(raw ?? '').trim()
  const m = PART_RE.exec(s)
  if (!m) return { raw: s, ...EMPTY }

  const prefix = m[1].toUpperCase()
  const base = Number(m[2])
  const rest = m[3].trim()

  const num = NUMERIC_REST_RE.exec(rest)
  if (num) {
    return {
      raw: s, prefix, base, form: 'numeric',
      idx1: Number(num[1]),
      idx2: num[2] != null ? Number(num[2]) : null,
      suffixGroup: '', suffixNum: null,
      tail: (num[3] || '').trim(), parsed: true,
    }
  }

  const suf = SUFFIX_REST_RE.exec(rest)
  if (suf) {
    return {
      raw: s, prefix, base, form: 'suffix',
      idx1: null, idx2: null,
      suffixGroup: suf[1].toUpperCase(),
      suffixNum: suf[2] ? Number(suf[2]) : null,
      tail: (suf[3] || '').trim(), parsed: true,
    }
  }

  return { raw: s, ...EMPTY }
}

/**
 * The part number with its own base number masked out: L-76443-01/00 and
 * L-76237-01/00 both become L-#####-01/00.
 *
 * The base is the one field guaranteed to differ between two products, so a
 * diff that reads the raw number reports every paired line as changed and
 * buries the lines that changed for a real reason. Masking it is the same
 * decision the matcher makes when it ignores the base — applied to the text
 * instead of to the pairing. A name that doesn't parse is returned untouched.
 */
export function canonicalPartName(raw: string): string {
  const p = parsePartName(raw)
  if (!p.parsed) return String(raw ?? '').trim()
  const rest = p.form === 'suffix'
    ? `${p.suffixGroup}${p.suffixNum ?? ''}`
    : `${String(p.idx1).padStart(2, '0')}${p.idx2 != null ? `/${String(p.idx2).padStart(2, '0')}` : ''}`
  return `${p.prefix}-#####-${rest}${p.tail ? ` ${p.tail}` : ''}`
}

/**
 * The name a card should be MATCHED on.
 *
 * A level-0 card is a DATA0050 row, so its part number is the APC number
 * (76443) and carries no prefix at all. The C-/B- number for the same thing is
 * on its BOM part (DATA0017.INV_PART_NUMBER, captured as bomNumber), so when
 * the part number doesn't parse the BOM part is tried instead.
 */
export function matchNameOf(card: { partNumber?: string; bomNumber?: string } | null): string {
  if (!card) return ''
  const pn = String(card.partNumber || '').trim()
  if (parsePartName(pn).parsed) return pn
  const bn = String(card.bomNumber || '').trim()
  if (bn && parsePartName(bn).parsed) return bn
  return pn
}

export type MatchVerdict = {
  match: boolean
  /** Lower is a better pair. 0 means the part numbers are identical. */
  distance: number
  /** Plain-language reason, shown in the UI so a pairing can be judged. */
  reason: string
  /**
   * Set when a pair was accepted but something about it should be looked at —
   * at present, a level-0 pair whose BOM parts don't correspond. The pair is
   * still shown, because the comparison is what was asked for; the warning
   * says not to read a clean result as agreement.
   */
  warn?: string
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
  // C to C, S to S, B to B, L to L, P to P. Never across.
  if (a.prefix !== b.prefix) {
    return NO(`prefix ${a.prefix} ≠ ${b.prefix}`)
  }
  if (a.form !== b.form) {
    return NO(`${a.raw} and ${b.raw} are numbered differently`)
  }

  if (a.form === 'suffix') return matchSuffixForm(a, b, rules)

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

/**
 * P-76443-UPA1 against P-76237-UPA1.
 *
 * The letter run is the material's role — UPA adhesive, UPC coverlay — so by
 * default it must be identical: pairing an adhesive with a coverlay would
 * report a difference in every line of both. The number is the instance, and
 * defaults to exact so UPA1 pairs with UPA1 and a second adhesive the other
 * product doesn't have stays visibly unmatched rather than quietly standing in
 * for the first.
 */
function matchSuffixForm(a: ParsedPartName, b: ParsedPartName, rules: MatchRules): MatchVerdict {
  if (rules.suffixGroupMustMatch && a.suffixGroup !== b.suffixGroup) {
    return NO(`${a.suffixGroup} ≠ ${b.suffixGroup}`)
  }
  if ((a.suffixNum == null) !== (b.suffixNum == null)) {
    return NO('one side is numbered and the other is not')
  }
  const dn = a.suffixNum == null ? 0 : Math.abs((a.suffixNum as number) - (b.suffixNum as number))
  if (dn > rules.suffixNumTolerance) {
    return NO(`${a.suffixGroup}${a.suffixNum} vs ${b.suffixGroup}${b.suffixNum}`
      + `, tolerance ${rules.suffixNumTolerance}`)
  }

  const groupGap = a.suffixGroup === b.suffixGroup ? 0 : 1
  const baseGap = Math.abs((a.base ?? 0) - (b.base ?? 0))
  const distance = groupGap * 1000 + dn * 10 + Math.min(baseGap, 9) / 10

  const bits = [`${a.prefix} prefix`]
  bits.push(groupGap ? `${a.suffixGroup} vs ${b.suffixGroup}` : `${a.suffixGroup} on both`)
  if (a.suffixNum != null) bits.push(dn ? `number off by ${dn}` : 'same number')
  return { match: true, distance, reason: bits.join(', ') }
}

const fmtIdx = (n: number | null) => n == null ? '—' : String(n).padStart(2, '0')

/* ───────────────────── description fallback ───────────────────── */

/**
 * Dice coefficient over word bags. Used only to relate lines whose NUMBERS
 * cannot be related — a purchased label on one product against the purchased
 * label on the other.
 */
export function describeSimilarity(a: string, b: string): number {
  const tok = (s: string) => String(s || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean)
  const wa = tok(a), wb = tok(b)
  if (!wa.length || !wb.length) return 0
  const bag = new Map<string, number>()
  for (const t of wa) bag.set(t, (bag.get(t) || 0) + 1)
  let hit = 0
  for (const t of wb) {
    const c = bag.get(t) || 0
    if (c > 0) { bag.set(t, c - 1); hit++ }
  }
  return (2 * hit) / (wa.length + wb.length)
}

/* ───────────────────────── level-for-level pairing ───────────────────────── */

export type PairableCard = {
  /** Stable key within its own side. */
  key: string
  level: number
  partNumber: string
  /** The C-/B- number for a DATA0050 card, when the part number has none. */
  bomNumber?: string
}

export type CardPair<L extends PairableCard, R extends PairableCard> = {
  level: number
  gold: L | null
  other: R | null
  /** Set on a real pair; null for an unmatched card. */
  verdict: MatchVerdict | null
}

/* ──────────────────────── generic name pairing ──────────────────────── */

export type NamePair<T> = {
  gold: T | null
  other: T | null
  verdict: MatchVerdict | null
}

/**
 * Pairs two lists on their part names, best match first, then falls back to
 * description similarity for whatever is left.
 *
 * Used for BOM lines as well as cards, which is the point: a BOM diffed as
 * plain text lines up line 2 against line 2, so one missing layer shifts
 * everything below it and reports the whole list as changed. Pairing by name
 * first means L-…-01/00 meets L-…-01/00 wherever each sits, and the layer that
 * genuinely has no counterpart is the only thing flagged.
 */
export function pairByName<T>(
  gold: T[],
  other: T[],
  rules: MatchRules,
  nameOf: (x: T) => string,
  describeOf?: (x: T) => string
): NamePair<T>[] {
  type Cand = { li: number; ri: number; v: MatchVerdict }
  const cands: Cand[] = []
  for (let li = 0; li < gold.length; li++) {
    for (let ri = 0; ri < other.length; ri++) {
      const v = matchPartNames(nameOf(gold[li]), nameOf(other[ri]), rules)
      if (v.match) cands.push({ li, ri, v })
    }
  }
  cands.sort((x, y) => x.v.distance - y.v.distance || x.li - y.li || x.ri - y.ri)

  const usedL = new Set<number>()
  const usedR = new Set<number>()
  const taken: { li: number; ri: number; v: MatchVerdict }[] = []
  for (const c of cands) {
    if (usedL.has(c.li) || usedR.has(c.ri)) continue
    usedL.add(c.li); usedR.add(c.ri)
    taken.push(c)
  }

  // Second pass over the leftovers, on description.
  if (describeOf && rules.descriptionFallback > 0) {
    const restL = gold.map((_, i) => i).filter(i => !usedL.has(i))
    const restR = other.map((_, i) => i).filter(i => !usedR.has(i))
    const fb: Cand[] = []
    for (const li of restL) {
      for (const ri of restR) {
        const sim = describeSimilarity(describeOf(gold[li]), describeOf(other[ri]))
        if (sim >= rules.descriptionFallback) {
          fb.push({ li, ri, v: {
            match: true,
            distance: 1e6 + (1 - sim),
            reason: `matched on description (${Math.round(sim * 100)}% alike)`,
          } })
        }
      }
    }
    fb.sort((x, y) => x.v.distance - y.v.distance || x.li - y.li)
    for (const c of fb) {
      if (usedL.has(c.li) || usedR.has(c.ri)) continue
      usedL.add(c.li); usedR.add(c.ri)
      taken.push(c)
    }
  }

  // Emit in gold order, with each unmatched right-hand entry placed after the
  // last pair that precedes it, so the two columns stay readable.
  const byL = new Map<number, Cand>()
  for (const c of taken) byL.set(c.li, c)

  const out: NamePair<T>[] = []
  const emittedR = new Set<number>()
  for (let li = 0; li < gold.length; li++) {
    const c = byL.get(li)
    if (c) { out.push({ gold: gold[li], other: other[c.ri], verdict: c.v }); emittedR.add(c.ri) }
    else out.push({ gold: gold[li], other: null, verdict: null })
  }
  for (let ri = 0; ri < other.length; ri++) {
    if (!emittedR.has(ri)) out.push({ gold: null, other: other[ri], verdict: null })
  }
  return out
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
/**
 * The level-0 pair, which is always made but not always clean.
 *
 * The two products ARE the thing being compared, so their cards pair whatever
 * their numbers say — rejecting the one pairing we are certain about would
 * leave nothing to compare. But the APC number (76443) carries no prefix, and
 * the number that says what KIND of assembly this is lives on the card's BOM
 * part: DATA0050.BOM_PTR -> DATA0025 -> DATA0017.INV_PART_NUMBER, captured as
 * bomNumber. Two products that are really alike show the same C-#####-01/NN
 * there.
 *
 * So the pair is made and the BOM parts are checked separately. A mismatch is
 * reported rather than silently accepted: comparing a C-01 assembly against a
 * B-01 assembly can still produce a tidy-looking diff, and that tidiness would
 * be misleading.
 */
function verdictForRoot(
  left: PairableCard, right: PairableCard, rules: MatchRules
): MatchVerdict {
  const lb = String(left.bomNumber || '').trim()
  const rb = String(right.bomNumber || '').trim()
  const base: MatchVerdict = { match: true, distance: 0, reason: 'the product itself' }

  if (!lb && !rb) return { ...base, warn: 'neither card has a BOM part captured' }
  if (!lb) return { ...base, warn: `no BOM part on the standard (compared has ${rb})` }
  if (!rb) return { ...base, warn: `no BOM part on the compared part (standard has ${lb})` }

  const v = matchPartNames(lb, rb, rules)
  if (v.match) {
    return { ...base, reason: `the product itself · BOM part ${lb} ↔ ${rb} (${v.reason})` }
  }
  return { ...base, warn: `BOM parts do not correspond: ${lb} vs ${rb} — ${v.reason}` }
}

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
        verdict: verdictForRoot(left[0], right[0], rules),
      })
      continue
    }

    type Cand = { l: L; r: R; v: MatchVerdict }
    const cands: Cand[] = []
    for (const l of left) {
      for (const r of right) {
        // matchNameOf, not partNumber: a DATA0050 card is numbered 76443 and
        // only its BOM part carries the C-/B- number to match on.
        const v = matchPartNames(matchNameOf(l), matchNameOf(r), rules)
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
