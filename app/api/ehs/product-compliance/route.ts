import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule } from '@/lib/config/access'
import { productTypeFromPart, type MaterialLine } from '@/lib/ehs/productCompliance'

export const dynamic = 'force-dynamic'

const canWriteEhs = (roles: string[]) => roles.includes('Admin') || roles.includes('EHSadmin')

// GET -> every product assessed, most recent signoff first.
// ?all=1 returns the full history rather than just the latest per part.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'ehs')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const all = sp.get('all') === '1'

  try {
    // Latest assessment per part unless the full history was asked for.
    const rows = await queryPrimary<any[]>(
      all
        ? `SELECT id, apc_part, customer_part, part_type, reach_status, rohs_status,
                  prop65_status, material_count, covered_count, assessed_by, assessed_at
           FROM ehs_product_assessments
           ORDER BY assessed_at DESC`
        : `SELECT a.id, a.apc_part, a.customer_part, a.part_type, a.reach_status, a.rohs_status,
                  a.prop65_status, a.material_count, a.covered_count, a.assessed_by, a.assessed_at
           FROM ehs_product_assessments a
           JOIN (
             SELECT apc_part, MAX(id) AS latest_id
             FROM ehs_product_assessments
             GROUP BY apc_part
           ) l ON l.latest_id = a.id
           ORDER BY a.assessed_at DESC`
    )
    return NextResponse.json({ success: true, rows: rows || [], count: rows?.length ?? 0 })
  } catch (error) {
    console.error('EHS product assessments query error:', error)
    return NextResponse.json({
      error: 'Failed to load assessments',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST -> record a signoff. The verdicts and the BOM snapshot are supplied by
// the client from what it displayed, so the stored record matches what the
// signer actually saw. EHSadmin/Admin only.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canWriteEhs(roles)) {
    return NextResponse.json({ error: 'Only an EHS Admin can sign off a product' }, { status: 403 })
  }

  try {
    const b = await request.json()
    const apc_part = String(b?.apc_part ?? '').trim().slice(0, 120)
    if (!apc_part) return NextResponse.json({ error: 'apc_part required' }, { status: 400 })

    const materials: MaterialLine[] = Array.isArray(b?.materials) ? b.materials : []
    const user = (session.user as any)?.username || 'unknown'
    const verdict = (v: any) => (String(v).toLowerCase() === 'pass' ? 'Pass' : 'Fail')

    const res: any = await queryPrimary(
      `INSERT INTO ehs_product_assessments
         (apc_part, customer_part, part_type, reach_status, rohs_status, prop65_status,
          material_count, covered_count, notes, assessed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [apc_part,
       String(b?.customer_part ?? '').slice(0, 120),
       productTypeFromPart(apc_part),
       verdict(b?.reach_status), verdict(b?.rohs_status), verdict(b?.prop65_status),
       materials.length,
       materials.filter(m => m.family_name).length,
       String(b?.notes ?? ''),
       user]
    )
    const id = res?.insertId

    for (const m of materials) {
      await queryPrimary(
        `INSERT INTO ehs_product_assessment_lines
           (assessment_id, part_number, description, manufacturer, family_name,
            reach_status, rohs_status, prop65_status, per_part_evidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id,
         String(m.part_number ?? '').slice(0, 120),
         String(m.description ?? '').slice(0, 300),
         String(m.manufacturer ?? '').slice(0, 200),
         String(m.family_name ?? '').slice(0, 120),
         String(m.reach_status ?? '').slice(0, 30),
         String(m.rohs_status ?? '').slice(0, 30),
         String(m.prop65_status ?? '').slice(0, 30),
         m.per_part_evidence ? 1 : 0]
      )
    }

    return NextResponse.json({ success: true, id, assessed_by: user })
  } catch (error) {
    console.error('EHS product assessment save error:', error)
    return NextResponse.json({
      error: 'Failed to save the assessment',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
