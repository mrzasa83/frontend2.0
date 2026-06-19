import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export const dynamic = 'force-dynamic'

const EDIT_ROLES = ['Admin', 'Quality Control', 'Operations', 'Production Control']
const canEdit = (roles: string[]) => roles.some(r => EDIT_ROLES.includes(r))

async function nextReworkNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `RW-${year}-`
  const rows = await queryPrimary(
    'SELECT rework_number FROM reworks WHERE rework_number LIKE ? ORDER BY rework_number DESC LIMIT 1',
    [`${prefix}%`]
  )
  let seq = 1
  if (rows?.length) {
    const last = rows[0].rework_number as string
    const n = parseInt(last.slice(prefix.length), 10)
    if (!isNaN(n)) seq = n + 1
  }
  return `${prefix}${String(seq).padStart(4, '0')}`
}

// GET: list (?status=) or single (?id=) with steps
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const status = searchParams.get('status')

  try {
    if (id) {
      const rows = await queryPrimary('SELECT * FROM reworks WHERE id = ?', [id])
      if (!rows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const steps = await queryPrimary(
        'SELECT id, step_order, step_code, step_name, notes FROM rework_steps WHERE rework_id = ? ORDER BY step_order ASC, id ASC',
        [id]
      )
      return NextResponse.json({ success: true, record: { ...rows[0], steps: steps || [] } })
    }

    let sql = 'SELECT * FROM reworks'
    const params: any[] = []
    if (status && status !== 'all') { sql += ' WHERE status = ?'; params.push(status) }
    sql += ' ORDER BY created_at DESC'
    const rows = await queryPrimary(sql, params)
    return NextResponse.json({ success: true, data: rows || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// POST: create a rework (header + steps)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  const username = (session.user as any)?.username || session.user?.name || 'unknown'
  if (!canEdit(roles)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

  try {
    const b = await request.json()
    const number = await nextReworkNumber()
    const res: any = await queryPrimary(
      `INSERT INTO reworks
        (rework_number, customer_name, customer_part, work_order, pcb_number,
         inspection_report, authorized_by, rework_date, discrepancy, status, site, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        number, b.customerName || null, b.customerPart || null, b.workOrder || null, b.pcbNumber || null,
        b.inspectionReport || null, b.authorizedBy || null, b.reworkDate || null, b.discrepancy || null,
        'Open', b.site || null, username,
      ]
    )
    const reworkId = res.insertId
    const steps = Array.isArray(b.steps) ? b.steps : []
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i]
      await queryPrimary(
        'INSERT INTO rework_steps (rework_id, step_order, step_code, step_name, notes) VALUES (?,?,?,?,?)',
        [reworkId, i, s.code || null, s.name || s.step_name || '', s.notes || null]
      )
    }
    return NextResponse.json({ success: true, id: reworkId, reworkNumber: number })
  } catch (error) {
    return NextResponse.json({ error: 'Create failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

// PUT: update header/steps/status
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = (session.user as any)?.roles || []
  if (!canEdit(roles)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

  try {
    const b = await request.json()
    const { id } = b
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Header fields (snake_case columns)
    const map: Record<string, any> = {
      customer_name: b.customerName, customer_part: b.customerPart, work_order: b.workOrder,
      pcb_number: b.pcbNumber, inspection_report: b.inspectionReport, authorized_by: b.authorizedBy,
      rework_date: b.reworkDate, discrepancy: b.discrepancy, status: b.status, site: b.site,
    }
    const sets: string[] = []
    const vals: any[] = []
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { sets.push(`${col} = ?`); vals.push(val === '' ? null : val) }
    }
    if (sets.length) {
      vals.push(id)
      await queryPrimary(`UPDATE reworks SET ${sets.join(', ')} WHERE id = ?`, vals)
    }

    // Replace steps if provided
    if (Array.isArray(b.steps)) {
      await queryPrimary('DELETE FROM rework_steps WHERE rework_id = ?', [id])
      for (let i = 0; i < b.steps.length; i++) {
        const s = b.steps[i]
        await queryPrimary(
          'INSERT INTO rework_steps (rework_id, step_order, step_code, step_name, notes) VALUES (?,?,?,?,?)',
          [id, i, s.code || s.step_code || null, s.name || s.step_name || '', s.notes || null]
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
