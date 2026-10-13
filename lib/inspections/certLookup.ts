import { queryPrimary } from '@/lib/db/mysql-primary'

/**
 * Ties traceability rows to the certificate archive.
 *
 * WHY THIS EXISTS INSTEAD OF A PARADIGM PO JOIN
 *
 * We spent several rounds hunting the Paradigm table that PO_PTR points at,
 * because DATA0070 turned out to be impossible — 141,509 rows with RKEY up to
 * 143,116, while every PO_PTR on a real lot runs 148,420..176,498, past the
 * end of the table.
 *
 * But the app already indexes 177,000+ certificates in material_cert_pos,
 * keyed by po_number, lot and apc_part. The cert archive therefore answers
 * "which PO did this lot come in on" directly, without Paradigm — and it also
 * carries the file, which is the thing a cert reviewer actually wants. One
 * join replaces both the PO lookup and the manual hunt for the PDF.
 *
 * The lot number is the join key. Part numbers are NOT reliable across the
 * two systems: the same material shows up as AL0100CU1OZ2529 in Paradigm's
 * inventory and under variant spellings in the archive's folder names, so
 * matching on part would silently drop real certs. Part is used only to RANK
 * several certs for one lot, never to exclude one.
 *
 * PO NUMBER SPELLING. Paradigm's printed report renders the prefix as PURO
 * (letter O) while the archive stores PUR0 (digit zero) — the schema's own
 * example is PUR0133783. They are the same purchase order. Anything comparing
 * the two must fold O and 0 in the prefix or it will match nothing.
 */

export type CertMatch = {
  id: number
  poNumber: string
  lot: string
  apcPart: string
  materialType: string
  fileName: string
  filePath: string
  fileMtime: string | null
  fileSize: number | null
  /** true when the cert's part also matches the issued part, not just the lot. */
  partMatches: boolean
  /**
   * How the lot was matched. 'lot' is a literal match on the stored spelling.
   * 'lot-normalized' means the two systems punctuate it differently —
   * Paradigm's F160426-01B against the archive's F16042601B — and the match
   * was made with punctuation removed.
   */
  matchedOn: 'lot' | 'lot-normalized' | 'lot-base'
  /**
   * Set on a normalized match where the archive held MORE THAN ONE distinct
   * spelling under the same normalized key. A plain punctuation difference
   * yields exactly one, so more than one means two different lots may have
   * been folded together and a human should look before trusting the cert.
   */
  ambiguous?: boolean
}

/** Upper-case and strip punctuation, matching how apc_part_norm is built. */
export function normalizePart(part: string): string {
  return (part || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/**
 * The same treatment for a lot number.
 *
 * Parts got a normalised column (apc_part_norm) when the archive was built;
 * lots did not, so the lot join is plain equality and any difference in
 * punctuation misses. F160426-01B in Paradigm against F16042601B or
 * "F160426 01B" in a scanned filename is a real difference to a string
 * compare and no difference at all to a person.
 *
 * Used only as a FALLBACK, after an exact match has been tried — see
 * findCertsForLots. An exact hit is always the better answer, because two
 * genuinely different lots could in principle normalise to the same thing.
 */
export function normalizeLot(lot: string): string {
  return (lot || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** The MySQL side of normalizeLot, for comparing against the stored column.
 *  Only the separators actually seen in these numbers are stripped: MySQL 5.6
 *  has no REGEXP_REPLACE, so a general strip would mean nesting REPLACE once
 *  per character class. */
const SQL_NORM_LOT = (col: string) =>
  `UPPER(REPLACE(REPLACE(REPLACE(REPLACE(${col}, '-', ''), '.', ''), ' ', ''), '_', ''))`

/**
 * Shortest normalized lot worth matching loosely.
 *
 * Across the archive, 75 normalized keys carry more than one stored spelling,
 * so folding punctuation is not quite free. Nearly all of that risk sits in
 * short keys, where removing the separators leaves too little to identify
 * anything — six characters is enough for the real lot formats
 * (F16042601B, 200526AB043) and short enough to exclude the stubs.
 */
const MIN_NORM_LOT = 6

/**
 * Material temper codes Paradigm appends to a purchased lot.
 *
 * An ALLOWLIST, not a pattern, and the survey of real lot suffixes is why.
 * A first version stripped any trailing run of letters, which the data says
 * is badly wrong:
 *
 *   C006720-A .. -F   six SUB-LOT SEQUENCE letters under one base. Stripping
 *                     collapses six distinct lots into one. The same shape
 *                     repeats on C006117, C038416, C007417, 622762.
 *   S0-…-01-100-RTS   a process marker on a WORK ORDER lot, where the base
 *                     (S0-038949-01-100) is itself a real and different lot.
 *   -RW -DRL -RE -MX  the same: status markers on manufactured lots, which
 *   -IN -FSA -OTL     have no purchased-material certificate to find anyway.
 *
 * Only a designation of the MATERIAL belongs here, because only that leaves
 * the lot's identity intact. Extend the set if another temper turns up; do
 * not replace it with a pattern.
 */
const TEMPER_SUFFIXES = new Set(['HH', 'QH', 'FH', 'SH', 'EH', 'OH'])

/**
 * A lot with its temper code removed: 283346300-HH -> 283346300.
 *
 * Paradigm appends the temper to the lot on some purchased rows — HH for half
 * hard, on a part described "CU C110 HALF HRD" — while the supplier files the
 * certificate under the bare number. That is not a punctuation difference, so
 * normalizeLot cannot reach it: 283346300HH and 283346300 are different
 * strings.
 *
 * Stripping it is NOT sufficient on its own. 283346300 carries both -HH (5
 * lots) and -QH (2 lots) in Paradigm while the archive holds exactly one
 * certificate for 283346300, so the base alone would hand the same cert to
 * two different materials. The caller must also require the certificate's
 * part to match the issued part — the temper is carried in the part number
 * (CUETP0000**HH**01002419), which is what tells the two apart.
 *
 * Returns '' when there is no temper suffix, or when what remains is too
 * short to identify anything.
 */
export function lotBase(lot: string): string {
  const raw = String(lot ?? '').trim()
  const m = raw.match(/^(.+?)[-_ ]([A-Za-z]{2,3})$/)
  if (!m) return ''
  if (!TEMPER_SUFFIXES.has(m[2].toUpperCase())) return ''
  const base = normalizeLot(m[1])
  return base.length >= MIN_NORM_LOT ? base : ''
}

/**
 * Folds the PUR0 / PURO prefix difference so a Paradigm-printed PO and an
 * archived one compare equal. Only the prefix is touched — digits inside the
 * number are left alone, since 0 and O are not interchangeable there.
 */
export function normalizePoNumber(po: string): string {
  return (po || '').toUpperCase().replace(/^PUR[O0]/, 'PUR0')
}

/**
 * Looks up every archived certificate for a set of lot numbers.
 *
 * Returns a map keyed by the raw lot string. Lots are chunked so a large
 * traceability result cannot build an unbounded IN list.
 */
export async function findCertsForLots(
  lots: string[],
  partsByLot?: Record<string, string[]>
): Promise<Record<string, CertMatch[]>> {
  const unique = Array.from(new Set(
    (lots || []).map(l => (l || '').trim()).filter(Boolean)
  ))
  if (!unique.length) return {}

  const byLot: Record<string, CertMatch[]> = {}
  const CHUNK = 200

  const SELECT_COLS = `id, site, material_type, apc_part, apc_part_norm, po_number, lot,
                       file_name, file_path, file_mtime, file_size`

  /**
   * Which traceability lot a returned row belongs to. On the exact pass that
   * is the row's own lot; on the normalised pass the stored spelling differs
   * from the one we asked about, so the caller supplies the mapping.
   */
  const collect = (
    rows: any[],
    lotFor: (r: any) => string,
    matchedOn: 'lot' | 'lot-normalized' | 'lot-base' = 'lot',
  ) => {
    for (const r of rows) {
      const stored = String(r.lot || '').trim()
      const lot = lotFor(r)
      if (!lot) continue
      const wantParts = (partsByLot?.[lot] || []).map(normalizePart).filter(Boolean)
      const certPart = String(r.apc_part_norm || '')
      ;(byLot[lot] ||= []).push({
        id: Number(r.id),
        poNumber: String(r.po_number || '').trim(),
        // The archive's own spelling, not the one we searched for, so the UI
        // can show what the file actually says.
        lot: stored || lot,
        apcPart: String(r.apc_part || '').trim(),
        materialType: String(r.material_type || '').trim(),
        fileName: String(r.file_name || '').trim(),
        filePath: String(r.file_path || '').trim(),
        fileMtime: r.file_mtime ?? null,
        fileSize: r.file_size == null ? null : Number(r.file_size),
        // A loose containment test, because the two systems spell the same
        // material differently often enough that equality is too strict.
        partMatches: !!certPart && wantParts.some(
          p => p === certPart || certPart.includes(p) || p.includes(certPart)
        ),
        matchedOn,
      })
    }
  }

  // ── Pass 1: exact, which is what the idx_lot index serves. ──
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK)
    const placeholders = chunk.map(() => '?').join(',')
    try {
      const rows = await queryPrimary<any[]>(
        `SELECT ${SELECT_COLS}
         FROM material_cert_pos
         WHERE lot IN (${placeholders})
         ORDER BY file_mtime DESC, id DESC`,
        chunk
      )
      collect(rows, r => String(r.lot || '').trim())
    } catch {
      // The archive is an enhancement, not a dependency. If it is unreachable
      // the traceability rows still stand on their own.
      return byLot
    }
  }

  /**
   * Pass 2: the lots pass 1 found nothing for, compared with punctuation and
   * case removed from both sides.
   *
   * Only the misses, so a run where everything matched costs nothing extra.
   * This pass cannot use idx_lot — normalising the column defeats the index —
   * but it is scoped to what already failed, and the archive is small enough
   * (~177k rows) that one scan is cheaper than a reviewer hunting a PDF by
   * hand. An exact hit always wins, since two genuinely different lots could
   * normalise alike.
   */
  const missing = unique.filter(l => !byLot[l]?.length)
  if (missing.length) {
    const wanted = new Map<string, string>()   // normalised -> the lot we asked about
    for (const l of missing) {
      const n = normalizeLot(l)
      // Short keys are not worth normalising: strip the punctuation out of a
      // three-character lot and it will match half the archive. Only lots long
      // enough to be distinctive go through the fallback.
      if (n.length >= MIN_NORM_LOT) wanted.set(n, l)
    }
    const keys = Array.from(wanted.keys())

    for (let i = 0; i < keys.length; i += CHUNK) {
      const chunk = keys.slice(i, i + CHUNK)
      const placeholders = chunk.map(() => '?').join(',')
      try {
        const rows = await queryPrimary<any[]>(
          `SELECT ${SELECT_COLS}
           FROM material_cert_pos
           WHERE ${SQL_NORM_LOT('lot')} IN (${placeholders})
           ORDER BY file_mtime DESC, id DESC`,
          chunk
        )
        collect(rows, r => wanted.get(normalizeLot(String(r.lot || ''))) || '', 'lot-normalized')
      } catch {
        // A failed fallback leaves pass 1's results standing.
        break
      }
    }
  }

  /**
   * Pass 3: lots that STILL found nothing, with a trailing temper code
   * removed — 283346300-HH against the archive's 283346300.
   *
   * Last on purpose. It is the loosest of the three, because it discards
   * characters rather than just ignoring punctuation, so it only ever sees
   * lots that both earlier passes failed on. Matches are marked 'lot-base'
   * and shown as inferred, since the cert is filed under a shorter number
   * than the one Paradigm issued.
   */
  const stillMissing = unique.filter(l => !byLot[l]?.length)
  if (stillMissing.length) {
    const wantedBase = new Map<string, string>()   // base -> the lot we asked about
    for (const l of stillMissing) {
      const b = lotBase(l)
      if (b) wantedBase.set(b, l)
    }
    const keys = Array.from(wantedBase.keys())

    for (let i = 0; i < keys.length; i += CHUNK) {
      const chunk = keys.slice(i, i + CHUNK)
      const placeholders = chunk.map(() => '?').join(',')
      try {
        const rows = await queryPrimary<any[]>(
          `SELECT ${SELECT_COLS}
           FROM material_cert_pos
           WHERE ${SQL_NORM_LOT('lot')} IN (${placeholders})
           ORDER BY file_mtime DESC, id DESC`,
          chunk
        )
        /**
         * The part must agree, and this is the guard that makes a base match
         * safe rather than merely plausible.
         *
         * 283346300 exists in Paradigm as both -HH and -QH, against a single
         * archived certificate. The lot alone cannot tell them apart; the
         * part can, because the temper is written into it —
         * CUETP0000HH01002419. A cert whose part does not correspond to the
         * part that was issued is the wrong cert, so it is dropped rather
         * than shown with a caveat.
         */
        const before = new Set(Object.keys(byLot))
        collect(rows, r => wantedBase.get(normalizeLot(String(r.lot || ''))) || '', 'lot-base')
        for (const lot of Object.keys(byLot)) {
          if (before.has(lot)) continue
          byLot[lot] = byLot[lot].filter(c => c.matchedOn !== 'lot-base' || c.partMatches)
          if (!byLot[lot].length) delete byLot[lot]
        }
      } catch {
        break
      }
    }
  }

  for (const lot of Object.keys(byLot)) {
    /**
     * A loose match that pulled in two DIFFERENT stored spellings has
     * folded two lots together. Punctuation alone cannot do that — Paradigm's
     * F160426-01B and the archive's F16042601B are one spelling each — so
     * more than one means the key was not distinctive enough and every cert
     * under it is marked for a human to check.
     */
    const loose = byLot[lot].filter(c => c.matchedOn !== 'lot')
    if (loose.length) {
      const spellings = new Set(loose.map(c => c.lot.toUpperCase()))
      if (spellings.size > 1) for (const c of loose) c.ambiguous = true
    }

    // Certs whose part also matches come first, and an exact lot match beats a
    // normalized one, so the UI's primary link is the most specific available
    // rather than whichever was indexed last.
    byLot[lot].sort((a, b) => {
      if (a.ambiguous !== b.ambiguous) return a.ambiguous ? 1 : -1
      if (a.matchedOn !== b.matchedOn) {
        const rank = { lot: 0, 'lot-normalized': 1, 'lot-base': 2 } as const
        return rank[a.matchedOn] - rank[b.matchedOn]
      }
      return a.partMatches === b.partMatches ? 0 : a.partMatches ? -1 : 1
    })
  }
  return byLot
}
