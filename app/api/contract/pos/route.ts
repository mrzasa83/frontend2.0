import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'

export const dynamic = 'force-dynamic'

// GET                       -> grouped PO list (one row per PO# + customer)
// GET ?po=..&customer=..     -> one PO's detail: all versions/files + relations
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'contract')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const po = (sp.get('po') || '').trim()
  const customer = (sp.get('customer') || '').trim()

  try {
    if (po && customer) {
      // Detail: all files for this PO#+customer, newest first, plus clause relations.
      const files = await queryPrimary<any[]>(
        `SELECT id, apc_part, customer_part AS po_number, po_folder AS customer,
                version_label, version_rank, file_name, file_path, file_mtime, file_size
         FROM po_cert_files
         WHERE customer_part = ? AND po_folder = ?
         ORDER BY version_rank DESC, file_mtime DESC`,
        [po, customer]
      )
      const clauses = await queryPrimary<any[]>(
        `SELECT pc.id, pc.clause_id, pc.standard, pc.clause_number, pc.how_added,
                pc.source_file, pc.confidence, pc.created_by, pc.created_at,
                c.title, c.classification
         FROM contract_po_clauses pc
         LEFT JOIN contract_clauses c ON c.id = pc.clause_id
         WHERE pc.po_number = ? AND pc.customer = ?
         ORDER BY pc.standard, pc.clause_number`,
        [po, customer]
      )
      return NextResponse.json({ success: true, po, customer, files: files || [], clauses: clauses || [] })
    }

    // List: group po_cert_files into one row per (po_number, customer).
    // Server-side filter + sort + pagination (100/page). Version defaults to the
    // latest (highest version_rank).
    const q = (sp.get('q') || '').trim()
    const sortKey = (sp.get('sort') || 'latest_mtime').trim()
    const sortDir = (sp.get('dir') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('pageSize') || '100', 10) || 100))
    const offset = (page - 1) * pageSize

    // Whitelist sortable columns to avoid injection.
    const SORTABLE: Record<string, string> = {
      po_number: 'po_number', customer: 'customer', apc_part: 'apc_part',
      latest_version: 'latest_version', version_count: 'version_count',
      file_count: 'file_count', latest_mtime: 'latest_mtime',
    }
    const orderCol = SORTABLE[sortKey] || 'latest_mtime'

    // Optional text filter across PO#, customer, APC part.
    const whereParts = ["customer_part <> ''"]
    const params: any[] = []
    if (q) {
      whereParts.push('(customer_part LIKE ? OR po_folder LIKE ? OR apc_part LIKE ?)')
      const like = `%${q}%`
      params.push(like, like, like)
    }
    const whereSql = whereParts.join(' AND ')

    // Count of distinct PO groups (for pagination).
    const countRows = await queryPrimary<any[]>(
      `SELECT COUNT(*) AS total FROM (
         SELECT customer_part, po_folder FROM po_cert_files
         WHERE ${whereSql}
         GROUP BY customer_part, po_folder
       ) g`, params
    )
    const total = countRows?.[0]?.total ?? 0

    // latest_version = the version_label of the row with the highest version_rank
    // (ties broken by newest file). Uses GROUP_CONCAT ordered by rank DESC.
    const rows = await queryPrimary<any[]>(
      `SELECT customer_part AS po_number,
              po_folder     AS customer,
              MAX(apc_part)  AS apc_part,
              COUNT(*)       AS file_count,
              COUNT(DISTINCT version_label) AS version_count,
              MAX(file_mtime) AS latest_mtime,
              MAX(version_rank) AS latest_rank,
              SUBSTRING_INDEX(
                GROUP_CONCAT(version_label ORDER BY version_rank DESC, file_mtime DESC SEPARATOR '||'),
                '||', 1) AS latest_version
       FROM po_cert_files
       WHERE ${whereSql}
       GROUP BY customer_part, po_folder
       ORDER BY ${orderCol} ${sortDir}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )
    return NextResponse.json({
      success: true, rows: rows || [], count: rows?.length ?? 0,
      total, page, pageSize, pages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Contract POs query error:', error)
    return NextResponse.json({
      error: 'Failed to load POs',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
