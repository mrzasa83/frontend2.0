import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canWriteScope } from '@/lib/config/access'

// Write access is matrix-driven (operations/inspections scope).
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

    // Generate inspection number: {TYPE-PREFIX}-{YYYY}-{seq}
    const prefix = inspectionType === 'X-Section' ? 'XS' : inspectionType === 'AOI' ? 'AOI' : 'FAI'
    const year = new Date().getFullYear()
    const countRows = await queryPrimary(
      'SELECT COUNT(*) AS c FROM inspections WHERE inspection_type = ? AND YEAR(created_at) = ?',
      [inspectionType || 'First Article', year]
    )
    const seq = (Number(countRows?.[0]?.c) || 0) + 1
    const inspectionNumber = `${prefix}-${year}-${String(seq).padStart(4, '0')}`

    const result: any = await queryPrimary(`
      INSERT INTO inspections
        (inspection_number, inspection_type, product_type, part_number, pcb_number, work_order,
         start_date, due_date, net_inspect_number, report_type, report_destination,
         report_destination_other, source_flag, owner, phase, site, dependency_id, notes, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      inspectionNumber, inspectionType || 'First Article', productType || 'PCB',
      partNumber || null, pcbNumber || null, workOrder || null, startDate || null,
      dueDate || null, netInspectNumber || null, reportType || null, reportDestination || null,
      reportDestinationOther || null, sourceFlag ? 1 : 0,
      owner || username, phase || 'Setup', site || null,
      dependencyId || null, notes || null, username
    ])

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
