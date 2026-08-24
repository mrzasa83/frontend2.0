/**
 * Customer PO (received / sales order) filename parsing.
 *
 * Archive layout:  S:\Quality\QCDept\PO\<Customer>\[<SubGroup>\]<file>.pdf
 *
 * Filename shape:
 *   <APC part> [<APC part> ...] <customer PO number>[<rev>] [revised]
 *
 *   - One or more leading APC part numbers, each EXACTLY 5 digits, space
 *     separated. Each becomes its own row, since one PO can cover several parts.
 *   - A longer number follows: the customer's PO number.
 *   - An optional revision, written as a letter glued to the PO number
 *     ("3504841992E"), an underscore and a value ("..._9"), or a REV keyword
 *     ("..._REV 8").
 *   - "revised" anywhere in the name marks it V1; everything else is V0.
 *
 * Leading tokens that are NOT exactly 5 digits disqualify the file — a 6-digit
 * leading number is legacy (pre-2019) and deliberately excluded.
 *
 * Examples:
 *   019541 3503116793_1.pdf          -> excluded (6-digit leading token)
 *   25501 3504841992E revised.pdf    -> 25501        | PO 3504841992 | Rev E | V1
 *   30117 3503032413.pdf             -> 30117        | PO 3503032413 | Rev - | V0
 *   30844 30845 3506869069_9.pdf     -> 30844, 30845 | PO 3506869069 | Rev 9 | V0
 *   30844 30845 3506869069_REV 8.pdf -> 30844, 30845 | PO 3506869069 | Rev 8 | V0
 */

export type ParsedCustomerPo = {
  apcParts: string[]     // one row per part
  poNumber: string       // the customer's PO number
  rev: string            // '' when none
  revRank: number | null // numeric ordering: digits as-is, letters A=1, B=2 …
  version: string        // 'V0' or 'V1' ("revised")
  parsed: boolean
  reason: string         // why it was skipped, when parsed is false
}

const APC_PART_RE = /^\d{5}$/
const REVISED_RE = /\brevised\b/i

/** Rank a revision so "latest" can be ordered: 9 > 8, E > D. */
export function revRankOf(rev: string): number | null {
  const r = String(rev ?? '').trim()
  if (!r) return null
  if (/^\d+$/.test(r)) return parseInt(r, 10)
  const c = r.toUpperCase().charCodeAt(0)
  return c >= 65 && c <= 90 ? c - 64 : null
}

export function parseCustomerPoFilename(nameOrBase: string): ParsedCustomerPo {
  const empty = (reason: string): ParsedCustomerPo => ({
    apcParts: [], poNumber: '', rev: '', revRank: null, version: 'V0', parsed: false, reason,
  })

  const base = String(nameOrBase ?? '').replace(/\.pdf$/i, '').trim()
  if (!base) return empty('empty name')

  const tokens = base.split(/\s+/)
  if (!tokens.length) return empty('empty name')

  // Leading APC part numbers — exactly five digits each.
  const apcParts: string[] = []
  let i = 0
  while (i < tokens.length && APC_PART_RE.test(tokens[i])) { apcParts.push(tokens[i]); i++ }

  if (!apcParts.length) {
    // Distinguish the legacy 6-digit case so the indexer can report it.
    return /^\d{6,}$/.test(tokens[0])
      ? empty(`leading token ${tokens[0]} is not a 5-digit APC part (legacy)`)
      : empty('no leading 5-digit APC part number')
  }

  let rest = tokens.slice(i).join(' ').trim()

  // "revised" marks a second issue of the same PO+rev.
  const version = REVISED_RE.test(rest) ? 'V1' : 'V0'
  rest = rest.replace(REVISED_RE, ' ').replace(/\s{2,}/g, ' ').trim()

  // The customer PO number: the first run of 6+ digits.
  const poMatch = rest.match(/\d{6,}/)
  if (!poMatch) return empty('no customer PO number found')
  const poNumber = poMatch[0]

  // Whatever follows the PO number carries the revision.
  const after = rest.slice((poMatch.index ?? 0) + poNumber.length)
  let rev = ''
  const revKeyword = after.match(/^\s*[_\-]?\s*rev\.?\s*([A-Za-z0-9]{1,4})\b/i)
  const revGlued = after.match(/^([A-Za-z])\b/)
  const revSep = after.match(/^\s*[_\-]\s*([A-Za-z0-9]{1,4})\b/)
  if (revKeyword) rev = revKeyword[1]
  else if (revGlued) rev = revGlued[1]
  else if (revSep) rev = revSep[1]

  rev = rev.toUpperCase()

  return {
    apcParts, poNumber, rev, revRank: revRankOf(rev), version,
    parsed: true, reason: '',
  }
}
