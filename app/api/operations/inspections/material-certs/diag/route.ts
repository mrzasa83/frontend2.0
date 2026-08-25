import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { COC_ROOTS, COC_EXCLUDED_TYPES } from '@/lib/config/drives'
import { getIndexState } from '@/lib/certs/indexRefresh'
import { parseCoCFileName, positionInTree } from '@/lib/certs/cocParser'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Answers "is it actually walking the archive?" by looking at the filesystem
 * from inside the container, rather than inferring from an empty table.
 *
 * GET  ?probe=PUR00009936   optionally hunt for one PO number on disk
 *      ?dir=Hardware/HDW0000000039   list a specific folder
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = new URL(request.url).searchParams
  const probe = (sp.get('probe') || '').trim().toUpperCase()
  const dir = (sp.get('dir') || '').trim()
  const excluded = COC_EXCLUDED_TYPES()

  const roots: any[] = []
  for (const r of COC_ROOTS()) {
    const entry: any = { site: r.site, path: r.path }
    try {
      await fs.access(r.path)
      entry.reachable = true
      const items = await fs.readdir(r.path, { withFileTypes: true })
      const folders = items.filter(i => i.isDirectory()).map(i => i.name)
      entry.materialTypeFolders = folders.length
      entry.folders = folders
      entry.excluded = folders.filter(f => excluded.includes(f.trim().toLowerCase()))
      entry.willWalk = folders.filter(f => !excluded.includes(f.trim().toLowerCase())).length
    } catch (e) {
      entry.reachable = false
      entry.error = e instanceof Error ? e.message : String(e)
    }
    roots.push(entry)
  }

  // List one folder, e.g. dir=Hardware/HDW0000000039
  let listing: any = null
  if (dir) {
    listing = []
    for (const r of COC_ROOTS()) {
      const full = path.join(r.path, dir)
      try {
        const items = await fs.readdir(full, { withFileTypes: true })
        listing.push({
          site: r.site, path: full, exists: true,
          files: items.filter(i => i.isFile()).map(i => {
            const parsed = parseCoCFileName(i.name)
            const pos = positionInTree(r.path, path.join(full, i.name))
            return {
              name: i.name,
              isPdf: i.name.toLowerCase().endsWith('.pdf'),
              parsedPo: parsed.poNumber, parsedLot: parsed.lot,
              materialType: pos.materialType, apcPart: pos.apcPart,
            }
          }),
          folders: items.filter(i => i.isDirectory()).map(i => i.name),
        })
      } catch (e) {
        listing.push({
          site: r.site, path: full, exists: false,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
  }

  // Hunt a PO number on disk, so a missing cert can be traced to the file
  // rather than guessed at. Bounded so this can't run away.
  let probeResult: any = null
  if (probe) {
    const hits: any[] = []
    let scanned = 0
    const hunt = async (root: string, d: string, depth: number) => {
      if (depth > 6 || hits.length >= 25 || scanned > 60000) return
      let items: any[]
      try { items = await fs.readdir(d, { withFileTypes: true }) } catch { return }
      for (const i of items) {
        const full = path.join(d, i.name)
        if (i.isDirectory()) { await hunt(root, full, depth + 1); continue }
        scanned++
        if (i.name.toUpperCase().includes(probe)) {
          const pos = positionInTree(root, full)
          const parsed = parseCoCFileName(i.name)
          hits.push({
            path: full, name: i.name,
            materialType: pos.materialType, apcPart: pos.apcPart,
            parsedPo: parsed.poNumber, parsedLot: parsed.lot,
            isPdf: i.name.toLowerCase().endsWith('.pdf'),
            excludedByType: excluded.includes(pos.materialType.trim().toLowerCase()),
          })
        }
      }
    }
    for (const r of COC_ROOTS()) {
      try { await fs.access(r.path) } catch { continue }
      await hunt(r.path, r.path, 0)
    }
    // and what the database thinks
    let inDb: any[] = []
    try {
      inDb = await queryPrimary<any[]>(
        `SELECT site, material_type, apc_part, po_number, lot, file_path
         FROM material_cert_pos WHERE po_number LIKE ? LIMIT 25`, [`%${probe}%`]
      )
    } catch { /* table may not exist */ }
    probeResult = { probe, filesScanned: scanned, onDisk: hits, inDatabase: inDb || [] }
  }

  let counts: any = null
  try {
    const c = await queryPrimary<any[]>(
      `SELECT COUNT(*) AS files, COUNT(DISTINCT po_number) AS pos,
              COUNT(DISTINCT material_type) AS types, COUNT(DISTINCT apc_part) AS parts
       FROM material_cert_pos`
    )
    counts = c?.[0] || null
  } catch (e) {
    counts = { error: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json({
    success: true,
    excludedTypes: excluded,
    roots,
    database: counts,
    indexState: await getIndexState('supplier_cert_pos'),
    listing,
    probe: probeResult,
  })
}
