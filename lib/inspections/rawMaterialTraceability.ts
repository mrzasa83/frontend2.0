/**
 * Raw Material Traceability — the Paradigm "Work Order -> Raw Material"
 * report, rebuilt against PDMLIV.
 *
 * TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02). Read-only.
 *
 * WHY THIS EXISTS, AND WHAT IT REPLACES
 *
 * app/api/operations/inspections/material-certs/route.ts walks the BOM
 * (DATA0025/DATA0026) and then joins DATA0020 on the inventory pointer
 * alone:
 *
 *     JOIN DATA0020 lot ON lot.INVENTORY_POINTER = d17.RKEY
 *     JOIN DATA0070 po  ON po.RKEY = lot.PO_PTR
 *
 * Nothing in that constrains the lot to the work order, so it returns every
 * lot ever received for every part on the BOM. Measured on -354516-01-000:
 * 374 rows, 340 distinct lots, expiry dates spanning 2008-2029, and not one
 * of the 4 lots actually issued to the job. It answers "what could have been
 * used" when the question is "what was used".
 *
 * Paradigm does not walk the BOM at all. It walks the MATERIAL ISSUE LEDGER,
 * DATA0153 — the record of what stock was actually issued to which work
 * order. Only two TRAN_TYPEs appear in it: 'Stock To Work Order' (15,200
 * rows) and 'Stock To Work Center' (474).
 *
 * HOW THE WALK WORKS
 *
 * A lot number tells you which kind of material it is. Work-order-made lots
 * are named after the job that produced them and begin with a dash
 * ('-354590-02-100', PO_PTR = 0); purchased lots carry the supplier's batch
 * and a PO ('G011595160', '5508-0104', '4WA5N.1'). So:
 *
 *   level 0   issues whose TRAN_SOURCE is the work order
 *   level n   for each made lot issued at level n-1, the issues against the
 *             work order that produced it
 *
 * Purchased lots are leaves. The recursion is gated on the leading dash,
 * which is both correctness and performance: without it, a supplier batch
 * like '5508-0104' would LIKE-match any work order ending in those
 * characters and invent material that was never issued, while probing a
 * 15k-row table once per purchased lot.
 *
 * THREE THINGS THAT BIT, ALL WORTH KEEPING IN MIND BEFORE EDITING
 *
 * 1. SPLIT WORK ORDERS. A job runs as a base number plus S0-/S1-/S2-/S3-
 *    splits, and the material is issued against the splits. The printed
 *    report for -354516-01-000 carries S3's quantities exactly
 *    (205.000 / 27.134 / 407.015 / 434.150) while the base job carries
 *    360 / 47.65 / 714.76 / 762.41. Matching by suffix brings the base and
 *    all its splits back together, which is why IssuedToWorkOrder is in the
 *    output — the caller needs to see which split a row came from.
 *
 * 2. DATA0020 KEEPS ONE ROW PER LOT PER WAREHOUSE LOCATION. Joining it on
 *    (INVENTORY_POINTER, BATCH_NO) therefore multiplies every issue by the
 *    number of locations that have held that lot. OUTER APPLY ... TOP 1
 *    collapses it.
 *
 * 3. A RECURSIVE CTE CANNOT DEDUPE ITSELF. T-SQL forbids DISTINCT, TOP,
 *    GROUP BY, HAVING, aggregates and subqueries in the recursive member, so
 *    when one made lot is issued under five sources, its children get walked
 *    five times. The dedupe is ROW_NUMBER() over DATA0153.RKEY on the
 *    outside: one ledger row is one physical issue however many paths reach
 *    it.
 *
 * Also note every character column is CAST to an explicit length AND given
 * COLLATE DATABASE_DEFAULT on both sides. A recursive CTE requires exact
 * type, length and collation agreement across the UNION ALL and will not
 * coerce, and this server has mixed Latin1_General_CI_AI /
 * Latin1_General_BIN columns that otherwise conflict on text joins.
 *
 * WORK_ORDER_NUMBER and TRAN_SOURCE are stored with leading spaces, hence
 * LTRIM(RTRIM(...)) on every comparison.
 */

export type TraceabilityOptions = {
  /** Base or split work order, e.g. '-354516-01-000'. */
  workOrder: string
  /**
   * Paradigm's "Include Sub Levels". Off stops at the work order's own
   * issues; on follows made lots down into the jobs that produced them.
   * Defaults on, matching the dialog we're replicating.
   */
  includeSubLevels?: boolean
  /**
   * Paradigm's "Concise Output". Purchased items only, one row per
   * (part, lot, PO) — the per-issue columns that vary (work order, split,
   * date, quantity) are dropped so repeat issues of one lot collapse.
   * Defaults on.
   */
  concise?: boolean
  /**
   * Not on Paradigm's dialog — added because the split discovery made it a
   * decision we have to take deliberately rather than by accident.
   *
   * Off (the default) matches the work order by suffix, so the base job and
   * every S0-/S1-/S2-/S3- split come back together. On matches the exact
   * string given.
   *
   * This matters: the printed report for -354516-01-000 carries S3's
   * quantities, not the base job's, even though its header prints the base
   * number. Until we know whether Paradigm always reports the last split or
   * the operator picked S3, showing all splits with IssuedToWorkOrder on
   * each row is the honest default — it can't silently report the wrong
   * quantity, because every split's quantity is visible.
   */
  exactWorkOrder?: boolean
}

/** Depth ceiling. Deep enough for any real assembly, shallow enough that a
 *  data problem surfaces as a short result rather than a hung query. */
const MAX_LEVEL = 10

/**
 * The recursive walk, shared by both output modes. Emitted as a CTE body so
 * the two SELECT shapes can sit on top of the same traversal rather than
 * drifting apart.
 */
/**
 * Normalises a work order or lot number to its comparable core.
 *
 *   -357152-01-100      -> 357152-01-100
 *   S3-354516-01-000    -> 354516-01-000
 *   354516-01-000       -> 354516-01-000
 *
 * Paradigm writes the same job several ways: a base number, S0-/S1-/S2-/S3-
 * splits of it, and lot numbers that carry the producing job's number with a
 * leading dash. Comparing the normalised forms matches all of them exactly,
 * which is both safer and broader than a wildcard.
 *
 * It has to agree character for character with NORM_SQL below — if the two
 * ever drift, the query silently returns nothing, which is the failure this
 * function exists to prevent.
 */
export function normalizeWorkOrder(wo: string): string {
  return wo.trim().toUpperCase()
    // Split/alternate prefix. NOT just S: the ledger also carries A1-, A5-
    // (e.g. A5-350167-01-100, A1-356192-01-100) alongside S0-/S1-. An
    // S-only rule silently dropped every A-prefixed job.
    .replace(/^[A-Z]\d{1,2}-/, '')
    .replace(/^-/, '')           // leading dash on lots and job numbers
}

/** The SQL twin of normalizeWorkOrder. `v` must already be trimmed and
 *  uppercased. Kept as one expression so Ledger computes it once per row. */
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
 * The recursive walk, shared by both output modes. Emitted as a CTE body so
 * the two SELECT shapes sit on one traversal rather than drifting apart.
 *
 * WHY THERE IS NO WILDCARD HERE ANY MORE
 *
 * The first cut matched the root with LIKE '%' + @workOrder and recursed with
 * LIKE '%' + i.BatchSerial. That over-matches: any work order whose number
 * happens to END with the search string comes back as if it were the same
 * job. It is the same class of bug as the old BOM-walk in material-certs,
 * which returned 374 rows of unrelated lots. Widening it further to
 * '%' + wo + '%' would make that worse, not better.
 *
 * Normalising both sides and comparing for equality is broader AND stricter:
 * it matches the base job, every S-split and the lot form in one comparison,
 * and matches nothing else.
 *
 * Ledger is a plain (non-recursive) CTE so the trimming, uppercasing and
 * normalising happen once per row instead of once per recursion step. A
 * recursive member may reference another CTE as a table, which it could not
 * do with the CROSS APPLY this would otherwise need — T-SQL forbids subqueries
 * and APPLY inside a recursive member.
 */
function issuesCte(includeSubLevels: boolean, exactWorkOrder: boolean): string {
  // Exact pins one spelling, splits included or not. Otherwise the normalised
  // forms are compared, which gathers the base job and all of its splits.
  const rootMatch = exactWorkOrder
    ? 't.Src = @workOrderExact'
    : 't.SrcNorm = @workOrderNorm'

  return `
Ledger AS (
    SELECT
        t.DATA0017_PTR, t.QUANTITY, t.TDATE,
        t.LOC_PTR, t.WHSE_PTR, t.UNIT_PTR, t.RKEY,
        CAST(UPPER(LTRIM(RTRIM(t.TRAN_SOURCE)))     AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS Src,
        CAST(UPPER(LTRIM(RTRIM(t.BATCH_SERIAL_NO))) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS Batch,
        CAST(${NORM_SQL('UPPER(LTRIM(RTRIM(t.TRAN_SOURCE)))')} AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS SrcNorm,
        CAST(${NORM_SQL('UPPER(LTRIM(RTRIM(t.BATCH_SERIAL_NO)))')} AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS BatchNorm
    FROM DATA0153 t
    WHERE LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')
),
Issues AS (
    SELECT
        t.Src                                AS TranSource,
        CAST(@workOrderExact AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT         AS ParentSource,
        t.Batch                              AS BatchSerial,
        t.BatchNorm                          AS BatchNorm,
        t.DATA0017_PTR, t.QUANTITY, t.TDATE,
        t.LOC_PTR, t.WHSE_PTR, t.UNIT_PTR, t.RKEY,
        CAST(0 AS INT) AS Lvl,
        CAST('|' + @workOrderNorm + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT AS Visited
    FROM Ledger t
    WHERE ${rootMatch}

    UNION ALL

    SELECT
        t.Src,
        i.BatchSerial,
        t.Batch,
        t.BatchNorm,
        t.DATA0017_PTR, t.QUANTITY, t.TDATE,
        t.LOC_PTR, t.WHSE_PTR, t.UNIT_PTR, t.RKEY,
        i.Lvl + 1,
        CAST(i.Visited + i.BatchNorm + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT
    FROM Issues i
    JOIN Ledger t
      -- The lot issued at level n-1 names the job that produced it, so the
      -- producing job's issues are the ones whose normalised source equals
      -- the normalised lot. Equality, not LIKE: this picks up every split of
      -- the producing job and nothing else.
      ON t.SrcNorm = i.BatchNorm
    WHERE ${includeSubLevels ? '1 = 1' : '1 = 0'}
      AND i.Lvl < ${MAX_LEVEL}
      -- Only a work-order-style lot can have issues of its own; a supplier
      -- batch is a leaf. Also keeps the recursion off a 15k-row table once
      -- per purchased lot.
      AND i.BatchSerial LIKE '-%'
      -- Cycle guard. A reworked lot can otherwise re-enter its own branch.
      AND i.Visited NOT LIKE '%|' + i.BatchNorm + '|%'
),
OneRowPerIssue AS (
    -- The recursion dedupe. PARTITION BY RKEY alone is deliberate: the key is
    -- the ledger row, so duplicates collapse regardless of which level or
    -- parent reached it first.
    SELECT i.*,
           ROW_NUMBER() OVER (
               PARTITION BY i.RKEY
               ORDER BY i.Lvl, i.ParentSource
           ) AS rn
    FROM Issues i
)`
}

/**
 * Resolves one DATA0020 row per issue, never several.
 *
 * Preference order: a lot row carrying a PO first, since the PO and supplier
 * are the whole point of a traceability report and a location row with
 * PO_PTR = 0 would blank them; then one whose warehouse location matches the
 * issue; then lowest RKEY so the choice is stable run to run.
 */
const LOT_APPLY = `
OUTER APPLY (
    SELECT TOP 1 l.*
    FROM DATA0020 l
    WHERE l.INVENTORY_POINTER = i.DATA0017_PTR
      AND LTRIM(RTRIM(l.BATCH_NO)) COLLATE DATABASE_DEFAULT = i.BatchSerial
    ORDER BY
        CASE WHEN l.PO_PTR > 0 THEN 0 ELSE 1 END,
        CASE WHEN l.INV_WHOUSE_LOC_PTR = i.LOC_PTR THEN 0 ELSE 1 END,
        l.RKEY
) lot`

/**
 * Builds the query and its parameters. Caller passes the params straight to
 * queryMSSQL — the work order is never interpolated, so a work order
 * containing a quote or a wildcard cannot alter the statement.
 */
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
  const cte = issuesCte(includeSubLevels, exactWorkOrder)

  // queryMSSQL already prepends SET TRANSACTION ISOLATION LEVEL READ
  // UNCOMMITTED per batch, so this must not repeat it. The leading semicolon
  // terminates that statement before WITH.
  const prefix = ';WITH '

  if (concise) {
    /**
     * Concise. Purchased leaves only, deduped to one row per
     * (part, lot, PO) — which is exactly how Paradigm's concise page reads:
     * "only purchased items, and if the same purchase order / inventory part
     * number are the same, they are the same line item".
     *
     * GROUP BY rather than DISTINCT so the quantity issued can still be
     * totalled and the first and last issue dates kept. Paradigm's own page
     * omits those, but a cert reviewer asking "how much of this lot went in"
     * would otherwise have to switch modes to find out.
     *
     * CAREFUL WITH THAT SUM. Splits are apportionments of one issue, not
     * separate consumption. Measured on -354516-01-000, lot -354589-01-100:
     *
     *     base 714.758  S0 774.322  S1 722.700  S2 381.205  S3 407.015
     *     sum  3000.000 exactly
     *
     * The other three lots sum to 200.000, 3200.000 and 1511 — round totals,
     * so the sum is the real quantity issued to the job family. But the
     * printed Paradigm page shows S3's 407.015 share, a 7.37x difference.
     * Both are correct answers to different questions, which is precisely
     * why WorkOrderCount is selected: the UI has to say the quantity is a
     * total across N work orders, or someone reconciling against Paradigm
     * will read a real number as a defect.
     */
    return {
      sql: `${prefix}${cte}
SELECT
    MIN(i.Lvl)                             AS Lvl,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    i.BatchSerial                          AS BatchSerial,
    LTRIM(RTRIM(po.PO_NUMBER))             AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME))       AS SupplierName,
    LTRIM(RTRIM(supp.CODE))                AS SupplierCode,
    MAX(lot.EXPIRED_DATE)                  AS ExpDate,
    SUM(i.QUANTITY)                        AS Quantity,
    MIN(i.TDATE)                           AS FirstIssueDate,
    MAX(i.TDATE)                           AS LastIssueDate,
    COUNT(*)                               AS IssueCount,
    -- How many work orders that SUM spans. Greater than 1 means splits are
    -- folded in and the figure will not match a Paradigm page run for one
    -- split. Not cosmetic: it is the difference between 3000 and 407.015.
    COUNT(DISTINCT i.TranSource)           AS WorkOrderCount,
    MIN(i.TranSource)                      AS FirstWorkOrder,
    MAX(i.TranSource)                      AS LastWorkOrder,
    -- Surfaced unresolved so the UI can distinguish "no PO" from "PO exists
    -- but we cannot resolve it" (see PO_PTR 174187 / DATA0070).
    MAX(lot.PO_PTR)                        AS PoPtr,
    MAX(lot.RO_PTR)                        AS RoPtr,
    -- Aggregated rather than grouped: location varies per issue, and adding
    -- it to GROUP BY would split one lot into several concise lines, which
    -- is exactly what concise exists to avoid.
    MAX(LTRIM(RTRIM(loc.CODE)))            AS LocationCode,
    MAX(LTRIM(RTRIM(loc.LOCATION)))        AS LocationName,
    MAX(LTRIM(RTRIM(wh.WAREHOUSE_CODE)))   AS WarehouseCode,
    MAX(LTRIM(RTRIM(ctry.COUNTRY_CODE)))   AS CountryOfOrigin
FROM OneRowPerIssue i
JOIN DATA0017 d17 ON d17.RKEY = i.DATA0017_PTR
${LOT_APPLY}
-- KNOWN BROKEN, kept only so the shape stays stable until the right table
-- is found. DATA0070 holds 141,509 rows with RKEY 1..143,116, while every
-- PO_PTR on real lots runs 148,420..176,498 — past the end of the table. Not
-- one of them can resolve, which is why PONumber is NULL on every purchased
-- row. PO_PTR is not a DATA0070 key. The UI shows the raw pointer as
-- "ref NNNNNN (unresolved)" so a blank is never read as "never purchased".
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
-- Resolved in round 5, all three verified against known values:
--   DATA0016  RKEY 286 -> NASKT / N ASSY KIT, 3490 -> NBW22 / N HARDWARE,
--             439 -> NPP01 / PPG PREP. This is DATA0153.LOC_PTR's table.
--   DATA0015  RKEY 1 -> WHSE1 / NASHUA - APC WAREHOUSE, matching the
--             printed report's header exactly.
--   DATA9432  keyed DATA0020_PTR -> C_OF_O_PTR, i.e. country of origin per
--             LOT. DATA9419 is per customer part and DATA9421 per inventory
--             part, so neither answers "where did this lot come from".
LEFT JOIN DATA0016 loc  ON loc.RKEY = i.LOC_PTR
LEFT JOIN DATA0015 wh   ON wh.RKEY  = i.WHSE_PTR
OUTER APPLY (
    SELECT TOP 1 c.C_OF_O_PTR
    FROM DATA9432 c
    WHERE c.DATA0020_PTR = lot.RKEY
    ORDER BY c.RKEY DESC
) coo
LEFT JOIN DATA0250 ctry ON ctry.COUNTRY_RKEY = coo.C_OF_O_PTR
WHERE i.rn = 1
  AND d17.P_M = 'P'
GROUP BY
    LTRIM(RTRIM(d17.INV_PART_NUMBER)),
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)),
    i.BatchSerial,
    LTRIM(RTRIM(po.PO_NUMBER)),
    LTRIM(RTRIM(supp.SUPPLIER_NAME)),
    LTRIM(RTRIM(supp.CODE))
ORDER BY InventoryPart, BatchSerial
OPTION (MAXRECURSION 32)`,
      params,
    }
  }

  /**
   * Non-concise. Every issue, made and purchased, at every level, with the
   * split it was issued against. One row per DATA0153 ledger row.
   */
  return {
    sql: `${prefix}${cte}
SELECT
    i.Lvl                                  AS Lvl,
    i.ParentSource                         AS IssuedFrom,
    i.TranSource                           AS IssuedToWorkOrder,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    d17.P_M                                AS PurchasedOrMade,
    i.BatchSerial                          AS BatchSerial,
    i.QUANTITY                             AS Quantity,
    i.TDATE                                AS IssueDate,
    i.WHSE_PTR                             AS WhsePtr,
    i.LOC_PTR                              AS LocPtr,
    lot.PO_PTR                             AS PoPtr,
    lot.RO_PTR                             AS RoPtr,
    LTRIM(RTRIM(po.PO_NUMBER))             AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME))       AS SupplierName,
    LTRIM(RTRIM(supp.CODE))                AS SupplierCode,
    lot.EXPIRED_DATE                       AS ExpDate,
    LTRIM(RTRIM(loc.CODE))                 AS LocationCode,
    LTRIM(RTRIM(loc.LOCATION))             AS LocationName,
    LTRIM(RTRIM(wh.WAREHOUSE_CODE))        AS WarehouseCode,
    LTRIM(RTRIM(ctry.COUNTRY_CODE))        AS CountryOfOrigin,
    i.RKEY                                 AS IssueRkey
FROM OneRowPerIssue i
LEFT JOIN DATA0017 d17 ON d17.RKEY = i.DATA0017_PTR
${LOT_APPLY}
-- KNOWN BROKEN, kept only so the shape stays stable until the right table
-- is found. DATA0070 holds 141,509 rows with RKEY 1..143,116, while every
-- PO_PTR on real lots runs 148,420..176,498 — past the end of the table. Not
-- one of them can resolve, which is why PONumber is NULL on every purchased
-- row. PO_PTR is not a DATA0070 key. The UI shows the raw pointer as
-- "ref NNNNNN (unresolved)" so a blank is never read as "never purchased".
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
-- Resolved in round 5, all three verified against known values:
--   DATA0016  RKEY 286 -> NASKT / N ASSY KIT, 3490 -> NBW22 / N HARDWARE,
--             439 -> NPP01 / PPG PREP. This is DATA0153.LOC_PTR's table.
--   DATA0015  RKEY 1 -> WHSE1 / NASHUA - APC WAREHOUSE, matching the
--             printed report's header exactly.
--   DATA9432  keyed DATA0020_PTR -> C_OF_O_PTR, i.e. country of origin per
--             LOT. DATA9419 is per customer part and DATA9421 per inventory
--             part, so neither answers "where did this lot come from".
LEFT JOIN DATA0016 loc  ON loc.RKEY = i.LOC_PTR
LEFT JOIN DATA0015 wh   ON wh.RKEY  = i.WHSE_PTR
OUTER APPLY (
    SELECT TOP 1 c.C_OF_O_PTR
    FROM DATA9432 c
    WHERE c.DATA0020_PTR = lot.RKEY
    ORDER BY c.RKEY DESC
) coo
LEFT JOIN DATA0250 ctry ON ctry.COUNTRY_RKEY = coo.C_OF_O_PTR
WHERE i.rn = 1
ORDER BY i.Lvl, i.TranSource, InventoryPart, i.TDATE
OPTION (MAXRECURSION 32)`,
    params,
  }
}

/**
 * Extracts the leading job number from a work order or lot, e.g. '357152'
 * from '-357152-01-100'. Used only to widen a diagnostic probe, never the
 * report itself.
 */
export function workOrderCore(wo: string): string {
  const m = normalizeWorkOrder(wo).match(/\d{4,}/)
  return m ? m[0] : normalizeWorkOrder(wo)
}

/**
 * Why did that come back empty?
 *
 * An empty traceability result has several very different causes and they
 * need different responses from whoever is looking at it:
 *
 *   the number is spelled differently in the ledger   -> show the spellings
 *   the job exists but nothing was issued against it  -> say so
 *   the job does not exist at all                     -> it's a bad number
 *   the ledger does not go back that far              -> a data boundary
 *
 * "No material issues recorded" covers all four and distinguishes none, which
 * leaves the user with nothing to do. These probes are deliberately wide —
 * a substring match on the job number — because that is safe for a diagnostic
 * in a way it would never be for the report, where it would silently fold in
 * unrelated jobs.
 */
export function buildEmptyResultProbes(workOrder: string): {
  ledger: { sql: string; params: Record<string, unknown> }
  header: { sql: string; params: Record<string, unknown> }
  coverage: { sql: string; params: Record<string, unknown> }
} {
  const core = workOrderCore(workOrder)
  return {
    // Every spelling of this job number the issue ledger knows about.
    ledger: {
      sql: `SELECT TOP 25
    LTRIM(RTRIM(t.TRAN_SOURCE)) AS TranSource,
    LTRIM(RTRIM(t.TRAN_TYPE))   AS TranType,
    COUNT(*)                    AS Rows,
    MIN(t.TDATE)                AS FirstTran,
    MAX(t.TDATE)                AS LastTran
FROM DATA0153 t
WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) LIKE '%' + @core + '%'
GROUP BY LTRIM(RTRIM(t.TRAN_SOURCE)), LTRIM(RTRIM(t.TRAN_TYPE))
ORDER BY TranSource`,
      params: { core },
    },
    // Does the work order exist as a job at all?
    header: {
      sql: `SELECT TOP 25
    LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) AS WorkOrderNumber
FROM DATA0006 wo
WHERE LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) LIKE '%' + @core + '%'
ORDER BY WorkOrderNumber`,
      params: { core },
    },
    // How far back the ledger goes, so a date boundary is visible as one
    // rather than being mistaken for a missing job.
    coverage: {
      sql: `SELECT COUNT(*) AS TotalRows, MIN(t.TDATE) AS Oldest, MAX(t.TDATE) AS Newest
FROM DATA0153 t`,
      params: {},
    },
  }
}
