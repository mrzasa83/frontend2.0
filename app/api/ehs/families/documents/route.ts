import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { MTRL_COMP_PATH } from '@/lib/config/drives'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const canWriteEhs = (roles: string[]) => roles.includes('Admin') || roles.includes('EHSadmin')

/** Filesystem-safe version of a family name for use in a file name. */
const safeName = (s: string) => String(s || 'family').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')

// POST (multipart) -> store an evidence document for a family.
// Saved as  S:\FrontEndQCFolders\MtrlComp\{familyName}-{date}.pdf
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canWriteEhs(roles)) {
    return NextResponse.json({ error: 'Only an EHS Admin can upload supporting documents' }, { status: 403 })
  }

  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const family_id = Number(form.get('family_id'))
    const doc_type = String(form.get('doc_type') || 'General').slice(0, 30)
    const title = String(form.get('title') || '').slice(0, 200)
    if (!file || !family_id) {
      return NextResponse.json({ error: 'file and family_id are required' }, { status: 400 })
    }

    const fam = await queryPrimary<any[]>(
      'SELECT family_name FROM ehs_part_families WHERE id = ? LIMIT 1', [family_id]
    )
    if (!fam?.length) return NextResponse.json({ error: 'Family not found' }, { status: 404 })

    const dir = MTRL_COMP_PATH()
    await fs.mkdir(dir, { recursive: true })

    // {familyName}-{date}.{ext}, de-duplicated with a counter when the same
    // family gets more than one document on the same day.
    const ext = (path.extname(file.name) || '.pdf').toLowerCase()
    const date = new Date().toISOString().slice(0, 10)
    const base = `${safeName(fam[0].family_name)}-${date}`
    let fileName = `${base}${ext}`
    let n = 2
    while (true) {
      try { await fs.access(path.join(dir, fileName)); fileName = `${base}-${n++}${ext}` }
      catch { break }
    }
    const full = path.join(dir, fileName)

    const bytes = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(full, bytes)

    await queryPrimary(
      `INSERT INTO ehs_family_documents
         (family_id, doc_type, title, file_name, file_path, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [family_id, doc_type, title, fileName, full, bytes.length,
       (session.user as any)?.username || 'unknown']
    )
    return NextResponse.json({ success: true, file_name: fileName, file_path: full })
  } catch (error) {
    console.error('EHS document upload error:', error)
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// DELETE ?id=N -> remove the index row. The file on the S drive is left in
// place deliberately: evidence should not vanish from the archive on a click.
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canWriteEhs(roles)) {
    return NextResponse.json({ error: 'Only an EHS Admin can remove documents' }, { status: 403 })
  }
  try {
    const id = Number(new URL(request.url).searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await queryPrimary('DELETE FROM ehs_family_documents WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('EHS document delete error:', error)
    return NextResponse.json({ error: 'Failed to remove', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
