import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { partNumbers } = await request.json()

    if (!partNumbers || !Array.isArray(partNumbers) || partNumbers.length === 0) {
      return NextResponse.json(
        { error: 'partNumbers array is required' },
        { status: 400 }
      )
    }

    // Limit to prevent huge queries
    const limitedParts = partNumbers.slice(0, 100)
    
    const results: Record<string, { status: string; buildLocation: string }> = {}

    // Process each part number
    for (const apcPN of limitedParts) {
      try {
        // Check if part number starts with Z - indicates Obsolete
        const isObsolete = apcPN.toUpperCase().startsWith('Z')
        const searchPattern = isObsolete ? apcPN.substring(1) : apcPN

        // Get status from production data
        let status = 'Released'
        if (isObsolete) {
          status = 'Obsolete'
        } else {
          const prodQuery = `
            SELECT TOP 1 CUSTOMER_PART_NUMBER 
            FROM DATA0050 
            WHERE CUSTOMER_PART_NUMBER LIKE @partNumber
            ORDER BY CUSTOMER_PART_NUMBER
          `
          const prodResults = await queryMSSQL('1', prodQuery, {
            partNumber: `${searchPattern}%`
          })
          
          if (prodResults.length > 0) {
            const custPN = prodResults[0].CUSTOMER_PART_NUMBER || ''
            if (custPN.length > 6) {
              const statusChar = custPN.substring(6).trim()
              if (statusChar) {
                status = statusChar
              }
            }
          }
        }

        // Get build location from route data
        let buildLocation = 'Nashua'
        const routeQuery = `
          SELECT TOP 1 d34.DEPT_CODE
          FROM DATA0038 d38 
          INNER JOIN DATA0050 d50 ON d50.RKEY = d38.SOURCE_PTR 
          INNER JOIN DATA0034 d34 ON d34.RKEY = d38.DEPT_PTR
          WHERE d38.TTYPE = 4 
            AND d50.CUSTOMER_PART_NUMBER LIKE @partNumber
          ORDER BY d38.STEP_NUMBER
        `
        const routeResults = await queryMSSQL('1', routeQuery, {
          partNumber: `${searchPattern}%`
        })
        
        if (routeResults.length > 0) {
          const firstDeptCode = (routeResults[0].DEPT_CODE || '').trim().toUpperCase()
          if (firstDeptCode.startsWith('N-')) {
            buildLocation = 'Nogales'
          } else if (firstDeptCode.startsWith('M-')) {
            buildLocation = 'Mesa'
          }
        }

        results[apcPN] = { status, buildLocation }
      } catch (err) {
        // If individual part fails, continue with defaults
        results[apcPN] = { status: 'Unknown', buildLocation: 'Unknown' }
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error fetching batch info:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch batch info', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
