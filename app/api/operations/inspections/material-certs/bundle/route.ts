import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import { buildZip, uniqueNames } from '@/lib/certs/zip'

export const dynamic = 'force-dynamic'

const LDRIVE_ROOT = process.env.LDRIVE_ROOT || '/mnt/ldrive'
/** A certificate pack for one job; well above any real count, low enough that
 *  a bad request cannot ask the server to read the whole archive. */
const MAX_FILES = 300

/**
 * Bundles the certificates for a traceability result into one download.
 *
 *   mode=pdf   every cert merged into a single PDF, in the order given
 *   mode=zip   the original files, untouched, in a ZIP
 *
 * Both exist on purpose. A merged PDF is what gets attached to a customer
 * submission; the ZIP keeps each certificate byte-for-byte as the supplier
 * issued it, which is what an auditor asks for when the merged copy is
 * questioned.
 *
 * Paths are validated exactly as the single-file download route does: they
 * must resolve under LDRIVE_ROOT and end in .pdf. The client sends paths, so
 * this is the only thing standing between a crafted request and the rest of
 * the filesystem — it is deliberately a whitelist on the resolved path, not a
 * check on the string that came in.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await request.json() } catch { body = null }

  const mode = body?.mode === 'zip' ? 'zip' : 'pdf'
  const name = String(body?.name || 'certificates').replace(/[^\w.-]+/g, '_').slice(0, 80)
  const rawPaths: string[] = Array.isArray(body?.paths) ? body.paths : []

  if (!rawPaths.length) {
    return NextResponse.json({ error: 'No files requested' }, { status: 400 })
  }
  if (rawPaths.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (${rawPaths.length}); limit is ${MAX_FILES}` }, { status: 400 })
  }

  const root = path.resolve(LDRIVE_ROOT) + path.sep
  const safe: string[] = []
  for (const p of rawPaths) {
    const resolved = path.resolve(String(p || ''))
    if (resolved.startsWith(root) && resolved.toLowerCase().endsWith('.pdf')) {
      // De-duplicate: one lot can be reached by several rows, and a cert
      // repeated twenty times in a merged pack is worse than useless.
      if (!safe.includes(resolved)) safe.push(resolved)
    }
  }
  if (!safe.length) {
    return NextResponse.json({ error: 'No valid certificate paths' }, { status: 400 })
  }

  // Read what we can. A missing or unreadable file is reported, not fatal —
  // a pack of 14 of 15 certs with the gap named beats no pack at all.
  const files: { file: string; data: Buffer }[] = []
  const skipped: { file: string; reason: string }[] = []
  for (const p of safe) {
    try {
      files.push({ file: path.basename(p), data: await fs.readFile(p) })
    } catch (e) {
      skipped.push({ file: path.basename(p), reason: e instanceof Error ? e.message : String(e) })
    }
  }
  if (!files.length) {
    return NextResponse.json(
      { error: 'None of the certificate files could be read', skipped }, { status: 404 })
  }

  try {
    if (mode === 'zip') {
      const names = uniqueNames(files.map(f => f.file))
      const zip = buildZip(files.map((f, i) => ({ name: names[i], data: f.data })))
      return new NextResponse(new Uint8Array(zip), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${name}.zip"`,
          // Tells the UI what was left out without a second round trip.
          'X-Skipped-Count': String(skipped.length),
        },
      })
    }

    const merged = await PDFDocument.create()
    for (const f of files) {
      try {
        // ignoreEncryption: supplier certs are often protected against
        // editing. That flag is about copying pages out, not defeating a
        // password — an actually encrypted file still throws and is skipped.
        const src = await PDFDocument.load(f.data, { ignoreEncryption: true })
        const pages = await merged.copyPages(src, src.getPageIndices())
        pages.forEach(pg => merged.addPage(pg))
      } catch (e) {
        skipped.push({ file: f.file, reason: e instanceof Error ? e.message : String(e) })
      }
    }
    if (!merged.getPageCount()) {
      return NextResponse.json(
        { error: 'No certificate could be merged', skipped }, { status: 422 })
    }

    const out = await merged.save()
    return new NextResponse(new Uint8Array(out), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}.pdf"`,
        'X-Skipped-Count': String(skipped.length),
      },
    })
  } catch (error) {
    console.error('Error bundling certificates:', error)
    return NextResponse.json({
      error: 'Failed to build the bundle',
      details: error instanceof Error ? error.message : String(error),
      skipped,
    }, { status: 500 })
  }
}
