import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export const dynamic = 'force-dynamic'

// POST { partNumbers: string[] } -> { map: { [partNumber]: customerName } }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { partNumbers } = await request.json()
  if (!Array.isArray(partNumbers) || partNumbers.length === 0) {
    return NextResponse.json({ success: true, map: {} })
  }

  const map: Record<string, string> = {}
  // Resolve each distinct part (small N per visible page). Base part before any tag/space.
  const distinct = [...new Set(partNumbers.filter(Boolean).map((p: string) => p.trim()))]
  await Promise.all(distinct.map(async (part) => {
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

  return NextResponse.json({ success: true, map })
}
