import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule } from '@/lib/config/access'
import { windowsToLinuxPath, FILE_SERVE_ALLOWED_BASES } from '@/lib/config/drives'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execFileAsync = promisify(execFile)
export const dynamic = 'force-dynamic'
export const maxDuration = 180

const PYTHON = process.env.PYTHON_BIN || 'python3'
const SCANNER = path.join(process.cwd(), 'scripts', 'scan_drawing_notes.py')

/**
 * POST — explain why a PDF does or doesn't yield text. Reads nothing, writes
 * nothing.
 *
 * "The viewer lets me select the text but the scan sees none" has several
 * causes that are indistinguishable from the outside: a copy:no permission
 * flag, a font with no ToUnicode map, a page that is genuinely a scanned
 * image, or a raster too large for tesseract. This reports which one it is
 * instead of leaving it to guesswork.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const b = await request.json()
    const rawPath = String(b?.file_path ?? '').trim()
    if (!rawPath) return NextResponse.json({ error: 'file_path is required' }, { status: 400 })

    const resolved = path.resolve(windowsToLinuxPath(rawPath))
    const allowed = FILE_SERVE_ALLOWED_BASES()
    if (!allowed.some(base => resolved.startsWith(path.resolve(base)))) {
      return NextResponse.json({ error: 'That path is outside the allowed shares.' }, { status: 403 })
    }

    // dump=true also returns every extracted line with its coordinates. That
    // is the artefact worth sending to someone who can't see the drawing: a
    // screenshot shows the layout, but only the text layer shows what the
    // scanner actually had to work with.
    const wantDump = b?.dump === true
    const page = Number(b?.page || 0)

    const { stdout } = await execFileAsync(PYTHON, [SCANNER, resolved, '--diagnose'], {
      timeout: 150_000, maxBuffer: 8 * 1024 * 1024,
    })
    const report: any = { success: true, ...JSON.parse(stdout) }

    if (wantDump) {
      const args = [SCANNER, resolved, '--dump']
      if (page) args.push('--page', String(page))
      try {
        const dump = await execFileAsync(PYTHON, args, {
          timeout: 150_000, maxBuffer: 24 * 1024 * 1024,
        })
        report.dump = JSON.parse(dump.stdout)
      } catch (e) {
        report.dump_error = e instanceof Error ? e.message : String(e)
      }
    }
    return NextResponse.json(report)
  } catch (error) {
    console.error('Drawing note diagnose error:', error)
    return NextResponse.json({
      error: 'Diagnose failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
