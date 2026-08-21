import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export const dynamic = 'force-dynamic'

// POST { partNumbers?: string[], workOrders?: string[] }
//   -> { map: { [partNumber]: customerName },
//        analysisCode3: { [workOrder]: DATA0006.ANALYSIS_CODE_3 } }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { partNumbers, workOrders } = await request.json()
  const map: Record<string, string> = {}
  const analysisCode3: Record<string, string> = {}

  // Customer name from the customer part (DATA0050 -> DATA0010)
  const distinctParts = Array.isArray(partNumbers)
    ? [...new Set(partNumbers.filter(Boolean).map((p: string) => p.trim()))] : []
  await Promise.all(distinctParts.map(async (part) => {
    try {
      const base = part.replace(/^Z/i, '').split(/\s+/)[0]
      const rows = await queryMSSQL('1', `
        SELECT TOP 1 c.ABBR_NAME AS CustomerName
        FROM DATA0050 d50 WITH (NOLOCK)
        LEFT JOIN DATA0010 c WITH (NOLOCK) ON d50.CUSTOMER_PTR = c.RKEY
        WHERE d50.CUSTOMER_PART_NUMBER LIKE @p
        ORDER BY d50.CUSTOMER_PART_NUMBER
      `, { p: `${base}%` }) as any[]
      if (rows?.length && rows[0].CustomerName) map[part] = String(rows[0].CustomerName).trim()
    } catch { /* leave unresolved */ }
  }))

  // ANALYSIS_CODE_3 from the work order (DATA0006)
  const distinctWOs = Array.isArray(workOrders)
    ? [...new Set(workOrders.filter(Boolean).map((w: string) => w.trim()))] : []
  await Promise.all(distinctWOs.map(async (wo) => {
    try {
      const rows = await queryMSSQL('1', `
        SELECT TOP 1 ANALYSIS_CODE_3 AS Code3
        FROM DATA0006 WITH (NOLOCK)
        WHERE RTRIM(WORK_ORDER_NUMBER) = @wo
      `, { wo }) as any[]
      if (rows?.length && rows[0].Code3 != null) analysisCode3[wo] = String(rows[0].Code3).trim()
    } catch { /* leave unresolved */ }
  }))

  return NextResponse.json({ success: true, map, analysisCode3 })
}
