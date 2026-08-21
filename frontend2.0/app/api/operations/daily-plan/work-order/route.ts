import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// GET ?workOrder=-350515-08-100
//   Returns: general info, the work-order route (DATA0038 TTYPE=2 keyed on the
//   work order RKEY, joined to DATA0034 for dept), the current step (max
//   DATA0146 STEP_NO), and per-step instructions + parameters.
//
//   Note: backlog / unreleased work orders legitimately have no route — an empty
//   route array is a normal result, not an error.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workOrder = (new URL(request.url).searchParams.get('workOrder') || '').trim()
  if (!workOrder) return NextResponse.json({ error: 'workOrder required' }, { status: 400 })

  try {
    // General info (supplements the table row)
    const genRows = await queryMSSQL<any[]>('1', `
      SELECT
        wo.RKEY AS WO_RKEY,
        wo.WORK_ORDER_NUMBER AS WORK_ORDER,
        d50.CUSTOMER_PART_NUMBER AS CUSTOMER_PN,
        d17.INV_PART_NUMBER AS INVENTORY_PN,
        d17.INV_PART_DESCRIPTION AS DESCRIPTION,
        d10.ABBR_NAME AS CUSTOMER,
        wo.PRIORITY_CODE AS PTY,
        wo.QUAN_SCH AS QTY_SCHEDULED,
        wo.SCH_COMPL_DATE AS SCH_COMPLETE,
        wo.PARTS_PER_PANEL AS PARTS_PER_PANEL,
        wo.ANALYSIS_CODE_3 AS ANALYSIS_CODE_3,
        wo.ANALYSIS_CODE_5 AS ANALYSIS_CODE_5,
        CASE wo.PROD_STATUS
          WHEN 2   THEN 'RELEASED'
          WHEN 3   THEN 'IN PRODUCTION'
          WHEN 206 THEN 'ON HOLD (UNRELEASED)'
          WHEN 306 THEN 'ON HOLD (RELEASED)'
          ELSE 'UNKNOWN'
        END AS WO_STATUS
      FROM DATA0006 wo
      LEFT JOIN DATA0050 d50 ON d50.RKEY = wo.CUST_PART_PTR
      LEFT JOIN DATA0010 d10 ON d10.RKEY = d50.CUSTOMER_PTR
      LEFT JOIN DATA0017 d17 ON d17.RKEY = wo.INVENTORY_PTR
      WHERE LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) = LTRIM(RTRIM(@wo))
    `, { wo: workOrder })

    const general = genRows?.[0] || null

    // Current step: highest DATA0146 STEP_NO for the work order.
    const stepRows = await queryMSSQL<any[]>('1', `
      SELECT MAX(STEP_NO) AS CURRENT_STEP
      FROM DATA0146
      WHERE LTRIM(RTRIM(WORK_ORDER_NO)) = LTRIM(RTRIM(@wo))
    `, { wo: workOrder })
    const currentStep = stepRows?.[0]?.CURRENT_STEP ?? null

    // Work-order route with dept + instruction/parameter pointers, resolved.
    // Instructions come from DATA0036 via DEF_ROUT_INST_n_PTR; parameter names
    // from DATA0035 via DEF_ROUT_PARA_n_PTR; inline values from PARAMETER_1..10.
    const routeRows = await queryMSSQL<any[]>('1', `
      SELECT
        d38.STEP_NUMBER AS STEP_NUMBER,
        LTRIM(RTRIM(d34.DEPT_CODE)) AS DEPT_CODE,
        RTRIM(d34.DEPT_NAME) AS DEPT_NAME,
        d38.PERCENT_COMPLETE AS PERCENT_COMPLETE,
        -- instruction codes + text (up to 5)
        (
          ISNULL(RTRIM(i1.INST_CODE),'') +
          CASE WHEN i2.INST_CODE IS NOT NULL THEN '; ' + RTRIM(i2.INST_CODE) ELSE '' END +
          CASE WHEN i3.INST_CODE IS NOT NULL THEN '; ' + RTRIM(i3.INST_CODE) ELSE '' END +
          CASE WHEN i4.INST_CODE IS NOT NULL THEN '; ' + RTRIM(i4.INST_CODE) ELSE '' END +
          CASE WHEN i5.INST_CODE IS NOT NULL THEN '; ' + RTRIM(i5.INST_CODE) ELSE '' END
        ) AS INSTRUCTION_CODES,
        LTRIM(RTRIM(
          ISNULL(i1.PROD_ROUT_INST_1,'') + ' ' + ISNULL(i1.PROD_ROUT_INST_2,'') + ' ' +
          ISNULL(i1.PROD_ROUT_INST_3,'') + ' ' + ISNULL(i1.PROD_ROUT_INST_4,'')
        )) AS INSTRUCTION_TEXT,
        -- inline parameters, pipe-joined, blanks skipped
        (
          STUFF(
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_1))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_1)) ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_2))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_2)) ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_3))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_3)) ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_4))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_4)) ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_5))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_5)) ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_6))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_6)) ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_7))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_7)) ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_8))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_8)) ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_9))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_9)) ELSE '' END +
            CASE WHEN LTRIM(RTRIM(d38.PARAMETER_10))<>'' THEN ' | '+LTRIM(RTRIM(d38.PARAMETER_10)) ELSE '' END,
            1, 3, '')
        ) AS PARAMETERS,
        -- parameter names (from DATA0035 defs), pipe-joined
        (
          STUFF(
            CASE WHEN p1.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p1.PRODUCTION_PARAMETER) ELSE '' END +
            CASE WHEN p2.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p2.PRODUCTION_PARAMETER) ELSE '' END +
            CASE WHEN p3.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p3.PRODUCTION_PARAMETER) ELSE '' END +
            CASE WHEN p4.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p4.PRODUCTION_PARAMETER) ELSE '' END +
            CASE WHEN p5.PRODUCTION_PARAMETER IS NOT NULL THEN ' | '+RTRIM(p5.PRODUCTION_PARAMETER) ELSE '' END,
            1, 3, '')
        ) AS PARAMETER_NAMES,
        -- Additional Route Step Parameters (DATA0471 values → DATA0469 defs),
        -- multiple per step, seq-ordered, blended into "name: value" lines.
        -- PARAM_NOTE / values are ntext → CAST to nvarchar(max) before concat.
        (
          STUFF((
            SELECT '; ' +
              LTRIM(RTRIM(ISNULL(d469.PARAMETER_DESC, d469.PARAMETER_CODE))) + ': ' +
              LTRIM(RTRIM(ISNULL(CAST(d471.PARAMETER_VALUE AS NVARCHAR(MAX)), ''))) +
              CASE WHEN LTRIM(RTRIM(ISNULL(CAST(d471.PARAM_NOTE AS NVARCHAR(MAX)),''))) <> ''
                   THEN ' (' + LTRIM(RTRIM(CAST(d471.PARAM_NOTE AS NVARCHAR(MAX)))) + ')'
                   ELSE '' END
            FROM DATA0471 d471
            INNER JOIN DATA0469 d469 ON d469.RKEY = d471.DATA0469_PTR
            WHERE d471.DATA0038_PTR = d38.RKEY
            ORDER BY d471.SEQUENCE_NO
            FOR XML PATH(''), TYPE
          ).value('.', 'NVARCHAR(MAX)'), 1, 2, '')
        ) AS EXT_PARAMETERS
      FROM DATA0006 wo
      INNER JOIN DATA0038 d38 ON d38.SOURCE_PTR = wo.RKEY AND d38.TTYPE = 2
      LEFT JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
      LEFT JOIN DATA0036 i1 ON i1.RKEY = d38.DEF_ROUT_INST_1_PTR
      LEFT JOIN DATA0036 i2 ON i2.RKEY = d38.DEF_ROUT_INST_2_PTR
      LEFT JOIN DATA0036 i3 ON i3.RKEY = d38.DEF_ROUT_INST_3_PTR
      LEFT JOIN DATA0036 i4 ON i4.RKEY = d38.DEF_ROUT_INST_4_PTR
      LEFT JOIN DATA0036 i5 ON i5.RKEY = d38.DEF_ROUT_INST_5_PTR
      LEFT JOIN DATA0035 p1 ON p1.RKEY = d38.DEF_ROUT_PARA_1_PTR
      LEFT JOIN DATA0035 p2 ON p2.RKEY = d38.DEF_ROUT_PARA_2_PTR
      LEFT JOIN DATA0035 p3 ON p3.RKEY = d38.DEF_ROUT_PARA_3_PTR
      LEFT JOIN DATA0035 p4 ON p4.RKEY = d38.DEF_ROUT_PARA_4_PTR
      LEFT JOIN DATA0035 p5 ON p5.RKEY = d38.DEF_ROUT_PARA_5_PTR
      WHERE LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) = LTRIM(RTRIM(@wo))
      ORDER BY d38.STEP_NUMBER
    `, { wo: workOrder })

    // Step activity/history from the production-transaction table (DATA9469).
    // One row per active step, each with its entry date + time (TIME_IN is an
    // HHMMSS integer). Dwell time is derived client-side from consecutive entries.
    const historyRows = await queryMSSQL<any[]>('1', `
      SELECT STEP_NO, LTRIM(RTRIM(WORK_CENTER)) AS WORK_CENTER,
             RTRIM(WORK_CENTER_NAME) AS WORK_CENTER_NAME,
             DATE_IN, TIME_IN, QUAN_IN_BKLG, QUAN_PROD
      FROM DATA9469 WITH (NOLOCK)
      WHERE LTRIM(RTRIM(WORK_ORDER_NO)) = LTRIM(RTRIM(@wo))
      ORDER BY STEP_NO
    `, { wo: workOrder })

    return NextResponse.json({
      success: true,
      general,
      route: routeRows || [],
      history: historyRows || [],
      currentStep,
      released: !!(routeRows && routeRows.length),
    })
  } catch (error) {
    console.error('Work order detail error:', error)
    return NextResponse.json({
      error: 'Failed to load work order',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
