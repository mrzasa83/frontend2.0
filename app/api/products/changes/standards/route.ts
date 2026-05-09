import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary, getMySQLPrimaryPool } from '@/lib/db/mysql-primary'

// ─── GET: List all ESCF records or single record ────────────────
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    if (id) {
      // Single record with all fields
      const rows = await queryPrimary('SELECT * FROM escf WHERE id = ?', [id])
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const record = rows[0]

      // Fetch change history log
      const history = await queryPrimary(
        'SELECT * FROM escf_history WHERE escf_id = ? ORDER BY changed_at DESC',
        [id]
      )

      // Fetch work center history — all ESCFs for the same department
      let wcHistory: any[] = []
      if (record.department) {
        wcHistory = await queryPrimary(`
          SELECT
            e.id, e.department, e.affected_departments, e.wcm, e.initiator, e.pes,
            e.subdate, e.subtime,
            CASE
              WHEN e.escf_status = 2 THEN 'Rejected'
              WHEN e.pe_disposition = '' OR e.pe_disposition IS NULL THEN 'Pending'
              WHEN e.pe_disposition = 'Approved' AND e.escf_status = 1 THEN 'Implemented'
              WHEN e.pe_disposition = 'Approved' AND e.escf_status = 0 THEN 'Approved'
              ELSE 'Approved'
            END AS status
          FROM escf e
          WHERE e.department = ?
             OR (e.affected_departments IS NOT NULL
                 AND CONCAT(',', e.affected_departments, ',') LIKE CONCAT('%,', ?, ',%'))
          ORDER BY STR_TO_DATE(e.subdate, '%d%b%Y') ASC, NULLIF(e.subtime, '') ASC
        `, [record.department, record.department])
      }

      return NextResponse.json({ success: true, record, history, wcHistory })
    }

    // List view with computed status
    const rows = await queryPrimary(`
      SELECT
        id, department, affected_departments, wcm, initiator, pes,
        subdate, subtime, escf_status, pe_disposition,
        CASE
          WHEN escf_status = 2 THEN 'Rejected'
          WHEN pe_disposition = '' OR pe_disposition IS NULL THEN 'Pending'
          WHEN pe_disposition = 'Approved' AND escf_status = 1 THEN 'Implemented'
          WHEN pe_disposition = 'Approved' AND escf_status = 0 THEN 'Approved'
          ELSE 'Approved'
        END AS status
      FROM escf
      ORDER BY id DESC
    `)

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (error) {
    console.error('Error fetching ESCF:', error)
    return NextResponse.json({
      error: 'Failed to fetch ESCF data',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// ─── PUT: Update an ESCF record (Admin only) ───────────────────
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  if (!roles.includes('Admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Fetch current record for history comparison
    const current = await queryPrimary('SELECT * FROM escf WHERE id = ?', [id])
    if (!current || current.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const oldRecord = current[0]
    const pool = getMySQLPrimaryPool()
    const conn = await pool.getConnection()

    try {
      await conn.beginTransaction()

      // Build dynamic UPDATE
      const allowedFields = [
        'department', 'affected_departments', 'wcm', 'initiator', 'pes',
        'pe_disposition', 'escf_status', 'change_status', 'subdate', 'subtime',
        'is_new_process', 'current_standard', 'requested_change',
        'intended_imp_date', 'reason_for_change', 'request',
        'is_pe_cost_impact', 'prev_tooled_dis', 'pem',
        'is_ppe_cost_impact', 'rejection_reason', 'quote_hold_require',
        'review_date', 'software', 'submission_type',
        'user', 'completedby', 'engenix_affected', 'engenix_updated',
        'disposition', 'closeddate', 'closedtime',
        'pe_disposition_date', 'pe_disposition_time',
      ]
      const setClauses: string[] = []
      const params: any[] = []
      const historyEntries: { field: string; oldVal: any; newVal: any }[] = []

      for (const field of allowedFields) {
        if (field in updates && String(updates[field]) !== String(oldRecord[field] || '')) {
          setClauses.push(`${field} = ?`)
          params.push(updates[field])
          historyEntries.push({
            field,
            oldVal: oldRecord[field],
            newVal: updates[field],
          })
        }
      }

      if (setClauses.length === 0) {
        await conn.rollback()
        conn.release()
        return NextResponse.json({ success: true, message: 'No changes detected' })
      }

      params.push(id)
      await conn.execute(`UPDATE escf SET ${setClauses.join(', ')} WHERE id = ?`, params)

      // Log history
      const username = (session.user as any)?.username || session.user?.name || 'unknown'
      for (const entry of historyEntries) {
        await conn.execute(
          'INSERT INTO escf_history (escf_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?)',
          [id, entry.field, String(entry.oldVal ?? ''), String(entry.newVal ?? ''), username]
        )
      }

      await conn.commit()
      console.log(`ESCF ${id} updated by ${username}: ${historyEntries.map(h => h.field).join(', ')}`)
      return NextResponse.json({ success: true, updated: setClauses.length })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (error) {
    console.error('Error updating ESCF:', error)
    return NextResponse.json({
      error: 'Failed to update',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
