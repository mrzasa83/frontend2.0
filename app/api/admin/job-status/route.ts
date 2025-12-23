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
    const { shopPN } = await request.json()

    if (!shopPN) {
      return NextResponse.json(
        { error: 'shopPN is required' },
        { status: 400 }
      )
    }

    // Clean the shop PN - extract just the numeric part if needed
    const cleanPN = shopPN.toString().trim()

    const query = `
      SELECT DISTINCT
        CASE 
          WHEN d50_p.customer_part_number LIKE 'R%' 
          THEN LEFT(d50_p.customer_part_number, 6)
          ELSE LEFT(d50_p.customer_part_number, 5)
        END AS APC_PN,
        CASE 
          WHEN LEN(d50_p.customer_part_number) <= 5 
               OR LTRIM(RTRIM(SUBSTRING(
                     d50_p.customer_part_number, 
                     CASE WHEN d50_p.customer_part_number LIKE 'R%' THEN 8 ELSE 7 END, 
                     LEN(d50_p.customer_part_number)))) = '' 
          THEN 'Released'
          ELSE LTRIM(RTRIM(SUBSTRING(
                     d50_p.customer_part_number, 
                     CASE WHEN d50_p.customer_part_number LIKE 'R%' THEN 8 ELSE 7 END, 
                     LEN(d50_p.customer_part_number))))
        END AS Release_Status,
        d50_p.customer_part_desc,
        d50_s.ANALYSIS_CODE_4 AS Program
      FROM data0050 d50_p
      JOIN data0050 d50_s 
        ON d50_s.production_part_ptr = d50_p.rkey
        AND d50_s.rkey <> d50_p.rkey
      WHERE d50_p.customer_part_number LIKE @shopPNPattern
        AND d50_p.rkey = d50_p.production_part_ptr
    `

    const results = await queryMSSQL('1', query, {
      shopPNPattern: `${cleanPN}%`
    })

    // Return the first result if found
    if (results && results.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          apcPN: results[0].APC_PN,
          releaseStatus: results[0].Release_Status,
          description: results[0].customer_part_desc,
          program: results[0].Program || null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: null
    })

  } catch (error) {
    console.error('Job Status API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch job status', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

// Batch endpoint for multiple shop PNs
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { shopPNs } = await request.json()

    if (!shopPNs || !Array.isArray(shopPNs) || shopPNs.length === 0) {
      return NextResponse.json(
        { error: 'shopPNs array is required' },
        { status: 400 }
      )
    }

    // Build a query that handles multiple shop PNs
    // We'll use a UNION approach or IN clause
    const uniquePNs = [...new Set(shopPNs.filter(pn => pn))].slice(0, 100) // Limit to 100
    
    if (uniquePNs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {}
      })
    }

    // Build WHERE clause for multiple patterns
    const patterns = uniquePNs.map((_, idx) => `d50_p.customer_part_number LIKE @pn${idx}`).join(' OR ')
    
    const query = `
      SELECT DISTINCT
        CASE 
          WHEN d50_p.customer_part_number LIKE 'R%' 
          THEN LEFT(d50_p.customer_part_number, 6)
          ELSE LEFT(d50_p.customer_part_number, 5)
        END AS APC_PN,
        CASE 
          WHEN LEN(d50_p.customer_part_number) <= 5 
               OR LTRIM(RTRIM(SUBSTRING(
                     d50_p.customer_part_number, 
                     CASE WHEN d50_p.customer_part_number LIKE 'R%' THEN 8 ELSE 7 END, 
                     LEN(d50_p.customer_part_number)))) = '' 
          THEN 'Released'
          ELSE LTRIM(RTRIM(SUBSTRING(
                     d50_p.customer_part_number, 
                     CASE WHEN d50_p.customer_part_number LIKE 'R%' THEN 8 ELSE 7 END, 
                     LEN(d50_p.customer_part_number))))
        END AS Release_Status,
        d50_p.customer_part_desc,
        d50_s.ANALYSIS_CODE_4 AS Program
      FROM data0050 d50_p
      JOIN data0050 d50_s 
        ON d50_s.production_part_ptr = d50_p.rkey
        AND d50_s.rkey <> d50_p.rkey
      WHERE (${patterns})
        AND d50_p.rkey = d50_p.production_part_ptr
    `

    // Build params object
    const params: Record<string, string> = {}
    uniquePNs.forEach((pn, idx) => {
      params[`pn${idx}`] = `${pn}%`
    })

    const results = await queryMSSQL('1', query, params)

    // Map results by APC_PN
    const dataMap: Record<string, { releaseStatus: string; program: string | null }> = {}
    
    if (results && results.length > 0) {
      results.forEach((row: any) => {
        dataMap[row.APC_PN] = {
          releaseStatus: row.Release_Status,
          program: row.Program || null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: dataMap
    })

  } catch (error) {
    console.error('Batch Job Status API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch job statuses', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
