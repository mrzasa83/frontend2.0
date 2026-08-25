import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { COC_ROOTS } from '@/lib/config/drives'
import { rebuildCocIndex } from '@/lib/certs/rebuildCoc'
import { claimRun, finishRun, getIndexState } from '@/lib/certs/indexRefresh'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const INDEX_NAME = 'supplier_cert_pos'

type Found = {
  site: string
  materialType: string
  apcPart: string
  poNumber: string
  lot: string
  fileName: string
  filePath: string
  relDir: string
  mtime: Date | null
  size: number | null
}

// GET -> inventory status: counts and when it was last refreshed.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const totals = await queryPrimary<any[]>(
      `SELECT COUNT(*) AS files,
              COUNT(DISTINCT po_number) AS pos,
              COUNT(DISTINCT apc_part_norm) AS parts,
              MAX(indexed_at) AS last_indexed
       FROM material_cert_pos`
    )
    const bySite = await queryPrimary<any[]>(
      'SELECT site, COUNT(*) AS files FROM material_cert_pos GROUP BY site ORDER BY site'
    )
    const lastRun = await queryPrimary<any[]>(
      `SELECT started_at, finished_at, files_found, files_written, removed, status, message, run_by
       FROM material_cert_po_runs ORDER BY id DESC LIMIT 1`
    )
    return NextResponse.json({
      success: true,
      files: Number(totals?.[0]?.files) || 0,
      pos: Number(totals?.[0]?.pos) || 0,
      parts: Number(totals?.[0]?.parts) || 0,
      lastIndexed: totals?.[0]?.last_indexed || null,
      bySite: bySite || [],
      lastRun: lastRun?.[0] || null,
      indexState: await getIndexState(INDEX_NAME),
      roots: COC_ROOTS(),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read inventory status',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST -> (re)build the inventory by walking all three site roots.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin') && !roles.includes('Quality') && !roles.includes('EHSadmin')) {
    return NextResponse.json({ error: 'Not permitted to rebuild the cert inventory' }, { status: 403 })
  }

  const user = (session.user as any)?.username || 'unknown'
  const sp = new URL(request.url).searchParams
  const onlySite = (sp.get('site') || '').trim()
  // ?mode=full empties the index first (use after a parser or scope change).
  const purge = (sp.get('mode') || '') === 'full'
  // ?force=1 clears a stuck "running" flag. A run that died mid-way leaves the
  // flag set, and every later rebuild is then silently refused.
  const force = sp.get('force') === '1'

  if (force) {
    await queryPrimary(
      `UPDATE index_state SET running = 0, last_status = 'reset' WHERE index_name = ?`,
      [INDEX_NAME]
    ).catch(() => {})
  }

  if (!(await claimRun(INDEX_NAME))) {
    return NextResponse.json({
      success: true, alreadyRunning: true,
      message: 'An index run is already in progress.',
    })
  }

  const runRes: any = await queryPrimary(
    'INSERT INTO material_cert_po_runs (status, run_by) VALUES (?, ?)', ['running', user]
  ).catch(() => null)
  const runId = runRes?.insertId ?? null

  try {
    // Same code path the hourly background refresh uses.
    const r = await rebuildCocIndex(onlySite, purge)
    if (runId) {
      await queryPrimary(
        `UPDATE material_cert_po_runs
         SET finished_at = NOW(), files_found = ?, files_written = ?, removed = ?,
             status = ?, message = ?
         WHERE id = ?`,
        [r.found, r.written, r.removed, r.status, r.problems.join(' | ').slice(0, 1000), runId]
      ).catch(() => {})
    }
    await finishRun(INDEX_NAME, r.written, r.status, r.problems.join(' | '))
    return NextResponse.json({ success: true, ...r })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (runId) {
      await queryPrimary(
        `UPDATE material_cert_po_runs SET finished_at = NOW(), status = 'error', message = ? WHERE id = ?`,
        [msg.slice(0, 1000), runId]
      ).catch(() => {})
    }
    await finishRun(INDEX_NAME, 0, 'error', msg)
    console.error('C of C indexer error:', error)
    return NextResponse.json({ error: 'Index failed', details: msg }, { status: 500 })
  }
}
