import { NextRequest, NextResponse } from 'next/server'
import { queryMSSQL } from '@/lib/mssql'
import { logActivity } from '@/lib/mysql'
import { writeRouteFile } from '@/lib/file-writer'

export async function POST(request: NextRequest) {
  try {
    const { operator, workOrder, loggingEnabled = true, skipBadgeCheck = false } = await request.json()

    // Validate inputs
    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work Order is required' },
        { status: 400 }
      )
    }

    // Paradigm stores work orders with a leading facility/type prefix before the
    // dash (e.g. "S-355041-01-000"), while operators type only the dashed portion
    // ("-355041-01-000"). A bare LIKE with the raw value acts like "=" and misses.
    // Anchor the match to the end so any prefix is absorbed, mirroring the known-
    // good query `... LIKE '%-355041-01-000'`. Escape LIKE metacharacters in the
    // user input so a stray %/_/[ can't broaden or break the pattern.
    const escapeLike = (s: string) => s.replace(/[[%_]/g, (c) => `[${c}]`)
    const cleanWorkOrder = String(workOrder).trim()
    const workOrderMatch = `%${escapeLike(cleanWorkOrder)}`

    // Validate operator badge ID format (5 digits) unless skipped
    if (!skipBadgeCheck && operator && !/^\d{5}$/.test(operator)) {
      return NextResponse.json(
        { error: 'Operator Badge ID must be exactly 5 digits' },
        { status: 400 }
      )
    }

    // Log the request only if logging is enabled
    if (loggingEnabled && operator) {
      await logActivity(operator, workOrder, 'query_initiated', undefined, undefined)
    }

    // Query to retrieve work order data with complex joins and conditional logic
    const query = `
      SELECT 
          DATA0010_1.ABBR_NAME,
          rtrim(DATA0050_1.CUSTOMER_PART_NUMBER) as CUSTOMER_PART_NUMBER,
          DATA0146_1.SALES_ORDER,
          DATA0006_1.WORK_ORDER_NUMBER AS WORK_ORDER,
          CASE 
              WHEN DATA0006_1.WORK_ORDER_NUMBER NOT LIKE '%-000' THEN rtrim(DATA0017_1.INV_PART_NUMBER)
              WHEN DATA0006_1.WORK_ORDER_NUMBER LIKE 'W%-000' THEN rtrim(DATA0017_3.INV_PART_NUMBER)
              WHEN DATA0006_1.WORK_ORDER_NUMBER LIKE '%-000' THEN rtrim(DATA0017_2.INV_PART_NUMBER)
          END AS INV_PART_NUMBER,
          SUBSTRING(CAST(DATA0006_1.PARTS_PER_PANEL AS CHAR), 1, 4) AS NRUP,
          DATA0146_1.STEP_NO AS STEP,
          CASE 
              WHEN DATA0006_1.WORK_ORDER_NUMBER NOT LIKE '%-000' THEN (
                  SELECT rtrim(DATA0044.PROD_PARA_04)
                  FROM DATA0044 DATA0044 WITH (NOLOCK)
                  WHERE DATA0044.SOURCE_PTR = DATA0017_1.RKEY
                      AND DATA0006_1.INVENTORY_PTR = DATA0017_1.RKEY
                      AND DATA0044.SOURCE_TYPE = '1'
              )
              WHEN DATA0006_1.WORK_ORDER_NUMBER LIKE '%-000' THEN (
                  SELECT rtrim(DATA0044.PROD_PARA_04)
                  FROM DATA0044
                  WHERE DATA0044.SOURCE_PTR = DATA0050_1.RKEY
                      AND DATA0044.SOURCE_TYPE = '2'
              )
          END AS CIRC_SIZE,
          CASE 
              WHEN DATA0006_1.WORK_ORDER_NUMBER NOT LIKE '%-000' THEN (
                  SELECT rtrim(DATA0044.PROD_PARA_08)
                  FROM DATA0044 DATA0044 WITH (NOLOCK)
                  WHERE DATA0044.SOURCE_PTR = DATA0017_1.RKEY
                      AND DATA0006_1.INVENTORY_PTR = DATA0017_1.RKEY
                      AND DATA0044.SOURCE_TYPE = '1'
              )
              WHEN DATA0006_1.WORK_ORDER_NUMBER LIKE '%-000' THEN (
                  SELECT rtrim(DATA0044.PROD_PARA_08)
                  FROM DATA0044
                  WHERE DATA0044.SOURCE_PTR = DATA0050_1.RKEY
                      AND DATA0044.SOURCE_TYPE = '2'
              )
          END AS PNL_SIZE,
          rtrim(D34.DEPT_CODE) as DEPT_CODE
      FROM DATA0006 AS DATA0006_1 WITH (NOLOCK)
      LEFT OUTER JOIN DATA0146 AS DATA0146_1 WITH (NOLOCK) 
          ON DATA0006_1.WORK_ORDER_NUMBER = DATA0146_1.WORK_ORDER_NO
      LEFT OUTER JOIN DATA0050 AS DATA0050_1 WITH (NOLOCK) 
          ON DATA0006_1.CUST_PART_PTR = DATA0050_1.RKEY
      LEFT OUTER JOIN DATA0010 AS DATA0010_1 WITH (NOLOCK) 
          ON DATA0050_1.CUSTOMER_PTR = DATA0010_1.RKEY
      LEFT OUTER JOIN DATA0008 AS DATA0008_1 WITH (NOLOCK) 
          ON DATA0050_1.PROD_CODE_PTR = DATA0008_1.RKEY
      LEFT OUTER JOIN DATA0015 AS DATA0015_1 WITH (NOLOCK) 
          ON DATA0015_1.RKEY = DATA0006_1.WHOUSE_PTR
      LEFT OUTER JOIN DATA0060 AS DATA0060_1 WITH (NOLOCK) 
          ON DATA0060_1.SALES_ORDER = DATA0146_1.SALES_ORDER
      LEFT OUTER JOIN DATA0017 AS DATA0017_1 WITH (NOLOCK) 
          ON DATA0006_1.INVENTORY_PTR = DATA0017_1.RKEY
      LEFT OUTER JOIN DATA0025 AS DATA0025_1 WITH (NOLOCK) 
          ON DATA0025_1.RKEY = DATA0006_1.BOM_PTR
      LEFT OUTER JOIN DATA0017 AS DATA0017_2 WITH (NOLOCK) 
          ON DATA0017_2.RKEY = DATA0025_1.INVENTORY_PTR
      LEFT OUTER JOIN DATA0025 AS DATA0025_2 WITH (NOLOCK) 
          ON DATA0025_2.RKEY = DATA0050_1.BOM_PTR
      LEFT OUTER JOIN DATA0017 AS DATA0017_3 WITH (NOLOCK) 
          ON DATA0017_3.RKEY = DATA0025_2.INVENTORY_PTR
      LEFT OUTER JOIN DATA0038 AS DATA0038_1 WITH (NOLOCK) 
          ON DATA0038_1.SOURCE_PTR = DATA0006_1.RKEY 
          AND DATA0146_1.STEP_NO = DATA0038_1.STEP_NUMBER
      LEFT OUTER JOIN DATA0034 AS D34 WITH (NOLOCK) 
          ON DATA0038_1.DEPT_PTR = D34.RKEY
      WHERE DATA0006_1.WORK_ORDER_NUMBER LIKE @workOrder
      ORDER BY DATA0050_1.CUSTOMER_PART_NUMBER
    `

    const result = await queryMSSQL(query, {
      workOrder: workOrderMatch,
    })

    // If we got results, process routing queries
    let routeData = null
    if (result.length > 0) {
      // Extract 5 characters starting from position 3 (index 2) of INV_PART_NUMBER
      const invPartNumber = result[0].INV_PART_NUMBER || ''
      const extractedCode = invPartNumber.substring(2, 7) // Characters 3-7 (5 chars)
      
      // Get first 5 characters of CUSTOMER_PART_NUMBER for comparison
      const customerPartNumber = result[0].CUSTOMER_PART_NUMBER || ''
      const customerPartFirst5 = customerPartNumber.substring(0, 5)

      // Debug logging
      console.log('===== ROUTING DEBUG =====')
      console.log('Full INV_PART_NUMBER:', invPartNumber)
      console.log('Extracted Code (chars 3-7):', extractedCode)
      console.log('Customer Part Number:', customerPartNumber)
      console.log('Customer Part First 5:', customerPartFirst5)
      console.log('Match:', customerPartFirst5 === extractedCode)
      console.log('=========================')

      // Check if Customer Part Number first 5 chars match extracted code
      let routeResult1: any[] = []
      let debugQuery1SQL = ''
      let skippedQuery1 = false

      if (customerPartFirst5 === extractedCode) {
        // Run Route Query 1: Check customer part number
        const routeQuery1 = `
          SELECT 
              d38.STEP_NUMBER,
              rtrim(d34.DEPT_CODE) as DEPT_CODE,
              rtrim(d34.DEPT_NAME) as DEPT_NAME,
              STUFF((
                  SELECT '; ' +
                         p.PRODUCTION_PARAMETER + '=' + RTRIM(v.param_value)
                  FROM (
                      VALUES
                          (1, d38.PARAMETER_1, d38.DEF_ROUT_PARA_1_PTR),
                          (2, d38.PARAMETER_2, d38.DEF_ROUT_PARA_2_PTR),
                          (3, d38.PARAMETER_3, d38.DEF_ROUT_PARA_3_PTR),
                          (4, d38.PARAMETER_4, d38.DEF_ROUT_PARA_4_PTR),
                          (5, d38.PARAMETER_5, d38.DEF_ROUT_PARA_5_PTR),
                          (6, d38.PARAMETER_6, d38.DEF_ROUT_PARA_6_PTR),
                          (7, d38.PARAMETER_7, d38.DEF_ROUT_PARA_7_PTR),
                          (8, d38.PARAMETER_8, d38.DEF_ROUT_PARA_8_PTR)
                  ) AS v(param_num, param_value, param_ptr)
                  LEFT JOIN DATA0035 p ON p.RKEY = v.param_ptr
                  WHERE v.param_value IS NOT NULL
                  FOR XML PATH(''), TYPE
              ).value('.', 'nvarchar(max)'), 1, 2, '') AS ParameterList,
              STUFF((
                  SELECT '; ' +
                         RTRIM(d469.PARAMETER_CODE) + '=' + RTRIM(d471.PARAMETER_VALUE)
                  FROM DATA0471 d471
                  INNER JOIN DATA0469 d469 ON d469.RKEY = d471.DATA0469_PTR
                  WHERE d471.DATA0038_PTR = d38.RKEY
                  FOR XML PATH(''), TYPE
              ).value('.', 'nvarchar(max)'), 1, 2, '') AS ExtraParameters
          FROM DATA0038 d38 
          INNER JOIN DATA0050 d50 ON d50.RKEY = d38.SOURCE_PTR 
          INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
          WHERE d38.TTYPE = 4 
              AND d50.CUSTOMER_PART_NUMBER LIKE @custPartNumber
          ORDER BY d38.STEP_NUMBER
        `

        const query1Param = `${extractedCode}%`
        routeResult1 = await queryMSSQL(routeQuery1, {
          custPartNumber: query1Param,
        })

        // Build the actual SQL for debug display
        debugQuery1SQL = routeQuery1.replace('@custPartNumber', `'${query1Param}'`)
      } else {
        // Skip Query 1 - Customer Part doesn't match extracted code
        skippedQuery1 = true
        console.log('Skipping Query 1 - Customer Part first 5 does not match extracted code')
      }

      // Check if we should run Route Query 2:
      // 1. Query 1 was skipped (Customer Part mismatch) - always run Query 2
      // 2. Query 1 returned exactly 1 step, OR
      // 3. First step has "ASSEMBLY" in DEPT_NAME
      let shouldRunQuery2 = false
      let query2Reason = ''

      if (skippedQuery1) {
        shouldRunQuery2 = true
        query2Reason = 'Query 1 skipped - Customer Part first 5 chars do not match extracted code'
      } else if (routeResult1.length === 0) {
        shouldRunQuery2 = false
        query2Reason = 'Query 1 returned 0 rows'
      } else if (routeResult1.length === 1) {
        shouldRunQuery2 = true
        query2Reason = 'Query 1 returned exactly 1 step'
      } else {
        // Check if first step has "ASSEMBLY" in DEPT_NAME
        const firstStep = routeResult1[0]
        const firstStepHasAssembly = firstStep.DEPT_NAME && 
          firstStep.DEPT_NAME.toUpperCase().includes('ASSEMBLY')
        
        if (firstStepHasAssembly) {
          shouldRunQuery2 = true
          query2Reason = `Query 1 returned ${routeResult1.length} steps and first step contains ASSEMBLY`
        } else {
          shouldRunQuery2 = false
          query2Reason = `Query 1 returned ${routeResult1.length} steps but first step does not contain ASSEMBLY - Query 2 not needed`
        }
      }

      // Run Route Query 2 if conditions are met
      if (shouldRunQuery2) {
        // Debug logging for Query 2
        console.log('===== QUERY 2 DEBUG =====')
        console.log('INV_PART_NUMBER being searched:', invPartNumber)
        console.log('Query 2 will search for:', `${invPartNumber}%`)
        console.log('========================')

        const routeQuery2 = `
          SELECT 
              d38.STEP_NUMBER,
              rtrim(d34.DEPT_CODE) as DEPT_CODE,
              rtrim(d34.DEPT_NAME) as DEPT_NAME,
              STUFF((
                  SELECT '; ' +
                         p.PRODUCTION_PARAMETER + '=' + RTRIM(v.param_value)
                  FROM (
                      VALUES
                          (1, d38.PARAMETER_1, d38.DEF_ROUT_PARA_1_PTR),
                          (2, d38.PARAMETER_2, d38.DEF_ROUT_PARA_2_PTR),
                          (3, d38.PARAMETER_3, d38.DEF_ROUT_PARA_3_PTR),
                          (4, d38.PARAMETER_4, d38.DEF_ROUT_PARA_4_PTR),
                          (5, d38.PARAMETER_5, d38.DEF_ROUT_PARA_5_PTR),
                          (6, d38.PARAMETER_6, d38.DEF_ROUT_PARA_6_PTR),
                          (7, d38.PARAMETER_7, d38.DEF_ROUT_PARA_7_PTR),
                          (8, d38.PARAMETER_8, d38.DEF_ROUT_PARA_8_PTR)
                  ) AS v(param_num, param_value, param_ptr)
                  LEFT JOIN DATA0035 p ON p.RKEY = v.param_ptr
                  WHERE v.param_value IS NOT NULL
                  FOR XML PATH(''), TYPE
              ).value('.', 'nvarchar(max)'), 1, 2, '') AS ParameterList,
              STUFF((
                  SELECT '; ' +
                         RTRIM(d469.PARAMETER_CODE) + '=' + RTRIM(d471.PARAMETER_VALUE)
                  FROM DATA0471 d471
                  INNER JOIN DATA0469 d469 ON d469.RKEY = d471.DATA0469_PTR
                  WHERE d471.DATA0038_PTR = d38.RKEY
                  FOR XML PATH(''), TYPE
              ).value('.', 'nvarchar(max)'), 1, 2, '') AS ExtraParameters
          FROM DATA0038 d38 
          INNER JOIN DATA0017 d17 ON d17.RKEY = d38.SOURCE_PTR 
          INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
          WHERE d38.TTYPE = 3 
              AND d17.INV_PART_NUMBER LIKE @invPartNumber
          ORDER BY d38.STEP_NUMBER
        `

        const query2Param = `${invPartNumber}%`
        const routeResult2 = await queryMSSQL(routeQuery2, {
          invPartNumber: query2Param,
        })

        console.log('Query 2 returned rows:', routeResult2.length)

        // Build the actual SQL for debug display (replace parameter with value)
        const debugQuery2 = routeQuery2.replace('@invPartNumber', `'${query2Param}'`)

        routeData = {
          extractedCode,
          fullInvPartNumber: invPartNumber,
          customerPartNumber,
          customerPartFirst5,
          customerPartMatches: customerPartFirst5 === extractedCode,
          routeQuery1Results: routeResult1,
          routeQuery2Results: routeResult2,
          query2Reason,
          query2SearchTerm: query2Param,
          debugQuery1SQL: skippedQuery1 ? 'Query 1 was skipped' : debugQuery1SQL,
          debugQuery2SQL: debugQuery2,
        }
      } else {
        // Route Query 2 conditions not met
        routeData = {
          extractedCode,
          fullInvPartNumber: invPartNumber,
          customerPartNumber,
          customerPartFirst5,
          customerPartMatches: customerPartFirst5 === extractedCode,
          routeQuery1Results: routeResult1,
          routeQuery2Results: null,
          query2Reason,
          debugQuery1SQL: skippedQuery1 ? 'Query 1 was skipped' : debugQuery1SQL,
        }
      }
    }

    // Log successful query only if logging is enabled
    if (loggingEnabled && operator) {
      await logActivity(operator, workOrder, 'query_success', undefined, {
        recordCount: result.length,
        routeDataFound: !!routeData,
      })
    }

    // Write route file to network share if we have route data
    let fileWriteResult = null
    if (routeData && result[0]?.INV_PART_NUMBER) {
      fileWriteResult = await writeRouteFile(result[0].INV_PART_NUMBER, routeData)
      if (!fileWriteResult.success) {
        console.error('Failed to write route file:', fileWriteResult.error)
      }
    }

    return NextResponse.json({
      success: true,
      operator,
      workOrder,
      data: result,
      routeData,
      fileWritten: fileWriteResult?.success || false,
      filename: fileWriteResult?.filename,
      filePath: fileWriteResult?.path,
      usedFallback: fileWriteResult?.usedFallback || false,
      fileError: fileWriteResult?.error,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Work Order API Error:', error)
    
    // Log the error only if logging is enabled
    const body = await request.json().catch(() => ({}))
    const { operator, workOrder, loggingEnabled = true } = body
    
    if (operator && workOrder && loggingEnabled) {
      await logActivity(operator, workOrder, 'query_error', undefined, {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return NextResponse.json(
      { 
        error: 'Failed to process work order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
