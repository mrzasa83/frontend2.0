/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 3
   Test work order: -354516-01-000

   DATA0153 IS CONFIRMED AS THE MATERIAL-ISSUE LEDGER.
   Its columns, from your round-2 output:

     RKEY             PART_NUMBER      TDATE            DESCRIPTION
     TRAN_TYPE        TRAN_SOURCE      BATCH_SERIAL_NO  QUANTITY
     WHSE_PTR         LOC_PTR          UNIT_PTR         TRAN_NO
     PCODE_PTR        STD_COST         EMPL_PTR         SOURCE_LOC_PTR
     DATA0017_PTR     DATA0095_PTR     DATA0022_PTR

   Corrections and findings since round 2:

   * The inventory join is DATA0017_PTR, not INVENTORY_PTR. That
     was my guess in section 7 and it was wrong; hence the
     "Invalid column name" error.

   * TRAN_TYPE = 'Stock To Work Order' on all four rows, so that
     string is the issue filter.

   * LOC_PTR maps cleanly onto the report's LOCATION column:
         286  -> NASKT N ASSY KIT
         3490 -> NBW22 N HARDWARE
         3491 -> NBW23 N HARDWARE
     and WHSE_PTR = 1 is WHSE1, the report's header warehouse.

   * TDATE matches the report's ISSUE DATE (9/17, 9/21).

   * TWO THINGS DO NOT YET MATCH, and both are handled below.

     (a) QUANTITY is consistently 1.7561x the report's QTY ISSUED:
             360.000000 / 205.000 = 1.756098
              47.650563 /  27.134 = 1.756120
             714.758438 / 407.015 = 1.756099
             762.409000 / 434.150 = 1.756096
         A constant to six figures across four different parts and
         quantities is a unit conversion, not rounding. Section 14
         goes looking for where that factor lives. Do NOT ship a
         quantity column until this is explained — an issue
         quantity that is wrong by 75% is worse than no quantity.

     (b) The report's first section has FIVE lines; DATA0153
         returned FOUR. The missing one is the last:
             P-72623-PSA1 ... -354589-01-100 ... ( 407.015)
         printed in parentheses, i.e. NEGATIVE — a reversal of the
         line above it. Section 13 finds it. It matters: if the
         reversal is excluded, the report shows material as
         consumed that was actually returned to stock.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   12. THE CORRECTED JOIN  (replaces the broken section 7)
   ------------------------------------------------------------- */
SELECT
    t.RKEY,
    LTRIM(RTRIM(t.PART_NUMBER))     AS PartNumber,
    LTRIM(RTRIM(t.DESCRIPTION))     AS Description,
    LTRIM(RTRIM(t.TRAN_TYPE))       AS TranType,
    LTRIM(RTRIM(t.TRAN_SOURCE))     AS WorkOrder,
    LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS BatchSerial,
    t.QUANTITY,
    t.TDATE                         AS IssueDate,
    t.WHSE_PTR, t.LOC_PTR, t.UNIT_PTR,
    d17.INV_PART_NUMBER,
    d17.P_M                         AS PurchasedOrMade
FROM DATA0153 t
LEFT JOIN DATA0017 d17 ON d17.RKEY = t.DATA0017_PTR
WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) = '-354516-01-000'
ORDER BY t.TDATE;


/* -------------------------------------------------------------
   13. FIND THE REVERSAL  (the missing fifth line)
   -------------------------------------------------------------
   Every transaction against that lot, whatever its type or
   source. One of these should be the negative 407.015.
   ------------------------------------------------------------- */
SELECT
    RKEY, LTRIM(RTRIM(PART_NUMBER)) AS PartNumber,
    LTRIM(RTRIM(TRAN_TYPE))   AS TranType,
    LTRIM(RTRIM(TRAN_SOURCE)) AS TranSource,
    LTRIM(RTRIM(BATCH_SERIAL_NO)) AS BatchSerial,
    QUANTITY, TDATE, LOC_PTR
FROM DATA0153
WHERE LTRIM(RTRIM(BATCH_SERIAL_NO)) = '-354589-01-100'
ORDER BY TDATE;

-- What transaction types exist at all, and which carry negatives?
SELECT
    LTRIM(RTRIM(TRAN_TYPE)) AS TranType,
    COUNT(*)                AS rows_total,
    SUM(CASE WHEN QUANTITY < 0 THEN 1 ELSE 0 END) AS negative_rows
FROM DATA0153
GROUP BY LTRIM(RTRIM(TRAN_TYPE))
ORDER BY rows_total DESC;


/* -------------------------------------------------------------
   14. EXPLAIN THE 1.7561 QUANTITY FACTOR
   -------------------------------------------------------------
   Candidates, in order of likelihood:
     - a unit-of-measure conversion hanging off UNIT_PTR
     - a conversion factor on the inventory part itself
       (parts per panel, sq ft per sheet, and the like)
   The report's UNIT column prints 'PART', so the stored quantity
   is probably in a stocking unit and the report converts.
   ------------------------------------------------------------- */
-- Where does UNIT_PTR point? Look for a units/UOM table.
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%UNIT%' OR COLUMN_NAME LIKE '%UOM%'
    OR COLUMN_NAME LIKE '%CONV%' OR COLUMN_NAME LIKE '%FACTOR%')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Anything on the inventory record that looks like a conversion?
-- 38918 = C-72623-01/00 (COMPOSITE), 38913 = P-72623-PSA1 (PSA).
SELECT * FROM DATA0017 WHERE RKEY IN (38918, 38913);


/* -------------------------------------------------------------
   15. RESOLVE LOCATION AND WAREHOUSE
   -------------------------------------------------------------
   LOC_PTR 286 / 3490 / 3491 should resolve to
   'NASKT N ASSY KIT' / 'NBW22 N HARDWARE' / 'NBW23 N HARDWARE'.
   Find the table whose RKEYs match.
   ------------------------------------------------------------- */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%LOC_CODE%' OR COLUMN_NAME LIKE '%LOCATION_CODE%'
    OR COLUMN_NAME LIKE '%LOC_DESC%'  OR COLUMN_NAME LIKE '%WHSE%')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- DATA0095 is referenced directly by DATA0153.DATA0095_PTR and was
-- flagged in round 1 for holding the work order in REFERENCE_NUMBER.
-- It may be the lot-at-location record that ties everything together.
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0095'
ORDER BY ORDINAL_POSITION;

SELECT * FROM DATA0095 WHERE RKEY IN (5234608, 5234609, 5234610, 5236949);


/* -------------------------------------------------------------
   16. DRAFT OF THE REAL QUERY — RECURSIVE, NON-CONCISE
   -------------------------------------------------------------
   This is the shape the Material Certs page needs. It walks work
   orders, not the BOM: every issued batch that is itself a work
   order becomes the next level down.

   @IncludeSubLevels = 0 stops at the top work order, matching the
   dialog's unticked state.

   Quantity is deliberately returned RAW, named QuantityRaw, until
   section 14 explains the 1.7561 factor. Location and C of O are
   left out for the same reason — better a column that is absent
   than one that is quietly wrong on a cert package.
   ------------------------------------------------------------- */
DECLARE @WorkOrder  VARCHAR(40) = '-354516-01-000';
DECLARE @IncludeSub BIT = 1;

;WITH Issues AS (
    -- Level 0: what was issued to the work order itself
    SELECT
        CAST(LTRIM(RTRIM(t.TRAN_SOURCE)) AS VARCHAR(40)) AS WorkOrder,
        LTRIM(RTRIM(t.BATCH_SERIAL_NO))                  AS BatchSerial,
        t.DATA0017_PTR,
        t.QUANTITY, t.TDATE, t.LOC_PTR, t.UNIT_PTR, t.RKEY,
        0 AS Lvl,
        CAST('|' + LTRIM(RTRIM(t.TRAN_SOURCE)) + '|' AS VARCHAR(4000)) AS Visited
    FROM DATA0153 t
    WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) = @WorkOrder
      AND LTRIM(RTRIM(t.TRAN_TYPE)) = 'Stock To Work Order'

    UNION ALL

    -- Deeper: an issued batch that is itself a work order has its
    -- own issues. The Visited guard stops a cycle from recursing
    -- for ever if a lot ever references its own parent.
    SELECT
        CAST(LTRIM(RTRIM(t.TRAN_SOURCE)) AS VARCHAR(40)),
        LTRIM(RTRIM(t.BATCH_SERIAL_NO)),
        t.DATA0017_PTR,
        t.QUANTITY, t.TDATE, t.LOC_PTR, t.UNIT_PTR, t.RKEY,
        i.Lvl + 1,
        CAST(i.Visited + LTRIM(RTRIM(t.TRAN_SOURCE)) + '|' AS VARCHAR(4000))
    FROM Issues i
    JOIN DATA0153 t
      ON LTRIM(RTRIM(t.TRAN_SOURCE)) COLLATE DATABASE_DEFAULT
       = i.BatchSerial COLLATE DATABASE_DEFAULT
    WHERE @IncludeSub = 1
      AND i.Lvl < 10
      AND LTRIM(RTRIM(t.TRAN_TYPE)) = 'Stock To Work Order'
      AND i.Visited NOT LIKE '%|' + LTRIM(RTRIM(t.TRAN_SOURCE)) + '|%'
)
SELECT
    i.Lvl,
    i.WorkOrder,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    d17.P_M                                AS PurchasedOrMade,
    i.BatchSerial,
    i.QUANTITY                             AS QuantityRaw,
    i.TDATE                                AS IssueDate,
    -- Purchased lots only: DATA0020 carries the PO and expiry.
    -- A manufactured lot has PO_PTR = 0 and simply misses here.
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
ORDER BY i.Lvl, i.WorkOrder, InventoryPart
OPTION (MAXRECURSION 32);
