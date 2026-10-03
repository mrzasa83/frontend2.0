/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 2 diagnostics
   Test work order: -354516-01-000

   WHAT SECTION G SETTLED

   The DATA0020 fan-out is fixed. OUTER APPLY ... TOP 1 took level 0
   from 26 rows to 20 — exactly 4 issues under each of the five
   sources (base, S0, S1, S2, S3), which is precisely what DATA0153
   holds. Lot -354589-01-100 no longer doubles. Defect (1) closed.

   A SECOND DUPLICATION, DIFFERENT CAUSE

   The five level-1 rows are byte-identical and resolve to ONE
   DATA0153 row. Not a DATA0020 artefact — a recursion artefact.
   The CTE recurses over issue ROWS: -359164-01-100 appears in five
   level-0 rows (once per source), so each of the five walked into
   the same child issue and emitted it. One physical issue, five
   paths, five copies.

   The fix cannot live inside the CTE. T-SQL forbids DISTINCT, TOP,
   GROUP BY, HAVING, aggregates, subqueries and APPLY in the
   recursive member of a recursive CTE, so the recursion cannot
   dedupe its own frontier. It has to be done on the outside, and
   the right key is DATA0153.RKEY: one ledger row is one physical
   issue no matter how many paths reach it. Section H does that and
   should return 21 rows — all 20 at level 0 (genuinely distinct
   issues) plus 1 at level 1.

   STILL OPEN — SECTIONS D, E AND F ARE NOT YET RUN

   They are the blockers for the two remaining defects, and neither
   can be reasoned out from what we have:

     (2) PO NUMBER AND SUPPLIER NULL EVERYWHERE, including
         G011595160, which the report shows as PURO136354 /
         SAUNDERS DIV OF RS HUGHES. The lot row itself clearly
         matched — ExpDate 2028-01-11 came through and agrees with
         the report — so DATA0020 resolved and the PO join did not.
         Section E. Note G now also prefers a lot row carrying a PO
         when several exist, so if the OUTER APPLY was picking a
         PO-less location row, E will show it.

     (3) RECURSION DESCENDS ONE BRANCH ONLY. Level 1 appears solely
         under -359164-01-100. Nothing for -354590-02-100,
         -340281-01-100 or -354589-01-100, yet the printed report
         has a whole section for -354590-02-100 (CU FOIL, two
         COVERLAY lines). All four batches start with a dash so the
         recursion gate passed for all four; the JOIN simply found
         nothing. Section F, extended below, establishes whether
         those issues exist in DATA0153 at all.

         A hypothesis worth testing while you are in there:
         DATA0153 holds only ~15,700 rows in total, which is very
         small for a complete material-issue ledger at our volume.
         It may be a current-period table with history archived
         elsewhere (DATA9469 production transactions is the
         candidate). -359164-01-100 may simply be the most recent
         of the four. F3 and F4 test that directly — if DATA0153
         starts in, say, 2024, the older work orders were never
         going to be in it and the recursion needs a second source
         rather than a better LIKE pattern.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   E1. DOES DATA0070 HOLD THE KEY THE LOT POINTS AT
   -------------------------------------------------------------
   Round 1 showed lot G011595160 has PO_PTR = 174187. If this
   returns nothing, PO_PTR is not a DATA0070 RKEY.
   ------------------------------------------------------------- */
SELECT * FROM DATA0070 WHERE RKEY = 174187;


/* -------------------------------------------------------------
   E2. WHAT PO_PTR LOOKS LIKE ON THE LOTS OF THIS PART
   -------------------------------------------------------------
   Part 10859 is the one carrying G011595160. If some lots resolve
   to a PO and others do not, the pattern tells us which.
   ------------------------------------------------------------- */
SELECT TOP 20
    lot.RKEY,
    LTRIM(RTRIM(lot.BATCH_NO))       AS BatchNo,
    lot.INV_WHOUSE_LOC_PTR,
    lot.PO_PTR,
    lot.RO_PTR,
    lot.QUAN_ON_HAND,
    lot.EXPIRED_DATE,
    LTRIM(RTRIM(po.PO_NUMBER))       AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME)) AS SupplierName
FROM DATA0020 lot
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
WHERE lot.INVENTORY_POINTER = 10859
ORDER BY lot.RKEY DESC;


/* -------------------------------------------------------------
   E3. WHERE PO_NUMBER AND RO_NUMBER ACTUALLY LIVE
   -------------------------------------------------------------
   The report column is "RO/P.O. NUMBER", so a repair order is the
   other possibility and RO_PTR may be the live pointer. This lists
   every table that has either column, so we join the right one.
   ------------------------------------------------------------- */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%RO_NUMBER%' OR COLUMN_NAME LIKE '%PO_NUMBER%')
ORDER BY TABLE_NAME, COLUMN_NAME;


/* -------------------------------------------------------------
   E4. DOES PURO136354 EXIST, AND WHERE
   -------------------------------------------------------------
   Searching for the PO number the report prints. Whichever table
   and column it turns up in is the join we should be making.
   Hard-coded to DATA0070 first since that is the current guess.
   ------------------------------------------------------------- */
SELECT TOP 10
    po.RKEY,
    LTRIM(RTRIM(po.PO_NUMBER))       AS PONumber,
    po.SUPPLIER_POINTER,
    LTRIM(RTRIM(supp.SUPPLIER_NAME)) AS SupplierName
FROM DATA0070 po
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
WHERE LTRIM(RTRIM(po.PO_NUMBER)) LIKE '%136354%';


/* -------------------------------------------------------------
   F1. DO THE OTHER THREE WORK ORDERS HAVE ISSUES AT ALL
   -------------------------------------------------------------
   And how does TRAN_SOURCE spell them. If a spelling we are not
   matching comes back, that spelling is the fix.
   ------------------------------------------------------------- */
SELECT
    LTRIM(RTRIM(TRAN_SOURCE)) AS TranSource,
    LTRIM(RTRIM(TRAN_TYPE))   AS TranType,
    COUNT(*)                  AS rows_found,
    MIN(TDATE)                AS first_tran,
    MAX(TDATE)                AS last_tran
FROM DATA0153
WHERE LTRIM(RTRIM(TRAN_SOURCE)) LIKE '%354590%'
   OR LTRIM(RTRIM(TRAN_SOURCE)) LIKE '%340281%'
   OR LTRIM(RTRIM(TRAN_SOURCE)) LIKE '%354589%'
   OR LTRIM(RTRIM(TRAN_SOURCE)) LIKE '%359164%'
GROUP BY LTRIM(RTRIM(TRAN_SOURCE)), LTRIM(RTRIM(TRAN_TYPE))
ORDER BY TranSource;


/* -------------------------------------------------------------
   F2. THE CU FOIL AND COVERLAY LINES THE REPORT SHOWS
   -------------------------------------------------------------
   The report lists these under -354590-02-100. Zero rows here
   means DATA0153 does not hold them and we need another source.
   ------------------------------------------------------------- */
SELECT TOP 50
    LTRIM(RTRIM(TRAN_SOURCE))     AS TranSource,
    LTRIM(RTRIM(TRAN_TYPE))       AS TranType,
    LTRIM(RTRIM(PART_NUMBER))     AS PartNumber,
    LTRIM(RTRIM(DESCRIPTION))     AS Description,
    LTRIM(RTRIM(BATCH_SERIAL_NO)) AS BatchSerial,
    QUANTITY, TDATE
FROM DATA0153
WHERE LTRIM(RTRIM(PART_NUMBER)) IN ('FCWROUT3.OZ1824', 'UPCLFA2K124R')
ORDER BY TDATE DESC;


/* -------------------------------------------------------------
   F3. HOW FAR BACK DOES DATA0153 GO
   -------------------------------------------------------------
   The archive hypothesis. If this table only covers recent
   months, the three missing work orders predate it and no LIKE
   pattern will ever find them.
   ------------------------------------------------------------- */
SELECT
    COUNT(*)   AS total_rows,
    MIN(TDATE) AS oldest,
    MAX(TDATE) AS newest
FROM DATA0153;

-- Rows per year, to see whether it is a rolling window or complete
SELECT
    YEAR(TDATE) AS yr,
    COUNT(*)    AS rows_in_year
FROM DATA0153
GROUP BY YEAR(TDATE)
ORDER BY yr;


/* -------------------------------------------------------------
   F4. IF DATA0153 IS A WINDOW, WHERE IS THE HISTORY
   -------------------------------------------------------------
   DATA9469 is the production-transaction table and the obvious
   candidate. Shape first, then look for the same work orders.
   ------------------------------------------------------------- */
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA9469'
ORDER BY ORDINAL_POSITION;

-- Any table at all with a column that could hold a batch/lot and a
-- work-order source, so we are not guessing at DATA9469 alone
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%BATCH%' OR COLUMN_NAME LIKE '%TRAN_SOURCE%')
ORDER BY TABLE_NAME, COLUMN_NAME;


/* -------------------------------------------------------------
   H. THE QUERY WITH BOTH FAN-OUTS FIXED
   -------------------------------------------------------------
   Two separate corrections, both outside the recursive member
   because T-SQL will not allow either one inside it:

     OUTER APPLY ... TOP 1   collapses DATA0020, which keeps one
                             row per lot PER WAREHOUSE LOCATION.

     ROW_NUMBER() by RKEY    collapses the recursion. One DATA0153
                             row is one physical material issue; if
                             five paths reach it, it is still one
                             issue and belongs on the report once.
                             Keeping the shallowest level and the
                             first parent alphabetically, so the
                             surviving row is stable run to run.

   Expect 21 rows: 20 at level 0, 1 at level 1. Recursion depth and
   the PO join are still open (E and F), so this is a dedupe test,
   not the finished report.
   ------------------------------------------------------------- */
DECLARE @WorkOrder  VARCHAR(40) = '-354516-01-000';
DECLARE @IncludeSub BIT = 1;

;WITH Issues AS (
    SELECT
        CAST(LTRIM(RTRIM(t.TRAN_SOURCE))     AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS TranSource,
        CAST(@WorkOrder                      AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS ParentSource,
        CAST(LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS BatchSerial,
        t.DATA0017_PTR, t.QUANTITY, t.TDATE,
        t.LOC_PTR, t.WHSE_PTR, t.UNIT_PTR, t.RKEY,
        CAST(0 AS INT) AS Lvl,
        CAST('|' + @WorkOrder + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT AS Visited
    FROM DATA0153 t
    WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) LIKE '%' + @WorkOrder
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')
    UNION ALL
    SELECT
        CAST(LTRIM(RTRIM(t.TRAN_SOURCE))     AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT,
        CAST(i.BatchSerial                   AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT,
        CAST(LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT,
        t.DATA0017_PTR, t.QUANTITY, t.TDATE,
        t.LOC_PTR, t.WHSE_PTR, t.UNIT_PTR, t.RKEY,
        i.Lvl + 1,
        CAST(i.Visited + i.BatchSerial + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT
    FROM Issues i
    JOIN DATA0153 t
      ON LTRIM(RTRIM(t.TRAN_SOURCE)) COLLATE DATABASE_DEFAULT
         LIKE '%' + i.BatchSerial
    WHERE @IncludeSub = 1
      AND i.Lvl < 10
      AND i.BatchSerial LIKE '-%'
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')
      AND i.Visited NOT LIKE '%|' + i.BatchSerial + '|%'
),
OneRowPerIssue AS (
    -- The recursion dedupe. PARTITION BY RKEY alone is deliberate:
    -- the key is the ledger row, so every duplicate path collapses
    -- regardless of which level or parent found it.
    SELECT i.*,
           ROW_NUMBER() OVER (
               PARTITION BY i.RKEY
               ORDER BY i.Lvl, i.ParentSource
           ) AS rn
    FROM Issues i
)
SELECT
    i.Lvl,
    i.ParentSource                         AS IssuedFrom,
    i.TranSource                           AS IssuedToWorkOrder,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    d17.P_M                                AS PurchasedOrMade,
    i.BatchSerial,
    i.QUANTITY                             AS Quantity,
    i.TDATE                                AS IssueDate,
    i.WHSE_PTR, i.LOC_PTR,
    lot.PO_PTR, lot.RO_PTR,
    LTRIM(RTRIM(po.PO_NUMBER))             AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME))       AS SupplierName,
    lot.EXPIRED_DATE                       AS ExpDate,
    i.RKEY                                 AS IssueRkey
FROM OneRowPerIssue i
LEFT JOIN DATA0017 d17 ON d17.RKEY = i.DATA0017_PTR
OUTER APPLY (
    SELECT TOP 1 l.*
    FROM DATA0020 l
    WHERE l.INVENTORY_POINTER = i.DATA0017_PTR
      AND LTRIM(RTRIM(l.BATCH_NO)) COLLATE DATABASE_DEFAULT = i.BatchSerial
    ORDER BY
        CASE WHEN l.PO_PTR > 0 THEN 0 ELSE 1 END,
        CASE WHEN l.INV_WHOUSE_LOC_PTR = i.LOC_PTR THEN 0 ELSE 1 END,
        l.RKEY
) lot
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
WHERE i.rn = 1
ORDER BY i.Lvl, i.TranSource, InventoryPart
OPTION (MAXRECURSION 32);
