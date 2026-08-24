import { queryPrimary } from '@/lib/db/mysql-primary'
import { COC_ROOTS } from '@/lib/config/drives'
import { parseCoCFileName, positionInTree, normalizePart } from '@/lib/certs/cocParser'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * Rebuild the supplier certificate-of-conformance inventory.
 *
 * Lives in lib rather than the route so both the manual Refresh button and the
 * hourly background refresh run exactly the same code — a background job that
 * quietly diverges from the button is a nasty thing to debug.
 */

const MAX_DEPTH = 12

const toMysqlDt = (d: Date | null) =>
  d ? d.toISOString().slice(0, 19).replace('T', ' ') : null

type Found = {
  site: string; materialType: string; apcPart: string
  poNumber: string; lot: string; fileName: string; filePath: string
  relDir: string; mtime: Date | null; size: number | null
}

async function walk(root: string, dir: string, site: string, depth: number, out: Found[]) {
  if (depth > MAX_DEPTH) return
  let entries: any[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) { await walk(root, full, site, depth + 1, out); continue }
    if (!e.isFile() || !e.name.toLowerCase().endsWith('.pdf')) continue

    const { materialType, apcPart, relativeDir } = positionInTree(root, full)
    const { poNumber, lot } = parseCoCFileName(e.name)
    let mtime: Date | null = null, size: number | null = null
    try { const st = await fs.stat(full); mtime = st.mtime; size = st.size } catch { /* keep the row */ }

    out.push({
      site, materialType, apcPart, poNumber, lot,
      fileName: e.name, filePath: full, relDir: relativeDir, mtime, size,
    })
  }
}

export async function rebuildCocIndex(onlySite = ''): Promise<{
  count: number; status: 'ok' | 'partial'; message?: string
  found: number; written: number; removed: number; unparsed: number
  sitesScanned: string[]; problems: string[]
}> {
  const roots = COC_ROOTS().filter(r => !onlySite || r.site.toLowerCase() === onlySite.toLowerCase())
  const found: Found[] = []
  const problems: string[] = []

  for (const r of roots) {
    try {
      await fs.access(r.path)
    } catch {
      // A site whose drive isn't mounted must not wipe its existing rows.
      problems.push(`${r.site}: root not reachable (${r.path})`)
      continue
    }
    await walk(r.path, r.path, r.site, 0, found)
  }

  let written = 0
  const seen: string[] = []
  for (const f of found) {
    const filePath = f.filePath.slice(0, 700)
    const hash = crypto.createHash('sha1').update(filePath).digest('hex')
    seen.push(hash)
    await queryPrimary(
      `INSERT INTO material_cert_pos
         (site, material_type, apc_part, apc_part_norm, po_number, lot,
          file_name, file_path, rel_dir, file_mtime, file_size, path_hash)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         site = VALUES(site), material_type = VALUES(material_type),
         apc_part = VALUES(apc_part), apc_part_norm = VALUES(apc_part_norm),
         po_number = VALUES(po_number), lot = VALUES(lot),
         file_name = VALUES(file_name), rel_dir = VALUES(rel_dir),
         file_mtime = VALUES(file_mtime), file_size = VALUES(file_size)`,
      [f.site, f.materialType.slice(0, 190), f.apcPart.slice(0, 190),
       normalizePart(f.apcPart).slice(0, 190), f.poNumber.slice(0, 60),
       f.lot.slice(0, 120), f.fileName.slice(0, 300), filePath,
       f.relDir.slice(0, 500), toMysqlDt(f.mtime), f.size, hash]
    ).catch(() => {})
    written++
  }

  // Prune only the sites we actually scanned.
  let removed = 0
  const scanned = roots
    .filter(r => !problems.some(p => p.startsWith(`${r.site}:`)))
    .map(r => r.site)
  if (scanned.length) {
    const keep = new Set(seen)
    const existing = await queryPrimary<any[]>(
      `SELECT id, path_hash FROM material_cert_pos WHERE site IN (${scanned.map(() => '?').join(',')})`,
      scanned
    ).catch(() => [])
    const stale = (existing || []).filter(r => !keep.has(r.path_hash)).map(r => r.id)
    for (let i = 0; i < stale.length; i += 500) {
      const batch = stale.slice(i, i + 500)
      await queryPrimary(
        `DELETE FROM material_cert_pos WHERE id IN (${batch.map(() => '?').join(',')})`, batch
      ).catch(() => {})
      removed += batch.length
    }
  }

  const unparsed = found.filter(f => !f.poNumber).length
  return {
    count: written,
    status: problems.length ? 'partial' : 'ok',
    message: problems.join(' | '),
    found: found.length, written, removed, unparsed,
    sitesScanned: scanned, problems,
  }
}
