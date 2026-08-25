import { queryPrimary } from '@/lib/db/mysql-primary'
import { COC_ROOTS } from '@/lib/config/drives'
import { parseCoCFileName, positionInTree, normalizePart } from '@/lib/certs/cocParser'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { bulkUpsert, bulkDeleteIds } from '@/lib/certs/bulkWrite'
import { queryMSSQL } from '@/lib/db/mssql'

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
  unknownParts?: number
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

  // Look up the Paradigm description for each part folder. The folder name is
  // DATA0017.INV_PART_NUMBER, so one batched query per few hundred parts gives
  // every cert a readable description without a second lookup at display time.
  const descriptions = new Map<string, string>()
  const distinctParts = Array.from(new Set(
    found.map(f => f.apcPart.trim()).filter(Boolean)
  ))
  for (let i = 0; i < distinctParts.length; i += 200) {
    const batch = distinctParts.slice(i, i + 200)
    const names = batch.map((_, j) => `@p${j}`)
    const params: Record<string, any> = {}
    batch.forEach((p, j) => { params[`p${j}`] = p })
    try {
      const rowsFound = await queryMSSQL<any[]>('1', `
        SELECT INV_PART_NUMBER, INV_PART_DESCRIPTION
        FROM DATA0017 WITH (NOLOCK)
        WHERE LTRIM(RTRIM(INV_PART_NUMBER)) IN (${names.join(',')})`, params)
      for (const r of rowsFound || []) {
        descriptions.set(
          String(r.INV_PART_NUMBER || '').trim().toUpperCase(),
          String(r.INV_PART_DESCRIPTION || '').trim()
        )
      }
    } catch (e) {
      // Paradigm unreachable — index the files anyway, without descriptions.
      console.error('C of C description lookup failed:', e)
    }
  }

  // Accumulate then write in batches — a per-row await here saturates the
  // connection pool and makes unrelated page queries time out.
  const seen: string[] = []
  const rows: any[][] = []
  for (const f of found) {
    const filePath = f.filePath.slice(0, 700)
    const hash = crypto.createHash('sha1').update(filePath).digest('hex')
    seen.push(hash)
    const desc = descriptions.get(f.apcPart.trim().toUpperCase())
    rows.push([
      f.site, f.materialType.slice(0, 190), f.apcPart.slice(0, 190),
      normalizePart(f.apcPart).slice(0, 190),
      (desc || '').slice(0, 300), desc ? 1 : 0,
      f.poNumber.slice(0, 60),
      f.lot.slice(0, 120), f.fileName.slice(0, 300), filePath,
      f.relDir.slice(0, 500), toMysqlDt(f.mtime), f.size, hash,
    ])
  }
  const written = await bulkUpsert(
    'material_cert_pos',
    ['site', 'material_type', 'apc_part', 'apc_part_norm', 'part_description', 'part_found',
     'po_number', 'lot', 'file_name', 'file_path', 'rel_dir', 'file_mtime', 'file_size', 'path_hash'],
    rows,
    ['site', 'material_type', 'apc_part', 'apc_part_norm', 'part_description', 'part_found',
     'po_number', 'lot', 'file_name', 'rel_dir', 'file_mtime', 'file_size'],
  )

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
    removed = await bulkDeleteIds('material_cert_pos', stale)
  }

  const unparsed = found.filter(f => !f.poNumber).length
  const unknownParts = distinctParts.filter(
    p => !descriptions.has(p.toUpperCase())
  ).length
  return {
    count: written,
    unknownParts,
    status: problems.length ? 'partial' : 'ok',
    message: problems.join(' | '),
    found: found.length, written, removed, unparsed,
    sitesScanned: scanned, problems,
  }
}
