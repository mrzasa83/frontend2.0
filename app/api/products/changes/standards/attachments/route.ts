import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import * as fs from 'fs'

const ESCF_BASE_PATH = '/mnt/jdrive/APC EngJobs/00 DocControl/escf'

// Match attachment ref (e.g. "74939.pptx") to actual files on disk
// Actual filename pattern: {ref_base}.{date}.{time}_{desc}.{ext}
// e.g. "74939.pptx" matches "74939.27Dec2023.11'39'06_74939layout.pptx"
function findMatchingFiles(
  allFiles: { name: string; size: number; modified: string; dir: string }[],
  attachmentRef: string
): { name: string; size: number; modified: string; dir: string }[] {
  const dotIdx = attachmentRef.lastIndexOf('.')
  if (dotIdx < 0) {
    // No extension — match prefix only
    return allFiles.filter(f => f.name.startsWith(attachmentRef))
  }
  const base = attachmentRef.substring(0, dotIdx)  // "74939"
  const ext = attachmentRef.substring(dotIdx)       // ".pptx"

  return allFiles.filter(f => {
    // Exact match
    if (f.name === attachmentRef) return true
    // Prefix match: starts with "74939." (or "74939_") and ends with ".pptx"
    if ((f.name.startsWith(base + '.') || f.name.startsWith(base + '_')) &&
        f.name.toLowerCase().endsWith(ext.toLowerCase())) return true
    return false
  })
}

// GET: fetch attachments for an ESCF, with fuzzy file matching
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const escfId = searchParams.get('escfId')
  const attachmentsRaw = searchParams.get('attachments') || ''

  if (!escfId) return NextResponse.json({ error: 'escfId required' }, { status: 400 })

  try {
    // Get local metadata (descriptions)
    const meta = await queryPrimary(
      'SELECT * FROM escf_attachments WHERE escf_id = ? ORDER BY filename ASC',
      [escfId]
    )

    // Scan disk — check both flat dir and per-id subdir
    const allFiles: { name: string; size: number; modified: string; dir: string }[] = []
    const dirsToScan = [
      ESCF_BASE_PATH,
      `${ESCF_BASE_PATH}/${escfId}`,
    ]
    for (const dir of dirsToScan) {
      try {
        if (fs.existsSync(dir)) {
          for (const entry of fs.readdirSync(dir)) {
            try {
              const full = `${dir}/${entry}`
              const stat = fs.statSync(full)
              if (stat.isFile()) {
                allFiles.push({
                  name: entry,
                  size: stat.size,
                  modified: stat.mtime.toISOString(),
                  dir,
                })
              }
            } catch {}
          }
        }
      } catch {}
    }

    // Parse attachment refs and match to files
    const refs = attachmentsRaw.split(',').map(s => s.trim()).filter(s => s)
    const matched: {
      ref: string
      files: { name: string; size: number; modified: string; dir: string }[]
    }[] = refs.map(ref => ({
      ref,
      files: findMatchingFiles(allFiles, ref),
    }))

    return NextResponse.json({
      success: true,
      escfId: Number(escfId),
      metadata: meta,
      matched,
      basePath: ESCF_BASE_PATH,
    })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({
      error: 'Failed to fetch', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST: upsert attachment metadata (description)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { escfId, filename, description } = await request.json()
    if (!escfId || !filename) {
      return NextResponse.json({ error: 'escfId and filename required' }, { status: 400 })
    }

    const username = (session.user as any)?.username || session.user?.name || 'unknown'

    await queryPrimary(`
      INSERT INTO escf_attachments (escf_id, filename, description, created_by)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE description = VALUES(description), updated_at = CURRENT_TIMESTAMP
    `, [escfId, filename, description || null, username])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving attachment meta:', error)
    return NextResponse.json({
      error: 'Failed to save', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
