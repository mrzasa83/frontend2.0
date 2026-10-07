import { queryMSSQL } from '@/lib/db/mssql'

/**
 * Production-part search, shared by the EHS "assess a product" picker and the
 * Gold Standard "like parts" picker.
 *
 * This lived inside app/api/ehs/product-compliance/search/route.ts. The Gold
 * Standard picker needs the same results, but that route is gated on EHS read
 * access and most roles that can see Product (CADadmin, OpsRo, OpsCreate,
 * roUser, NPIeng, FAIadmin) have no EHS read — calling it from Product would
 * 403 for them. Copying the SQL into a second route would let the two drift,
 * so the query lives here and each route supplies its own permission check.
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
 * out: building the notes for every part means a correlated FOR XML PATH
 * across the whole notepad table, which is far too slow to sit behind a
 * type-ahead — and neither picker shows notes. It can be added back on a
 * detail view, where it's one part at a time.
 */
export const PART_SEARCH_SQL = `
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

export type ProductionPartHit = {
  prod_part: string
  sales_part: string
  customer_name: string
  customer_code: string
  program: string
  status: string
  prod_part_rkey: number | null
  /** Aliases the EHS picker and the assessment already key on. */
  apc_part: string
  customer_part: string
}

const clean = (v: any) => String(v ?? '').trim()

/**
 * Runs the search. Returns [] for a term under two characters rather than
 * scanning DATA0050 for a single digit behind a type-ahead.
 */
export async function searchProductionParts(
  q: string,
  includeObsolete = false
): Promise<ProductionPartHit[]> {
  const term = (q || '').trim()
  if (term.length < 2) return []

  const rows = await queryMSSQL<any[]>('1', PART_SEARCH_SQL, {
    q: `%${term}%`,
    prefix: `${term}%`,
    includeObsolete: includeObsolete ? 1 : 0,
  })

  return (rows || []).map(r => {
    const prod = clean(r.ProdPartNum)
    const sales = clean(r.SalesPartNum)
    return {
      prod_part: prod,
      sales_part: sales,
      customer_name: clean(r.CUSTOMER_NAME),
      customer_code: clean(r.CUST_CODE),
      program: clean(r.Program),
      status: clean(r.Status),
      prod_part_rkey: r.ProdPartRKEY != null ? Number(r.ProdPartRKEY) : null,
      // The assessment keys on the production part number.
      apc_part: prod,
      customer_part: sales,
    }
  })
}
