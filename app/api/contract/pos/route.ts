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
    const rows = await queryPrimary<any[]>(
      `SELECT customer_part AS po_number,
              po_folder     AS customer,
              MAX(apc_part)  AS apc_part,
              COUNT(*)       AS file_count,
              COUNT(DISTINCT version_label) AS version_count,
              MAX(file_mtime) AS latest_mtime,
              SUBSTRING_INDEX(GROUP_CONCAT(version_label ORDER BY version_rank DESC SEPARATOR '||'), '||', 1) AS latest_version
       FROM po_cert_files
       WHERE customer_part <> ''
       GROUP BY customer_part, po_folder
       ORDER BY latest_mtime DESC`
    )
    return NextResponse.json({ success: true, rows: rows || [], count: rows?.length ?? 0 })
  } catch (error) {
    console.error('Contract POs query error:', error)
    return NextResponse.json({
      error: 'Failed to load POs',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
