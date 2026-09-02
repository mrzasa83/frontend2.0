import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/mssql'
import { queryMySQL } from '@/lib/mysql'

/**
 * Resolve a work order's route for the acquire flow.
 *
 * Current step comes from DATA9469 (live production-transaction table):
 *   MIN(STEP_NO) WHERE WORK_ORDER_NO = @wo (tail of split lots)
 * NOT from DATA0038.PERCENT_COMPLETE. Matches frontend2.0's Daily Plan app
 * (lib/queries/dailyPlan.ts + operations/daily-plan/work-order route).
 *
 * Route steps come from DATA0038 (TTYPE=2, SOURCE_PTR = DATA0006.RKEY), joined
 * to DATA0034 for dept. Acquire layers come from each step's parameters: NAMES
 * (DATA0035 defs via DEF_ROUT_PARA_n_PTR) paired with inline VALUES
 * (DATA0038.PARAMETER_1..10). On an expose step the values are the Genesis
 * layer names to acquire, keyed by number: names "SIDE|SIDE" + values
 * "E1S1|E1S2" -> layers { 1: E1S1, 2: E1S2 }.
 *
 * Expose steps are identified via shared MySQL wc_dept_mapping (is_expose_step
 * = 1) joined on DEPT_PTR = paradigm_rkey; they can't be inferred from the dept
 * code (e.g. I-LDIB-D is an Image dept), so the admin list is authoritative.
 */

interface ParamLayer {
  layerNum: number | null
  layerName: string
  paramName: string
  raw: string
}

interface RouteStep {
  stepNumber: number
  deptRkey: number | null
  deptCode: string
  deptName: string
  percentComplete: number
  isExposeStep: boolean
  isCurrent: boolean
  paramNames: string
  paramValues: string
  extParameters: string
  layers: ParamLayer[]
}

// Pair parameter names with values into acquire layers. Values may be
// number-prefixed ("1: E1S1") or bare ("E1S1"); key by the leading number when
// present, else by 1-based position.
function parseParamLayers(paramNames: string, paramValues: string): ParamLayer[] {
  if (!paramValues) return []
  const names = (paramNames || '').split('|').map(s => s.trim())
  const values = paramValues.split('|').map(s => s.trim()).filter(Boolean)
  const out: ParamLayer[] = []
  values.forEach((v, i) => {
    // Value may be "1: E1S1", "LYR 1: E1S1", or bare "E1S1".
    const m = v.match(/^(?:LYR\s*)?(\d+)\s*:\s*(.+)$/i)
    const layerNum = m ? parseInt(m[1], 10) : (i + 1)
    const layerName = (m ? m[2] : v).trim()
    if (layerName) out.push({ layerNum, layerName, paramName: names[i] || '', raw: v })
  })
  return out
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { workOrder } = await request.json()
    if (!workOrder) {
      return NextResponse.json({ error: 'workOrder is required' }, { status: 400 })
    }
    const cleanWo = String(workOrder).trim()

    // Suffix-anchored match (Paradigm stores a facility prefix before the dash).
    const escapeLike = (s: string) => s.replace(/[[%_]/g, (c) => `[${c}]`)
    const woMatch = `%${escapeLike(cleanWo)}`

    // Current step now comes from DATA9469 (live production-transaction table),
    // not DATA0146 which was sparse/unreliable. For split lots, MIN(STEP_NO) is
    // the tail lot's step — the current step, matching frontend2.0's Daily Plan.
    const stepRows = await queryMSSQL<any>(`
      SELECT MIN(STEP_NO) AS CURRENT_STEP
      FROM DATA9469 WITH (NOLOCK)
      WHERE WORK_ORDER_NO COLLATE DATABASE_DEFAULT LIKE @wo
    `, { wo: woMatch })
    const currentStepNumber: number | null = stepRows?.[0]?.CURRENT_STEP ?? null

    // Route steps + parameter names/values + ext-params.
    const routeRows = await queryMSSQL<any>(`
      SELECT
        d38.STEP_NUMBER AS STEP_NUMBER,
        d38.DEPT_PTR AS DEPT_RKEY,
        LTRIM(RTRIM(d34.DEPT_CODE)) AS DEPT_CODE,
        RTRIM(d34.DEPT_NAME) AS DEPT_NAME,
        ISNULL(d38.PERCENT_COMPLETE, 0) AS PERCENT_COMPLETE,
        (
          STUFF(
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_1))<>''  THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_1))  ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_2))<>''  THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_2))  ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_3))<>''  THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_3))  ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_4))<>''  THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_4))  ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_5))<>''  THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_5))  ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_6))<>''  THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_6))  ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_7))<>''  THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_7))  ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_8))<>''  THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_8))  ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_9))<>''  THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_9))  ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_10))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_10)) ELSE '' END,
            1, 3, '')
        ) AS PARAM_VALUES,
        (
          STUFF(
            CASE WHEN p1.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p1.PRODUCTION_PARAMETER) ELSE '' END +
            CASE WHEN p2.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p2.PRODUCTION_PARAMETER) ELSE '' END +
            CASE WHEN p3.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p3.PRODUCTION_PARAMETER) ELSE '' END +
            CASE WHEN p4.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p4.PRODUCTION_PARAMETER) ELSE '' END +
            CASE WHEN p5.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p5.PRODUCTION_PARAMETER) ELSE '' END,
            1, 3, '')
        ) AS PARAM_NAMES,
        (
          STUFF((
            SELECT '; ' + RTRIM(d469.PARAMETER_CODE) + '=' +
                   LTRIM(RTRIM(ISNULL(CAST(d471.PARAMETER_VALUE AS NVARCHAR(MAX)), '')))
            FROM DATA0471 d471
            INNER JOIN DATA0469 d469 ON d469.RKEY = d471.DATA0469_PTR
            WHERE d471.DATA0038_PTR = d38.RKEY
            ORDER BY d471.SEQUENCE_NO
            FOR XML PATH(''), TYPE
          ).value('.', 'NVARCHAR(MAX)'), 1, 2, '')
        ) AS EXT_PARAMETERS
      FROM DATA0006 wo WITH (NOLOCK)
      INNER JOIN DATA0038 d38 WITH (NOLOCK) ON d38.SOURCE_PTR = wo.RKEY AND d38.TTYPE = '2'
      LEFT JOIN DATA0034 d34 WITH (NOLOCK) ON d34.RKEY = d38.DEPT_PTR
      LEFT JOIN DATA0035 p1 WITH (NOLOCK) ON p1.RKEY = d38.DEF_ROUT_PARA_1_PTR
      LEFT JOIN DATA0035 p2 WITH (NOLOCK) ON p2.RKEY = d38.DEF_ROUT_PARA_2_PTR
      LEFT JOIN DATA0035 p3 WITH (NOLOCK) ON p3.RKEY = d38.DEF_ROUT_PARA_3_PTR
      LEFT JOIN DATA0035 p4 WITH (NOLOCK) ON p4.RKEY = d38.DEF_ROUT_PARA_4_PTR
      LEFT JOIN DATA0035 p5 WITH (NOLOCK) ON p5.RKEY = d38.DEF_ROUT_PARA_5_PTR
      WHERE wo.WORK_ORDER_NUMBER COLLATE DATABASE_DEFAULT LIKE @wo
      ORDER BY d38.STEP_NUMBER
    `, { wo: woMatch })

    if (!routeRows?.length) {
      // Distinguish the two failure modes so we can see WHY: did the WO not
      // match in DATA0006 at all, or did it match but have no DATA0038 (ttype=2)
      // route rows? Also report the stored WO number(s) that matched the suffix,
      // in case the stored format differs from what was entered.
      let diag = ''
      try {
        const woRows = await queryMSSQL<any>(`
          SELECT TOP 5 RTRIM(WORK_ORDER_NUMBER) AS WO, RKEY
          FROM DATA0006 WITH (NOLOCK)
          WHERE WORK_ORDER_NUMBER COLLATE DATABASE_DEFAULT LIKE @wo
        `, { wo: woMatch })
        if (!woRows?.length) {
          diag = `No DATA0006 row matches "${woMatch}". Check the work-order number/format.`
        } else {
          const rkeys = woRows.map((r: any) => r.RKEY)
          const params: Record<string, any> = {}
          const ph = rkeys.map((k: number, i: number) => { params[`k${i}`] = k; return `@k${i}` })
          const stepCount = await queryMSSQL<any>(`
            SELECT COUNT(*) AS N, MIN(TTYPE) AS MINT, MAX(TTYPE) AS MAXT
            FROM DATA0038 WITH (NOLOCK)
            WHERE SOURCE_PTR IN (${ph.join(',')})
          `, params)
          const ttype2 = await queryMSSQL<any>(`
            SELECT COUNT(*) AS N FROM DATA0038 WITH (NOLOCK)
            WHERE SOURCE_PTR IN (${ph.join(',')}) AND TTYPE = '2'
          `, params)
          const matched = woRows.map((r: any) => r.WO).join(', ')
          diag = `Matched DATA0006 WO(s): [${matched}]. DATA0038 rows for those: ${stepCount?.[0]?.N ?? 0} (TTYPE ${stepCount?.[0]?.MINT}–${stepCount?.[0]?.MAXT}); TTYPE=2 rows: ${ttype2?.[0]?.N ?? 0}.`
        }
      } catch (e) {
        diag = `diagnostic query failed: ${String(e)}`
      }
      return NextResponse.json(
        { success: false, error: `No route found for work order "${cleanWo}"`, diagnostic: diag },
        { status: 404 }
      )
    }

    const exposeRows = await queryMySQL<{ paradigm_rkey: number }>(
      `SELECT paradigm_rkey FROM wc_dept_mapping
       WHERE is_expose_step = 1 AND paradigm_rkey IS NOT NULL`
    )
    const exposeRkeys = new Set(exposeRows.map(r => Number(r.paradigm_rkey)))

    const steps: RouteStep[] = routeRows.map((r: any) => {
      const deptRkey = r.DEPT_RKEY != null ? Number(r.DEPT_RKEY) : null
      const stepNumber = Number(r.STEP_NUMBER)
      return {
        stepNumber,
        deptRkey,
        deptCode: r.DEPT_CODE || '',
        deptName: r.DEPT_NAME || '',
        percentComplete: Number(r.PERCENT_COMPLETE) || 0,
        isExposeStep: deptRkey != null && exposeRkeys.has(deptRkey),
        isCurrent: currentStepNumber != null && stepNumber === Number(currentStepNumber),
        paramNames: r.PARAM_NAMES || '',
        paramValues: r.PARAM_VALUES || '',
        extParameters: r.EXT_PARAMETERS || '',
        layers: parseParamLayers(r.PARAM_NAMES || '', r.PARAM_VALUES || ''),
      }
    })

    const currentIdx = steps.findIndex(s => s.isCurrent)
    const hasLayers = (s: RouteStep) => s.isExposeStep && s.layers.length > 0
    let suggested: RouteStep | undefined
    if (currentIdx >= 0 && hasLayers(steps[currentIdx])) {
      suggested = steps[currentIdx]
    } else if (currentIdx >= 0) {
      suggested = steps.slice(currentIdx).find(hasLayers) || steps.find(hasLayers)
    } else {
      suggested = steps.find(hasLayers)
    }

    return NextResponse.json({
      success: true,
      workOrder: cleanWo,
      steps,
      currentStepNumber,
      suggestedStepNumber: suggested?.stepNumber ?? null,
      hasExposeConfig: exposeRkeys.size > 0,
    })
  } catch (error) {
    console.error('WO route API error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve route', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
