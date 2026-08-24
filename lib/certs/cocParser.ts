/**
 * Certificate-of-conformance file parsing.
 *
 * The C of C archive is laid out by site, then material type, then APC part:
 *
 *   <root>/<Material Type>/<APC Part Number>/<file>.pdf
 *   .../Paradigm C of Cs/Copper/AL0100CU1OZ2532/PUR0133783 - LOT 2507410115.pdf
 *
 * The file name carries the purchase-order number and the lot. The canonical
 * form is "PUR0133783 - LOT 2507410115.pdf", but scanned archives accumulate
 * variants over the years, so the parsing below is deliberately forgiving:
 * it pulls the PUR number wherever it appears and treats everything after a
 * LOT marker (or after the separator, when the marker is missing) as the lot.
 *
 * Files can sit deeper than one level under the part folder. Material type and
 * APC part are always taken from the FIRST TWO levels below the root, whatever
 * the depth of the file itself.
 */

export type ParsedCoC = {
  poNumber: string   // e.g. PUR0133783 — '' when the name carries no PUR number
  lot: string        // e.g. 2507410115 — '' when no lot is present
}

/** PUR followed by digits, anywhere in the name. */
const PO_RE = /\b(PUR[\s_-]?\d{3,})\b/i

/**
 * An explicit lot marker: LOT / LOT# / LOT: / L.O.T.
 * No trailing word boundary — the marker frequently runs straight into the lot
 * value with no space, as in "PUR0133783-LOT2507410115.pdf".
 */
const LOT_MARKER_RE = /\bL[\s._]*O[\s._]*T[\s._:#-]*(.+)$/i

/** Trailing copy markers Windows adds: " (1)", " - Copy", " copy 2". */
const COPY_SUFFIX_RE = /\s*(?:\(\d+\)|-?\s*copy(?:\s*\d+)?)\s*$/i

const clean = (s: string) => String(s ?? '').replace(/\s+/g, ' ').trim()

/** Strip the extension and any copy suffix from a file name. */
export function baseName(fileName: string): string {
  const noExt = String(fileName ?? '').replace(/\.[A-Za-z0-9]+$/, '')
  return clean(noExt.replace(COPY_SUFFIX_RE, ''))
}

/**
 * Pull the PO number and lot out of a C of C file name.
 * Returns empty strings rather than throwing — an unparseable name still gets
 * indexed so it can be found and fixed, rather than silently dropped.
 */
export function parseCoCFileName(fileName: string): ParsedCoC {
  const base = baseName(fileName)
  if (!base) return { poNumber: '', lot: '' }

  // PO number, normalised to PUR0133783 (no inner spaces or separators).
  const poMatch = base.match(PO_RE)
  const poNumber = poMatch ? poMatch[1].toUpperCase().replace(/[\s_-]/g, '') : ''

  // Everything after the PO number is where a lot would live; if there's no PO
  // number, consider the whole name.
  const after = poMatch
    ? base.slice((poMatch.index ?? 0) + poMatch[1].length)
    : base

  let lot = ''
  const lotMatch = after.match(LOT_MARKER_RE)
  if (lotMatch) {
    lot = clean(lotMatch[1])
  } else {
    // No LOT marker — take what follows a separator, e.g. "PUR0133783 - 2507410115"
    const sep = after.match(/^\s*[-_–]\s*(.+)$/)
    if (sep) lot = clean(sep[1])
  }

  // Tidy the lot: drop a leading "#" or ":" and any trailing punctuation.
  lot = lot.replace(/^[#:\s-]+/, '').replace(/[\s.,;-]+$/, '')

  return { poNumber, lot: lot.slice(0, 120) }
}

/**
 * Given a file's full path and the root it was found under, work out the
 * material type and APC part number from the first two levels below the root.
 */
export function positionInTree(rootPath: string, filePath: string): {
  materialType: string
  apcPart: string
  relativeDir: string
} {
  const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '')
  const root = norm(rootPath)
  const full = norm(filePath)
  const rel = full.toLowerCase().startsWith(root.toLowerCase() + '/')
    ? full.slice(root.length + 1)
    : full
  const parts = rel.split('/').filter(Boolean)
  // The last element is the file itself.
  const dirs = parts.slice(0, Math.max(0, parts.length - 1))
  return {
    materialType: dirs[0] ? clean(dirs[0]) : '',
    apcPart: dirs[1] ? clean(dirs[1]) : '',
    relativeDir: dirs.join('/'),
  }
}

/** Normalised part number for matching against Paradigm part numbers. */
export function normalizePart(part: string): string {
  return String(part ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}
