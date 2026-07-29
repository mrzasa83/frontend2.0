import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { PO_ROOT, parsePoFilename, normCust } from '@/lib/certs/poParser'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_DEPTH = 6
const sha1 = (s: string) => crypto.createHash('sha1').update(s).digest('hex')

// Recursively collect PDFs (with stat) under a directory.
async function walkPdfs(dir: string, depth: number, out: { full: string; mtime: Date | null; size: number | null }[]) {
  if (depth > MAX_DEPTH) return
  let entries: any[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch { return }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) await walkPdfs(full, depth + 1, out)
    else if (e.isFile() && e.name.toLowerCase().endsWith('.pdf')) {
      let mtime: Date | null = null, size: number | null = null
      try { const st = await fs.stat(full); mtime = st.mtime; size = st.size } catch { /* keep nulls */ }
      out.push({ full, mtime, size })
    }
  }
}

// Resolve which top-level PO folders belong to a given FAI customer.
// 1. Explicit admin mapping (paradigm_customer -> po_folder)
// 2. Loose fallback: folder name norm-contains / is-contained-by the customer
async function resolveFolders(customer: string): Promise<{ folders: string[]; usedMapping: boolean }> {
  const cust = (customer || '').trim()
  if (!cust) return { folders: [], usedMapping: false }
  try {
    const rows = await queryPrimary(
      'SELECT po_folder FROM po_customer_mapping WHERE paradigm_customer = ?', [cust]
    )
    if (rows?.length) return { folders: rows.map((r: any) => r.po_folder), usedMapping: true }
  } catch { /* table may not exist yet */ }
  try {
    const entries = await fs.readdir(PO_ROOT(), { withFileTypes: true })
    const nc = normCust(cust)
    const matches = entries.filter(e => e.isDirectory()).map(e => e.name).filter(name => {
      const nf = normCust(name)
      return !!nf && !!nc && (nf.includes(nc) || nc.includes(nf))
    })
    return { folders: matches, usedMapping: false }
  } catch { return { folders: [], usedMapping: false } }
}

function isUnderRoot(p: string): boolean {
  const resolved = path.resolve(p)
  return resolved === path.resolve(PO_ROOT()) || resolved.startsWith(path.resolve(PO_ROOT()) + path.sep)
}

const toMysqlDt = (d: Date | null) =>
  d ? d.toISOString().slice(0, 19).replace('T', ' ') : null

// Scan the resolved folders and (re)build the catalog rows for them. Only the
// scanned folders are replaced, so refreshing one customer doesn't wipe others.
async function rebuildCatalog(folders: string[]): Promise<number> {
  let count = 0
  const BATCH = 200

  for (const folder of folders) {
    const folderPath = path.join(PO_ROOT(), folder)
    if (!isUnderRoot(folderPath)) continue

    const files: { full: string; mtime: Date | null; size: number | null }[] = []
    await walkPdfs(folderPath, 0, files)

    // Replace this folder's slice of the catalog.
    await queryPrimary('DELETE FROM po_cert_files WHERE po_folder = ?', [folder])

    // Build all rows first, then insert in batches to keep round-trips low.
    const rows: any[][] = []
    for (const f of files) {
      const fileName = path.basename(f.full)
      const parsed = parsePoFilename(fileName)
      const relDir = path.relative(folderPath, path.dirname(f.full))
      const hash = sha1(f.full)
      const mtime = toMysqlDt(f.mtime)
      const parts = parsed.parsed ? parsed.apcParts : ['']
      for (const apc of parts) {
        rows.push([
          folder, apc, parsed.customerPart || '', parsed.version || '', parsed.versionRank,
          fileName, f.full.substring(0, 700), relDir.substring(0, 500), mtime, f.size, hash,
        ])
      }
    }

    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH)
      const placeholders = chunk.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')
      const flat = chunk.flat()
      try {
        await queryPrimary(
          `INSERT INTO po_cert_files
            (po_folder, apc_part, customer_part, version_label, version_rank,
             file_name, file_path, rel_dir, file_mtime, file_size, path_hash)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE
             customer_part=VALUES(customer_part), version_label=VALUES(version_label),
             version_rank=VALUES(version_rank), file_name=VALUES(file_name),
             rel_dir=VALUES(rel_dir), file_mtime=VALUES(file_mtime),
             file_size=VALUES(file_size), scanned_at=CURRENT_TIMESTAMP`,
          flat
        )
        count += chunk.length
      } catch {
        // Fall back to row-by-row for this chunk so one bad row doesn't drop 200.
        for (const r of chunk) {
          try {
            await queryPrimary(
              `INSERT INTO po_cert_files
                (po_folder, apc_part, customer_part, version_label, version_rank,
                 file_name, file_path, rel_dir, file_mtime, file_size, path_hash)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)
               ON DUPLICATE KEY UPDATE file_mtime=VALUES(file_mtime), scanned_at=CURRENT_TIMESTAMP`,
              r
            )
            count++
          } catch { /* skip bad row */ }
        }
      }
    }
  }
  return count
}

function mapRow(r: any) {
  return {
    apcPart: r.apc_part || '',
    customerPart: r.customer_part || '',
    version: r.version_label || '',
    versionRank: r.version_rank,
    fileName: r.file_name || '',
    filePath: r.file_path || '',
    folder: r.po_folder || '',
    relDir: r.rel_dir || '',
    fileMtime: r.file_mtime || null,
    fileSize: r.file_size ?? null,
    parsed: !!(r.apc_part && r.apc_part.length),
  }
}

// GET  ?customer=NORTBALT[&part=76272][&q=free-text][&all=1]
//   Lists catalog rows from the DB (fast). Defaults to the FAI part number when
//   provided; `q` narrows further by free text; `all=1` ignores the part filter.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const customer = searchParams.get('customer') || ''
  const part = (searchParams.get('part') || '').trim()
  const custPart = (searchParams.get('custPart') || '').trim()
  const q = (searchParams.get('q') || '').trim()
  const showAll = searchParams.get('all') === '1'

  try {
    const { folders, usedMapping } = await resolveFolders(customer)
    if (!folders.length) {
      return NextResponse.json({ success: true, files: [], folders: [], usedMapping, scanned: false,
        note: 'No PO folder resolved for this customer' })
    }

    const where: string[] = [`po_folder IN (${folders.map(() => '?').join(',')})`]
    const args: any[] = [...folders]

    // Exact APC part match (FAI tab) OR loose customer-part match (Products tab).
    if (part && !showAll) { where.push('apc_part = ?'); args.push(part) }
    else if (custPart && !showAll) { where.push('customer_part LIKE ?'); args.push(`%${custPart}%`) }
    if (q) {
      where.push('(apc_part LIKE ? OR customer_part LIKE ? OR file_name LIKE ?)')
      const like = `%${q}%`; args.push(like, like, like)
    }

    const rows = await queryPrimary(
      `SELECT po_folder, apc_part, customer_part, version_label, version_rank,
              file_name, file_path, rel_dir, file_mtime, file_size
       FROM po_cert_files
       WHERE ${where.join(' AND ')}
       ORDER BY (file_mtime IS NULL), file_mtime DESC, file_name ASC
       LIMIT 2000`, args
    )

    return NextResponse.json({
      success: true, files: (rows || []).map(mapRow), folders, usedMapping, scanned: true,
    })
  } catch (error) {
    console.error('PO cert list error:', error)
    return NextResponse.json({ error: 'Failed to list PO certs',
      details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// POST  { customer }   -> rebuild the catalog for that customer's folders (the
//                         slow drive walk), then return fresh counts.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { customer } = await request.json()
    const { folders, usedMapping } = await resolveFolders(customer || '')
    if (!folders.length) {
      return NextResponse.json({ success: true, folders: [], usedMapping, indexed: 0,
        note: 'No PO folder resolved for this customer' })
    }
    const indexed = await rebuildCatalog(folders)
    return NextResponse.json({ success: true, folders, usedMapping, indexed, refreshedAt: new Date().toISOString() })
  } catch (error) {
    console.error('PO cert refresh error:', error)
    return NextResponse.json({ error: 'Failed to refresh PO cert catalog',
      details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
