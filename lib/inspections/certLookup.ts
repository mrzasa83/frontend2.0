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
}

/** Upper-case and strip punctuation, matching how apc_part_norm is built. */
export function normalizePart(part: string): string {
  return (part || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
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

  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK)
    const placeholders = chunk.map(() => '?').join(',')
    let rows: any[] = []
    try {
      rows = await queryPrimary<any[]>(
        `SELECT id, site, material_type, apc_part, apc_part_norm, po_number, lot,
                file_name, file_path, file_mtime, file_size
         FROM material_cert_pos
         WHERE lot IN (${placeholders})
         ORDER BY file_mtime DESC, id DESC`,
        chunk
      )
    } catch {
      // The archive is an enhancement, not a dependency. If it is unreachable
      // the traceability rows still stand on their own.
      return byLot
    }

    for (const r of rows) {
      const lot = String(r.lot || '').trim()
      if (!lot) continue
      const wantParts = (partsByLot?.[lot] || []).map(normalizePart).filter(Boolean)
      const certPart = String(r.apc_part_norm || '')
      ;(byLot[lot] ||= []).push({
        id: Number(r.id),
        poNumber: String(r.po_number || '').trim(),
        lot,
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
      })
    }
  }

  // Certs whose part also matches come first, so the UI's primary link is the
  // most specific one available rather than whichever was indexed last.
  for (const lot of Object.keys(byLot)) {
    byLot[lot].sort((a, b) =>
      (a.partMatches === b.partMatches ? 0 : a.partMatches ? -1 : 1))
  }
  return byLot
}
