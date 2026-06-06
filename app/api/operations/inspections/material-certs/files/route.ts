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

const norm = (s: string) => (s || '').trim().toUpperCase().replace(/\s+/g, '')

// Find candidate folders for a part: catalog first, then a targeted find fallback.
async function folderPaths(part: string): Promise<string[]> {
  const p = part.trim()
  if (!p) return []
  // 1. Catalog
  const rows = await queryPrimary('SELECT folder_path FROM material_cert_folders WHERE part_folder = ?', [p])
  if (rows?.length) return rows.map((r: any) => r.folder_path)
  // 2. Fallback: targeted find (bounded depth, ignore errors)
  try {
    const safe = p.replace(/[^A-Za-z0-9_.-]/g, '')
    if (!safe) return []
    const { stdout } = await execAsync(
      `find "${LDRIVE_ROOT}" -maxdepth 9 -type d -name "${safe}" 2>/dev/null | head -20`,
      { timeout: 20000, maxBuffer: 1024 * 1024 }
    )
    return stdout.split('\n').map(s => s.trim()).filter(Boolean)
  } catch { return [] }
}

// Parse "PUR0003850 - LOT F1010704B.pdf" -> { po, batch }
function parsePdfName(name: string): { po: string; batch: string } | null {
  const base = name.replace(/\.pdf$/i, '')
  const m = base.split(/\s*-\s*LOT\s*/i)
  if (m.length < 2) return null
  return { po: norm(m[0]), batch: norm(m.slice(1).join(' LOT ')) }
}

// Validate a path is safely under the L drive root
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

    // Group by part to avoid repeated folder lookups
    const parts = Array.from(new Set(certs.map(c => (c.purchasedPart || '').trim()).filter(Boolean)))
    const folderCache: Record<string, { name: string; po: string; batch: string }[]> = {}

    for (const part of parts) {
      const dirs = await folderPaths(part)
      const files: { name: string; po: string; batch: string }[] = []
      for (const dir of dirs) {
        if (!isUnderRoot(dir)) continue
        try {
          const names = await fs.readdir(dir)
          for (const n of names) {
            if (!n.toLowerCase().endsWith('.pdf')) continue
            const parsed = parsePdfName(n)
            if (parsed) files.push({ name: path.join(dir, n), po: parsed.po, batch: parsed.batch })
          }
        } catch { /* skip unreadable dir */ }
      }
      folderCache[part] = files
    }

    // Match each cert -> candidate file paths (ranked best-first)
    const matches: Record<string, { path: string; name: string }[]> = {}
    for (const c of certs) {
      const key = `${c.purchasedPart}|${c.poNumber}|${c.batchSerial}`
      const files = folderCache[(c.purchasedPart || '').trim()] || []
      const po = norm(c.poNumber), batch = norm(c.batchSerial)
      const scored = files.map(f => {
        let score = 0
        if (f.po === po && f.batch === batch) score = 3            // exact PO + batch
        else if (f.po === po && (f.batch.includes(batch) || batch.includes(f.batch))) score = 2
        else if (f.batch === batch) score = 1                      // batch only
        else if (f.po === po) score = 1                            // PO only
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
