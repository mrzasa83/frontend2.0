import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule, hasRole } from '@/lib/config/access'
import { queryMSSQL } from '@/lib/db/mssql'
import { productTypeFromPart, type MaterialLine } from '@/lib/ehs/productCompliance'

export const dynamic = 'force-dynamic'

const canWriteEhs = (roles: string[]) => hasRole(roles, 'Admin', 'EHSadmin')

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
    // Part Number and Customer Part Number come from Paradigm (DATA0050), not
    // from the values captured at signoff — so the list reflects the part as it
    // stands today rather than a stale copy.
    //   CUSTOMER_PART_NUMBER = the APC part number
    //   CUSTOMER_PART_DESC   = the customer's own part number
    const parts = Array.from(new Set(
      (rows || []).map(r => String(r.apc_part || '').trim()).filter(Boolean)
    ))
    const live = new Map<string, { apc: string; customer: string }>()
    for (let i = 0; i < parts.length; i += 200) {
      const batch = parts.slice(i, i + 200)
      const names = batch.map((_, j) => `@p${j}`)
      const params: Record<string, any> = {}
      batch.forEach((p, j) => { params[`p${j}`] = p })
      try {
        const found = await queryMSSQL<any[]>('1', `
          SELECT CUSTOMER_PART_NUMBER, CUSTOMER_PART_DESC
          FROM data0050 WITH (NOLOCK)
          WHERE LTRIM(RTRIM(CUSTOMER_PART_NUMBER)) IN (${names.join(',')})`, params)
        for (const f of found || []) {
          const apc = String(f.CUSTOMER_PART_NUMBER || '').trim()
          live.set(apc.toUpperCase(), {
            apc,
            customer: String(f.CUSTOMER_PART_DESC || '').trim(),
          })
        }
      } catch (e) {
        // Paradigm unreachable — fall back to the stored values below.
        console.error('EHS assessed-list DATA0050 lookup failed:', e)
      }
    }

    const merged = (rows || []).map(r => {
      const hit = live.get(String(r.apc_part || '').trim().toUpperCase())
      const apc = hit?.apc || r.apc_part
      return {
        ...r,
        apc_part: apc,
        customer_part: hit ? hit.customer : r.customer_part,
        part_type: productTypeFromPart(apc),
      }
    })

    return NextResponse.json({ success: true, rows: merged, count: merged.length })
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

    // Take the part numbers from Paradigm rather than the request body, so the
    // signoff records what DATA0050 actually says at the moment it was made.
    let apcResolved = apc_part
    let customerResolved = String(b?.customer_part ?? '').slice(0, 120)
    try {
      const hdr = await queryMSSQL<any[]>('1', `
        SELECT TOP 1 CUSTOMER_PART_NUMBER, CUSTOMER_PART_DESC
        FROM data0050 WITH (NOLOCK)
        WHERE LTRIM(RTRIM(CUSTOMER_PART_NUMBER)) = @part`, { part: apc_part })
      if (hdr?.length) {
        apcResolved = String(hdr[0].CUSTOMER_PART_NUMBER || '').trim() || apc_part
        customerResolved = String(hdr[0].CUSTOMER_PART_DESC || '').trim() || customerResolved
      }
    } catch (e) {
      console.error('EHS signoff DATA0050 lookup failed:', e)
    }
    const verdict = (v: any) => (String(v).toLowerCase() === 'pass' ? 'Pass' : 'Fail')

    const res: any = await queryPrimary(
      `INSERT INTO ehs_product_assessments
         (apc_part, customer_part, part_type, reach_status, rohs_status, prop65_status,
          material_count, covered_count, notes, assessed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [apcResolved,
       customerResolved.slice(0, 120),
       productTypeFromPart(apcResolved),
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
