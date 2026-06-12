import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { FILE_SERVE_ALLOWED_BASES } from '@/lib/config/drives'

const execFileAsync = promisify(execFile)

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const ALLOWED_BASES = FILE_SERVE_ALLOWED_BASES()
// Office formats LibreOffice can render to PDF
const CONVERTIBLE = ['doc', 'docx', 'ppt', 'pptx', 'odt', 'odp', 'ods', 'xls', 'xlsx', 'rtf']
const CACHE_DIR = path.join(os.tmpdir(), 'lo-pdf-cache')
const SOFFICE = process.env.SOFFICE_BIN || 'soffice'

// GET ?path=<office file> : returns a converted PDF (inline), cached by path+mtime
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    if (!filePath) return NextResponse.json({ error: 'File path is required' }, { status: 400 })

    const normalizedPath = path.normalize(filePath)
    if (!ALLOWED_BASES.some(base => normalizedPath.startsWith(base))) {
      return NextResponse.json({ error: 'Access denied to this path' }, { status: 403 })
    }
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    const ext = path.extname(normalizedPath).toLowerCase().replace(/^\./, '')
    if (!CONVERTIBLE.includes(ext)) {
      return NextResponse.json({ error: `Cannot convert .${ext} files` }, { status: 400 })
    }

    // Cache key from path + mtime, so edits invalidate the cached PDF
    const stat = fs.statSync(normalizedPath)
    const hash = crypto.createHash('sha1').update(`${normalizedPath}:${stat.mtimeMs}`).digest('hex')
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    const cachedPdf = path.join(CACHE_DIR, `${hash}.pdf`)

    if (!fs.existsSync(cachedPdf)) {
      // Convert with a unique LibreOffice profile dir to avoid concurrency locks
      const work = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-'))
      try {
        const profile = path.join(work, 'profile')
        await execFileAsync(SOFFICE, [
          '--headless', '--norestore', '--nologo', '--nofirststartwizard',
          `-env:UserInstallation=file://${profile}`,
          '--convert-to', 'pdf',
          '--outdir', work,
          normalizedPath,
        ], { timeout: 110000, maxBuffer: 1024 * 1024 * 8, env: { ...process.env, HOME: work } })

        // LibreOffice names the output <basename>.pdf
        const base = path.basename(normalizedPath, path.extname(normalizedPath))
        const producedPdf = path.join(work, `${base}.pdf`)
        if (!fs.existsSync(producedPdf)) throw new Error('Conversion produced no output')
        fs.copyFileSync(producedPdf, cachedPdf)
      } finally {
        try { fs.rmSync(work, { recursive: true, force: true }) } catch { /* ignore */ }
      }
    }

    const pdf = fs.readFileSync(cachedPdf)
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.basename(normalizedPath, path.extname(normalizedPath))}.pdf"`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error: any) {
    console.error('Convert error:', error)
    const msg = error?.killed ? 'Conversion timed out' : (error?.message || 'Conversion failed')
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
