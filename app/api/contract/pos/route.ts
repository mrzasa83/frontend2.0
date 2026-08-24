import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { refreshIfStale } from '@/lib/certs/indexRefresh'
import { rebuildCustomerPoIndex } from '@/lib/certs/rebuildCustomerPo'
import { getIndexState } from '@/lib/certs/indexRefresh'

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

  // Self-maintaining index: if the customer PO sweep hasn't run in the last
  // hour, start it in the background and answer immediately from what's indexed.
  refreshIfStale('customer_pos', rebuildCustomerPoIndex)

  const startedAt = Date.now()
  const sp = new URL(request.url).searchParams
  const po = (sp.get('po') || '').trim()
  const customer = (sp.get('customer') || '').trim()

  try {
    if (po && customer) {
      // Detail: all files for this PO#+customer, newest first, plus clause relations.
      const files = await queryPrimary<any[]>(
        `SELECT id, apc_part, po_number, customer, sub_group,
                rev, rev_rank, version,
                CONCAT_WS(' ', NULLIF(rev, ''), version) AS version_label,
                rev_rank AS version_rank,
                file_name, file_path, file_mtime, file_size
         FROM customer_po_files
         WHERE po_number = ? AND customer = ?
         ORDER BY rev_rank DESC, version DESC, file_mtime DESC`,
        [po, customer]
      )
      const clauses = await queryPrimary<any[]>(
        `SELECT pc.id, pc.clause_id, pc.standard, pc.clause_number, pc.how_added,
                pc.source_file, pc.confidence, pc.found_pages, pc.created_by, pc.created_at,
                c.title, c.classification
         FROM contract_po_clauses pc
         LEFT JOIN contract_clauses c ON c.id = pc.clause_id
         WHERE pc.po_number = ? AND pc.customer = ?
         ORDER BY pc.standard, pc.clause_number`,
        [po, customer]
      )
      return NextResponse.json({ success: true, po, customer, files: files || [], clauses: clauses || [] })
    }

    // List: group the customer PO index into one row per (po_number, customer).
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
      sub_group: 'sub_group', latest_version: 'latest_version',
      version_count: 'version_count', file_count: 'file_count',
      latest_mtime: 'latest_mtime',
    }
    const orderCol = SORTABLE[sortKey] || 'latest_mtime'

    // Optional text filter across PO#, customer, APC part.
    const whereParts = ["po_number <> ''"]
    const params: any[] = []
    if (q) {
      whereParts.push('(po_number LIKE ? OR customer LIKE ? OR apc_part LIKE ? OR sub_group LIKE ?)')
      const like = `%${q}%`
      params.push(like, like, like, like)
    }

    // Per-column filters. These run server-side so they filter the whole table,
    // not just the current page. Column names are fixed here, never interpolated
    // from user input; only the values are bound as parameters.
    const colFilter = (param: string, column: string) => {
      const v = (sp.get(param) || '').trim()
      if (!v) return
      whereParts.push(`${column} LIKE ?`)
      params.push(`%${v}%`)
    }
    colFilter('f_po', 'po_number')
    colFilter('f_customer', 'customer')
    colFilter('f_apc', 'apc_part')
    colFilter('f_subgroup', 'sub_group')

    const whereSql = whereParts.join(' AND ')

    // Version filters compare against the aggregated latest version, so they
    // belong in HAVING rather than WHERE.
    const havingParts: string[] = []
    const havingParams: any[] = []
    const fVersion = (sp.get('f_version') || '').trim()
    if (fVersion) {
      havingParts.push('latest_version LIKE ?')
      havingParams.push(`%${fVersion}%`)
    }
    const havingSql = havingParts.length ? `HAVING ${havingParts.join(' AND ')}` : ''

    // Count of distinct PO groups (for pagination).
    const countRows = await queryPrimary<any[]>(
      `SELECT COUNT(*) AS total FROM (
         SELECT po_number, customer,
                SUBSTRING_INDEX(
                  GROUP_CONCAT(CONCAT_WS(' ', NULLIF(rev, ''), version)
                               ORDER BY rev_rank DESC, version DESC, file_mtime DESC SEPARATOR '||'),
                  '||', 1) AS latest_version
         FROM customer_po_files
         WHERE ${whereSql}
         GROUP BY po_number, customer
         ${havingSql}
       ) g`, [...params, ...havingParams]
    )
    const total = countRows?.[0]?.total ?? 0

    // One row per PO number + customer. latest_version is the highest revision
    // seen for that PO (rev rank first, then V1 over V0).
    const rows = await queryPrimary<any[]>(
      `SELECT po_number,
              customer,
              MAX(sub_group)  AS sub_group,
              GROUP_CONCAT(DISTINCT apc_part ORDER BY apc_part SEPARATOR ', ') AS apc_part,
              COUNT(*)        AS file_count,
              COUNT(DISTINCT CONCAT(rev, '|', version)) AS version_count,
              MAX(file_mtime) AS latest_mtime,
              MAX(rev_rank)   AS latest_rank,
              SUBSTRING_INDEX(
                GROUP_CONCAT(CONCAT_WS(' ', NULLIF(rev, ''), version)
                             ORDER BY rev_rank DESC, version DESC, file_mtime DESC SEPARATOR '||'),
                '||', 1) AS latest_version
       FROM customer_po_files
       WHERE ${whereSql}
       GROUP BY po_number, customer
       ${havingSql}
       ORDER BY ${orderCol} ${sortDir}
       LIMIT ? OFFSET ?`,
      [...params, ...havingParams, pageSize, offset]
    )

    const indexState = await getIndexState('customer_pos')
    return NextResponse.json({
      success: true, rows: rows || [], count: rows?.length ?? 0,
      total, page, pageSize, pages: Math.ceil(total / pageSize),
      indexState,
      elapsedMs: Date.now() - startedAt,
    })
  } catch (error) {
    console.error('Contract POs query error:', error)
    return NextResponse.json({
      error: 'Failed to load POs',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
