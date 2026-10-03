/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 4
   Test work order: -354516-01-000

   ROUND 3 FOUND SOMETHING THAT CHANGES THE QUERY.

   Asking DATA0153 for every transaction against lot
   -354589-01-100 returned FIVE rows, not one, differing only in
   TRAN_SOURCE:

       -354516-01-000     714.758438
       S0-354516-01-000   774.321641
       S1-354516-01-000   722.700199
       S2-354516-01-000   381.204500
       S3-354516-01-000   407.015222   <-- the report's 407.015

   Same TDATE, same batch, same LOC_PTR. These are SPLIT work
   orders: one job split into sub-lots, each carrying its own
   material issues under an S-prefixed source.

   WHICH KILLS MY UNIT-CONVERSION THEORY. In round 3 I read the
   constant 1.7561 ratio as a UOM conversion. It is not: the
   report's 407.015 is simply the S3 split's own issue quantity,
   sitting in the table verbatim. The constant ratio was a
   coincidence of this one lot — and the DATA0017 dump settles it,
   because nothing on either part carries anything like 1.7561
   (STOCK_UNIT_PTR = 1, BOM_UNIT_PTR = 0, BOM_STOCK_RATIO = 0,
   REPORT_VALUE1/2/3 are 0.003/1/0.001 and 0.03/1/0.01). There is
   no conversion factor to find because there is no conversion.

   The quantities were never wrong — we were reading the wrong
   work order. Section 17 proves it either way.

   THE OTHER OPEN ITEM ALSO LOOKS DIFFERENT NOW.
   DATA0153 holds exactly two transaction types and ZERO negative
   rows in 15,200:
       Stock To Work Order    15200 rows, 0 negative
       Stock To Work Center     474 rows, 0 negative
   So the report's parenthesised ( 407.015) is NOT a negative row
   in this table. Either returns live somewhere else, or the
   parentheses mean something other than a reversal — section 19
   decides which. Note the report prints the SAME batch twice at
   the SAME quantity, once plain and once in parentheses, which is
   exactly what an issue-and-return pair would look like.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   17. THE DECISIVE QUERY — ALL SPLITS OF THIS WORK ORDER
   -------------------------------------------------------------
   If the split theory is right, S3-354516-01-000 carries all four
   of the report's quantities:
        -354590-02-100   205.000
        -340281-01-100    27.134
        -354589-01-100   407.015
        -359164-01-100   434.150
   and the base -354516-01-000 carries the larger numbers we
   already saw. If instead every split shows the same ratio to the
   report, the conversion theory survives after all.

   This also reveals the splitting convention: how many S-levels
   exist, and whether the base work order is itself one of them.
   ------------------------------------------------------------- */
SELECT
    LTRIM(RTRIM(t.TRAN_SOURCE))     AS TranSource,
    LTRIM(RTRIM(t.PART_NUMBER))     AS PartNumber,
    LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS BatchSerial,
    t.QUANTITY,
    t.TDATE,
    t.LOC_PTR,
    t.RKEY
FROM DATA0153 t
WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) LIKE '%-354516-01-000'
ORDER BY t.TRAN_SOURCE, t.PART_NUMBER, t.TDATE;


/* -------------------------------------------------------------
   18. HOW COMMON IS THE SPLIT PREFIX
   -------------------------------------------------------------
   Decides how the app must match a work order. If splits are
   routine, matching TRAN_SOURCE = @wo exactly would silently
   under-report on most jobs, and matching LIKE '%' + @wo is
   required. Worth knowing the prefix alphabet before relying on
   'S%' — there may be R, W or other letters.
   ------------------------------------------------------------- */
SELECT
    CASE
      WHEN LTRIM(RTRIM(TRAN_SOURCE)) LIKE '-%' THEN '(no prefix)'
      ELSE LEFT(LTRIM(RTRIM(TRAN_SOURCE)),
                CHARINDEX('-', LTRIM(RTRIM(TRAN_SOURCE))) - 1)
    END                        AS SourcePrefix,
    COUNT(*)                   AS rows_total,
    COUNT(DISTINCT TRAN_SOURCE) AS distinct_sources
FROM DATA0153
WHERE CHARINDEX('-', LTRIM(RTRIM(TRAN_SOURCE))) > 0
GROUP BY
    CASE
      WHEN LTRIM(RTRIM(TRAN_SOURCE)) LIKE '-%' THEN '(no prefix)'
      ELSE LEFT(LTRIM(RTRIM(TRAN_SOURCE)),
                CHARINDEX('-', LTRIM(RTRIM(TRAN_SOURCE))) - 1)
    END
ORDER BY rows_total DESC;


/* -------------------------------------------------------------
   19. WHERE DO RETURNS LIVE
   -------------------------------------------------------------
   DATA0153 is issues-only. Find the table holding the other
   direction, so a returned lot is not reported as consumed.
   ------------------------------------------------------------- */
-- Tables shaped like DATA0153 (a TRAN_TYPE and a batch column).
SELECT c.TABLE_NAME, COUNT(*) AS shared_columns
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND c.COLUMN_NAME IN ('TRAN_TYPE','TRAN_SOURCE','BATCH_SERIAL_NO',
                        'QUANTITY','TDATE','DATA0017_PTR')
GROUP BY c.TABLE_NAME
HAVING COUNT(*) >= 3
ORDER BY shared_columns DESC, c.TABLE_NAME;

-- Anything anywhere describing the reverse movement.
SELECT DISTINCT TOP 50 LTRIM(RTRIM(TRAN_TYPE)) AS TranType
FROM DATA0153
ORDER BY TranType;


/* -------------------------------------------------------------
   20. REMAINING LOOKUPS  (unchanged from round 3, still needed)
   -------------------------------------------------------------
   LOC_PTR 286 / 3490 / 3491 -> 'NASKT N ASSY KIT' /
   'NBW22 N HARDWARE' / 'NBW23 N HARDWARE'; plus country of origin
   for the C OF O column.
   ------------------------------------------------------------- */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%LOC_CODE%' OR COLUMN_NAME LIKE '%LOCATION%'
    OR COLUMN_NAME LIKE '%WHSE%'     OR COLUMN_NAME LIKE '%WAREHOUSE%')
ORDER BY TABLE_NAME, COLUMN_NAME;

SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%ORIGIN%' OR COLUMN_NAME LIKE '%COUNTRY%'
    OR COLUMN_NAME LIKE '%C_OF_O%' OR COLUMN_NAME LIKE '%COFO%')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- DATA0095 is pointed at directly by DATA0153.DATA0095_PTR and may
-- be the lot-at-location record carrying both.
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0095'
ORDER BY ORDINAL_POSITION;

SELECT * FROM DATA0095 WHERE RKEY IN (5234608, 5234609, 5234610, 5236949);


/* -------------------------------------------------------------
   21. THE QUERY, NOW SPLIT-AWARE
   -------------------------------------------------------------
   Same recursion as round 3 (work order -> issued batch -> that
   batch treated as a work order), with one change: a work order
   is matched by its SUFFIX, so the base job and all its S-splits
   come back together. That is what the Paradigm report appears to
   do, and it is the difference between seeing one split's
   material and seeing the job's.

   QUANTITY is now returned as-is and named Quantity — round 3's
   reason for withholding it has gone, assuming section 17 lands
   the way the evidence points. Confirm section 17 first.
   ------------------------------------------------------------- */
DECLARE @WorkOrder  VARCHAR(40) = '-354516-01-000';
DECLARE @IncludeSub BIT = 1;

;WITH Issues AS (
    SELECT
        CAST(LTRIM(RTRIM(t.TRAN_SOURCE)) AS VARCHAR(40)) AS TranSource,
        CAST(@WorkOrder AS VARCHAR(40))                  AS RootWorkOrder,
        LTRIM(RTRIM(t.BATCH_SERIAL_NO))                  AS BatchSerial,
        t.DATA0017_PTR, t.QUANTITY, t.TDATE, t.LOC_PTR, t.WHSE_PTR,
        t.UNIT_PTR, t.RKEY,
        0 AS Lvl,
        CAST('|' + @WorkOrder + '|' AS VARCHAR(4000)) AS Visited
    FROM DATA0153 t
    WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) LIKE '%' + @WorkOrder
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')

    UNION ALL

    SELECT
        CAST(LTRIM(RTRIM(t.TRAN_SOURCE)) AS VARCHAR(40)),
        i.BatchSerial,
        LTRIM(RTRIM(t.BATCH_SERIAL_NO)),
        t.DATA0017_PTR, t.QUANTITY, t.TDATE, t.LOC_PTR, t.WHSE_PTR,
        t.UNIT_PTR, t.RKEY,
        i.Lvl + 1,
        CAST(i.Visited + i.BatchSerial + '|' AS VARCHAR(4000))
    FROM Issues i
    JOIN DATA0153 t
      ON LTRIM(RTRIM(t.TRAN_SOURCE)) COLLATE DATABASE_DEFAULT
         LIKE '%' + i.BatchSerial COLLATE DATABASE_DEFAULT
    WHERE @IncludeSub = 1
      AND i.Lvl < 10
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')
      -- a lot must not re-enter its own ancestry
      AND i.Visited NOT LIKE '%|' + i.BatchSerial + '|%'
)
SELECT
    i.Lvl,
    i.RootWorkOrder                        AS ParentWorkOrder,
    i.TranSource                           AS IssuedToWorkOrder,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    d17.P_M                                AS PurchasedOrMade,
    i.BatchSerial,
    i.QUANTITY                             AS Quantity,
    i.TDATE                                AS IssueDate,
    i.WHSE_PTR, i.LOC_PTR,
    LTRIM(RTRIM(po.PO_NUMBER))             AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME))       AS SupplierName,
    lot.EXPIRED_DATE                       AS ExpDate
FROM Issues i
LEFT JOIN DATA0017 d17 ON d17.RKEY = i.DATA0017_PTR
LEFT JOIN DATA0020 lot
       ON lot.INVENTORY_POINTER = i.DATA0017_PTR
      AND LTRIM(RTRIM(lot.BATCH_NO)) COLLATE DATABASE_DEFAULT
        = i.BatchSerial COLLATE DATABASE_DEFAULT
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
ORDER BY i.Lvl, i.TranSource, InventoryPart
OPTION (MAXRECURSION 32);


/* -------------------------------------------------------------
   22. CONCISE OUTPUT
   -------------------------------------------------------------
   Purchased leaves only, deduped. Your reading was right: drop
   the columns that vary per issue (date, quantity, work order,
   and now the split) and identical lots collapse. The report's
   concise page is four rows for this job.

   P_M = 'P' is the purchased test; a manufactured lot has
   P_M = 'M' and no PO. Run 21 first, then this, and compare the
   row counts to the two report pages.
   ------------------------------------------------------------- */
DECLARE @WO2 VARCHAR(40) = '-354516-01-000';

;WITH Issues AS (
    SELECT LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS BatchSerial,
           t.DATA0017_PTR, t.LOC_PTR, 0 AS Lvl,
           CAST('|' + @WO2 + '|' AS VARCHAR(4000)) AS Visited
    FROM DATA0153 t
    WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) LIKE '%' + @WO2
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')
    UNION ALL
    SELECT LTRIM(RTRIM(t.BATCH_SERIAL_NO)),
           t.DATA0017_PTR, t.LOC_PTR, i.Lvl + 1,
           CAST(i.Visited + i.BatchSerial + '|' AS VARCHAR(4000))
    FROM Issues i
    JOIN DATA0153 t
      ON LTRIM(RTRIM(t.TRAN_SOURCE)) COLLATE DATABASE_DEFAULT
         LIKE '%' + i.BatchSerial COLLATE DATABASE_DEFAULT
    WHERE i.Lvl < 10
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')
      AND i.Visited NOT LIKE '%|' + i.BatchSerial + '|%'
)
SELECT DISTINCT
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    LTRIM(RTRIM(po.PO_NUMBER))             AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME))       AS SupplierName,
    i.BatchSerial,
    lot.EXPIRED_DATE                       AS ExpDate
FROM Issues i
JOIN DATA0017 d17 ON d17.RKEY = i.DATA0017_PTR
LEFT JOIN DATA0020 lot
       ON lot.INVENTORY_POINTER = i.DATA0017_PTR
      AND LTRIM(RTRIM(lot.BATCH_NO)) COLLATE DATABASE_DEFAULT
        = i.BatchSerial COLLATE DATABASE_DEFAULT
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
WHERE d17.P_M = 'P'
ORDER BY InventoryPart, i.BatchSerial
OPTION (MAXRECURSION 32);
