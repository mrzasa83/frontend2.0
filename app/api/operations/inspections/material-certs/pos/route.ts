import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { normalizePart } from '@/lib/certs/cocParser'
import { refreshIfStale } from '@/lib/certs/indexRefresh'
import { rebuildCocIndex } from '@/lib/certs/rebuildCoc'

export const dynamic = 'force-dynamic'

// Whitelisted sort columns — never interpolate user input into SQL.
const SORTABLE: Record<string, string> = {
  po_number: 'po_number',
  lot: 'lot',
  apc_part: 'apc_part',
  material_type: 'material_type',
  site: 'site',
  file_name: 'file_name',
  file_mtime: 'file_mtime',
}

// GET -> search the C of C inventory.
// Filters: q, po, lot, part, type, site, from, to. Paged, 100 per page.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Keep the inventory fresh without making anyone wait: if it hasn't been
  // rebuilt in the last hour, start a walk in the background and answer now
  // from what's already indexed.
  refreshIfStale('supplier_cert_pos', rebuildCocIndex)

  const sp = new URL(request.url).searchParams
  const where: string[] = ['1=1']
  const params: any[] = []

  const like = (col: string, v: string) => { where.push(`${col} LIKE ?`); params.push(`%${v}%`) }

  const q = (sp.get('q') || '').trim()
  if (q) {
    where.push('(po_number LIKE ? OR lot LIKE ? OR apc_part LIKE ? OR file_name LIKE ?)')
    const l = `%${q}%`
    params.push(l, l, l, l)
  }
  const po = (sp.get('po') || '').trim()
  if (po) like('po_number', po.toUpperCase())
  const lot = (sp.get('lot') || '').trim()
  if (lot) like('lot', lot)
  const type = (sp.get('type') || '').trim()
  if (type) like('material_type', type)
  const site = (sp.get('site') || '').trim()
  if (site) { where.push('site = ?'); params.push(site) }

  // Part matches on the normalised form so "AL-0100 CU" finds "AL0100CU…".
  const part = (sp.get('part') || '').trim()
  if (part) { where.push('apc_part_norm LIKE ?'); params.push(`%${normalizePart(part)}%`) }

  const from = (sp.get('from') || '').trim()
  if (from) { where.push('file_mtime >= ?'); params.push(from) }
  const to = (sp.get('to') || '').trim()
  if (to) { where.push('file_mtime < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(to) }

  const sortKey = SORTABLE[sp.get('sort') || ''] || 'file_mtime'
  const dir = (sp.get('dir') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
  const pageSize = Math.min(200, Math.max(1, parseInt(sp.get('pageSize') || '100', 10) || 100))
  const offset = (page - 1) * pageSize
  const whereSql = where.join(' AND ')

  try {
    const countRows = await queryPrimary<any[]>(
      `SELECT COUNT(*) AS total FROM material_cert_pos WHERE ${whereSql}`, params
    )
    const total = Number(countRows?.[0]?.total) || 0

    const rows = await queryPrimary<any[]>(
      `SELECT id, site, material_type, apc_part, po_number, lot,
              file_name, file_path, rel_dir, file_mtime, file_size
       FROM material_cert_pos
       WHERE ${whereSql}
       ORDER BY ${sortKey} ${dir}, po_number ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    // Distinct values for the dropdown filters.
    const types = await queryPrimary<any[]>(
      `SELECT material_type, COUNT(*) AS files FROM material_cert_pos
       WHERE material_type <> '' GROUP BY material_type ORDER BY material_type`
    )
    const sites = await queryPrimary<any[]>(
      `SELECT site, COUNT(*) AS files FROM material_cert_pos
       WHERE site <> '' GROUP BY site ORDER BY site`
    )

    return NextResponse.json({
      success: true,
      rows: rows || [],
      total, page, pageSize, pages: Math.ceil(total / pageSize) || 1,
      materialTypes: (types || []).map(t => t.material_type),
      sites: (sites || []).map(s => s.site),
    })
  } catch (error) {
    console.error('C of C search error:', error)
    return NextResponse.json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
