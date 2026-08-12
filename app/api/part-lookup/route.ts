import { NextRequest, NextResponse } from 'next/server'
import { queryMSSQL } from '@/lib/mssql'

export async function POST(request: NextRequest) {
  try {
    const { partNumber } = await request.json()

    if (!partNumber || !partNumber.trim()) {
      return NextResponse.json({ error: 'Part number is required' }, { status: 400 })
    }

    const search = partNumber.trim()

    // Query 1: Search by INV_PART_NUMBER (contains Genesis job # at chars 3-7)
    // Also search CUSTOMER_PART_NUMBER for flexibility
    const query = `
      SELECT DISTINCT
        rtrim(d17.INV_PART_NUMBER) AS INV_PART_NUMBER,
        rtrim(d50.CUSTOMER_PART_NUMBER) AS CUSTOMER_PART_NUMBER,
        rtrim(d10.ABBR_NAME) AS CUSTOMER_NAME,
        CASE
          WHEN d44.PROD_PARA_04 IS NOT NULL THEN rtrim(d44.PROD_PARA_04)
          ELSE NULL
        END AS CIRC_SIZE,
        CASE
          WHEN d44.PROD_PARA_08 IS NOT NULL THEN rtrim(d44.PROD_PARA_08)
          ELSE NULL
        END AS PNL_SIZE
      FROM DATA0017 d17 WITH (NOLOCK)
      LEFT JOIN DATA0050 d50 WITH (NOLOCK)
        ON d50.BOM_PTR IN (
          SELECT d25.RKEY FROM DATA0025 d25 WITH (NOLOCK)
          WHERE d25.INVENTORY_PTR = d17.RKEY
        )
      LEFT JOIN DATA0010 d10 WITH (NOLOCK)
        ON d50.CUSTOMER_PTR = d10.RKEY
      LEFT JOIN DATA0044 d44 WITH (NOLOCK)
        ON d44.SOURCE_PTR = d17.RKEY AND d44.SOURCE_TYPE = '1'
      WHERE d17.INV_PART_NUMBER LIKE @searchTerm
    `

    // Search with wildcard - the part number might be partial
    const results = await queryMSSQL(query, {
      searchTerm: `%${search}%`,
    })

    // Also try exact customer part match if nothing found or for better results
    let custResults: any[] = []
    if (results.length === 0 || results.length > 10) {
      const custQuery = `
        SELECT DISTINCT
          rtrim(d17.INV_PART_NUMBER) AS INV_PART_NUMBER,
          rtrim(d50.CUSTOMER_PART_NUMBER) AS CUSTOMER_PART_NUMBER,
          rtrim(d10.ABBR_NAME) AS CUSTOMER_NAME,
          CASE
            WHEN d44.PROD_PARA_04 IS NOT NULL THEN rtrim(d44.PROD_PARA_04)
            ELSE NULL
          END AS CIRC_SIZE,
          CASE
            WHEN d44.PROD_PARA_08 IS NOT NULL THEN rtrim(d44.PROD_PARA_08)
            ELSE NULL
          END AS PNL_SIZE
        FROM DATA0050 d50 WITH (NOLOCK)
        LEFT JOIN DATA0025 d25 WITH (NOLOCK)
          ON d25.RKEY = d50.BOM_PTR
        LEFT JOIN DATA0017 d17 WITH (NOLOCK)
          ON d17.RKEY = d25.INVENTORY_PTR
        LEFT JOIN DATA0010 d10 WITH (NOLOCK)
          ON d50.CUSTOMER_PTR = d10.RKEY
        LEFT JOIN DATA0044 d44 WITH (NOLOCK)
          ON d44.SOURCE_PTR = d50.RKEY AND d44.SOURCE_TYPE = '2'
        WHERE d50.CUSTOMER_PART_NUMBER LIKE @searchTerm
      `
      custResults = await queryMSSQL(custQuery, {
        searchTerm: `%${search}%`,
      })
    }

    // Merge and deduplicate by INV_PART_NUMBER
    const seen = new Set<string>()
    const merged: any[] = []
    for (const row of [...results, ...custResults]) {
      const key = row.INV_PART_NUMBER || ''
      if (key && !seen.has(key)) {
        seen.add(key)
        // Extract Genesis job number (chars 3-7 of INV_PART_NUMBER)
        const jobNumber = key.substring(2, 7)
        merged.push({
          ...row,
          JOB_NUMBER: jobNumber,
        })
      }
    }

    // Sort by INV_PART_NUMBER
    merged.sort((a, b) => (a.INV_PART_NUMBER || '').localeCompare(b.INV_PART_NUMBER || ''))

    return NextResponse.json({
      success: true,
      results: merged.slice(0, 20), // Cap at 20
      count: merged.length,
      search,
    })
  } catch (error) {
    console.error('Part Lookup Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Part lookup failed' },
      { status: 500 }
    )
  }
}
