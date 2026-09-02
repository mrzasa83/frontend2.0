import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/mssql'

// Search washdown defect codes from Paradigm DATA0039.
// Source (per spec): REJECT_DEFECT_FLAG = 'D' AND ACTIVE_FLAG = 0.
// We store REJ_CODE (the "D" number) but show code + description, searchable
// on either — same UX as the frontend2.0 Daily Plan route selector.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim()
    const like = `%${q.replace(/[[%_]/g, (c) => `[${c}]`)}%`

    const rows = await queryMSSQL<{ REJ_CODE: string; REJECT_DESCRIPTION: string }>(`
      SELECT RTRIM(REJ_CODE) AS REJ_CODE, RTRIM(REJECT_DESCRIPTION) AS REJECT_DESCRIPTION
      FROM DATA0039 WITH (NOLOCK)
      WHERE REJECT_DEFECT_FLAG = 'D' AND ACTIVE_FLAG = 0
        ${q ? `AND (RTRIM(REJ_CODE) COLLATE DATABASE_DEFAULT LIKE @like OR REJECT_DESCRIPTION COLLATE DATABASE_DEFAULT LIKE @like)` : ''}
      ORDER BY REJ_CODE
    `, { like })

    return NextResponse.json({
      defects: rows.map(r => ({ code: r.REJ_CODE, description: r.REJECT_DESCRIPTION })),
    })
  } catch (error) {
    console.error('Washdown defect search error:', error)
    return NextResponse.json({ error: 'Failed to search defect codes', details: String(error) }, { status: 500 })
  }
}
