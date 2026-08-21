import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { queryMSSQL } from '@/lib/db/mssql'
import { PO_ROOT } from '@/lib/certs/poParser'
import { promises as fs } from 'fs'

export const dynamic = 'force-dynamic'

const READ_CONN = '1'

// GET — everything the mapping UI needs:
//   paradigmCustomers: DATA0010 abbreviations (the FAI "customer")
//   poFolders:         real top-level folder names under the PO root
//   mappings:          current customer -> folder rows
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Paradigm customers (abbreviated name + full name for display)
    const custRows = await queryMSSQL<any[]>(READ_CONN, `
      SELECT RKEY, ABBR_NAME, CUSTOMER_NAME
      FROM DATA0010 WITH (NOLOCK)
      WHERE ABBR_NAME IS NOT NULL AND ABBR_NAME <> ''
      ORDER BY ABBR_NAME ASC
    `)

    // 2. Actual PO folders on disk (directories only, top level)
    let poFolders: string[] = []
    try {
      const entries = await fs.readdir(PO_ROOT(), { withFileTypes: true })
      poFolders = entries
        .filter(e => e.isDirectory())
        .map(e => e.name)
        // hide the housekeeping folders that start with punctuation
        .filter(n => /^[A-Za-z0-9]/.test(n))
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    } catch (e) {
      // Drive not mounted / path missing — return empty, surfaced in UI
      poFolders = []
    }

    // 3. Current mappings
    const mappings = await queryPrimary(
      `SELECT id, paradigm_customer, paradigm_rkey, po_folder, created_by, created_at
       FROM po_customer_mapping ORDER BY paradigm_customer, po_folder`
    )

    return NextResponse.json({
      success: true,
      paradigmCustomers: custRows.map((r: any) => ({
        rkey: r.RKEY,
        abbr: (r.ABBR_NAME || '').trim(),
        name: (r.CUSTOMER_NAME || '').trim(),
      })),
      poFolders,
      mappings,
      poRoot: PO_ROOT(),
    })
  } catch (error) {
    console.error('Error loading PO folder mapping:', error)
    return NextResponse.json({
      error: 'Failed to load',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST — add mapping(s): { paradigmCustomer, paradigmRkey?, poFolders: string[] }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  try {
    const { paradigmCustomer, paradigmRkey, poFolders } = await request.json()
    if (!paradigmCustomer || !Array.isArray(poFolders) || !poFolders.length) {
      return NextResponse.json({ error: 'paradigmCustomer and poFolders required' }, { status: 400 })
    }

    const username = (session.user as any)?.username || session.user?.name || 'unknown'
    let added = 0
    for (const folder of poFolders) {
      try {
        await queryPrimary(
          `INSERT IGNORE INTO po_customer_mapping (paradigm_customer, paradigm_rkey, po_folder, created_by)
           VALUES (?, ?, ?, ?)`,
          [paradigmCustomer, paradigmRkey || null, folder, username]
        )
        added++
      } catch { /* duplicate — skip */ }
    }
    return NextResponse.json({ success: true, added })
  } catch (error) {
    console.error('Error adding PO folder mapping:', error)
    return NextResponse.json({
      error: 'Failed to add',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// DELETE ?id= — remove a mapping
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await queryPrimary('DELETE FROM po_customer_mapping WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to delete',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
