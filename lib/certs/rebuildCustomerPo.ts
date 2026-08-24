import { queryPrimary } from '@/lib/db/mysql-primary'
import { PO_CERT_PATH } from '@/lib/config/drives'
import { parseCustomerPoFilename, revRankOf } from '@/lib/certs/customerPoParser'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { bulkUpsert, bulkDeleteIds } from '@/lib/certs/bulkWrite'

/**
 * Full sweep of the customer PO archive.
 * In lib so the manual Refresh button and the hourly background refresh share
 * one implementation.
 */
const MAX_DEPTH = 8

const toMysqlDt = (d: Date | null) =>
  d ? d.toISOString().slice(0, 19).replace('T', ' ') : null

type FoundFile = { full: string; mtime: Date | null; size: number | null }

async function walkPdfs(dir: string, depth: number, out: FoundFile[]) {
  if (depth > MAX_DEPTH) return
  let entries: any[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      await walkPdfs(full, depth + 1, out)
      continue
    }
    if (!e.isFile() || !e.name.toLowerCase().endsWith('.pdf')) continue
    let mtime: Date | null = null, size: number | null = null
    try { const st = await fs.stat(full); mtime = st.mtime; size = st.size } catch { /* keep going */ }
    out.push({ full, mtime, size })
  }
}

/**
 * Sweep EVERY customer folder under the PO root and rebuild the index.
 *
 * The previous catalog only scanned folders it could resolve from a work
 * order's customer, so whole customer folders were never indexed unless someone
 * happened to trigger them. This walks the lot.
 */
/**
 * @param purge  When true the index is emptied first, so rows written by an
 *               older parser can't linger. Otherwise the sweep reconciles:
 *               upsert everything found, then delete rows whose file is gone.
 *               Reconcile is the normal mode — it never leaves the table empty,
 *               and a failed run can't wipe the index.
 */
export async function rebuildCustomerPoIndex(purge = false): Promise<{
  count: number; status: 'ok' | 'partial'; message?: string
  files: number; rows: number; skipped: number; customers: number
}> {
  const root = PO_CERT_PATH()
  let customers: string[] = []
  try {
    const entries = await fs.readdir(root, { withFileTypes: true })
    customers = entries.filter(e => e.isDirectory()).map(e => e.name)
  } catch (e) {
    return {
      count: 0, status: 'partial', message: `PO root not reachable (${root})`,
      files: 0, rows: 0, skipped: 0, customers: 0,
    }
  }

  if (purge) {
    await queryPrimary('DELETE FROM customer_po_files').catch(() => {})
    await queryPrimary('DELETE FROM customer_po_skipped').catch(() => {})
  }

  // Admin corrections, applied over whatever the parser produced.
  const overrides = new Map<string, any>()
  try {
    const ov = await queryPrimary<any[]>(
      'SELECT path_hash, po_number, rev, version, apc_parts FROM customer_po_overrides'
    )
    for (const o of ov || []) overrides.set(o.path_hash, o)
  } catch { /* table may not exist yet */ }

  let files = 0, rows = 0, skipped = 0
  const seenRows: string[] = []
  const seenSkips: string[] = []
  // Rows are accumulated and written in batches; writing them one at a time
  // starves the connection pool and makes ordinary page queries time out.
  const fileRows: any[][] = []
  const skipRows: any[][] = []

  for (const customer of customers) {
    const custDir = path.join(root, customer)
    const found: FoundFile[] = []
    await walkPdfs(custDir, 0, found)
    files += found.length

    for (const f of found) {
      // Sub-group is the folder between the customer and the file, when present.
      const rel = path.relative(custDir, f.full)
      const relDirs = path.dirname(rel).split(path.sep).filter(d => d && d !== '.')
      const subGroup = relDirs[0] || ''
      const fileName = path.basename(f.full)
      const filePath = f.full.slice(0, 700)
      const parsed = parseCustomerPoFilename(fileName)
      const fileHash = crypto.createHash('sha1').update(filePath).digest('hex')
      const ov = overrides.get(fileHash)
      if (ov) {
        // An override can rescue a file the parser rejected outright.
        if (ov.po_number) { parsed.poNumber = String(ov.po_number); parsed.parsed = true }
        if (ov.rev !== null && ov.rev !== undefined) {
          parsed.rev = String(ov.rev).toUpperCase()
          parsed.revRank = revRankOf(parsed.rev)
        }
        if (ov.version) parsed.version = String(ov.version)
        if (ov.apc_parts) {
          parsed.apcParts = String(ov.apc_parts).split(',').map(p => p.trim()).filter(Boolean)
          if (parsed.apcParts.length) parsed.parsed = true
        }
      }

      if (!parsed.parsed) {
        seenSkips.push(fileHash)
        skipped++
        skipRows.push([
          customer.slice(0, 190), subGroup.slice(0, 190), fileName.slice(0, 300), filePath,
          parsed.reason.slice(0, 200), toMysqlDt(f.mtime), fileHash,
        ])
        continue
      }

      // One row per APC part — a single PO file can cover several.
      for (const part of parsed.apcParts) {
        const hash = crypto.createHash('sha1').update(`${filePath}|${part}`).digest('hex')
        seenRows.push(hash)
        fileRows.push([
          customer.slice(0, 190), subGroup.slice(0, 190), part, parsed.poNumber.slice(0, 60),
          parsed.rev.slice(0, 10), parsed.revRank, parsed.version,
          fileName.slice(0, 300), filePath, toMysqlDt(f.mtime), f.size, hash,
        ])
        rows++
      }
    }
  }

  await bulkUpsert(
    'customer_po_files',
    ['customer', 'sub_group', 'apc_part', 'po_number', 'rev', 'rev_rank', 'version',
     'file_name', 'file_path', 'file_mtime', 'file_size', 'path_hash'],
    fileRows,
    ['customer', 'sub_group', 'apc_part', 'po_number', 'rev', 'rev_rank', 'version',
     'file_name', 'file_mtime', 'file_size'],
  )
  await bulkUpsert(
    'customer_po_skipped',
    ['customer', 'sub_group', 'file_name', 'file_path', 'reason', 'file_mtime', 'path_hash'],
    skipRows,
    ['customer', 'sub_group', 'file_name', 'reason', 'file_mtime'],
  )

  // Drop rows whose files have gone. Only safe because we just swept the whole
  // root — if the root had been unreachable we returned above without touching
  // anything.
  const prune = async (table: string, keep: string[]) => {
    const existing = await queryPrimary<any[]>(`SELECT id, path_hash FROM ${table}`).catch(() => [])
    const keepSet = new Set(keep)
    const stale = (existing || []).filter(r => !keepSet.has(r.path_hash)).map(r => r.id)
    return bulkDeleteIds(table, stale)
  }
  await prune('customer_po_files', seenRows)
  await prune('customer_po_skipped', seenSkips)

  // Work out the newest revision per PO, and the newest version within each
  // revision, ONCE — so the list query doesn't have to derive it on every read.
  // Generous timeouts: these are two full passes, but they run per index run
  // rather than per page view.
  const MAINT_TIMEOUT = 120000
  try {
    await queryPrimary(
      `UPDATE customer_po_files f
       JOIN (
         SELECT po_number, customer, MAX(COALESCE(rev_rank, -1)) AS max_rank
         FROM customer_po_files GROUP BY po_number, customer
       ) t ON t.po_number = f.po_number AND t.customer = f.customer
       SET f.is_latest_rev = (COALESCE(f.rev_rank, -1) = t.max_rank)`,
      [], MAINT_TIMEOUT
    )
    await queryPrimary(
      `UPDATE customer_po_files f
       JOIN (
         SELECT po_number, customer, rev, MAX(version) AS max_ver
         FROM customer_po_files GROUP BY po_number, customer, rev
       ) t ON t.po_number = f.po_number AND t.customer = f.customer AND t.rev = f.rev
       SET f.is_latest_version = (f.version = t.max_ver)`,
      [], MAINT_TIMEOUT
    )
  } catch (e) {
    // Flags left as-is; the list still works, it just may show extra revisions.
    console.error('customer PO latest-flag pass failed:', e)
  }

  return {
    count: rows, status: 'ok',
    message: `${customers.length} customers · ${files} PDFs · ${rows} part rows · ${skipped} skipped`,
    files, rows, skipped, customers: customers.length,
  }
}

