import { NextRequest, NextResponse } from 'next/server'
import { queryMSSQL } from '@/lib/mssql'

export async function POST(request: NextRequest) {
  try {
    const { workOrder } = await request.json()

    if (!workOrder || !workOrder.trim()) {
      return NextResponse.json({ error: 'Work order is required' }, { status: 400 })
    }

    const cleanWo = workOrder.trim()

    // Work order → PCB (job) number lookup.
    // The reliable job identifier is chars 3-7 of inv_part_number
    // (e.g. "S-75014-04/08" → 75014). CUSTOMER_PART_NUMBER may match the
    // job (case 1) or diverge from it (case 2), so we key off inv_part_number.
    const query = `
      SELECT
        d6.WORK_ORDER_NUMBER,
        rtrim(d50.CUSTOMER_PART_NUMBER) AS CUSTOMER_PART_NUMBER,
        rtrim(d17.inv_part_number) AS inv_part_number
      FROM data0006 d6 WITH (NOLOCK)
      JOIN DATA0050 d50 WITH (NOLOCK) ON d6.CUST_PART_PTR = d50.rkey
      JOIN DATA0017 d17 WITH (NOLOCK) ON d6.INVENTORY_PTR = d17.rkey
      WHERE d6.WORK_ORDER_NUMBER LIKE @workOrder
    `

    // Try exact match first, then wildcard, then dash-stripped wildcard
    let results = await queryMSSQL(query, { workOrder: cleanWo })

    if (results.length === 0) {
      results = await queryMSSQL(query, { workOrder: `%${cleanWo}%` })
    }

    if (results.length === 0) {
      const noDash = cleanWo.replace(/^-+/, '')
      if (noDash !== cleanWo) {
        results = await queryMSSQL(query, { workOrder: `%${noDash}%` })
      }
    }

    // Normalize to the shape the frontend expects (WORK_ORDER + INV_PART_NUMBER)
    const normalized = results.map((r: any) => ({
      WORK_ORDER: (r.WORK_ORDER_NUMBER || '').trim(),
      INV_PART_NUMBER: (r.inv_part_number || '').trim(),
      CUSTOMER_PART_NUMBER: (r.CUSTOMER_PART_NUMBER || '').trim(),
      CUSTOMER_NAME: '',
      CIRC_SIZE: '',
      PNL_SIZE: '',
      DEPT_CODE: '',
    }))

    return NextResponse.json({
      success: normalized.length > 0,
      results: normalized,
      count: normalized.length,
      searchTerm: cleanWo,
    })
  } catch (error) {
    console.error('WO Lookup Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Query failed',
      results: [],
      count: 0,
    }, { status: 500 })
  }
}
