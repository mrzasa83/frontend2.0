import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { revRankOf } from '@/lib/certs/customerPoParser'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const isAdmin = (roles: string[]) => roles.includes('Admin')

/**
 * Correct what the filename parser produced for one PO file.
 *
 * The correction is stored against the file and re-applied on every index run,
 * so it survives a rebuild. The already-indexed rows are updated in place too,
 * so the change shows immediately rather than waiting for the next sweep.
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!isAdmin(roles)) {
    return NextResponse.json({ error: 'Only an Admin can correct PO details' }, { status: 403 })
  }

  try {
    const b = await request.json()
    const filePath = String(b?.file_path ?? '').trim()
    if (!filePath) return NextResponse.json({ error: 'file_path required' }, { status: 400 })

    const poNumber = b?.po_number === undefined ? null : String(b.po_number).trim().slice(0, 60)
    const rev = b?.rev === undefined ? null : String(b.rev).trim().toUpperCase().slice(0, 10)
    const version = b?.version === undefined ? null : (String(b.version).trim().toUpperCase() === 'V1' ? 'V1' : 'V0')
    const partsRaw = b?.apc_parts === undefined ? null : String(b.apc_parts)
    const parts = partsRaw === null ? null
      : partsRaw.split(',').map(p => p.trim()).filter(Boolean)
    const note = String(b?.note ?? '').slice(0, 300)
    const user = (session.user as any)?.username || 'unknown'
    const hash = crypto.createHash('sha1').update(filePath).digest('hex')

    await queryPrimary(
      `INSERT INTO customer_po_overrides
         (path_hash, file_path, po_number, rev, version, apc_parts, note, updated_by)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         po_number = VALUES(po_number), rev = VALUES(rev), version = VALUES(version),
         apc_parts = VALUES(apc_parts), note = VALUES(note), updated_by = VALUES(updated_by)`,
      [hash, filePath.slice(0, 700), poNumber, rev, version,
       parts ? parts.join(',').slice(0, 300) : null, note, user]
    )

    // Apply to the indexed rows now.
    const sets: string[] = []
    const vals: any[] = []
    if (poNumber !== null) { sets.push('po_number = ?'); vals.push(poNumber) }
    if (rev !== null) { sets.push('rev = ?', 'rev_rank = ?'); vals.push(rev, revRankOf(rev)) }
    if (version !== null) { sets.push('version = ?'); vals.push(version) }
    if (sets.length) {
      await queryPrimary(
        `UPDATE customer_po_files SET ${sets.join(', ')} WHERE file_path = ?`, [...vals, filePath]
      )
    }

    // A changed part list means rows appear or disappear, so rewrite them.
    if (parts && parts.length) {
      const existing = await queryPrimary<any[]>(
        `SELECT customer, sub_group, po_number, rev, rev_rank, version, file_name,
                file_mtime, file_size
         FROM customer_po_files WHERE file_path = ? LIMIT 1`, [filePath]
      )
      if (existing?.length) {
        const e = existing[0]
        await queryPrimary('DELETE FROM customer_po_files WHERE file_path = ?', [filePath])
        for (const part of parts) {
          const rowHash = crypto.createHash('sha1').update(`${filePath}|${part}`).digest('hex')
          await queryPrimary(
            `INSERT INTO customer_po_files
               (customer, sub_group, apc_part, po_number, rev, rev_rank, version,
                file_name, file_path, file_mtime, file_size, path_hash)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE apc_part = VALUES(apc_part)`,
            [e.customer, e.sub_group, part.slice(0, 40),
             poNumber ?? e.po_number, rev ?? e.rev,
             rev !== null ? revRankOf(rev) : e.rev_rank,
             version ?? e.version, e.file_name, filePath, e.file_mtime, e.file_size, rowHash]
          )
        }
      }
    }

    // Recompute the latest flags for just this PO, so the corrected row shows
    // up (or drops out) under the Latest filters straight away.
    try {
      const scope = await queryPrimary<any[]>(
        'SELECT DISTINCT po_number, customer FROM customer_po_files WHERE file_path = ?', [filePath]
      )
      for (const sc of scope || []) {
        await queryPrimary(
          `UPDATE customer_po_files f
           JOIN (
             SELECT po_number, customer, MAX(COALESCE(rev_rank, -1)) AS max_rank
             FROM customer_po_files WHERE po_number = ? AND customer = ?
             GROUP BY po_number, customer
           ) t ON t.po_number = f.po_number AND t.customer = f.customer
           SET f.is_latest_rev = (COALESCE(f.rev_rank, -1) = t.max_rank)
           WHERE f.po_number = ? AND f.customer = ?`,
          [sc.po_number, sc.customer, sc.po_number, sc.customer]
        )
        await queryPrimary(
          `UPDATE customer_po_files f
           JOIN (
             SELECT po_number, customer, rev, MAX(version) AS max_ver
             FROM customer_po_files WHERE po_number = ? AND customer = ?
             GROUP BY po_number, customer, rev
           ) t ON t.po_number = f.po_number AND t.customer = f.customer AND t.rev = f.rev
           SET f.is_latest_version = (f.version = t.max_ver)
           WHERE f.po_number = ? AND f.customer = ?`,
          [sc.po_number, sc.customer, sc.po_number, sc.customer]
        )
      }
    } catch { /* flags refresh on the next sweep regardless */ }

    return NextResponse.json({ success: true, updated_by: user })
  } catch (error) {
    console.error('PO override error:', error)
    return NextResponse.json({
      error: 'Failed to save the correction',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// DELETE ?file_path=... -> drop the correction; the next index run re-parses.
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!isAdmin(roles)) {
    return NextResponse.json({ error: 'Only an Admin can remove a correction' }, { status: 403 })
  }
  try {
    const filePath = (new URL(request.url).searchParams.get('file_path') || '').trim()
    if (!filePath) return NextResponse.json({ error: 'file_path required' }, { status: 400 })
    const hash = crypto.createHash('sha1').update(filePath).digest('hex')
    await queryPrimary('DELETE FROM customer_po_overrides WHERE path_hash = ?', [hash])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to remove', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
