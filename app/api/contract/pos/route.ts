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
      // One row per file. The index stores a row per APC part, so a PO file
      // covering several parts would otherwise be listed once per part.
      const files = await queryPrimary<any[]>(
        `SELECT MIN(id) AS id,
                GROUP_CONCAT(DISTINCT apc_part ORDER BY apc_part SEPARATOR ', ') AS apc_part,
                po_number, customer,
                MAX(sub_group)  AS sub_group,
                MAX(rev)        AS rev,
                MAX(version)    AS version,
                MAX(rev_rank)   AS rev_rank,
                TRIM(CONCAT_WS(' ', NULLIF(MAX(rev), ''), MAX(version))) AS version_label,
                MAX(rev_rank)   AS version_rank,
                file_name, file_path,
                MAX(file_mtime) AS file_mtime,
                MAX(file_size)  AS file_size
         FROM customer_po_files
         WHERE po_number = ? AND customer = ?
         GROUP BY file_path, file_name, po_number, customer
         ORDER BY MAX(COALESCE(rev_rank, -1)) DESC, MAX(version) DESC, MAX(file_mtime) DESC`,
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
      po_number: 'f.po_number', customer: 'f.customer', apc_part: 'apc_part',
      sub_group: 'sub_group', latest_version: 'latest_version',
      version_count: 'version_count', file_name: 'f.file_name',
      latest_mtime: 'latest_mtime',
    }
    const orderCol = SORTABLE[sortKey] || 'latest_mtime'

    // Optional text filter across PO#, customer, APC part.
    const whereParts = ["f.po_number <> ''"]
    const params: any[] = []
    if (q) {
      whereParts.push('(f.po_number LIKE ? OR f.customer LIKE ? OR f.apc_part LIKE ? OR f.sub_group LIKE ? OR f.file_name LIKE ?)')
      const like = `%${q}%`
      params.push(like, like, like, like, like)
    }

    // Per-column filters. These run server-side so they filter the whole table,
    // not just the current page. Column names are fixed here, never interpolated
    // from user input; only the values are bound as parameters.
    const colFilter = (param: string, column: string) => {
      const v = (sp.get(param) || '').trim()
      if (!v) return
      whereParts.push(`f.${column} LIKE ?`)
      params.push(`%${v}%`)
    }
    colFilter('f_po', 'po_number')
    colFilter('f_customer', 'customer')
    colFilter('f_apc', 'apc_part')
    colFilter('f_subgroup', 'sub_group')

    const whereSql = whereParts.join(' AND ')

    // Revision / version column filters are plain column comparisons now that
    // the flags are precomputed — no HAVING needed.
    const fRev = (sp.get('f_rev') || '').trim()
    if (fRev) { whereParts.push('f.rev LIKE ?'); params.push(`%${fRev}%`) }
    const fVersion = (sp.get('f_version') || '').trim()
    if (fVersion) { whereParts.push('f.version LIKE ?'); params.push(`%${fVersion}%`) }

    // Count of distinct PO groups (for pagination).
    // "Latest" filters. Both default on, so the list shows current paperwork.
    // These read PRECOMPUTED flags — the newest revision/version is worked out
    // once per index run, not derived on every page load. Deriving it here was
    // two full table scans per request, which blew the query timeout.
    const latestRev = (sp.get('latestRev') ?? '1') !== '0'
    const latestVersion = (sp.get('latestVersion') ?? '1') !== '0'
    if (latestRev) whereParts.push('f.is_latest_rev = 1')
    if (latestVersion) whereParts.push('f.is_latest_version = 1')
    const whereSql2 = whereParts.join(' AND ')

    const countRows = await queryPrimary<any[]>(
      `SELECT COUNT(DISTINCT f.file_path) AS total
       FROM customer_po_files f
       WHERE ${whereSql2}`, params
    )
    const total = countRows?.[0]?.total ?? 0

    const rows = await queryPrimary<any[]>(
      `SELECT f.po_number,
              f.customer,
              MAX(f.sub_group) AS sub_group,
              GROUP_CONCAT(DISTINCT f.apc_part ORDER BY f.apc_part SEPARATOR ', ') AS apc_part,
              MAX(f.rev)       AS rev,
              MAX(f.version)   AS version,
              MAX(f.rev_rank)  AS rev_rank,
              TRIM(CONCAT_WS(' ', NULLIF(MAX(f.rev), ''), MAX(f.version))) AS latest_version,
              COUNT(DISTINCT CONCAT(f.rev, '|', f.version)) AS version_count,
              f.file_name,
              f.file_path,
              MAX(f.file_mtime) AS latest_mtime
       FROM customer_po_files f
       WHERE ${whereSql2}
       GROUP BY f.file_path, f.file_name, f.po_number, f.customer
       ORDER BY ${orderCol} ${sortDir}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    const indexState = await getIndexState('customer_pos')
    return NextResponse.json({
      success: true, rows: rows || [], count: rows?.length ?? 0,
      total, page, pageSize, pages: Math.ceil(total / pageSize),
      indexState,
      elapsedMs: Date.now() - startedAt,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Contract POs query error:', error)
    // A timeout usually means an index sweep is hogging the pool. Answer with an
    // empty page and an explanation instead of a red failure banner.
    const busy = /timeout|PROTOCOL_SEQUENCE_TIMEOUT|ECONNRESET/i.test(msg)
    if (busy) {
      return NextResponse.json({
        success: true, rows: [], count: 0, total: 0,
        page: 1, pageSize: 100, pages: 1,
        indexState: await getIndexState('customer_pos').catch(() => null),
        busy: true,
        notice: 'The PO index is being rebuilt — the list will fill in once it finishes.',
      })
    }
    return NextResponse.json({
      error: 'Failed to load POs', details: msg,
    }, { status: 500 })
  }
}
