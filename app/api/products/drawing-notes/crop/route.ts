import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { windowsToLinuxPath, FILE_SERVE_ALLOWED_BASES } from '@/lib/config/drives'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const execFileAsync = promisify(execFile)
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const PYTHON = process.env.PYTHON_BIN || 'python3'
const SCANNER = path.join(process.cwd(), 'scripts', 'scan_drawing_notes.py')

/**
 * Where rendered note crops are cached. Re-rendering a region of a D-size PDF
 * on every view would be slow and pointless, since a released drawing doesn't
 * change.
 *
 * /tmp, not /var/lib: the container runs Next.js as a non-root user, so mkdir
 * under /var/lib fails with EACCES and every crop 500s. The deployed
 * containers already bind-mount a writable /tmp/<app>-work, which is the
 * natural home for a cache — it is meant to be disposable, and a lost crop
 * just re-renders.
 *
 * Override with DRAWING_NOTE_IMAGE_DIR to keep them somewhere durable.
 */
const CACHE_DIR = process.env.DRAWING_NOTE_IMAGE_DIR
  || path.join(process.env.WORK_DIR || '/tmp', 'drawing-note-crops')

/**
 * GET ?source_id=N — the note as it appears on the sheet, cropped to its bbox.
 *
 * Rendered on demand from the stored bbox rather than at scan time: the box
 * can be corrected by an approver, and the image should follow it.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sourceId = Number(new URL(request.url).searchParams.get('source_id') || 0)
  if (!sourceId) return NextResponse.json({ error: 'source_id required' }, { status: 400 })

  try {
    const rows = await queryPrimary<any[]>(
      `SELECT id, pdf_path, page_no, bbox_x0, bbox_y0, bbox_x1, bbox_y1
         FROM drawing_note_sources WHERE id = ? LIMIT 1`, [sourceId])
    const s = rows?.[0]
    if (!s) return NextResponse.json({ error: 'Sighting not found' }, { status: 404 })
    if (s.bbox_x0 === null || s.bbox_x1 === null) {
      return NextResponse.json({
        error: 'No position was recorded for this note, so it cannot be cropped.',
      }, { status: 409 })
    }

    const linuxPath = windowsToLinuxPath(String(s.pdf_path || ''))
    const resolved = path.resolve(linuxPath)
    const allowed = FILE_SERVE_ALLOWED_BASES()
    if (!allowed.some(base => resolved.startsWith(path.resolve(base)))) {
      return NextResponse.json({ error: 'Source PDF is outside the allowed shares.' }, { status: 403 })
    }
    if (!existsSync(resolved)) {
      return NextResponse.json({
        error: 'The source drawing is no longer at the recorded path.',
      }, { status: 404 })
    }

    // Cache key covers the box as well as the file, so a corrected bbox
    // renders afresh instead of serving the old crop.
    const key = crypto.createHash('sha1')
      .update(`${s.pdf_path}|${s.page_no}|${s.bbox_x0},${s.bbox_y0},${s.bbox_x1},${s.bbox_y1}`)
      .digest('hex')
    const outFile = path.join(CACHE_DIR, `${key}.png`)

    if (!existsSync(outFile)) {
      try {
        await mkdir(CACHE_DIR, { recursive: true })
      } catch (e: any) {
        return NextResponse.json({
          error: `Cannot write the image cache at ${CACHE_DIR} (${e?.code || 'error'}). `
            + 'Set DRAWING_NOTE_IMAGE_DIR to a directory the container can write to.',
        }, { status: 500 })
      }
      const spec = `${s.page_no},${s.bbox_x0},${s.bbox_y0},${s.bbox_x1},${s.bbox_y1}`
      const { stdout } = await execFileAsync(
        PYTHON, [SCANNER, resolved, '--crop', spec, '--out', outFile],
        { timeout: 90_000, maxBuffer: 4 * 1024 * 1024 }
      )
      const res = JSON.parse(stdout || '{}')
      if (res.status !== 'ok') {
        return NextResponse.json({
          error: res.message || 'Could not render the note image.',
        }, { status: 500 })
      }
      if (!existsSync(outFile)) {
        return NextResponse.json({
          error: 'The renderer reported success but produced no image. '
            + 'Check that poppler-utils is installed in the container.',
        }, { status: 500 })
      }
      await queryPrimary(
        'UPDATE drawing_note_sources SET image_path = ? WHERE id = ?',
        [outFile, sourceId]
      )
    }

    const png = await readFile(outFile)
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=86400',
        'Content-Disposition': `inline; filename="note-${sourceId}.png"`,
      },
    })
  } catch (error) {
    console.error('Drawing note crop error:', error)
    return NextResponse.json({
      error: 'Failed to render the note image',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
