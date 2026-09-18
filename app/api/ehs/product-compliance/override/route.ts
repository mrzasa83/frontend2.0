import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { canReadModule, hasRole } from '@/lib/config/access'
import { COMPLIANCE_VALUES } from '@/lib/ehs/familyMatch'

export const dynamic = 'force-dynamic'

const canWriteEhs = (roles: string[]) => hasRole(roles, 'Admin', 'EHSadmin')
const canRead = (roles: string[]) =>
  canReadModule(roles, 'ehs') || canReadModule(roles, 'products')

const CATS = ['reach', 'rohs', 'prop65', 'pfas'] as const

/** Only the four agreed values; anything else falls back to Unknown. */
const val = (v: any) =>
  (COMPLIANCE_VALUES as readonly string[]).includes(String(v)) ? String(v) : 'Unknown'

// GET ?part=... -> the standing assembly-level position, if one has been set.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canRead((session.user as any)?.roles || [])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const part = (new URL(request.url).searchParams.get('part') || '').trim()
  if (!part) return NextResponse.json({ error: 'part is required' }, { status: 400 })

  try {
    const rows = await queryPrimary<any[]>(
      'SELECT * FROM ehs_product_overrides WHERE apc_part = ? LIMIT 1', [part])
    return NextResponse.json({ success: true, override: rows?.[0] || null })
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({
        error: 'ehs_product_overrides does not exist. Run sql/create_ehs_product_overrides.sql.',
      }, { status: 500 })
    }
    console.error('EHS product override load error:', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}

/**
 * POST -> record the assessor's conclusion for the finished assembly.
 *
 * Body: { part, reach_status, rohs_status, prop65_status, pfas_status,
 *         computed: { reach, rohs, prop65, pfas }, reason, route_step }
 *
 * A reason is REQUIRED when any conclusion differs from what the materials
 * computed. That is the whole point of the feature — a route step that removes
 * or qualifies the offending material — and an unexplained divergence is worse
 * than no override at all, because it looks like a considered judgement.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canWriteEhs(roles)) {
    return NextResponse.json({
      error: 'Only an EHS Admin can set an assembly-level classification',
    }, { status: 403 })
  }
  const user = (session.user as any)?.username || 'unknown'

  try {
    const b = await request.json()
    const part = String(b?.part || '').trim()
    if (!part) return NextResponse.json({ error: 'part is required' }, { status: 400 })

    const computed = b?.computed || {}
    const reason = String(b?.reason ?? '').trim()

    // "Pass"/"Fail" from the roll-up vs "Compliant"/"Non-Compliant" from the
    // assessor are different vocabularies, so compare on intent rather than
    // string equality.
    const passes = (v: string) => v === 'Compliant' || v === 'Exempt' || v === 'Pass'
    const diverged = CATS.filter(c => {
      const chosen = val(b?.[`${c}_status`])
      const comp = String(computed?.[c] ?? '')
      if (!comp) return false
      return passes(chosen) !== passes(comp)
    })
    if (diverged.length && !reason) {
      return NextResponse.json({
        error: `A reason is required when the assembly differs from the materials `
          + `(${diverged.join(', ')}). Record the route step or exemption that justifies it.`,
      }, { status: 400 })
    }

    await queryPrimary(
      `INSERT INTO ehs_product_overrides
         (apc_part, reach_status, rohs_status, prop65_status, pfas_status,
          computed_reach, computed_rohs, computed_prop65, computed_pfas,
          reason, route_step, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         reach_status = VALUES(reach_status),
         rohs_status = VALUES(rohs_status),
         prop65_status = VALUES(prop65_status),
         pfas_status = VALUES(pfas_status),
         computed_reach = VALUES(computed_reach),
         computed_rohs = VALUES(computed_rohs),
         computed_prop65 = VALUES(computed_prop65),
         computed_pfas = VALUES(computed_pfas),
         reason = VALUES(reason),
         route_step = VALUES(route_step),
         updated_by = VALUES(updated_by)`,
      [part,
        val(b?.reach_status), val(b?.rohs_status), val(b?.prop65_status), val(b?.pfas_status),
        String(computed?.reach ?? '').slice(0, 20),
        String(computed?.rohs ?? '').slice(0, 20),
        String(computed?.prop65 ?? '').slice(0, 20),
        String(computed?.pfas ?? '').slice(0, 20),
        reason || null, String(b?.route_step ?? '').slice(0, 200), user]
    )
    return NextResponse.json({ success: true, diverged })
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({
        error: 'ehs_product_overrides does not exist. Run sql/create_ehs_product_overrides.sql.',
      }, { status: 500 })
    }
    console.error('EHS product override save error:', error)
    return NextResponse.json({
      error: 'Save failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
