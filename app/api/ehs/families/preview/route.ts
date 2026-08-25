import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { canReadModule } from '@/lib/config/access'
import { partMatchesFamily, criteriaToSql, type PartRow } from '@/lib/ehs/familyMatch'

export const dynamic = 'force-dynamic'

const BASE_SQL = `
  select RKEY, INV_PART_NUMBER, INV_PART_DESCRIPTION, MANUFACTURER_NAME, ACTIVE_FLAG
  from data0017
  where P_M = 'P' and ACTIVE_FLAG = 'Y' and INV_PART_NUMBER not like 'Z%'
  order by INV_PART_NUMBER`

// POST { criteria: [...] } -> the parts those criteria would capture, plus the
// SQL they stand for. Lets the user test a definition before saving it.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'ehs')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  try {
    const b = await request.json()
    const criteria = (Array.isArray(b?.criteria) ? b.criteria : [])
      .map((c: any, i: number) => ({
        field: String(c?.field ?? 'INV_PART_NUMBER').toUpperCase(),
        operator: String(c?.operator ?? 'LIKE').toUpperCase(),
        conjunction: String(c?.conjunction ?? 'AND').toUpperCase() === 'OR' ? 'OR' : 'AND',
        pattern: String(c?.pattern ?? '').trim(),
        seq: i,
      }))
      .filter((c: any) => c.pattern)

    if (!criteria.length) {
      return NextResponse.json({ success: true, count: 0, parts: [], sql: criteriaToSql([]) })
    }

    const parts = await queryMSSQL<PartRow[]>('1', BASE_SQL)
    const matches = (parts || []).filter(p =>
      partMatchesFamily(p, { criteria } as any))

    return NextResponse.json({
      success: true,
      count: matches.length,
      totalParts: parts?.length ?? 0,
      parts: matches.slice(0, 300),
      sql: criteriaToSql(criteria),
    })
  } catch (error) {
    console.error('EHS criteria preview error:', error)
    return NextResponse.json({
      error: 'Preview failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
