import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { COC_ROOTS } from '@/lib/config/drives'
import { parseCoCFileName, positionInTree, normalizePart } from '@/lib/certs/cocParser'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_DEPTH = 12

type Found = {
  site: string
  materialType: string
  apcPart: string
  poNumber: string
  lot: string
  fileName: string
  filePath: string
  relDir: string
  mtime: Date | null
  size: number | null
}

/** Recurse a root collecting every PDF, however deep it sits. */
async function walk(root: string, dir: string, site: string, depth: number, out: Found[]) {
  if (depth > MAX_DEPTH) return
  let entries: any[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return  // unreadable folder — skip rather than abort the whole run
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      await walk(root, full, site, depth + 1, out)
      continue
    }
    if (!e.isFile() || !e.name.toLowerCase().endsWith('.pdf')) continue

    const { materialType, apcPart, relativeDir } = positionInTree(root, full)
    const { poNumber, lot } = parseCoCFileName(e.name)
    let mtime: Date | null = null
    let size: number | null = null
    try {
      const st = await fs.stat(full)
      mtime = st.mtime
      size = st.size
    } catch { /* keep the row even if stat fails */ }

    out.push({
      site, materialType, apcPart, poNumber, lot,
      fileName: e.name, filePath: full, relDir: relativeDir, mtime, size,
    })
  }
}

// GET -> inventory status: counts and when it was last refreshed.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const totals = await queryPrimary<any[]>(
      `SELECT COUNT(*) AS files,
              COUNT(DISTINCT po_number) AS pos,
              COUNT(DISTINCT apc_part_norm) AS parts,
              MAX(indexed_at) AS last_indexed
       FROM material_cert_pos`
    )
    const bySite = await queryPrimary<any[]>(
      'SELECT site, COUNT(*) AS files FROM material_cert_pos GROUP BY site ORDER BY site'
    )
    const lastRun = await queryPrimary<any[]>(
      `SELECT started_at, finished_at, files_found, files_written, removed, status, message, run_by
       FROM material_cert_po_runs ORDER BY id DESC LIMIT 1`
    )
    return NextResponse.json({
      success: true,
      files: Number(totals?.[0]?.files) || 0,
      pos: Number(totals?.[0]?.pos) || 0,
      parts: Number(totals?.[0]?.parts) || 0,
      lastIndexed: totals?.[0]?.last_indexed || null,
      bySite: bySite || [],
      lastRun: lastRun?.[0] || null,
      roots: COC_ROOTS(),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read inventory status',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST -> (re)build the inventory by walking all three site roots.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin') && !roles.includes('Quality') && !roles.includes('EHSadmin')) {
    return NextResponse.json({ error: 'Not permitted to rebuild the cert inventory' }, { status: 403 })
  }

  const user = (session.user as any)?.username || 'unknown'
  const sp = new URL(request.url).searchParams
  const onlySite = (sp.get('site') || '').trim()   // optional: refresh one site

  const runRes: any = await queryPrimary(
    'INSERT INTO material_cert_po_runs (status, run_by) VALUES (?, ?)', ['running', user]
  ).catch(() => null)
  const runId = runRes?.insertId ?? null

  try {
    const roots = COC_ROOTS().filter(r => !onlySite || r.site.toLowerCase() === onlySite.toLowerCase())
    const found: Found[] = []
    const problems: string[] = []

    for (const r of roots) {
      try {
        await fs.access(r.path)
      } catch {
        // A site whose drive isn't mounted shouldn't wipe out its existing rows.
        problems.push(`${r.site}: root not reachable (${r.path})`)
        continue
      }
      await walk(r.path, r.path, r.site, 0, found)
    }

    let written = 0
    const seen: string[] = []
    for (const f of found) {
      const filePath = f.filePath.substring(0, 700)
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
        [f.site, f.materialType.substring(0, 190), f.apcPart.substring(0, 190),
         normalizePart(f.apcPart).substring(0, 190), f.poNumber.substring(0, 60),
         f.lot.substring(0, 120), f.fileName.substring(0, 300), filePath,
         f.relDir.substring(0, 500), f.mtime, f.size, hash]
      )
      written++
    }

    // Drop rows for files that no longer exist — but only for the sites we
    // actually managed to scan, so an unmounted drive never deletes its index.
    let removed = 0
    const scanned = roots
      .filter(r => !problems.some(p => p.startsWith(`${r.site}:`)))
      .map(r => r.site)
    if (scanned.length && seen.length) {
      const sitePlaceholders = scanned.map(() => '?').join(',')
      // Chunk the hash list; the archive can run to tens of thousands of files.
      const CHUNK = 500
      const keep = new Set(seen)
      const existing = await queryPrimary<any[]>(
        `SELECT id, path_hash FROM material_cert_pos WHERE site IN (${sitePlaceholders})`, scanned
      )
      const stale = (existing || []).filter(r => !keep.has(r.path_hash)).map(r => r.id)
      for (let i = 0; i < stale.length; i += CHUNK) {
        const batch = stale.slice(i, i + CHUNK)
        await queryPrimary(
          `DELETE FROM material_cert_pos WHERE id IN (${batch.map(() => '?').join(',')})`, batch
        )
        removed += batch.length
      }
    }

    if (runId) {
      await queryPrimary(
        `UPDATE material_cert_po_runs
         SET finished_at = NOW(), files_found = ?, files_written = ?, removed = ?,
             status = ?, message = ?
         WHERE id = ?`,
        [found.length, written, removed, problems.length ? 'partial' : 'ok',
         problems.join(' | ').substring(0, 1000), runId]
      ).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      found: found.length,
      written,
      removed,
      sitesScanned: scanned,
      problems,
      unparsed: found.filter(f => !f.poNumber).length,
    })
  } catch (error) {
    if (runId) {
      await queryPrimary(
        `UPDATE material_cert_po_runs SET finished_at = NOW(), status = 'error', message = ? WHERE id = ?`,
        [String(error instanceof Error ? error.message : error).substring(0, 1000), runId]
      ).catch(() => {})
    }
    console.error('C of C indexer error:', error)
    return NextResponse.json({
      error: 'Index failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
