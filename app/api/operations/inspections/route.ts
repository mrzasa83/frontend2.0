import { NextRequest, NextResponse } from 'next/server'
import { PHASES } from '@/lib/inspections/phases'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canWriteScope } from '@/lib/config/access'

// Write access is matrix-driven (operations/inspections scope).
/**
 * Phase is validated here because it no longer is in the database.
 *
 * The column was an ENUM, which rejected an unknown value — and on a server
 * without STRICT mode stored it as an empty string instead of erroring, which
 * is worse. It is now VARCHAR so the phase list can change without a
 * migration, and this is the guard that replaces it.
 */
function validPhase(v: any): boolean {
  return (PHASES as readonly string[]).includes(String(v))
}

function canEdit(roles: string[], _phase: string): boolean {
  return canWriteScope(roles, 'operations/inspections')
}

// GET: list or single
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') // filter by inspection_type

  try {
    if (id) {
      const rows = await queryPrimary('SELECT * FROM inspections WHERE id = ?', [id])
      if (!rows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      // Pull dependency info if present
      const record = rows[0]
      if (record.dependency_id) {
        const dep = await queryPrimary('SELECT id, inspection_number, inspection_type, phase FROM inspections WHERE id = ?', [record.dependency_id])
        record.dependency = dep?.[0] || null
      }
      const history = await queryPrimary(
        'SELECT * FROM inspection_history WHERE inspection_id = ? ORDER BY changed_at DESC', [id]
      )
      return NextResponse.json({ success: true, record, history })
    }

    let sql = 'SELECT * FROM inspections'
    const params: any[] = []
    if (type) { sql += ' WHERE inspection_type = ?'; params.push(type) }
    sql += ' ORDER BY start_date DESC, id DESC'

    const rows = await queryPrimary(sql, params)
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error('Error fetching inspections:', error)
    return NextResponse.json({
      error: 'Failed to fetch', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST: create
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  const username = (session.user as any)?.username || session.user?.name || 'unknown'

  if (!canEdit(roles, 'Setup')) {
    return NextResponse.json({ error: 'Insufficient permissions to create inspections' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      inspectionType, productType, partNumber, pcbNumber, workOrder,
      startDate, dueDate, netInspectNumber, reportType, reportDestination,
      reportDestinationOther, sourceFlag, owner, phase, site, dependencyId, notes
    } = body

    /**
     * Inspection number: {PREFIX}-{YYYY}-{seq}
     *
     * The sequence is the highest number ALREADY ISSUED under this prefix and
     * year, read out of inspection_number itself, plus one.
     *
     * It used to be COUNT(*) + 1 over rows of this inspection_type created
     * this year, which breaks three ways:
     *
     *   Deleting.    Fourteen FAIs exist, one is deleted, the count says 13
     *                and the next create tries FAI-2026-0013 — which is still
     *                on a live row. It then fails on every attempt forever,
     *                because the count never moves.
     *   Concurrency. Two people creating at the same moment both read the
     *                same count and compute the same number.
     *   Prefix mix.  The prefix is FAI for every type that is not X-Section
     *                or AOI, but the count was per inspection_type — so two
     *                such types would each count separately and collide on a
     *                shared FAI prefix.
     *
     * Reading the max of what was issued fixes all three: it is keyed on the
     * number actually in use rather than on how many rows happen to exist, and
     * a deleted number stays retired instead of being handed out again. Gaps
     * in the series are correct — an inspection number appears in history and
     * on paperwork, so reissuing one would make two different inspections
     * indistinguishable after the fact.
     */
    const prefix = inspectionType === 'X-Section' ? 'XS' : inspectionType === 'AOI' ? 'AOI' : 'FAI'
    const year = new Date().getFullYear()
    const stem = `${prefix}-${year}-`

    const nextNumber = async (): Promise<string> => {
      const rows = await queryPrimary<any[]>(
        `SELECT MAX(CAST(SUBSTRING(inspection_number, ?) AS UNSIGNED)) AS maxSeq
           FROM inspections
          WHERE inspection_number LIKE ?`,
        [stem.length + 1, `${stem}%`]
      )
      const seq = (Number(rows?.[0]?.maxSeq) || 0) + 1
      return `${stem}${String(seq).padStart(4, '0')}`
    }

    const values = (inspectionNumber: string) => [
      inspectionNumber, inspectionType || 'First Article', productType || 'PCB',
      partNumber || null, pcbNumber || null, workOrder || null, startDate || null,
      dueDate || null, netInspectNumber || null, reportType || null, reportDestination || null,
      reportDestinationOther || null, sourceFlag ? 1 : 0,
      owner || username, validPhase(phase) ? phase : 'Setup', site || null,
      dependencyId || null, notes || null, username
    ]

    const INSERT_SQL = `
      INSERT INTO inspections
        (inspection_number, inspection_type, product_type, part_number, pcb_number, work_order,
         start_date, due_date, net_inspect_number, report_type, report_destination,
         report_destination_other, source_flag, owner, phase, site, dependency_id, notes, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `

    /**
     * Read-then-insert is not atomic, so two simultaneous creates can still
     * pick the same number. The unique key is what actually prevents a
     * duplicate; this turns losing that race into a retry rather than into an
     * error the user sees. Each attempt re-reads the max, so the loser of a
     * race takes the next number up.
     */
    let inspectionNumber = ''
    let result: any = null
    let lastDup: any = null
    for (let attempt = 0; attempt < 5; attempt++) {
      inspectionNumber = await nextNumber()
      try {
        result = await queryPrimary(INSERT_SQL, values(inspectionNumber))
        lastDup = null
        break
      } catch (e: any) {
        const dup = e?.code === 'ER_DUP_ENTRY'
          && /uq_inspection_number/i.test(String(e?.sqlMessage || e?.message || ''))
        if (!dup) throw e
        lastDup = e
      }
    }

    if (lastDup) {
      console.error('Inspection number kept colliding:', lastDup?.sqlMessage || lastDup)
      return NextResponse.json({
        error: 'Could not allocate an inspection number',
        details: `${inspectionNumber} is already in use and five attempts did not find a free number. `
          + 'Please try again; if it repeats, the inspection_number series needs looking at.',
      }, { status: 409 })
    }

    const newId = result?.insertId
    if (newId) {
      await logHistory(newId, 'Created', '', `${inspectionNumber} (${inspectionType || 'First Article'} / ${productType || 'PCB'})`, username)
    }

    return NextResponse.json({ success: true, inspectionNumber, id: newId })
  } catch (error) {
    console.error('Error creating inspection:', error)
    return NextResponse.json({
      error: 'Failed to create', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// Log a change to inspection history
async function logHistory(inspectionId: number, field: string, oldVal: any, newVal: any, user: string) {
  await queryPrimary(
    'INSERT INTO inspection_history (inspection_id, field_name, old_value, new_value, changed_by) VALUES (?,?,?,?,?)',
    [inspectionId, field, oldVal != null ? String(oldVal) : '', newVal != null ? String(newVal) : '', user]
  )
}

// PUT: update an inspection
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []

  try {
    const body = await request.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Fetch current record for permission check + history comparison
    const currentRows = await queryPrimary('SELECT * FROM inspections WHERE id = ?', [id])
    if (!currentRows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const current = currentRows[0]

    if (!canEdit(roles, current.phase)) {
      return NextResponse.json({ error: 'Insufficient permissions to edit at this phase' }, { status: 403 })
    }

    const allowed = ['inspection_type', 'product_type', 'part_number', 'pcb_number', 'work_order',
                     'start_date', 'due_date', 'net_inspect_number', 'report_type', 'report_destination',
                     'report_destination_other', 'source_flag', 'owner', 'phase', 'site', 'dependency_id', 'notes']
    const updates: string[] = []
    const params: any[] = []
    const changes: { field: string; old: any; new: any }[] = []
    if ('phase' in fields && !validPhase(fields.phase)) {
      return NextResponse.json({
        error: `Unknown phase "${fields.phase}". Valid phases: ${PHASES.join(', ')}.`,
      }, { status: 400 })
    }
    for (const key of allowed) {
      if (key in fields) {
        const val = key === 'source_flag' ? (fields[key] ? 1 : 0) : (fields[key] || null)
        updates.push(`${key} = ?`); params.push(val)
        if (String(current[key] ?? '') !== String(val ?? '')) {
          changes.push({ field: key, old: current[key], new: val })
        }
      }
    }
    if (!updates.length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    params.push(id)
    await queryPrimary(`UPDATE inspections SET ${updates.join(', ')} WHERE id = ?`, params)

    const username = (session.user as any)?.username || session.user?.name || 'unknown'
    for (const c of changes) {
      await logHistory(Number(id), c.field, c.old, c.new, username)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating inspection:', error)
    return NextResponse.json({
      error: 'Failed to update', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
