import { NextRequest, NextResponse } from 'next/server'
import { queryMSSQL } from '@/lib/mssql'
import { logActivity } from '@/lib/mysql'

export async function POST(request: NextRequest) {
  try {
    const { operator, partNumber, exactMatch = false, loggingEnabled = true } = await request.json()

    // Validate inputs
    if (!operator || !partNumber) {
      return NextResponse.json(
        { error: 'Operator and part number are required' },
        { status: 400 }
      )
    }

    // Log the request only if logging is enabled
    if (loggingEnabled) {
      await logActivity(operator, partNumber, 'product_route_query_initiated', undefined, {
        exactMatch
      })
    }

    if (exactMatch) {
      // EXACT MATCH: Get the specific route for this part number
      // Determine if this is a customer part or inventory part
      
      // First check if it's a customer part
      const customerCheckQuery = `
        SELECT CUSTOMER_PART_NUMBER, CUSTOMER_PART_DESC
        FROM DATA0050
        WHERE CUSTOMER_PART_NUMBER = @partNumber
      `
      
      const customerCheck = await queryMSSQL<{ 
        CUSTOMER_PART_NUMBER: string
        CUSTOMER_PART_DESC: string 
      }>(customerCheckQuery, { partNumber })

      let routeData = null

      if (customerCheck.length > 0) {
        // It's a CUSTOMER PART - use customer part route logic
        console.log('Exact match: Customer Part detected')
        
        // Extract the first 5 characters for route search
        const extractedCode = partNumber.substring(0, 5)
        
        const routeQuery = `
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
              AND d50.CUSTOMER_PART_NUMBER = @partNumber
          ORDER BY d38.STEP_NUMBER
        `

        const routeResult = await queryMSSQL(routeQuery, { partNumber })

        routeData = {
          partType: 'Customer Part',
          partNumber,
          description: customerCheck[0].CUSTOMER_PART_DESC,
          routeSteps: routeResult,
          stepCount: routeResult.length
        }

      } else {
        // Check if it's an INVENTORY PART
        const inventoryCheckQuery = `
          SELECT INV_PART_NUMBER
          FROM DATA0017
          WHERE INV_PART_NUMBER = @partNumber
        `
        
        const inventoryCheck = await queryMSSQL<{ INV_PART_NUMBER: string }>(
          inventoryCheckQuery, 
          { partNumber }
        )

        if (inventoryCheck.length > 0) {
          // It's an INVENTORY PART - use inventory part route logic
          console.log('Exact match: Inventory Part detected')
          
          const routeQuery = `
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
                AND d17.INV_PART_NUMBER = @partNumber
            ORDER BY d38.STEP_NUMBER
          `

          const routeResult = await queryMSSQL(routeQuery, { partNumber })

          routeData = {
            partType: 'Inventory Part',
            partNumber,
            description: 'Inventory part route',
            routeSteps: routeResult,
            stepCount: routeResult.length
          }
        }
      }

      if (loggingEnabled && routeData) {
        await logActivity(operator, partNumber, 'product_route_query_success', undefined, {
          exactMatch: true,
          partType: routeData.partType,
          stepCount: routeData.stepCount
        })
      }

      return NextResponse.json({
        success: true,
        operator,
        partNumber,
        exactMatch: true,
        routeData,
        timestamp: new Date().toISOString(),
      })

    } else {
      // FUZZY SEARCH: Get list of possible routes
      console.log('===== FUZZY SEARCH DEBUG =====')
      console.log('Part Number Search:', partNumber)
      console.log('==============================')

      const results: any[] = []
      const processedParts = new Set<string>() // Track duplicates

      // Step 1: Search DATA0050 for customer parts starting with partNumber
      const customerPartQuery = `
        SELECT CUSTOMER_PART_NUMBER 
        FROM DATA0050 
        WHERE CUSTOMER_PART_NUMBER LIKE @partNumber
      `
      
      const customerParts = await queryMSSQL<{ CUSTOMER_PART_NUMBER: string }>(
        customerPartQuery,
        { partNumber: `${partNumber}%` }
      )

      console.log(`Step 1: Found ${customerParts.length} customer parts`)

      // Filter: Keep only if 6th character is blank (first 5 match, then space/end)
      for (const row of customerParts) {
        const custPart = row.CUSTOMER_PART_NUMBER?.trim() || ''
        if (custPart.length >= 5) {
          const first5 = custPart.substring(0, 5)
          const char6 = custPart.length > 5 ? custPart[5] : ' '
          
          if (first5 === partNumber && (char6 === ' ' || custPart.length === 5)) {
            if (!processedParts.has(custPart)) {
              results.push({
                partNumber: custPart,
                partType: 'Customer Part',
                description: 'Direct customer part match'
              })
              processedParts.add(custPart)
            }
          }
        }
      }

      console.log(`Step 1 filtered: ${results.length} valid customer parts`)

      // Step 2: Search DATA0017 for inventory parts containing partNumber
      const invPartQuery = `
        SELECT INV_PART_NUMBER 
        FROM DATA0017 
        WHERE INV_PART_NUMBER LIKE @partNumber
      `
      
      const invParts = await queryMSSQL<{ INV_PART_NUMBER: string }>(
        invPartQuery,
        { partNumber: `%${partNumber}%` }
      )

      console.log(`Step 2: Found ${invParts.length} inventory parts`)

      // Step 3: For each inventory part, find associated customer parts via BOM
      for (const invRow of invParts) {
        const invPartNumber = invRow.INV_PART_NUMBER?.trim()
        if (!invPartNumber) continue

        console.log(`Step 3: Checking BOM for ${invPartNumber}`)

        // Complex BOM traversal query
        const bomQuery = `
          SELECT 
              DISTINCT(D50.CUSTOMER_PART_NUMBER),
              D50.CUSTOMER_PART_DESC
          FROM DATA0017 D17_6 LEFT OUTER JOIN
              DATA0023 D23_6 RIGHT OUTER JOIN
              DATA0028 D28_6 ON D23_6.RKEY = D28_6.SUPPLIER_PTR ON D17_6.RKEY = D28_6.INVENTORY_PTR RIGHT OUTER JOIN
              DATA0026 D26_6 ON D17_6.RKEY = D26_6.INVENTORY_PTR RIGHT OUTER JOIN
              DATA0026 D26_5 LEFT OUTER JOIN
              DATA0025 D25_6 RIGHT OUTER JOIN
              DATA0023 D23_5 RIGHT OUTER JOIN
              DATA0028 D28_5 ON D23_5.RKEY = D28_5.SUPPLIER_PTR RIGHT OUTER JOIN
              DATA0017 D17_5 ON D28_5.INVENTORY_PTR = D17_5.RKEY ON D25_6.INVENTORY_PTR = D17_5.RKEY ON
                  D26_5.INVENTORY_PTR = D17_5.RKEY ON D26_6.PARENT_NODE_INVENT = D25_6.RKEY RIGHT OUTER JOIN
              DATA0026 D26_4 LEFT OUTER JOIN DATA0025 D25_5 RIGHT OUTER JOIN
              DATA0023 D23_4 RIGHT OUTER JOIN
              DATA0028 D28_4 ON D23_4.RKEY = D28_4.SUPPLIER_PTR RIGHT OUTER JOIN
              DATA0017 D17_4 ON D28_4.INVENTORY_PTR = D17_4.RKEY ON D25_5.INVENTORY_PTR = D17_4.RKEY ON
                  D26_4.INVENTORY_PTR = D17_4.RKEY ON D26_5.PARENT_NODE_INVENT = D25_5.RKEY RIGHT OUTER JOIN
              DATA0026 D26_3 LEFT OUTER JOIN
              DATA0025 D25_4 RIGHT OUTER JOIN
              DATA0023 D23_3 RIGHT OUTER JOIN DATA0028 D28_3 ON D23_3.RKEY = D28_3.SUPPLIER_PTR RIGHT OUTER JOIN
              DATA0017 D17_3 ON D28_3.INVENTORY_PTR = D17_3.RKEY ON D25_4.INVENTORY_PTR = D17_3.RKEY ON
                  D26_3.INVENTORY_PTR = D17_3.RKEY ON D26_4.PARENT_NODE_INVENT = D25_4.RKEY RIGHT OUTER JOIN
              DATA0026 D26_2 LEFT OUTER JOIN
              DATA0025 D25_3 RIGHT OUTER JOIN
              DATA0023 D23_2 RIGHT OUTER JOIN
              DATA0028 D28_2 ON D23_2.RKEY = D28_2.SUPPLIER_PTR RIGHT OUTER JOIN
              DATA0017 D17_2 ON D28_2.INVENTORY_PTR = D17_2.RKEY ON D25_3.INVENTORY_PTR = D17_2.RKEY ON
                  D26_2.INVENTORY_PTR = D17_2.RKEY ON D26_3.PARENT_NODE_INVENT = D25_3.RKEY RIGHT OUTER JOIN
              DATA0025 D25_2 RIGHT OUTER JOIN
              DATA0023 D23_1 RIGHT OUTER JOIN
              DATA0028 D28_1 ON D23_1.RKEY = D28_1.SUPPLIER_PTR RIGHT OUTER JOIN
              DATA0017 D17_1 ON D28_1.INVENTORY_PTR = D17_1.RKEY ON D25_2.INVENTORY_PTR = D17_1.RKEY RIGHT OUTER JOIN
              DATA0026 D26_1 ON D17_1.RKEY = D26_1.INVENTORY_PTR ON D26_2.PARENT_NODE_INVENT = D25_2.RKEY RIGHT OUTER JOIN
              DATA0050 D50 INNER JOIN
              DATA0010 D10 ON D50.CUSTOMER_PTR = D10.RKEY INNER JOIN
              DATA0025 D25_1 ON D50.BOM_PTR = D25_1.RKEY ON D26_1.PARENT_NODE_INVENT = D25_1.RKEY
          WHERE D17_1.INV_PART_NUMBER like @invPart OR
              D17_2.INV_PART_NUMBER like @invPart OR
              D17_3.INV_PART_NUMBER like @invPart OR
              D17_4.INV_PART_NUMBER like @invPart OR
              D17_5.INV_PART_NUMBER like @invPart OR
              D17_6.INV_PART_NUMBER like @invPart
          ORDER BY D50.CUSTOMER_PART_NUMBER ASC
        `

        const bomResults = await queryMSSQL<{ 
          CUSTOMER_PART_NUMBER: string
          CUSTOMER_PART_DESC: string 
        }>(bomQuery, { invPart: `${invPartNumber}%` })

        console.log(`  - Found ${bomResults.length} customer parts in BOM`)

        // Only include if BOM query returned at least one row
        if (bomResults.length > 0) {
          // Add the inventory part itself as a selectable option
          if (!processedParts.has(invPartNumber)) {
            results.push({
              partNumber: invPartNumber,
              partType: 'Inventory Part',
              description: `Used in ${bomResults.length} customer part${bomResults.length !== 1 ? 's' : ''}`,
              customerPartCount: bomResults.length,
              isInventoryPart: true
            })
            processedParts.add(invPartNumber)
          }

          // Also add each customer part that uses this inventory part
          for (const bomRow of bomResults) {
            const custPart = bomRow.CUSTOMER_PART_NUMBER?.trim()
            // Filter out parts starting with 'Z'
            if (custPart && !custPart.startsWith('Z') && !processedParts.has(custPart)) {
              results.push({
                partNumber: custPart,
                partType: 'Customer Part',
                description: bomRow.CUSTOMER_PART_DESC?.trim() || `Contains ${invPartNumber}`,
                inventoryPart: invPartNumber,
                isInventoryPart: false
              })
              processedParts.add(custPart)
            }
          }
        }
      }

      console.log(`Final results: ${results.length} unique parts`)

      if (loggingEnabled) {
        await logActivity(operator, partNumber, 'product_route_search_success', undefined, {
          exactMatch: false,
          resultsCount: results.length
        })
      }

      return NextResponse.json({
        success: true,
        operator,
        partNumber,
        exactMatch: false,
        availableRoutes: results,
        timestamp: new Date().toISOString(),
      })
    }

  } catch (error) {
    console.error('Product Route API Error:', error)

    const { operator, partNumber, loggingEnabled } = await request.json().catch(() => ({}))
    if (operator && partNumber && loggingEnabled) {
      await logActivity(operator, partNumber, 'product_route_query_error', undefined, {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    )
  }
}
