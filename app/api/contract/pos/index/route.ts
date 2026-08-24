import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { PO_CERT_PATH } from '@/lib/config/drives'
import { claimRun, finishRun, getIndexState } from '@/lib/certs/indexRefresh'
import { rebuildCustomerPoIndex } from '@/lib/certs/rebuildCustomerPo'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const INDEX_NAME = 'customer_pos'

// GET -> index status.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const state = await getIndexState(INDEX_NAME)
    const totals = await queryPrimary<any[]>(
      `SELECT COUNT(*) AS rows_total, COUNT(DISTINCT po_number) AS pos,
              COUNT(DISTINCT apc_part) AS parts, COUNT(DISTINCT customer) AS customers
       FROM customer_po_files`
    )
    const skipped = await queryPrimary<any[]>('SELECT COUNT(*) AS n FROM customer_po_skipped').catch(() => [])
    return NextResponse.json({
      success: true,
      state,
      rows: Number(totals?.[0]?.rows_total) || 0,
      pos: Number(totals?.[0]?.pos) || 0,
      parts: Number(totals?.[0]?.parts) || 0,
      customers: Number(totals?.[0]?.customers) || 0,
      skipped: Number(skipped?.[0]?.n) || 0,
      root: PO_CERT_PATH(),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read index status',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST -> rebuild now (the manual Refresh button).
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await claimRun(INDEX_NAME))) {
    return NextResponse.json({
      success: true, alreadyRunning: true,
      message: 'An index run is already in progress.',
    })
  }
  try {
    const r = await rebuildCustomerPoIndex()
    await finishRun(INDEX_NAME, r.count, r.status, r.message)
    return NextResponse.json({ success: true, ...r })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await finishRun(INDEX_NAME, 0, 'error', msg)
    console.error('Customer PO index error:', error)
    return NextResponse.json({ error: 'Index failed', details: msg }, { status: 500 })
  }
}
