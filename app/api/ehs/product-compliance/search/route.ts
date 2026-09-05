import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import { canReadModule } from '@/lib/config/access'
import { productTypeFromPart } from '@/lib/ehs/productCompliance'

export const dynamic = 'force-dynamic'

/**
 * Production parts, for the "assess a product" picker.
 *
 * A production part is one that points at itself (RKEY = PRODUCTION_PART_PTR);
 * everything else on DATA0050 is a sales part hanging off one. ProdPartNum is
 * derived from the raw customer part number:
 *   Z-prefixed  obsolete — strip the Z
 *   R-prefixed  take the first six characters
 *   otherwise   everything before the first space
 * and whatever follows the space is the status ("Released" when there's none).
 *
 * Searchable on ProdPartNum, SalesPartNum and Program.
 *
 * The NoteRows / NotesJSON portion of the original query is deliberately left
 * out here. Building the notes for every part means a correlated FOR XML PATH
 * across the whole notepad table, which is far too slow to sit behind a
 * type-ahead — and the picker doesn't show notes. It can be added back on the
 * detail view, where it's one part at a time.
 */
const SEARCH_SQL = `
  WITH ProdParts AS (
      SELECT
          pp.RKEY AS ProdPartRKEY,

          CASE
              WHEN pp.CUSTOMER_PART_NUMBER LIKE 'Z%' THEN
                  CASE
                      WHEN CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) > 0 THEN
                          SUBSTRING(pp.CUSTOMER_PART_NUMBER, 2, CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) - 2)
                      ELSE
                          SUBSTRING(pp.CUSTOMER_PART_NUMBER, 2, LEN(pp.CUSTOMER_PART_NUMBER))
                  END
              WHEN pp.CUSTOMER_PART_NUMBER LIKE 'R%' THEN
                  LEFT(pp.CUSTOMER_PART_NUMBER, 6)
              ELSE
                  CASE
                      WHEN CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) > 0 THEN
                          LEFT(pp.CUSTOMER_PART_NUMBER, CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) - 1)
                      ELSE
                          pp.CUSTOMER_PART_NUMBER
                  END
          END AS ProdPartNum,

          (SELECT TOP 1 sp.CUSTOMER_PART_NUMBER
           FROM DATA0050 sp WITH (NOLOCK)
           WHERE sp.PRODUCTION_PART_PTR = pp.RKEY
             AND sp.RKEY <> pp.RKEY
           ORDER BY sp.RKEY) AS SalesPartNum,

          (SELECT TOP 1 sp.ANALYSIS_CODE_4
           FROM DATA0050 sp WITH (NOLOCK)
           WHERE sp.PRODUCTION_PART_PTR = pp.RKEY
             AND sp.RKEY <> pp.RKEY
           ORDER BY sp.RKEY) AS Program,

          CASE
              WHEN pp.CUSTOMER_PART_NUMBER LIKE 'Z%' THEN 'OBSOLETE'
              ELSE
                  CASE
                      WHEN CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER) = 0 THEN 'Released'
                      WHEN LTRIM(SUBSTRING(
                              pp.CUSTOMER_PART_NUMBER,
                              CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER),
                              LEN(pp.CUSTOMER_PART_NUMBER)
                          )) = '' THEN 'Released'
                      ELSE LTRIM(SUBSTRING(
                              pp.CUSTOMER_PART_NUMBER,
                              CHARINDEX(' ', pp.CUSTOMER_PART_NUMBER),
                              LEN(pp.CUSTOMER_PART_NUMBER)
                          ))
                  END
          END AS Status,

          cust.CUST_CODE,
          cust.CUSTOMER_NAME
      FROM DATA0050 pp WITH (NOLOCK)
      JOIN DATA0010 cust WITH (NOLOCK)
          ON pp.CUSTOMER_PTR = cust.RKEY
      -- Production parts only
      WHERE pp.RKEY = pp.PRODUCTION_PART_PTR
  )
  SELECT TOP 100
      ProdPartNum, SalesPartNum, CUSTOMER_NAME, Program, Status, CUST_CODE, ProdPartRKEY
  FROM ProdParts
  WHERE (ProdPartNum LIKE @q OR SalesPartNum LIKE @q OR Program LIKE @q)
    AND (@includeObsolete = 1 OR Status <> 'OBSOLETE')
  ORDER BY
      -- Prefix matches first, so typing "753" surfaces 75336 above A75336
      CASE WHEN ProdPartNum LIKE @prefix THEN 0 ELSE 1 END,
      ProdPartNum`

// GET ?q=123 -> products matching the search, for the "assess a product" picker.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'ehs')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const q = (sp.get('q') || '').trim()
  // Obsolete parts are out of scope unless explicitly asked for.
  const includeObsolete = sp.get('includeObsolete') === '1'
  if (q.length < 2) return NextResponse.json({ success: true, rows: [] })

  try {
    const rows = await queryMSSQL<any[]>('1', SEARCH_SQL, {
      q: `%${q}%`,
      prefix: `${q}%`,
      includeObsolete: includeObsolete ? 1 : 0,
    })
    const clean = (v: any) => String(v ?? '').trim()
    return NextResponse.json({
      success: true,
      includeObsolete,
      rows: (rows || []).map(r => ({
        prod_part: clean(r.ProdPartNum),
        sales_part: clean(r.SalesPartNum),
        customer_name: clean(r.CUSTOMER_NAME),
        customer_code: clean(r.CUST_CODE),
        program: clean(r.Program),
        status: clean(r.Status),
        // The assessment keys on the production part number.
        apc_part: clean(r.ProdPartNum),
        customer_part: clean(r.SalesPartNum),
        part_type: productTypeFromPart(clean(r.ProdPartNum)),
      })),
    })
  } catch (error) {
    console.error('EHS product search error:', error)
    return NextResponse.json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
