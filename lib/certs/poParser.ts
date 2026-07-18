/**
 * PO Certificate filename parsing.
 *
 * Files live under  S:\Quality\QCDept\PO\<Customer Folder>\...\<file>.pdf
 * Filename convention (loose — real-world data is messy):
 *
 *     <5dig> [<5dig> ...] <customerPartNumber> [<version tokens>].pdf
 *
 *   - A leading run of 5-digit tokens are APC customer part numbers. When more
 *     than one is present the PO covered several parts; each becomes its own row.
 *     These 5-digit numbers are the same identifier used on the FAI record.
 *   - The token(s) after the APC parts, up to the first version marker, are the
 *     customer's own part / PO number (reference only for us).
 *   - Optional trailing version markers indicate revisions:
 *         -Version00003 | -Original | COn | CNn | "Version n" | "Rev X"
 *     We rank these so the UI can show only the latest.
 *
 * Validated against the live PO listing: of ~46k PDFs, ~30k lead with a 5-digit
 * APC part number; ~6.4k carry a recognizable version token.
 */

// PO root under the S: drive mount. Overridable via env.
export const PO_ROOT = () =>
  process.env.PO_CERT_ROOT ||
  `${process.env.DRIVE_MOUNT_S || '/mnt/sdrive'}/Quality/QCDept/PO`

export type ParsedPoFile = {
  apcParts: string[]      // leading 5-digit APC part numbers (>=0)
  customerPart: string    // customer part / PO number (reference)
  version: string         // raw version label, '' when none
  versionRank: number | null // numeric rank for "latest" (higher = newer; Original = 0)
  parsed: boolean         // true when at least one leading 5-digit part was found
}

// Version markers, in priority order. First match on the remainder wins.
const VERSION_PATTERNS: { re: RegExp; rank: (m: RegExpMatchArray) => number }[] = [
  { re: /-?\s*Version\s*0*(\d+)/i, rank: m => parseInt(m[1], 10) },
  { re: /-\s*Original\b/i,          rank: () => 0 },
  { re: /\bCO\s*0*(\d+)\b/i,        rank: m => parseInt(m[1], 10) },
  { re: /\bCN\s*0*(\d+)\b/i,        rank: m => parseInt(m[1], 10) },
  { re: /\bRev\.?\s+([A-Za-z0-9]{1,3})\b/i, rank: m => {
      const v = m[1]
      return /^\d+$/.test(v) ? parseInt(v, 10) : (v.toUpperCase().charCodeAt(0) - 64)
    } },
]

function detectVersion(rest: string): { label: string; rank: number; index: number } | null {
  for (const p of VERSION_PATTERNS) {
    const m = rest.match(p.re)
    if (m && m.index != null) {
      return { label: m[0].replace(/^-/, '').trim(), rank: p.rank(m), index: m.index }
    }
  }
  return null
}

/** Parse a filename (with or without .pdf) into its PO-cert components. */
export function parsePoFilename(nameOrBase: string): ParsedPoFile {
  const base = nameOrBase.replace(/\.pdf$/i, '').trim()
  const tokens = base.split(/\s+/)

  const apcParts: string[] = []
  let i = 0
  while (i < tokens.length && /^\d{5}$/.test(tokens[i])) { apcParts.push(tokens[i]); i++ }

  if (apcParts.length === 0) {
    return { apcParts: [], customerPart: '', version: '', versionRank: null, parsed: false }
  }

  let rest = tokens.slice(i).join(' ').trim()
  const v = detectVersion(rest)
  let customerPart = rest
  let version = ''
  let versionRank: number | null = null

  if (v) {
    version = v.label
    versionRank = v.rank
    customerPart = rest.slice(0, v.index)
  }

  customerPart = customerPart
    .replace(/^[\s&+,\-]+/, '')            // leading connectors ("& ", "+ ", "- ")
    .replace(/\b(po|p\.o\.|order)\b/gi, ' ') // drop the literal word PO / order
    .replace(/[-\s]+$/, '')                 // trailing separators
    .replace(/\s{2,}/g, ' ')
    .trim()

  return { apcParts, customerPart, version, versionRank, parsed: true }
}

/** Loosely normalize a customer identifier for matching (A-Z0-9 only, upper). */
export const normCust = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
