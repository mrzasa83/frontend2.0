import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execFileAsync = promisify(execFile)
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const PYTHON = process.env.PYTHON_BIN || 'python3'
const SCANNER = path.join(process.cwd(), 'scripts', 'scan_po_clauses.py')

// POST -> scan the latest version file of a PO for called-out clauses.
// Body: { po_number, customer }. Returns detected clauses matched against the
// catalog. Advisory: results are suggestions the user accepts/rejects; we record
// the scan run but do NOT auto-insert relations.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'contract')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const b = await request.json()
    const po_number = String(b?.po_number ?? '').trim()
    const customer = String(b?.customer ?? '').trim()
    const chosenPath = String(b?.file_path ?? '').trim()
    if (!po_number || !customer) {
      return NextResponse.json({ error: 'po_number and customer required' }, { status: 400 })
    }
    const user = (session.user as any)?.username || 'unknown'

    // All PDF files for this PO, newest/highest-version first.
    const allFiles = await queryPrimary<any[]>(
      `SELECT version_label, file_name, file_path
       FROM po_cert_files
       WHERE customer_part = ? AND po_folder = ?
       ORDER BY version_rank DESC, file_mtime DESC`,
      [po_number, customer]
    )
    const pdfs = (allFiles || []).filter(f => /\.pdf$/i.test(f.file_name || f.file_path || ''))
    if (!pdfs.length) {
      return NextResponse.json({ error: 'No PDF files found for this PO' }, { status: 404 })
    }

    // Pick the file: the chosen one if provided, else latest. If multiple PDFs
    // exist and none chosen, ask the client to let the user select.
    let f: any
    if (chosenPath) {
      f = pdfs.find(x => x.file_path === chosenPath)
      if (!f) return NextResponse.json({ error: 'Chosen file not found for this PO' }, { status: 404 })
    } else if (pdfs.length > 1) {
      return NextResponse.json({
        success: true, needsFileChoice: true,
        files: pdfs.map(p => ({ file_name: p.file_name, file_path: p.file_path, version_label: p.version_label })),
      })
    } else {
      f = pdfs[0]
    }

    // Run the Python scanner (text-extract first, OCR image pages).
    let scan: any
    try {
      const { stdout } = await execFileAsync(PYTHON, [SCANNER, f.file_path], {
        timeout: 280000, maxBuffer: 1024 * 1024 * 16,
      })
      scan = JSON.parse(stdout)
    } catch (e: any) {
      await recordScan(po_number, customer, f, null, null, 0, 'error', String(e?.message || e), user)
      return NextResponse.json({ error: 'Scan failed', details: String(e?.message || e) }, { status: 500 })
    }

    if (scan.status !== 'ok') {
      await recordScan(po_number, customer, f, scan.pages, scan.ocr_pages, 0, 'error', scan.message || 'scan error', user)
      return NextResponse.json({ error: 'Scan error', details: scan.message }, { status: 500 })
    }

    // Match detected clause numbers against the catalog. A number may match more
    // than one standard (e.g. FAR vs NGC listing) — return all, let the user pick.
    const detected: { number: string; standard_hint: string }[] = scan.clauses || []
    const numbers = Array.from(new Set(detected.map(d => normNum(d.number)))).filter(Boolean)

    let matches: any[] = []
    if (numbers.length) {
      const placeholders = numbers.map(() => '?').join(',')
      matches = await queryPrimary<any[]>(
        `SELECT id, standard, clause_number, title, classification
         FROM contract_clauses
         WHERE REPLACE(UPPER(clause_number),' ','') IN (${placeholders})`,
        numbers
      )
    }

    // Which detected numbers matched the catalog vs. were only pattern hits.
    const matchedNums = new Set(matches.map(m => normNum(m.clause_number)))
    const unmatched = detected
      .filter(d => !matchedNums.has(normNum(d.number)))
      .map(d => ({ number: d.number, standard_hint: d.standard_hint }))

    // Which of the matched clauses are ALREADY related to this PO.
    const existing = await queryPrimary<any[]>(
      'SELECT clause_id FROM contract_po_clauses WHERE po_number = ? AND customer = ?',
      [po_number, customer]
    )
    const existingIds = new Set((existing || []).map(e => e.clause_id))
    const suggestions = matches.map(m => ({
      ...m, confidence: 'catalog', already_related: existingIds.has(m.id),
    }))

    await recordScan(po_number, customer, f, scan.pages, scan.ocr_pages, matches.length, 'ok', '', user)

    return NextResponse.json({
      success: true,
      scanned_file: f.file_name,
      version: f.version_label,
      pages: scan.pages, ocr_pages: scan.ocr_pages,
      suggestions,     // catalog matches (accept to relate)
      unmatched,       // pattern hits with no catalog clause (informational)
    })
  } catch (error) {
    console.error('PO scan error:', error)
    return NextResponse.json({ error: 'Scan failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// POST accept: the client posts accepted suggestions back to /clauses to insert
// (reusing that endpoint), so this route only scans + suggests.

function normNum(s: string) { return String(s || '').toUpperCase().replace(/\s/g, '') }

async function recordScan(po: string, cust: string, f: any, pages: number | null, ocr: number | null,
                          matches: number, status: string, message: string, user: string) {
  try {
    await queryPrimary(
      `INSERT INTO contract_po_scans
         (po_number, customer, version_label, file_name, file_path, pages, ocr_pages, matches_found, status, message, scanned_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [po, cust, f.version_label || '', f.file_name || '', f.file_path || '', pages, ocr, matches, status, message.slice(0, 500), user]
    )
  } catch { /* scan logging is best-effort */ }
}
