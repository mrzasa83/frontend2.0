import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
export const dynamic = 'force-dynamic'

const LDRIVE_ROOT = process.env.LDRIVE_ROOT || '/mnt/ldrive'

type CertKey = { purchasedPart: string; poNumber: string; batchSerial: string }

// Normalize an identifier for tolerant matching: uppercase, strip everything
// that isn't a letter or digit. So "FCWR0UT3.OZ1824" -> "FCWR0UT3OZ1824"
// and batch "G03811-18" -> "G0381118".
const norm = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

// Find candidate folders for a part. Match on the NORMALIZED part name so the
// dotted Paradigm part (FCWR0UT3.OZ1824) resolves to the dotless folder
// (FCWR0UT3OZ1824). Catalog first (indexed part_norm), then a find fallback.
async function folderPaths(rawPart: string): Promise<string[]> {
  const np = norm(rawPart)
  if (!np) return []
  // 1. Catalog by normalized part
  try {
    const rows = await queryPrimary('SELECT folder_path FROM material_cert_folders WHERE part_norm = ?', [np])
    if (rows?.length) return rows.map((r: any) => r.folder_path)
  } catch { /* part_norm column may not exist yet; fall through */ }
  // 1b. Legacy catalog by exact folder name
  try {
    const rows = await queryPrimary('SELECT folder_path FROM material_cert_folders WHERE part_folder = ?', [rawPart.trim()])
    if (rows?.length) return rows.map((r: any) => r.folder_path)
  } catch { /* ignore */ }
  // 2. Fallback: targeted find. Try the dotless/normalized name and the raw name.
  const tries = Array.from(new Set([np, rawPart.trim().replace(/[^A-Za-z0-9_.-]/g, '')])).filter(Boolean)
  for (const name of tries) {
    try {
      const { stdout } = await execAsync(
        `find "${LDRIVE_ROOT}" -maxdepth 9 -type d -iname "${name}" 2>/dev/null | head -20`,
        { timeout: 20000, maxBuffer: 1024 * 1024 }
      )
      const hits = stdout.split('\n').map(s => s.trim()).filter(Boolean)
      if (hits.length) return hits
    } catch { /* try next */ }
  }
  return []
}

// Parse "PUR0003850 - LOT F1010704B.pdf" -> { po, batch }, normalized.
// Also returns the normalized full base name for loose contains matching.
function parsePdfName(name: string): { po: string; batch: string; normName: string } {
  const base = name.replace(/\.pdf$/i, '')
  const normName = norm(base)
  const m = base.split(/\s*-\s*LOT\s*/i)
  if (m.length >= 2) return { po: norm(m[0]), batch: norm(m.slice(1).join(' LOT ')), normName }
  return { po: '', batch: '', normName }
}

function isUnderRoot(p: string): boolean {
  const resolved = path.resolve(p)
  return resolved.startsWith(path.resolve(LDRIVE_ROOT) + path.sep)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const certs: CertKey[] = body.certs || []
    if (!Array.isArray(certs) || !certs.length) {
      return NextResponse.json({ success: true, matches: {} })
    }

    // Group by normalized part to avoid repeated folder lookups
    const partMap = new Map<string, string>() // normPart -> a raw part for find fallback
    for (const c of certs) {
      const np = norm(c.purchasedPart)
      if (np && !partMap.has(np)) partMap.set(np, (c.purchasedPart || '').trim())
    }

    const folderCache: Record<string, { name: string; po: string; batch: string; normName: string }[]> = {}
    for (const [np, rawPart] of partMap) {
      const dirs = await folderPaths(rawPart)
      const files: { name: string; po: string; batch: string; normName: string }[] = []
      for (const dir of dirs) {
        if (!isUnderRoot(dir)) continue
        try {
          const names = await fs.readdir(dir)
          for (const n of names) {
            if (!n.toLowerCase().endsWith('.pdf')) continue
            const parsed = parsePdfName(n)
            files.push({ name: path.join(dir, n), po: parsed.po, batch: parsed.batch, normName: parsed.normName })
          }
        } catch { /* skip unreadable dir */ }
      }
      folderCache[np] = files
    }

    // Match each cert -> candidate file paths (ranked best-first).
    // Either a PO match OR a batch match is a confident hit.
    const matches: Record<string, { path: string; name: string }[]> = {}
    for (const c of certs) {
      const key = `${c.purchasedPart}|${c.poNumber}|${c.batchSerial}`
      const files = folderCache[norm(c.purchasedPart)] || []
      const po = norm(c.poNumber), batch = norm(c.batchSerial)
      const scored = files.map(f => {
        const poExact = !!po && f.po === po
        const batchExact = !!batch && f.batch === batch
        const batchLoose = !!batch && batch.length >= 3 && (
          (!!f.batch && (f.batch.includes(batch) || batch.includes(f.batch))) || f.normName.includes(batch)
        )
        const poLoose = !!po && po.length >= 3 && f.normName.includes(po)
        let score = 0
        if (poExact && batchExact) score = 5
        else if (batchExact) score = 4
        else if (poExact) score = 4
        else if (batchLoose) score = 2
        else if (poLoose) score = 1
        return { path: f.name, name: f.name.split('/').pop() || f.name, score }
      }).filter(f => f.score > 0)
        .sort((a, b) => b.score - a.score)
      if (scored.length) matches[key] = scored.map(({ path, name }) => ({ path, name }))
    }

    return NextResponse.json({ success: true, matches })
  } catch (error) {
    console.error('Cert file match error:', error)
    return NextResponse.json({ error: 'Match failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
