import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule, hasRole } from '@/lib/config/access'
import { EHS_DOCS_PATH } from '@/lib/config/drives'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Evidence documents held against a finished ASSEMBLY rather than a purchased
 * material: a customer declaration for the finished article, a test report, or
 * the process spec behind a route-step justification.
 *
 * Deliberately a separate table from ehs_part_documents. A declaration covering
 * the assembly says nothing about any one material on its BOM, and filing it
 * against a part would make it look as though it did.
 */

const canWriteEhs = (roles: string[]) => hasRole(roles, 'Admin', 'EHSadmin')
const safeName = (s: string) =>
  String(s || 'part').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')

const canRead = (roles: string[]) =>
  canReadModule(roles, 'ehs') || canReadModule(roles, 'products')

// GET ?part=... -> evidence documents held against an ASSEMBLY.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canRead((session.user as any)?.roles || [])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const part = (new URL(request.url).searchParams.get('part') || '').trim()
  if (!part) return NextResponse.json({ error: 'part is required' }, { status: 400 })

  try {
    const docs = await queryPrimary<any[]>(
      `SELECT id, apc_part, doc_type, title, file_name, file_path, file_size,
              uploaded_by, uploaded_at
         FROM ehs_product_documents WHERE apc_part = ?
        ORDER BY uploaded_at DESC`, [part])
    return NextResponse.json({ success: true, documents: docs || [] })
  } catch (error: any) {
    // A missing table is a migration that was never run, not a code fault, and
    // saying so plainly saves a trip through the container logs.
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({
        error: 'ehs_product_documents does not exist. Run sql/create_ehs_product_overrides.sql.',
      }, { status: 500 })
    }
    console.error('EHS part documents list error:', error)
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })
  }
}

// POST (multipart) -> attach a document to a part.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canWriteEhs(roles)) {
    return NextResponse.json({
      error: 'Only an EHS Admin can upload supporting documents',
    }, { status: 403 })
  }
  const user = (session.user as any)?.username || 'unknown'

  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const part = String(form.get('part') || '').trim()
    const doc_type = String(form.get('doc_type') || 'General').slice(0, 30)
    const title = String(form.get('title') || '').slice(0, 200)
    if (!file || !part) {
      return NextResponse.json({ error: 'file and part are required' }, { status: 400 })
    }

    // Same per-part folder as the material evidence, with an 'assembly'
    // subfolder so a declaration for the finished article is never mistaken
    // for evidence about one of its purchased materials.
    const dir = `${EHS_DOCS_PATH(part)}/assembly`
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (e: any) {
      // The share is a network mount; if it is absent or read-only the upload
      // cannot work and the reason is worth stating rather than surfacing as a
      // bare ENOENT.
      return NextResponse.json({
        error: `Cannot write to the evidence folder (${dir}): ${e?.code || e}. `
          + (e?.code === 'EROFS'
            ? 'That mount is read-only in the container — check docker-compose.yml.'
            : 'Check the J drive is mounted and writable by the container.'),
      }, { status: 500 })
    }

    // {docType}-{date}.{ext} inside the part's own folder, counter-suffixed
    // when a part gets more than one document of a type on the same day. The
    // part number is the folder, so repeating it in the file name adds nothing.
    const extn = (path.extname(file.name) || '.pdf').toLowerCase()
    const date = new Date().toISOString().slice(0, 10)
    const base = `${safeName(doc_type)}-${date}`
    let fileName = `${base}${extn}`
    let n = 2
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try { await fs.access(path.join(dir, fileName)); fileName = `${base}-${n++}${extn}` }
      catch { break }
    }
    const full = path.join(dir, fileName)
    const bytes = Buffer.from(await file.arrayBuffer())
    try {
      await fs.writeFile(full, bytes)
    } catch (e: any) {
      // mkdir can succeed on a path that already exists while the write still
      // fails, so the read-only case has to be caught here too.
      return NextResponse.json({
        error: `Could not write ${full}: ${e?.code || e}.`
          + (e?.code === 'EROFS' ? ' That mount is read-only in the container.' : ''),
      }, { status: 500 })
    }

    const ins = await queryPrimary<any>(
      `INSERT INTO ehs_product_documents
         (apc_part, doc_type, title, file_name, file_path, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [part, doc_type, title || file.name, fileName, full, bytes.length, user])

    return NextResponse.json({
      success: true,
      document: {
        id: Number(ins?.insertId || 0), apc_part: part, doc_type,
        title: title || file.name, file_name: fileName, file_path: full,
        file_size: bytes.length, uploaded_by: user,
      },
    })
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({
        error: 'ehs_product_documents does not exist. Run sql/create_ehs_product_overrides.sql.',
      }, { status: 500 })
    }
    console.error('EHS part document upload error:', error)
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// DELETE ?id=... -> remove the row. The file on the share is left in place
// deliberately: it may be evidence behind an assessment that has already been
// signed off, and an accidental click should not destroy it.
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canWriteEhs((session.user as any)?.roles || [])) {
    return NextResponse.json({ error: 'Only an EHS Admin can remove documents' }, { status: 403 })
  }
  const id = Number(new URL(request.url).searchParams.get('id') || 0)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  try {
    await queryPrimary('DELETE FROM ehs_product_documents WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('EHS part document delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
