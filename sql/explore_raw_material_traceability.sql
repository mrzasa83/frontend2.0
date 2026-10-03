/* =============================================================
   TARGET: MSSQL  (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — discovery queries for PDMLIV
   Test work order: -354516-01-000

   PURPOSE
     Work out which Paradigm tables back the "Raw Material
     Traceability / Work Order -> Raw Material" report, so the
     Material Certs page can reproduce it with switches for
     Include Sub Levels and Concise Output.

   WHAT THE REPORT TELLS US ABOUT THE DATA MODEL
     Read the non-concise output carefully and the shape falls out.

     Each section header is a WORK ORDER, and under it are the
     materials ISSUED to that work order:

       -354516-01-000                                    <- section = work order
       C-72623-01/00  COMPOSITE  NASKT N ASSY KIT  -354590-02-100  9/17/2026 PART 205.000
       P-72623-PSA1   PSA        NBW22 N HARDWARE  -340281-01-100  9/17/2026 PART  27.134

     The BATCH/SERIAL on those lines is itself a work order
     number (-354590-02-100). So a manufactured lot is identified
     by the work order that produced it, and "Include Sub Levels"
     means: for every issued lot that came from a work order,
     recurse into THAT work order's issues. The recursion runs
     through work orders, not through the BOM.

     Purchased lots instead carry a supplier batch (G011595160,
     5508-0104, 4WA5N.1) and have a PO, supplier, expiry and
     country of origin.

     So there are two things to find:
       (a) an ISSUE/transaction table:  work order, inventory part,
           location, batch/serial, issue date, unit, qty issued
       (b) a LOT/batch master:          batch no, expiry, PO ptr,
           country of origin          -- DATA0020 is the candidate

     CONCISE output is then the purchased leaves only, deduped on
     (inventory part, PO, supplier, location, batch/serial, expiry,
     C of O) — note it drops issue date and qty, which is exactly
     what makes two issues of the same lot collapse to one line.

   HOW TO USE THIS FILE
     RUN ONE SECTION AT A TIME — highlight a section and execute.
     Sections are separated by the ==== banners.

     There are deliberately no GO separators: GO is understood by
     SSMS and sqlcmd only, and a GUI client sends it to the server
     verbatim, which fails with "Incorrect syntax near 'GO'".
     Without GO the whole file is one batch, so running it top to
     bottom would also return several result sets at once and, in
     section 3, re-declare a cursor that is already open.

     Send back the results of 1-4; that is enough to write the
     real query. Everything here is read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   0. WHAT THE APP ALREADY RUNS TODAY
   -------------------------------------------------------------
   This is the live query behind Operations > Inspections >
   Material Certs (app/api/operations/inspections/material-certs
   /route.ts). Run it for the test work order and compare its
   output to the concise report.

   EXPECT A MISMATCH, and it is worth understanding before
   building anything new. The lot join is:

       JOIN DATA0020 lot ON lot.INVENTORY_POINTER = d17.RKEY

   which attaches EVERY lot ever received for that part number,
   with no reference to the work order at all. The work order is
   used only to pick which parts are on the BOM. So this returns
   "all lots of every purchased part that appears on this BOM",
   where the report returns "the lots actually issued to this work
   order". For a part bought repeatedly, the app currently shows
   lots that never went near the job.
   ------------------------------------------------------------- */
;WITH BomCTE AS (
    SELECT d26.INVENTORY_PTR AS component_rkey, d26.QTY_BOM, 1 AS level
    FROM DATA0006 wo
    JOIN DATA0025 d25 ON d25.RKEY = wo.BOM_PTR
    JOIN DATA0026 d26 ON d26.PARENT_NODE_INVENT = d25.RKEY
    WHERE wo.WORK_ORDER_NUMBER LIKE '%-354516-01-000%'
    UNION ALL
    SELECT d26.INVENTORY_PTR, d26.QTY_BOM, c.level + 1
    FROM BomCTE c
    JOIN DATA0025 d25 ON d25.INVENTORY_PTR = c.component_rkey
    JOIN DATA0026 d26 ON d26.PARENT_NODE_INVENT = d25.RKEY
    JOIN DATA0017 d17 ON d17.RKEY = c.component_rkey
    WHERE d17.P_M = 'M'
)
SELECT DISTINCT
    d17.INV_PART_NUMBER AS PurchasedPart,
    d17.INV_PART_DESCRIPTION AS Description,
    lot.BATCH_NO AS BatchSerial,
    lot.EXPIRED_DATE AS ExpDate,
    po.PO_NUMBER AS PONumber,
    supp.SUPPLIER_NAME AS SupplierName
FROM BomCTE c
JOIN DATA0017 d17 ON d17.RKEY = c.component_rkey
JOIN DATA0020 lot ON lot.INVENTORY_POINTER = d17.RKEY
JOIN DATA0070 po  ON po.RKEY = lot.PO_PTR
JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
WHERE d17.P_M = 'P'
ORDER BY d17.INV_PART_NUMBER;
/* -------------------------------------------------------------
   1. WHAT IS ACTUALLY IN THE LOT TABLE
   -------------------------------------------------------------
   Confirm DATA0020 is the batch master and see whether it carries
   a work-order reference, a location, and a country of origin. If
   it has a WO column, the issue table may not even be needed for
   the concise view.
   ------------------------------------------------------------- */
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0020'
ORDER BY ORDINAL_POSITION;
-- The two batch values from the report: one purchased, one that is
-- a work order number. Seeing both in the same table confirms that
-- manufactured and purchased lots live together.
SELECT TOP 20 *
FROM DATA0020
WHERE LTRIM(RTRIM(BATCH_NO)) IN ('G011595160', '5508-0104', '-354590-02-100');
/* -------------------------------------------------------------
   2. FIND THE ISSUE / TRANSACTION TABLE
   -------------------------------------------------------------
   Any table carrying BOTH a work-order-ish column and a
   batch/lot-ish column is a strong candidate. Paradigm's live
   transaction tables are in the DATA9xxx range (DATA9469 backs
   the production-transaction screen), so those are worth a look
   as well as the DATA0xxx range.
   ------------------------------------------------------------- */
SELECT
    c.TABLE_NAME,
    COUNT(*) AS matching_columns,
    MAX(CASE WHEN c.COLUMN_NAME LIKE '%WORK_ORDER%' THEN c.COLUMN_NAME END) AS wo_col,
    MAX(CASE WHEN c.COLUMN_NAME LIKE '%BATCH%'
              OR c.COLUMN_NAME LIKE '%LOT%'
              OR c.COLUMN_NAME LIKE '%SERIAL%' THEN c.COLUMN_NAME END) AS batch_col,
    MAX(CASE WHEN c.COLUMN_NAME LIKE '%QTY%'
              OR c.COLUMN_NAME LIKE '%QUAN%' THEN c.COLUMN_NAME END) AS qty_col,
    MAX(CASE WHEN c.COLUMN_NAME LIKE '%ISSUE%' THEN c.COLUMN_NAME END) AS issue_col,
    MAX(CASE WHEN c.COLUMN_NAME LIKE '%LOCATION%'
              OR c.COLUMN_NAME LIKE '%WAREHOUSE%'
              OR c.COLUMN_NAME LIKE '%BIN%' THEN c.COLUMN_NAME END) AS loc_col
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND (c.COLUMN_NAME LIKE '%WORK_ORDER%'
    OR c.COLUMN_NAME LIKE '%BATCH%'
    OR c.COLUMN_NAME LIKE '%LOT%'
    OR c.COLUMN_NAME LIKE '%SERIAL%'
    OR c.COLUMN_NAME LIKE '%ISSUE%')
GROUP BY c.TABLE_NAME
HAVING MAX(CASE WHEN c.COLUMN_NAME LIKE '%WORK_ORDER%' THEN 1 ELSE 0 END) = 1
   AND MAX(CASE WHEN c.COLUMN_NAME LIKE '%BATCH%'
                 OR c.COLUMN_NAME LIKE '%LOT%'
                 OR c.COLUMN_NAME LIKE '%SERIAL%' THEN 1 ELSE 0 END) = 1
ORDER BY matching_columns DESC, c.TABLE_NAME;
-- Widen the net: anything with an ISSUE-flavoured column at all.
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%ISSUE%' OR COLUMN_NAME LIKE '%ISSUED%')
ORDER BY TABLE_NAME, COLUMN_NAME;
/* -------------------------------------------------------------
   3. FIND WHICH TABLES MENTION THE TEST WORK ORDER
   -------------------------------------------------------------
   The blunt but decisive approach: look for the work order number
   in every character column of every DATA table, and for the known
   batch numbers. Whatever comes back IS the issue table.

   This is a cursor over a lot of tables, so run it off-hours and
   expect it to take a while. It only ever SELECTs.
   ------------------------------------------------------------- */
IF OBJECT_ID('tempdb..#hits') IS NOT NULL DROP TABLE #hits;
CREATE TABLE #hits (table_name SYSNAME, column_name SYSNAME, hits INT, sample NVARCHAR(200));

-- Clean up a cursor left open by a previous aborted run.
IF CURSOR_STATUS('global','cur') >= -1 BEGIN CLOSE cur; DEALLOCATE cur; END

DECLARE @t SYSNAME, @c SYSNAME, @sql NVARCHAR(MAX);
DECLARE cur CURSOR FAST_FORWARD FOR
    SELECT c.TABLE_NAME, c.COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS c
    JOIN INFORMATION_SCHEMA.TABLES t
      ON t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
    WHERE c.TABLE_NAME LIKE 'DATA%'
      AND c.DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar')
      AND c.CHARACTER_MAXIMUM_LENGTH BETWEEN 8 AND 60;

OPEN cur;
FETCH NEXT FROM cur INTO @t, @c;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'
      INSERT INTO #hits (table_name, column_name, hits, sample)
      SELECT ''' + @t + ''', ''' + @c + ''', COUNT(*), MIN(CAST(' + QUOTENAME(@c) + ' AS NVARCHAR(200)))
      FROM ' + QUOTENAME(@t) + ' WITH (NOLOCK)
      WHERE LTRIM(RTRIM(' + QUOTENAME(@c) + ')) IN
            (''-354516-01-000'', ''-354590-02-100'', ''G011595160'', ''5508-0104'')
      HAVING COUNT(*) > 0;';
    BEGIN TRY EXEC sp_executesql @sql; END TRY BEGIN CATCH END CATCH;
    FETCH NEXT FROM cur INTO @t, @c;
END
CLOSE cur; DEALLOCATE cur;

SELECT * FROM #hits ORDER BY table_name, column_name;
/* -------------------------------------------------------------
   4. SANITY-CHECK THE WORK ORDER HEADER
   -------------------------------------------------------------
   Confirms the WO exists, and gives the customer/part/warehouse
   shown in the report header. Note WORK_ORDER_NUMBER is stored
   with leading spaces, hence the LTRIM/RTRIM.
   ------------------------------------------------------------- */
SELECT TOP 5
    wo.RKEY,
    LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) AS WorkOrder,
    wo.BOM_PTR,
    wo.PROD_RTE_PTR
FROM DATA0006 wo
WHERE LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) = '-354516-01-000';
