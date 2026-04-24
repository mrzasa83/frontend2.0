import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

type Condition = {
  field: string   // 'change' | 'chngeffect'
  op: string      // 'contains' | 'equals' | 'startsWith'
  value: string
  logic: string   // 'AND' | 'OR' — how this condition joins to the NEXT
}

function buildWhereClause(conditions: Condition[]): { sql: string; params: any[] } {
  if (!conditions || conditions.length === 0) {
    return { sql: '1=1', params: [] }
  }

  const parts: string[] = []
  const params: any[] = []

  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i]
    const col = c.field === 'chngeffect' ? 'chngeffect' : '`change`'
    let expr = ''

    switch (c.op) {
      case 'equals':
        expr = `LOWER(${col}) = LOWER(?)`
        params.push(c.value)
        break
      case 'startsWith':
        expr = `LOWER(${col}) LIKE LOWER(?)`
        params.push(`${c.value}%`)
        break
      case 'contains':
      default:
        expr = `LOWER(${col}) LIKE LOWER(?)`
        params.push(`%${c.value}%`)
        break
    }

    if (i === 0) {
      parts.push(expr)
    } else {
      const prevLogic = conditions[i - 1].logic || 'OR'
      parts.push(`${prevLogic} ${expr}`)
    }
  }

  return { sql: parts.join(' '), params }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const searchId = searchParams.get('searchId')

    // Detail mode — single record
    if (id) {
      const rows = await queryPrimary('SELECT * FROM mcn WHERE id = ?', [id])
      if (!rows || (rows as any[]).length === 0) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, record: (rows as any[])[0] })
    }

    // Load conditions from saved search
    let conditions: Condition[] = []
    let searchName = 'Custom Search'

    if (searchId) {
      const searches = await queryPrimary(
        'SELECT name, conditions FROM drill_rout_searches WHERE id = ? AND active = 1', [searchId]
      )
      if ((searches as any[]).length === 0) {
        return NextResponse.json({ error: 'Search not found' }, { status: 404 })
      }
      const search = (searches as any[])[0]
      searchName = search.name
      conditions = typeof search.conditions === 'string'
        ? JSON.parse(search.conditions)
        : search.conditions
    }

    // Build and execute query
    const { sql: whereSql, params } = buildWhereClause(conditions)

    const query = `
      SELECT
        id, initiator,
        STR_TO_DATE(subdate, '%d%b%Y') as subDate,
        subtime,
        STR_TO_DATE(closeddate, '%d%b%Y') as closedDate,
        closedtime,
        toolnum, partnum,
        \`change\`, reason, chngeffect
      FROM mcn
      WHERE ${whereSql}
      ORDER BY STR_TO_DATE(subdate, '%d%b%Y') DESC
    `

    const rows = await queryPrimary(query, params)

    return NextResponse.json({
      success: true,
      searchName,
      count: (rows as any[]).length,
      data: rows,
    })
  } catch (error) {
    console.error('Error fetching MCN data:', error)
    return NextResponse.json({
      error: 'Failed to fetch MCN data',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
