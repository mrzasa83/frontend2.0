/**
 * Raw Material Traceability — what was actually issued to a work order.
 *
 * TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02). Read-only.
 *
 * THE CHAIN, established over rounds 9-11 and verified against a printed
 * Paradigm report for -357152-01-100:
 *
 *     DATA0006   work order
 *       -> DATA0067   WO BOM line (WO_PTR, INVT_PTR, QUAN_BOM,
 *                     QUAN_ISSUED, ROUTE_STEP_NO, LAYUP_SEQ_NO)
 *          -> DATA0095   inventory transaction, SRCE_PTR = DATA0067.RKEY
 *             -> DATA0020   the LOT   (INVT_LOC_PTR)
 *             -> DATA0017   the PART  (INVT_PTR)
 *
 * TRAN_TP 13 is "issued to work order": 3.1M rows from 2006-12-27 to today.
 * TRAN_TP 14 is its reversal, carrying a NEGATIVE quantity against the same
 * DATA0067 line, so net consumed = SUM(13) + SUM(14).
 *
 * WHAT THIS REPLACED, AND WHY
 *
 * The first version read DATA0153. That table holds 15,674 rows ALL inside a
 * single month — a rolling window, not a ledger. It returned nothing at all
 * for -357152-01-100 while Paradigm's own report showed 20 lines. Every
 * symptom chased for several rounds (a recursion that descended one branch, a
 * concise page with 1 purchased leaf instead of 4, a blank tab) was that one
 * fact. No search tuning could have fixed it.
 *
 * VERIFICATION: the walk below finds all 13 lots the printed report lists for
 * -357152-01-100, across three levels of sub-assembly.
 *
 * THE RECURSION MATCHES LOT TO WORK ORDER EXACTLY. THIS MATTERS.
 *
 * A made lot is named after the job that produced it, INCLUDING any letter
 * prefix: 'A1-345825-01-100' and '-345824-01-100' are two different lots of
 * the same part, from two different jobs. An earlier cut normalised the lot
 * before matching (stripping 'A1-', 'S0-' and the leading dash) and so walked
 * into A1 through A6 of -350167-01-100 — six jobs, four lots that were never
 * in this product. Normalising is right for the number a USER types, and
 * wrong for a lot, which is already exact.
 *
 * The "is this lot a work order" test is DATA0017.P_M = 'M', not a string
 * pattern. A made part has a producing job by definition; a purchased one
 * does not, whatever its batch happens to look like.
 */

export type TraceabilityOptions = {
  /** Work order as the user knows it, e.g. '-357152-01-100'. */
  workOrder: string
  /** Follow made lots into the jobs that produced them. Default on. */
  includeSubLevels?: boolean
  /** Purchased leaves only, one row per part/lot/PO. Default on. */
  concise?: boolean
  /** Match the work order string exactly rather than base + splits. */
  exactWorkOrder?: boolean
}

/** Depth ceiling. A 28-layer board walks ~3 levels; 10 is slack with a stop. */
const MAX_LEVEL = 10

/**
 * Normalises the work order a USER typed — not a lot. Strips a split or
 * alternate prefix (S0-, S1-, A1-, A5-) and a leading dash so the number can
 * be entered any way it appears on paper.
 *
 * Deliberately NOT applied to lot numbers in the recursion; see the header.
 */
export function normalizeWorkOrder(wo: string): string {
  return wo.trim().toUpperCase()
    .replace(/^[A-Z]\d{1,2}-/, '')
    .replace(/^-/, '')
}

/** SQL twin of normalizeWorkOrder. `v` must be trimmed and uppercased. */
const NORM_SQL = (v: string) => `
        CASE WHEN (CASE
                     WHEN ${v} LIKE '[A-Z][0-9]-%'      THEN SUBSTRING(${v}, 4, 40)
                     WHEN ${v} LIKE '[A-Z][0-9][0-9]-%' THEN SUBSTRING(${v}, 5, 40)
                     ELSE ${v}
                   END) LIKE '-%'
             THEN SUBSTRING(CASE
                     WHEN ${v} LIKE '[A-Z][0-9]-%'      THEN SUBSTRING(${v}, 4, 40)
                     WHEN ${v} LIKE '[A-Z][0-9][0-9]-%' THEN SUBSTRING(${v}, 5, 40)
                     ELSE ${v}
                   END, 2, 40)
             ELSE CASE
                     WHEN ${v} LIKE '[A-Z][0-9]-%'      THEN SUBSTRING(${v}, 4, 40)
                     WHEN ${v} LIKE '[A-Z][0-9][0-9]-%' THEN SUBSTRING(${v}, 5, 40)
                     ELSE ${v}
                   END
        END`

/**
 * The walk, as a CTE body. Recurses over WORK ORDERS rather than issue rows,
 * which is both cheaper and free of the fan-out the DATA0153 version had: one
 * row per job per level, and the issues are joined on afterwards.
 */
function walkCte(includeSubLevels: boolean, exactWorkOrder: boolean): string {
  const rootMatch = exactWorkOrder
    ? `UPPER(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER))) COLLATE DATABASE_DEFAULT = @workOrderExact`
    : `CAST(${NORM_SQL('UPPER(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)))')} AS VARCHAR(40))
         COLLATE DATABASE_DEFAULT = @workOrderNorm`

  return `
Walk AS (
    SELECT
        wo.RKEY AS WoRkey,
        CAST(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS WoNum,
        CAST(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS ParentWo,
        CAST(0 AS INT) AS Lvl,
        CAST('|' + CAST(wo.RKEY AS VARCHAR(20)) + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT AS Visited
    FROM DATA0006 wo
    WHERE ${rootMatch}

    UNION ALL

    SELECT
        wo2.RKEY,
        CAST(LTRIM(RTRIM(wo2.WORK_ORDER_NUMBER)) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT,
        p.WoNum,
        p.Lvl + 1,
        CAST(p.Visited + CAST(wo2.RKEY AS VARCHAR(20)) + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT
    FROM Walk p
    JOIN DATA0067 src ON src.WO_PTR = p.WoRkey
    JOIN DATA0095 t   ON t.SRCE_PTR = src.RKEY AND t.TRAN_TP = 13
    -- Only a MADE part has a job behind it. This is the real test; a string
    -- pattern on the batch number is not.
    JOIN DATA0017 d17 ON d17.RKEY = t.INVT_PTR AND d17.P_M = 'M'
    JOIN DATA0020 lot ON lot.RKEY = t.INVT_LOC_PTR
    -- EXACT. The lot number IS the producing work order number, prefix and
    -- all. Normalising here walked into A1..A6 of the same base job and
    -- pulled in four lots that were never in the product.
    JOIN DATA0006 wo2
      ON LTRIM(RTRIM(wo2.WORK_ORDER_NUMBER)) COLLATE DATABASE_DEFAULT
       = LTRIM(RTRIM(lot.BATCH_NO))          COLLATE DATABASE_DEFAULT
    WHERE ${includeSubLevels ? '1 = 1' : '1 = 0'}
      AND p.Lvl < ${MAX_LEVEL}
      AND p.Visited NOT LIKE '%|' + CAST(wo2.RKEY AS VARCHAR(20)) + '|%'
),
Issued AS (
    -- One row per transaction, with the reversal (TRAN_TP 14, negative
    -- quantity) kept so net consumption is visible rather than assumed.
    SELECT
        w.Lvl, w.WoNum, w.ParentWo,
        t.RKEY       AS TranRkey,
        t.TRAN_TP,
        t.INVT_PTR, t.INVT_LOC_PTR,
        t.QUANTITY, t.TRAN_DATE,
        src.ROUTE_STEP_NO, src.LAYUP_SEQ_NO
    FROM Walk w
    JOIN DATA0067 src ON src.WO_PTR = w.WoRkey
    JOIN DATA0095 t   ON t.SRCE_PTR = src.RKEY AND t.TRAN_TP IN (13, 14)
)`
}

/** Lot, part and the lookups the printed report shows. */
const LOOKUPS = `
LEFT JOIN DATA0020 lot  ON lot.RKEY = i.INVT_LOC_PTR
LEFT JOIN DATA0017 d17  ON d17.RKEY = i.INVT_PTR
LEFT JOIN DATA0016 loc  ON loc.RKEY = lot.INV_WHOUSE_LOC_PTR
OUTER APPLY (
    -- Country of origin per LOT where recorded (~30% of lots) ...
    SELECT TOP 1 c.C_OF_O_PTR FROM DATA9432 c
    WHERE c.DATA0020_PTR = lot.RKEY ORDER BY c.RKEY DESC
) coo
OUTER APPLY (
    -- ... else the PART's default origin, which covers the rest.
    SELECT TOP 1 x.C_OF_O_PTR FROM DATA9421 x
    WHERE x.DATA0017_PTR = i.INVT_PTR ORDER BY x.RKEY DESC
) coop
LEFT JOIN DATA0250 ctry
       ON ctry.COUNTRY_RKEY = COALESCE(NULLIF(coo.C_OF_O_PTR, 0), NULLIF(coop.C_OF_O_PTR, 0))`

export function buildTraceabilityQuery(opts: TraceabilityOptions): {
  sql: string
  params: Record<string, unknown>
} {
  const includeSubLevels = opts.includeSubLevels !== false
  const concise = opts.concise !== false
  const exactWorkOrder = opts.exactWorkOrder === true
  const workOrder = opts.workOrder.trim()

  const params = {
    workOrderExact: workOrder.toUpperCase(),
    workOrderNorm: normalizeWorkOrder(workOrder),
  }
  // queryMSSQL already issues SET TRANSACTION ISOLATION LEVEL per batch; the
  // leading semicolon terminates it before WITH.
  const prefix = ';WITH ' + walkCte(includeSubLevels, exactWorkOrder)

  if (concise) {
    /**
     * Purchased leaves only, one row per part / lot / PO — which is exactly
     * how Paradigm's concise page reads, and what the quality team needs for
     * a certificate pack.
     *
     * QtyIssued is the NET: issues minus reversals. A lot fully returned
     * nets to zero and is worth seeing as such rather than silently counted
     * as consumed.
     */
    return {
      sql: `${prefix}
SELECT
    MIN(i.Lvl)                             AS Lvl,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    LTRIM(RTRIM(lot.BATCH_NO))             AS BatchSerial,
    MAX(lot.PO_PTR)                        AS PoPtr,
    MAX(lot.RO_PTR)                        AS RoPtr,
    MAX(lot.EXPIRED_DATE)                  AS ExpDate,
    SUM(i.QUANTITY)                        AS Quantity,
    SUM(CASE WHEN i.TRAN_TP = 14 THEN -i.QUANTITY ELSE 0 END) AS QtyReturned,
    MIN(i.TRAN_DATE)                       AS FirstIssueDate,
    MAX(i.TRAN_DATE)                       AS LastIssueDate,
    COUNT(*)                               AS IssueCount,
    COUNT(DISTINCT i.WoNum)                AS WorkOrderCount,
    MIN(i.WoNum)                           AS FirstWorkOrder,
    MAX(i.WoNum)                           AS LastWorkOrder,
    MAX(LTRIM(RTRIM(loc.CODE)))            AS LocationCode,
    MAX(LTRIM(RTRIM(loc.LOCATION)))        AS LocationName,
    MAX(LTRIM(RTRIM(ctry.COUNTRY_CODE)))   AS CountryOfOrigin,
    MAX(CASE WHEN NULLIF(coo.C_OF_O_PTR, 0) IS NOT NULL THEN 'lot' ELSE 'part' END)
                                           AS CountryOfOriginSource
FROM Issued i
${LOOKUPS}
WHERE d17.P_M = 'P'
GROUP BY
    LTRIM(RTRIM(d17.INV_PART_NUMBER)),
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)),
    LTRIM(RTRIM(lot.BATCH_NO)),
    lot.PO_PTR
ORDER BY InventoryPart, BatchSerial
OPTION (MAXRECURSION 32)`,
      params,
    }
  }

  return {
    sql: `${prefix}
SELECT
    i.Lvl,
    i.ParentWo                             AS IssuedFrom,
    i.WoNum                                AS IssuedToWorkOrder,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    d17.P_M                                AS PurchasedOrMade,
    LTRIM(RTRIM(lot.BATCH_NO))             AS BatchSerial,
    i.TRAN_TP                              AS TranType,
    i.QUANTITY                             AS Quantity,
    i.TRAN_DATE                            AS IssueDate,
    i.ROUTE_STEP_NO                        AS RouteStep,
    i.LAYUP_SEQ_NO                         AS LayupSeq,
    lot.PO_PTR                             AS PoPtr,
    lot.RO_PTR                             AS RoPtr,
    lot.EXPIRED_DATE                       AS ExpDate,
    LTRIM(RTRIM(loc.CODE))                 AS LocationCode,
    LTRIM(RTRIM(loc.LOCATION))             AS LocationName,
    LTRIM(RTRIM(ctry.COUNTRY_CODE))        AS CountryOfOrigin,
    CASE WHEN NULLIF(coo.C_OF_O_PTR, 0) IS NOT NULL THEN 'lot' ELSE 'part' END
                                           AS CountryOfOriginSource,
    i.TranRkey                             AS IssueRkey
FROM Issued i
${LOOKUPS}
ORDER BY i.Lvl, i.WoNum, InventoryPart, i.TRAN_DATE
OPTION (MAXRECURSION 32)`,
    params,
  }
}

/** Leading job number, e.g. '357152' from '-357152-01-100'. Probe use only. */
export function workOrderCore(wo: string): string {
  const m = normalizeWorkOrder(wo).match(/\d{4,}/)
  return m ? m[0] : normalizeWorkOrder(wo)
}

/**
 * Why did that come back empty? An empty result has several very different
 * causes and they need different responses. Probed only on empty.
 */
export function buildEmptyResultProbes(workOrder: string): {
  ledger: { sql: string; params: Record<string, unknown> }
  header: { sql: string; params: Record<string, unknown> }
  coverage: { sql: string; params: Record<string, unknown> }
} {
  const core = workOrderCore(workOrder)
  return {
    ledger: {
      sql: `SELECT TOP 25
    LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) AS TranSource,
    'work order'                       AS TranType,
    COUNT(t.RKEY)                      AS Rows,
    MIN(t.TRAN_DATE)                   AS FirstTran,
    MAX(t.TRAN_DATE)                   AS LastTran
FROM DATA0006 wo
LEFT JOIN DATA0067 src ON src.WO_PTR  = wo.RKEY
LEFT JOIN DATA0095 t   ON t.SRCE_PTR  = src.RKEY AND t.TRAN_TP = 13
WHERE LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) LIKE '%' + @core + '%'
GROUP BY LTRIM(RTRIM(wo.WORK_ORDER_NUMBER))
ORDER BY TranSource`,
      params: { core },
    },
    header: {
      sql: `SELECT TOP 25 LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) AS WorkOrderNumber
FROM DATA0006 wo
WHERE LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) LIKE '%' + @core + '%'
ORDER BY WorkOrderNumber`,
      params: { core },
    },
    coverage: {
      // DATA0095 reaches back to 2006, so this is now reassurance rather than
      // the boundary it was when the tab read DATA0153.
      sql: `SELECT COUNT(*) AS TotalRows, MIN(t.TRAN_DATE) AS Oldest, MAX(t.TRAN_DATE) AS Newest
FROM DATA0095 t WHERE t.TRAN_TP = 13`,
      params: {},
    },
  }
}
