import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import * as fs from 'fs'

const ESCF_BASE_PATH = '/mnt/jdrive/APC EngJobs/00 DocControl/escf'

// Build actual filename from request field + attachment ref
// Pattern: {request_with_colons_as_quotes}_{attachment_value}
// Example: request="AOI-Puch.01Dec2020.11:12:55", attachment="74939.pptx"
//        → "AOI-Puch.01Dec2020.11"12"55_74939.pptx"
function buildActualFilename(request: string, attachmentRef: string): string {
  const sanitizedRequest = (request || '').replace(/:/g, '"')
  return `${sanitizedRequest}_${attachmentRef}`
}

function findFile(filename: string): { path: string; size: number; modified: string } | null {
  // Check flat directory first, then subdirectories
  const candidates = [
    `${ESCF_BASE_PATH}/${filename}`,
  ]
  for (const fullPath of candidates) {
    try {
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath)
        return { path: fullPath, size: stat.size, modified: stat.mtime.toISOString() }
      }
    } catch {}
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
    const fullPath = `${ESCF_BASE_PATH}/${downloadFile}`
    try {
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

    // Parse attachment refs and build actual filenames
    const refs = attachmentsRaw.split(',').map(s => s.trim()).filter(s => s)

    const files = refs.map(ref => {
      const actualName = buildActualFilename(requestField, ref)
      const diskInfo = findFile(actualName)
      return {
        ref,
        actualName,
        found: !!diskInfo,
        size: diskInfo?.size || 0,
        modified: diskInfo?.modified || '',
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
