import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { DAILY_PLAN_SQL, buildDailyPlanSQL } from '@/lib/queries/dailyPlan'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// GET  ?routeDept=CODE  -> the Daily Plan rows (optimized, set-based). Live query
// each load. When routeDept is supplied, only work orders whose ROUTE contains
// that department at any step are returned.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const routeDept = new URL(request.url).searchParams.get('routeDept') || ''
    const phrase = new URL(request.url).searchParams.get('phrase') || ''
    const sql = routeDept.trim() ? buildDailyPlanSQL(routeDept, phrase) : DAILY_PLAN_SQL
    const t0 = Date.now()
    const rows = await queryMSSQL<any[]>('1', sql)
    return NextResponse.json({
      success: true,
      rows: rows || [],
      count: rows?.length ?? 0,
      ms: Date.now() - t0,
      routeDept: routeDept.trim() || null,
      phrase: phrase.trim() || null,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Daily Plan query error:', error)
    return NextResponse.json({
      error: 'Failed to load Daily Plan',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST { workOrders: string[] } -> REMAINING_LABOR_HOURS for the given work
// orders only. This is the expensive per-row SUM over vw_wo_layer_all, so it's
// fetched lazily for the visible rows rather than for the whole plan.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { workOrders } = await request.json()
    const list = Array.isArray(workOrders)
      ? [...new Set(workOrders.filter(Boolean).map((w: string) => String(w).trim()))].slice(0, 500)
      : []
    if (!list.length) return NextResponse.json({ success: true, hours: {} })

    // Parameterized IN list
    const params: Record<string, any> = {}
    const names = list.map((wo, i) => { params[`w${i}`] = wo; return `@w${i}` })

    const rows = await queryMSSQL<any[]>('1', `
      SELECT D6.WORK_ORDER_NUMBER AS WORK_ORDER,
             ISNULL(SUM(WO.HOUR_LABOR), 0) AS REMAINING_LABOR_HOURS
      FROM DATA0006 AS D6 WITH (NOLOCK)
      LEFT OUTER JOIN vw_wo_layer_all AS WO ON WO.D6_1_RKEY = D6.RKEY AND WO.COMP_CHECK <> 'DONE'
      WHERE RTRIM(D6.WORK_ORDER_NUMBER) IN (${names.join(',')})
      GROUP BY D6.WORK_ORDER_NUMBER
    `, params)

    const hours: Record<string, number> = {}
    for (const r of rows || []) hours[String(r.WORK_ORDER).trim()] = Number(r.REMAINING_LABOR_HOURS) || 0
    return NextResponse.json({ success: true, hours })
  } catch (error) {
    console.error('Daily Plan labor-hours error:', error)
    return NextResponse.json({
      error: 'Failed to load labor hours',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
