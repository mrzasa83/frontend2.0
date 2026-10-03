/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — three defects to pin down
   Test work order: -354516-01-000

   WHAT THE LAST RUN SETTLED

   The split theory is confirmed outright. S3-354516-01-000 carries
   every one of the report's four quantities:

       batch              report      S3 split
       -354590-02-100    205.000    205.000000
       -340281-01-100     27.134     27.134348
       -354589-01-100    407.015    407.015222
       -359164-01-100    434.150    434.149570

   while the base work order carries 360 / 47.65 / 714.76 / 762.41.
   So the printed report was produced for the S3 split even though
   its header prints the base work order number. Worth settling
   with whoever ran it: does the page always report the LAST split,
   or did the operator pick S3? The app has to make the same choice
   deliberately rather than by accident.

   THREE DEFECTS REMAIN, ALL MINE.

   (1) EVERY ROW DUPLICATES ON LOT -354589-01-100.
       It comes back twice per source with an identical quantity —
       base, S0, S1, S2 and S3 all doubled. DATA0153 holds only one
       issue, so this is a join fan-out: DATA0020 keeps ONE ROW PER
       LOT PER WAREHOUSE LOCATION. Round 1 already showed it —
       batch 5508-0104 had two rows, RKEY 848946 and 847810,
       differing only in INV_WHOUSE_LOC_PTR. Joining on
       (INVENTORY_POINTER, BATCH_NO) therefore multiplies.
       Section D fixes it with OUTER APPLY.

       Note the coincidence worth not being fooled by: the report
       also prints that lot twice, the second in parentheses. My
       duplicate is a join artefact and is almost certainly NOT the
       same thing as the report's parenthesised line.

   (2) PO NUMBER AND SUPPLIER COME BACK NULL EVERYWHERE,
       including the purchased lot G011595160, which the report
       shows as PURO136354 / SAUNDERS DIV OF RS HUGHES. The lot
       itself clearly matched — ExpDate 2028-01-11 came through and
       agrees with the report. So DATA0020 resolved and the PO join
       did not. Round 1 showed that lot has PO_PTR = 174187, so
       either DATA0070 has no such RKEY or PO_PTR points somewhere
       else. Section E finds out.

   (3) THE RECURSION ONLY DESCENDED ONE BRANCH.
       Lvl 1 appears solely under -359164-01-100. Nothing came back
       for -354590-02-100, -340281-01-100 or -354589-01-100, yet
       the printed report has a whole section for -354590-02-100
       (CU FOIL, two COVERLAY lines). That is why concise returned
       one row instead of four. Section F establishes whether those
       work orders have issue rows at all and under what source
       spelling.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   D. CONFIRM THE DATA0020 FAN-OUT
   -------------------------------------------------------------
   Expect more than one row for the doubled lot. Whatever differs
   between them is the column the join is missing.
   ------------------------------------------------------------- */
SELECT
    lot.RKEY, lot.INVENTORY_POINTER, LTRIM(RTRIM(lot.BATCH_NO)) AS BatchNo,
    lot.INV_WHOUSE_LOC_PTR, lot.INVT_WHSE_LOC_PTR,
    lot.QUAN_ON_HAND, lot.EXPIRED_DATE, lot.PO_PTR, lot.RO_PTR
FROM DATA0020 lot
WHERE LTRIM(RTRIM(lot.BATCH_NO)) IN ('-354589-01-100', 'G011595160')
ORDER BY BatchNo, lot.RKEY;

-- How many lot rows per (part, batch) across the table? Anything
-- above 1 fans out any query joining on that pair alone.
SELECT TOP 20
    lot.INVENTORY_POINTER,
    LTRIM(RTRIM(lot.BATCH_NO)) AS BatchNo,
    COUNT(*) AS lot_rows
FROM DATA0020 lot
GROUP BY lot.INVENTORY_POINTER, LTRIM(RTRIM(lot.BATCH_NO))
HAVING COUNT(*) > 1
ORDER BY lot_rows DESC;


/* -------------------------------------------------------------
   E. WHY THE PO IS NULL
   ------------------------------------------------------------- */
-- Does DATA0070 even hold that key?
SELECT * FROM DATA0070 WHERE RKEY = 174187;

-- What the old Material Certs query joined successfully, for
-- contrast: pick any lot of this part that DOES resolve to a PO.
SELECT TOP 10
    lot.RKEY, LTRIM(RTRIM(lot.BATCH_NO)) AS BatchNo, lot.PO_PTR, lot.RO_PTR,
    LTRIM(RTRIM(po.PO_NUMBER)) AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME)) AS SupplierName
FROM DATA0020 lot
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
WHERE lot.INVENTORY_POINTER = 10859
ORDER BY lot.RKEY DESC;

-- The report column is "RO/P.O. NUMBER", so a repair order is the
-- other possibility. What does RO_PTR resolve against?
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%RO_NUMBER%' OR COLUMN_NAME LIKE '%PO_NUMBER%')
ORDER BY TABLE_NAME, COLUMN_NAME;


/* -------------------------------------------------------------
   F. WHY THE RECURSION STOPPED
   -------------------------------------------------------------
   The report has a section for -354590-02-100, so issues for it
   must exist somewhere. Find them, and find how TRAN_SOURCE spells
   that work order.
   ------------------------------------------------------------- */
SELECT
    LTRIM(RTRIM(TRAN_SOURCE)) AS TranSource,
    LTRIM(RTRIM(TRAN_TYPE))   AS TranType,
    COUNT(*)                  AS rows_found
FROM DATA0153
WHERE LTRIM(RTRIM(TRAN_SOURCE)) LIKE '%354590%'
   OR LTRIM(RTRIM(TRAN_SOURCE)) LIKE '%340281%'
   OR LTRIM(RTRIM(TRAN_SOURCE)) LIKE '%354589%'
   OR LTRIM(RTRIM(TRAN_SOURCE)) LIKE '%359164%'
GROUP BY LTRIM(RTRIM(TRAN_SOURCE)), LTRIM(RTRIM(TRAN_TYPE))
ORDER BY TranSource;

-- The CU FOIL and COVERLAY lines the report shows under
-- -354590-02-100. If these come back with a TRAN_SOURCE we are not
-- matching, that spelling is the fix.
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
   G. THE QUERY WITH THE FAN-OUT FIXED
   -------------------------------------------------------------
   OUTER APPLY ... TOP 1 collapses the lot to a single row instead
   of multiplying. Preferring a lot row whose location matches the
   issue's LOC_PTR, then one that actually carries a PO, then any.

   Recursion and PO are still open (sections E and F), so treat the
   output as a fan-out test only: lot -354589-01-100 should now
   appear ONCE per source, giving 24 rows rather than 30.
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
    LTRIM(RTRIM(po.PO_NUMBER))             AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME))       AS SupplierName,
    lot.EXPIRED_DATE                       AS ExpDate
FROM Issues i
LEFT JOIN DATA0017 d17 ON d17.RKEY = i.DATA0017_PTR
OUTER APPLY (
    -- ONE lot row, never several. DATA0020 keeps a row per
    -- warehouse location, so an unqualified join multiplies every
    -- issue by however many locations have held that lot.
    SELECT TOP 1 l.*
    FROM DATA0020 l
    WHERE l.INVENTORY_POINTER = i.DATA0017_PTR
      AND LTRIM(RTRIM(l.BATCH_NO)) COLLATE DATABASE_DEFAULT = i.BatchSerial
    ORDER BY
        CASE WHEN l.INV_WHOUSE_LOC_PTR = i.LOC_PTR THEN 0 ELSE 1 END,
        CASE WHEN l.PO_PTR > 0 THEN 0 ELSE 1 END,
        l.RKEY
) lot
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
ORDER BY i.Lvl, i.TranSource, InventoryPart
OPTION (MAXRECURSION 32);
