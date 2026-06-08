import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const LDRIVE_ROOT = process.env.LDRIVE_ROOT || '/mnt/ldrive'
const MAX_DEPTH = 9

// Walk the tree; record every directory that directly contains a PDF.
async function walk(dir: string, depth: number, found: { part: string; path: string; count: number }[]) {
  if (depth > MAX_DEPTH) return
  let entries: any[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch { return }

  let pdfCount = 0
  const subdirs: string[] = []
  for (const e of entries) {
    if (e.isDirectory()) subdirs.push(path.join(dir, e.name))
    else if (e.isFile() && e.name.toLowerCase().endsWith('.pdf')) pdfCount++
  }
  if (pdfCount > 0) {
    found.push({ part: path.basename(dir), path: dir, count: pdfCount })
  }
  for (const sd of subdirs) await walk(sd, depth + 1, found)
}

// GET: report catalog status
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const rows = await queryPrimary('SELECT COUNT(*) AS folders, MAX(indexed_at) AS last FROM material_cert_folders')
    return NextResponse.json({ success: true, folders: Number(rows?.[0]?.folders) || 0, lastIndexed: rows?.[0]?.last || null })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// POST: (re)build the catalog. Admin only.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin')) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const subPath = searchParams.get('subPath') || '' // optional: index only a sub-tree

  try {
    const root = subPath ? path.join(LDRIVE_ROOT, subPath) : LDRIVE_ROOT
    const found: { part: string; path: string; count: number }[] = []
    await walk(root, 0, found)

    // Upsert into catalog
    let written = 0
    for (const f of found) {
      const fullPath = f.path.substring(0, 700)
      const hash = crypto.createHash('sha1').update(fullPath).digest('hex')
      const partFolder = f.part.substring(0, 190)
      const partNorm = partFolder.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 190)
      await queryPrimary(
        `INSERT INTO material_cert_folders (part_folder, part_norm, folder_path, path_hash, file_count)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE part_folder = VALUES(part_folder), part_norm = VALUES(part_norm), folder_path = VALUES(folder_path), file_count = VALUES(file_count)`,
        [partFolder, partNorm, fullPath, hash, f.count]
      )
      written++
    }

    return NextResponse.json({ success: true, indexed: written, root })
  } catch (error) {
    console.error('Indexer error:', error)
    return NextResponse.json({ error: 'Index failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
