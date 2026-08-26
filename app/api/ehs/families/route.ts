import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { queryMSSQL } from '@/lib/db/mssql'
import { canReadModule } from '@/lib/config/access'
import { hasColumn } from '@/lib/db/schemaProbe'
import {
  partMatchesFamily, CRITERIA_FIELDS, CRITERIA_OPERATORS, COMPLIANCE_VALUES,
  type Criterion, type PartRow,
} from '@/lib/ehs/familyMatch'

export const dynamic = 'force-dynamic'

/** Only Admin and EHSadmin may change EHS data. */
const canWriteEhs = (roles: string[]) => roles.includes('Admin') || roles.includes('EHSadmin')

const BASE_SQL = `
  select RKEY, INV_PART_NUMBER, INV_PART_DESCRIPTION, MANUFACTURER_NAME, ACTIVE_FLAG
  from data0017
  where P_M = 'P' and ACTIVE_FLAG = 'Y' and INV_PART_NUMBER not like 'Z%'
  order by INV_PART_NUMBER`

const cleanCriteria = (raw: any): Criterion[] =>
  (Array.isArray(raw) ? raw : [])
    .map((c: any, i: number) => ({
      field: String(c?.field ?? '').toUpperCase(),
      operator: String(c?.operator ?? 'LIKE').toUpperCase(),
      conjunction: String(c?.conjunction ?? 'AND').toUpperCase() === 'OR' ? 'OR' : 'AND',
      pattern: String(c?.pattern ?? '').trim().slice(0, 200),
      seq: Number.isFinite(Number(c?.seq)) ? Number(c.seq) : i,
    }))
    .filter(c =>
      (CRITERIA_FIELDS as readonly string[]).includes(c.field) &&
      (CRITERIA_OPERATORS as readonly string[]).includes(c.operator) &&
      c.pattern.length > 0)

// GET            -> all families with criteria and a live match count
// GET ?id=N      -> one family, its criteria and its matching parts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'ehs')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const id = Number(sp.get('id'))

  try {
    const families = await queryPrimary<any[]>(
      `SELECT id, family_name, description, reach_status, rohs_status, prop65_status,
              classification_notes, inherit_compliance, sort_order, active, created_by, updated_by, updated_at
       FROM ehs_part_families
       ${id ? 'WHERE id = ?' : ''}
       ORDER BY sort_order, family_name`,
      id ? [id] : []
    )
    if (id && !families?.length) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    const withConj = await hasColumn('ehs_family_criteria', 'conjunction')
    const critRows = await queryPrimary<any[]>(
      `SELECT id, family_id, field, operator,
              ${withConj ? 'conjunction,' : "'AND' AS conjunction,"} pattern, seq
       FROM ehs_family_criteria ${id ? 'WHERE family_id = ?' : ''}
       ORDER BY family_id, seq, id`,
      id ? [id] : []
    )
    const byFamily = new Map<number, any[]>()
    for (const c of critRows || []) {
      if (!byFamily.has(c.family_id)) byFamily.set(c.family_id, [])
      byFamily.get(c.family_id)!.push(c)
    }

    const parts = await queryMSSQL<PartRow[]>('1', BASE_SQL)
    const withCounts = (families || []).map(f => {
      const criteria = byFamily.get(f.id) || []
      const matches = (parts || []).filter(p => partMatchesFamily(p, { ...f, criteria } as any))
      return { ...f, criteria, match_count: matches.length }
    })

    if (id) {
      const f = withCounts[0]
      const matches = (parts || []).filter(p => partMatchesFamily(p, f as any))
      const docs = await queryPrimary<any[]>(
        `SELECT id, doc_type, title, file_name, file_path, file_size, uploaded_by, uploaded_at
         FROM ehs_family_documents WHERE family_id = ? ORDER BY uploaded_at DESC`, [id]
      )
      return NextResponse.json({ success: true, family: f, parts: matches, documents: docs || [] })
    }

    return NextResponse.json({ success: true, families: withCounts, totalParts: parts?.length ?? 0 })
  } catch (error) {
    console.error('EHS families query error:', error)
    return NextResponse.json({
      error: 'Failed to load families',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST -> create a family (with optional criteria). EHSadmin/Admin only.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canWriteEhs(roles)) {
    return NextResponse.json({ error: 'Only an EHS Admin can create a family' }, { status: 403 })
  }
  try {
    const b = await request.json()
    const family_name = String(b?.family_name ?? '').trim().slice(0, 120)
    if (!family_name) return NextResponse.json({ error: 'family_name required' }, { status: 400 })
    const user = (session.user as any)?.username || 'unknown'
    const criteria = cleanCriteria(b?.criteria)
    const withConjIns = await hasColumn('ehs_family_criteria', 'conjunction')

    const res: any = await queryPrimary(
      `INSERT INTO ehs_part_families
         (family_name, description, reach_status, rohs_status, prop65_status,
          classification_notes, inherit_compliance, sort_order, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [family_name,
       String(b?.description ?? '').slice(0, 500),
       String(b?.reach_status ?? 'Unknown').slice(0, 30),
       String(b?.rohs_status ?? 'Unknown').slice(0, 30),
       String(b?.prop65_status ?? 'Unknown').slice(0, 30),
       String(b?.classification_notes ?? ''),
       b?.inherit_compliance === false || b?.inherit_compliance === 0 ? 0 : 1,
       Number(b?.sort_order) || 100,
       user]
    )
    const newId = res?.insertId
    for (const c of criteria) {
      await queryPrimary(
        withConjIns
          ? 'INSERT INTO ehs_family_criteria (family_id, field, operator, conjunction, pattern, seq) VALUES (?, ?, ?, ?, ?, ?)'
          : 'INSERT INTO ehs_family_criteria (family_id, field, operator, pattern, seq) VALUES (?, ?, ?, ?, ?)',
        withConjIns
          ? [newId, c.field, c.operator, c.conjunction, c.pattern, c.seq]
          : [newId, c.field, c.operator, c.pattern, c.seq]
      )
    }
    return NextResponse.json({ success: true, id: newId })
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'A family with that name already exists' }, { status: 409 })
    }
    console.error('EHS family create error:', error)
    return NextResponse.json({ error: 'Failed to create family', details: String(error?.message || error) }, { status: 500 })
  }
}

// PUT -> update a family's details, classification and/or criteria. EHSadmin/Admin only.
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canWriteEhs(roles)) {
    return NextResponse.json({ error: 'Only an EHS Admin can change EHS data' }, { status: 403 })
  }
  try {
    const b = await request.json()
    const id = Number(b?.id)
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const user = (session.user as any)?.username || 'unknown'

    const sets: string[] = []
    const vals: any[] = []
    const put = (col: string, v: any, max = 500) => {
      if (v === undefined) return
      sets.push(`${col} = ?`); vals.push(typeof v === 'string' ? v.slice(0, max) : v)
    }
    put('family_name', b.family_name, 120)
    put('description', b.description, 500)
    if (b.reach_status !== undefined && (COMPLIANCE_VALUES as readonly string[]).includes(b.reach_status)) put('reach_status', b.reach_status, 30)
    if (b.rohs_status !== undefined && (COMPLIANCE_VALUES as readonly string[]).includes(b.rohs_status)) put('rohs_status', b.rohs_status, 30)
    if (b.prop65_status !== undefined && (COMPLIANCE_VALUES as readonly string[]).includes(b.prop65_status)) put('prop65_status', b.prop65_status, 30)
    if (b.classification_notes !== undefined) { sets.push('classification_notes = ?'); vals.push(String(b.classification_notes)) }
    if (b.inherit_compliance !== undefined) {
      sets.push('inherit_compliance = ?'); vals.push(b.inherit_compliance ? 1 : 0)
    }
    if (b.sort_order !== undefined) { sets.push('sort_order = ?'); vals.push(Number(b.sort_order) || 100) }
    if (b.active !== undefined) { sets.push('active = ?'); vals.push(b.active ? 1 : 0) }
    sets.push('updated_by = ?'); vals.push(user)

    if (sets.length) {
      await queryPrimary(`UPDATE ehs_part_families SET ${sets.join(', ')} WHERE id = ?`, [...vals, id])
    }

    // Criteria are replaced wholesale when supplied — simplest correct semantics
    // for an editable rule list.
    if (b.criteria !== undefined) {
      const criteria = cleanCriteria(b.criteria)
      const withConjIns = await hasColumn('ehs_family_criteria', 'conjunction')
      await queryPrimary('DELETE FROM ehs_family_criteria WHERE family_id = ?', [id])
      for (const c of criteria) {
        await queryPrimary(
          withConjIns
            ? 'INSERT INTO ehs_family_criteria (family_id, field, operator, conjunction, pattern, seq) VALUES (?, ?, ?, ?, ?, ?)'
            : 'INSERT INTO ehs_family_criteria (family_id, field, operator, pattern, seq) VALUES (?, ?, ?, ?, ?)',
          withConjIns
            ? [id, c.field, c.operator, c.conjunction, c.pattern, c.seq]
            : [id, c.field, c.operator, c.pattern, c.seq]
        )
      }
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'A family with that name already exists' }, { status: 409 })
    }
    console.error('EHS family update error:', error)
    return NextResponse.json({ error: 'Failed to update family', details: String(error?.message || error) }, { status: 500 })
  }
}

// DELETE ?id=N -> remove a family (criteria and document rows cascade).
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canWriteEhs(roles)) {
    return NextResponse.json({ error: 'Only an EHS Admin can delete a family' }, { status: 403 })
  }
  try {
    const id = Number(new URL(request.url).searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await queryPrimary('DELETE FROM ehs_part_families WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('EHS family delete error:', error)
    return NextResponse.json({ error: 'Failed to delete', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
