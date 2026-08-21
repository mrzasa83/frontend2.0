import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import * as fs from 'fs'

const ESCF_BASE_PATH = '/mnt/jdrive/APC EngJobs/00 DocControl/escf'

// Build actual filename from request field + attachment ref
// The time colons get replaced with an unknown filesystem-safe char
// So we try multiple variants and fall back to fuzzy matching
function buildFilenameVariants(request: string, attachmentRef: string): string[] {
  const base = request || ''
  const variants = [
    `${base.replace(/:/g, '"')}_${attachmentRef}`,   // double quote
    `${base.replace(/:/g, "'")}_${attachmentRef}`,   // single quote
    `${base.replace(/:/g, '')}_${attachmentRef}`,    // removed entirely
    `${base.replace(/:/g, '-')}_${attachmentRef}`,   // dash
    `${base.replace(/:/g, '_')}_${attachmentRef}`,   // underscore
  ]
  return variants
}

// Normalize a filename for fuzzy comparison: strip non-alphanumeric except dots and underscores
function normalizeForMatch(name: string): string {
  return name.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase()
}

function findFile(request: string, attachmentRef: string, allFiles: string[]): string | null {
  // Try exact variants first
  const variants = buildFilenameVariants(request, attachmentRef)
  for (const v of variants) {
    if (allFiles.includes(v)) return v
  }

  // Fuzzy match: normalize both sides and compare
  // Expected skeleton: remove all non-alphanumeric except dots/underscores
  const expectedNorm = normalizeForMatch(`${request}_${attachmentRef}`)

  for (const f of allFiles) {
    if (normalizeForMatch(f) === expectedNorm) return f
  }

  // Partial match: check if file contains the attachment ref and starts with dept prefix
  const dept = request.split('.')[0] || ''
  for (const f of allFiles) {
    if (f.toLowerCase().startsWith(dept.toLowerCase() + '.') &&
        f.toLowerCase().endsWith(attachmentRef.toLowerCase())) {
      return f
    }
  }

  return null
}

// GET: fetch attachment info or download a file
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const escfId = searchParams.get('escfId')
  const download = searchParams.get('download')
  const downloadFile = searchParams.get('filename')

  // Download mode — stream the file
  if (download === 'true' && downloadFile) {
    // Try exact path first, then fuzzy match in directory
    let fullPath = `${ESCF_BASE_PATH}/${downloadFile}`
    try {
      if (!fs.existsSync(fullPath)) {
        // Fuzzy: find file by normalized name match
        const norm = normalizeForMatch(downloadFile)
        const dirFiles = fs.readdirSync(ESCF_BASE_PATH)
        const match = dirFiles.find(f => normalizeForMatch(f) === norm)
        if (match) {
          fullPath = `${ESCF_BASE_PATH}/${match}`
        }
      }
      if (!fs.existsSync(fullPath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      const buffer = fs.readFileSync(fullPath)
      const ext = downloadFile.split('.').pop()?.toLowerCase() || ''
      const mimeTypes: Record<string, string> = {
        pdf: 'application/pdf',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ppt: 'application/vnd.ms-powerpoint',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        doc: 'application/msword',
        msg: 'application/vnd.ms-outlook',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', bmp: 'image/bmp',
        txt: 'text/plain', csv: 'text/csv',
      }
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${encodeURIComponent(downloadFile)}"`,
          'Content-Length': String(buffer.length),
        },
      })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
    }
  }

  // List mode
  if (!escfId) return NextResponse.json({ error: 'escfId required' }, { status: 400 })

  const attachmentsRaw = searchParams.get('attachments') || ''
  const requestField = searchParams.get('request') || ''

  try {
    // Get local metadata (descriptions)
    const meta = await queryPrimary(
      'SELECT * FROM escf_attachments WHERE escf_id = ? ORDER BY filename ASC',
      [escfId]
    )

    // Scan the ESCF attachment directory
    let allDirFiles: string[] = []
    try {
      if (fs.existsSync(ESCF_BASE_PATH)) {
        allDirFiles = fs.readdirSync(ESCF_BASE_PATH)
      }
    } catch {}

    // Parse attachment refs and find matching files on disk
    const refs = attachmentsRaw.split(',').map(s => s.trim()).filter(s => s)

    const files = refs.map(ref => {
      const matchedName = findFile(requestField, ref, allDirFiles)
      let size = 0, modified = ''
      if (matchedName) {
        try {
          const stat = fs.statSync(`${ESCF_BASE_PATH}/${matchedName}`)
          size = stat.size
          modified = stat.mtime.toISOString()
        } catch {}
      }
      return {
        ref,
        actualName: matchedName || `${requestField.replace(/:/g, '')}_${ref}`,
        found: !!matchedName,
        size,
        modified,
      }
    })

    return NextResponse.json({
      success: true,
      escfId: Number(escfId),
      metadata: meta,
      files,
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
