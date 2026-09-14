import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { windowsToLinuxPath, FILE_SERVE_ALLOWED_BASES } from '@/lib/config/drives'
import { ingestScannedNote, pathHash, type ScannedNote } from '@/lib/products/drawingNotes'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execFileAsync = promisify(execFile)
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const PYTHON = process.env.PYTHON_BIN || 'python3'
const SCANNER = path.join(process.cwd(), 'scripts', 'scan_drawing_notes.py')

/**
 * POST — "Archive Drawing Notes" on a released PDF.
 *
 * Body: { file_path, file_name, apc_part, customer, customer_part?, allow_ocr? }
 *
 * Two-phase by design. The first call reads the PDF text layer only. If the
 * pages carry no text the scanner returns needs_ocr and stops, and this hands
 * that back so the UI can ask. OCR on a D-size drawing is slow and its output
 * usually needs correcting, so running it silently would put mangled text in
 * front of an approver with nothing to signal it deserves a harder look.
 *
 * Everything ingested lands Pending. A scan proposes; a person approves.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const user = (session.user as any)?.username || 'unknown'

  let scanId = 0
  try {
    const b = await request.json()
    const rawPath = String(b?.file_path ?? '').trim()
    const fileName = String(b?.file_name ?? '').trim()
    const apcPart = String(b?.apc_part ?? '').trim()
    const customer = String(b?.customer ?? '').trim()
    const customerPart = String(b?.customer_part ?? '').trim()
    const allowOcr = b?.allow_ocr === true

    if (!rawPath) return NextResponse.json({ error: 'file_path is required' }, { status: 400 })
    if (!apcPart) return NextResponse.json({ error: 'apc_part is required' }, { status: 400 })
    if (!/\.pdf$/i.test(fileName || rawPath)) {
      return NextResponse.json({
        error: 'Drawing notes can only be archived from a PDF.',
      }, { status: 400 })
    }

    // Same path handling as the file preview: accept a Windows UNC path and
    // confine the result to the configured shares, so this can't be pointed at
    // an arbitrary file on the server.
    const linuxPath = windowsToLinuxPath(rawPath)
    const allowed = FILE_SERVE_ALLOWED_BASES()
    const resolved = path.resolve(linuxPath)
    if (!allowed.some(base => resolved.startsWith(path.resolve(base)))) {
      return NextResponse.json({ error: 'That path is outside the allowed shares.' }, { status: 403 })
    }

    const args = [SCANNER, resolved]
    if (allowOcr) args.push('--allow-ocr')

    let parsed: any
    try {
      const { stdout } = await execFileAsync(PYTHON, args, {
        timeout: allowOcr ? 280_000 : 120_000,
        maxBuffer: 20 * 1024 * 1024,
      })
      parsed = JSON.parse(stdout)
    } catch (e: any) {
      const msg = e?.killed
        ? 'The scan timed out. A large drawing with OCR can exceed the limit — try a single page.'
        : `Scanner failed: ${e?.message || String(e)}`
      await recordScan({ apcPart, customer, rawPath, fileName, user, status: 'error', message: msg })
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    if (parsed.status === 'needs_ocr') {
      await recordScan({
        apcPart, customer, rawPath, fileName, user,
        status: 'needs_ocr', message: parsed.message, pages: parsed.pages,
      })
      // Not an error — a question. The client offers the OCR re-run.
      return NextResponse.json({
        success: true, needsOcr: true, message: parsed.message,
        pages: parsed.pages, ocr_pages: parsed.ocr_pages,
        debug: parsed.debug,
        encrypted: parsed.encrypted,
        extraction_allowed: parsed.extraction_allowed,
      })
    }

    if (parsed.status === 'error') {
      await recordScan({ apcPart, customer, rawPath, fileName, user, status: 'error', message: parsed.message })
      return NextResponse.json({ error: parsed.message }, { status: 500 })
    }

    const notes: ScannedNote[] = parsed.notes || []

    // Log the outcome of EVERY scan. A run that finds nothing is not an error,
    // so nothing was written and the container logs showed no trace of it at
    // all — which makes an empty result impossible to investigate after the
    // fact.
    console.log('[drawing-notes] scan', JSON.stringify({
      part: apcPart, file: fileName, status: parsed.status,
      pages: parsed.pages, notes: notes.length, ocr: !!parsed.ocr_used,
      encrypted: parsed.encrypted, extraction_allowed: parsed.extraction_allowed,
      decrypt_note: parsed.decrypt_note || undefined,
      debug: parsed.debug,
    }))

    if (!notes.length) {
      await recordScan({
        apcPart, customer, rawPath, fileName, user,
        status: 'empty', pages: parsed.pages,
        message: 'No numbered notes block found.',
      })
      return NextResponse.json({
        success: true, results: [], pages: parsed.pages,
        message: parsed.message
          || 'No numbered notes block was found in that PDF. '
             + 'If the notes are there but unreadable, the page may be an image — try OCR.',
        canRetryWithOcr: !allowOcr,
        debug: parsed.debug,
        encrypted: parsed.encrypted,
        extraction_allowed: parsed.extraction_allowed,
        decrypt_note: parsed.decrypt_note,
      })
    }

    const results = []
    for (const n of notes) {
      try {
        results.push(await ingestScannedNote(n, {
          apcPart, customerPart, customer,
          pdfPath: rawPath, pdfName: fileName || path.basename(resolved), user,
        }))
      } catch (e) {
        console.error('Drawing note ingest failed for note', n.note_number, e)
      }
    }

    const created = results.filter(r => r.isNew).length
    await recordScan({
      apcPart, customer, rawPath, fileName, user,
      status: 'ok', pages: parsed.pages, ocrUsed: !!parsed.ocr_used,
      found: notes.length, created, linked: results.length - created,
    })

    return NextResponse.json({
      success: true,
      pages: parsed.pages,
      grid: parsed.grid,
      ocr_used: !!parsed.ocr_used,
      found: notes.length,
      created,
      linked: results.length - created,
      results,
    })
  } catch (error) {
    console.error('Drawing note scan error:', error)
    return NextResponse.json({
      error: 'Scan failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  } finally {
    void scanId
  }
}

/**
 * Every scan is recorded, including the ones that found nothing.
 * Otherwise "we scanned that drawing and it had no notes" is indistinguishable
 * from "nobody ever scanned it".
 */
async function recordScan(o: {
  apcPart: string; customer: string; rawPath: string; fileName: string
  user: string; status: string; message?: string; pages?: number
  ocrUsed?: boolean; found?: number; created?: number; linked?: number
}) {
  try {
    await queryPrimary(
      `INSERT INTO drawing_note_scans
         (apc_part_number, customer, pdf_path, pdf_path_hash, pdf_name, pages,
          ocr_used, notes_found, notes_new, notes_linked, status, message, scanned_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [o.apcPart, o.customer, o.rawPath, pathHash(o.rawPath), o.fileName,
        o.pages || 0, o.ocrUsed ? 1 : 0, o.found || 0, o.created || 0,
        o.linked || 0, o.status, (o.message || '').slice(0, 600), o.user]
    )
  } catch (e) {
    console.error('Could not record the drawing-note scan run:', e)
  }
}
