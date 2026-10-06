/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 11
   The chain is proven. Now: recurse, or use Paradigm's own views.

   Z3 WORKED. THE CHAIN IS:

       DATA0006   work order
         -> DATA0067   WO BOM line   (WO_PTR, INVT_PTR, QUAN_BOM,
                                      QUAN_ISSUED, ROUTE_STEP_NO,
                                      LAYUP_SEQ_NO)
            -> DATA0095   transaction, SRCE_PTR = DATA0067.RKEY,
                          TRAN_TP 13 = issued to work order
               -> DATA0020   the LOT   (t.INVT_LOC_PTR)
               -> DATA0017   the PART  (t.INVT_PTR)

   TRAN_TP 13 holds 3,132,617 rows from 2006-12-27 to today, with
   SRCE_PTR 1..4,330,077 against DATA0067's max RKEY of 4,331,572.
   Twenty years of history where DATA0153 had one month.

   WHY -357152-01-100 CAME BACK WITH 4 ROWS, NOT 20

   Not a bug. DATA0067 has exactly 4 BOM lines for WO 874002:

       P  PPGWI0010602824   20764507
       P  PPGWIM010802824   20552488
       M  S-76405-01/14     -352290-01-100
       M  S-76405-15/28     -351576-01-100

   The two M lots are work orders in their own right. The report's
   other 16 lines — the copper foil and the laminate — are the
   material issued to THOSE jobs. Same recursive shape as before,
   now on a table that actually holds history.

   TWO WAYS TO FINISH, AND THE SECOND IS PROBABLY BETTER

   A1 walks it ourselves. B1 uses Paradigm's own views, which the
   object list turned up:

       vw_wo_inv_part_issued_all
       vw_wo_inv_part_issued_one
       vw_wo_inv_part_issued_two
       vw_wo_inv_part_issued_sum
       vw_work_order_src / _detail
       UFN_GET_COMPS   (a table-valued function — "get components")

   "Work order inventory part issued" is this problem's name. If
   one of those returns the 20 lines, it is maintained by whoever
   owns the ERP and we should use it instead of a walk of my own
   invention. RUN SECTION B FIRST.

   A CORRECTION FROM ROUND 10

   I said we could read the view definitions. We cannot: DefLen
   came back NULL on all 299 rows, so sys.sql_modules lists the
   objects but m.definition is NULL — no VIEW DEFINITION right. We
   can still SELECT FROM the views, which is what matters here, but
   I was wrong in the reassuring direction and that is worth
   correcting.

   ONE THING TO SETTLE BEFORE TRUSTING ANY OF IT

   TRAN_TP 14 has 151,028 rows and its SRCE_PTR range (35 ..
   4,329,245) is also DATA0067's. If 14 is a RETURN or reversal of
   an issue, a query that counts only 13 overstates what was
   consumed, and one that counts both double-counts. Section C
   settles it.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   B1. PARADIGM'S OWN VIEWS — try these first
   -------------------------------------------------------------
   Shape first, one row each, so nothing enormous comes back.
   ------------------------------------------------------------- */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('vw_wo_inv_part_issued_all','vw_wo_inv_part_issued_one',
                     'vw_wo_inv_part_issued_two','vw_wo_inv_part_issued_sum',
                     'vw_work_order_src','vw_work_order_src_detail')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT TOP 3 * FROM vw_wo_inv_part_issued_all;
SELECT TOP 3 * FROM vw_wo_inv_part_issued_sum;
SELECT TOP 3 * FROM vw_work_order_src_detail;

-- The function that sounds like a BOM explosion
SELECT p.name AS ParamName, TYPE_NAME(p.user_type_id) AS DataType,
       p.max_length, p.is_output
FROM sys.parameters p
JOIN sys.objects o ON o.object_id = p.object_id
WHERE o.name = 'UFN_GET_COMPS'
ORDER BY p.parameter_id;


/* -------------------------------------------------------------
   B2. THE VIEWS, FOR THIS WORK ORDER
   -------------------------------------------------------------
   Once B1 shows the column names, filter. The guesses below cover
   the likely spellings; delete whichever do not compile rather
   than fighting them.

   The target is 20 lines matching the printed page.
   ------------------------------------------------------------- */
-- SELECT * FROM vw_wo_inv_part_issued_all
-- WHERE LTRIM(RTRIM(WORK_ORDER_NUMBER)) COLLATE DATABASE_DEFAULT = '-357152-01-100';

-- SELECT * FROM vw_wo_inv_part_issued_all WHERE WO_PTR = 874002;


/* -------------------------------------------------------------
   C1. WHAT IS TRAN_TP 14
   -------------------------------------------------------------
   Same SRCE_PTR space as 13. If it is a return, counting only 13
   overstates consumption and counting both double-counts. Either
   way the app must know which.
   ------------------------------------------------------------- */
SELECT TOP 30
    t.RKEY, t.TRAN_TP, t.SRCE_PTR, t.INVT_PTR, t.INVT_LOC_PTR,
    t.QUANTITY, t.QTY_RETURNED, t.TRAN_DATE,
    LTRIM(RTRIM(lot.BATCH_NO))        AS BatchSerial,
    LTRIM(RTRIM(d17.INV_PART_NUMBER)) AS InventoryPart,
    src.WO_PTR,
    LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) AS WorkOrder
FROM DATA0095 t
JOIN DATA0067 src ON src.RKEY  = t.SRCE_PTR
JOIN DATA0006 wo  ON wo.RKEY   = src.WO_PTR
LEFT JOIN DATA0020 lot ON lot.RKEY = t.INVT_LOC_PTR
LEFT JOIN DATA0017 d17 ON d17.RKEY = t.INVT_PTR
WHERE t.TRAN_TP = 14
ORDER BY t.TRAN_DATE DESC;

-- Do 13 and 14 ever pair up on the same DATA0067 line?
SELECT TOP 20 t.SRCE_PTR,
       SUM(CASE WHEN t.TRAN_TP = 13 THEN t.QUANTITY ELSE 0 END) AS qty_13,
       SUM(CASE WHEN t.TRAN_TP = 14 THEN t.QUANTITY ELSE 0 END) AS qty_14,
       COUNT(*) AS rows_found
FROM DATA0095 t
WHERE t.TRAN_TP IN (13, 14)
GROUP BY t.SRCE_PTR
HAVING SUM(CASE WHEN t.TRAN_TP = 14 THEN 1 ELSE 0 END) > 0
ORDER BY rows_found DESC;


/* -------------------------------------------------------------
   A1. THE FULL RECURSIVE WALK — our own version
   -------------------------------------------------------------
   Use this if B turns up nothing usable.

   Walks work order -> issued lots -> for each MADE lot, the work
   order that produced it -> its issued lots, and so on. The
   normalising rule is the one already in the app: strip a letter
   prefix (S0-, S1-, A1-, A5-) and a leading dash, then compare for
   equality. No wildcards.

   Expect the four purchased lines the printed page shows for this
   job plus everything from the two sub-assemblies: 20 in total.
   ------------------------------------------------------------- */
DECLARE @WorkOrder VARCHAR(40) = '-357152-01-100';
DECLARE @WoNorm    VARCHAR(40) = '357152-01-100';

;WITH WoNorm AS (
    SELECT
        wo.RKEY,
        CAST(UPPER(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER))) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS WoNum,
        CAST(CASE
               WHEN UPPER(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER))) LIKE '[A-Z][0-9]-%'
                   THEN SUBSTRING(UPPER(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER))), 4, 40)
               WHEN UPPER(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER))) LIKE '-%'
                   THEN SUBSTRING(UPPER(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER))), 2, 40)
               ELSE UPPER(LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)))
             END AS VARCHAR(40)) COLLATE DATABASE_DEFAULT AS Norm
    FROM DATA0006 wo
),
IssuedLot AS (
    SELECT
        src.WO_PTR, src.ROUTE_STEP_NO, src.LAYUP_SEQ_NO,
        t.INVT_PTR, t.INVT_LOC_PTR, t.QUANTITY, t.TRAN_DATE, t.RKEY AS TranRkey,
        CAST(UPPER(LTRIM(RTRIM(lot.BATCH_NO))) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS BatchSerial,
        CAST(CASE
               WHEN UPPER(LTRIM(RTRIM(lot.BATCH_NO))) LIKE '[A-Z][0-9]-%'
                   THEN SUBSTRING(UPPER(LTRIM(RTRIM(lot.BATCH_NO))), 4, 40)
               WHEN UPPER(LTRIM(RTRIM(lot.BATCH_NO))) LIKE '-%'
                   THEN SUBSTRING(UPPER(LTRIM(RTRIM(lot.BATCH_NO))), 2, 40)
               ELSE UPPER(LTRIM(RTRIM(lot.BATCH_NO)))
             END AS VARCHAR(40)) COLLATE DATABASE_DEFAULT AS BatchNorm
    FROM DATA0067 src
    JOIN DATA0095 t   ON t.SRCE_PTR = src.RKEY AND t.TRAN_TP = 13
    LEFT JOIN DATA0020 lot ON lot.RKEY = t.INVT_LOC_PTR
),
Walk AS (
    SELECT w.RKEY AS WoRkey, w.WoNum, CAST(0 AS INT) AS Lvl,
           CAST('|' + w.Norm + '|' AS VARCHAR(4000))
               COLLATE DATABASE_DEFAULT AS Visited
    FROM WoNorm w
    WHERE w.Norm = @WoNorm

    UNION ALL

    SELECT w2.RKEY, w2.WoNum, p.Lvl + 1,
           CAST(p.Visited + w2.Norm + '|' AS VARCHAR(4000))
               COLLATE DATABASE_DEFAULT
    FROM Walk p
    JOIN IssuedLot il ON il.WO_PTR = p.WoRkey
    JOIN WoNorm   w2  ON w2.Norm   = il.BatchNorm
    WHERE p.Lvl < 8
      -- only a work-order-style lot can have a job behind it
      AND il.BatchSerial LIKE '-%'
      AND p.Visited NOT LIKE '%|' + w2.Norm + '|%'
)
SELECT DISTINCT
    p.Lvl,
    p.WoNum                                AS IssuedToWorkOrder,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    d17.P_M                                AS PurchasedOrMade,
    il.BatchSerial,
    il.QUANTITY,
    il.TRAN_DATE,
    lot.PO_PTR,
    lot.EXPIRED_DATE,
    LTRIM(RTRIM(loc.CODE))                 AS LocationCode,
    LTRIM(RTRIM(loc.LOCATION))             AS LocationName
FROM Walk p
JOIN IssuedLot il ON il.WO_PTR = p.WoRkey
LEFT JOIN DATA0020 lot ON lot.RKEY = il.INVT_LOC_PTR
LEFT JOIN DATA0017 d17 ON d17.RKEY = il.INVT_PTR
LEFT JOIN DATA0016 loc ON loc.RKEY = lot.INV_WHOUSE_LOC_PTR
ORDER BY p.Lvl, IssuedToWorkOrder, InventoryPart
OPTION (MAXRECURSION 32);


/* -------------------------------------------------------------
   A2. THE SAME, PURCHASED LEAVES ONLY (concise)
   -------------------------------------------------------------
   What the printed page actually shows. If this returns 20 rows
   matching it line for line, we are done.
   ------------------------------------------------------------- */
-- Same query as A1 with:  AND d17.P_M = 'P'  on the final SELECT.
