import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule, hasRole } from '@/lib/config/access'
import { loadFamilies } from '@/lib/ehs/loadFamilies'
import { familyForPart, COMPLIANCE_VALUES, type PartRow } from '@/lib/ehs/familyMatch'

export const dynamic = 'force-dynamic'

const canWriteEhs = (roles: string[]) => hasRole(roles, 'Admin', 'EHSadmin')

const PART_SQL = `
  SELECT TOP 1 RKEY, INV_PART_NUMBER, INV_PART_DESCRIPTION, MANUFACTURER_NAME, ACTIVE_FLAG
  FROM DATA0017 WITH (NOLOCK)
  WHERE LTRIM(RTRIM(INV_PART_NUMBER)) = @part`

// PUT -> set a part's own REACH / RoHS / Prop 65.
// Only valid when the part's family does NOT flow its classification down; if
// the family inherits, the family is the single place to change it and this is
// refused rather than quietly creating a second source of truth.
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canWriteEhs(roles)) {
    return NextResponse.json({ error: 'Only an EHS Admin can change a part classification' }, { status: 403 })
  }

  try {
    const b = await request.json()
    const partNumber = String(b?.part_number ?? '').trim()
    if (!partNumber) return NextResponse.json({ error: 'part_number required' }, { status: 400 })

    const partRows = await queryMSSQL<any[]>('1', PART_SQL, { part: partNumber })
    if (!partRows?.length) return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    const p = partRows[0]
    const clean = (v: any) => String(v ?? '').trim()

    const families = await loadFamilies()
    const asPart: PartRow = {
      RKEY: Number(p.RKEY),
      INV_PART_NUMBER: clean(p.INV_PART_NUMBER),
      INV_PART_DESCRIPTION: clean(p.INV_PART_DESCRIPTION),
      MANUFACTURER_NAME: clean(p.MANUFACTURER_NAME),
      ACTIVE_FLAG: clean(p.ACTIVE_FLAG),
    }
    const fam = familyForPart(asPart, families)
    if (!fam) {
      return NextResponse.json({
        error: 'This part is not in any family yet. Assign it to a family first.',
      }, { status: 400 })
    }
    if (fam.inherit_compliance ?? 1) {
      return NextResponse.json({
        error: `“${fam.family_name}” passes its classification down to its parts. ` +
               'Change it on the family, or mark the family as per-part evidence first.',
      }, { status: 400 })
    }

    const val = (v: any, fallback = 'Unknown') => {
      const s = String(v ?? '').trim()
      return (COMPLIANCE_VALUES as readonly string[]).includes(s) ? s : fallback
    }
    const user = (session.user as any)?.username || 'unknown'

    await queryPrimary(
      `INSERT INTO ehs_part_compliance
         (part_number, reach_status, rohs_status, prop65_status, notes, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         reach_status = VALUES(reach_status),
         rohs_status  = VALUES(rohs_status),
         prop65_status = VALUES(prop65_status),
         notes        = VALUES(notes),
         updated_by   = VALUES(updated_by)`,
      [asPart.INV_PART_NUMBER, val(b?.reach_status), val(b?.rohs_status), val(b?.prop65_status),
       String(b?.notes ?? ''), user]
    )

    return NextResponse.json({ success: true, updated_by: user })
  } catch (error) {
    console.error('EHS part compliance save error:', error)
    return NextResponse.json({
      error: 'Failed to save the classification',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
