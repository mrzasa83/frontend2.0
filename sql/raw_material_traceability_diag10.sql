/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 10
   DATA0095 is the table. One hop left.

   THE BREAKTHROUGH

   DATA0095 is the persistent inventory transaction table:
   5,143,604 rows reaching back to at least 2012, where DATA0153
   holds one month. Your data proves the joins outright — six of
   six, no exceptions:

       DATA0095.INVT_LOC_PTR  ->  DATA0020.RKEY    (the LOT)
       DATA0095.INVT_PTR      ->  DATA0017.RKEY    (the PART)

   e.g. INVT_LOC_PTR 832949 is lot 20558610, and its INVT_PTR
   111382 is exactly that lot's DATA0020.INVENTORY_POINTER. Same
   for 834127 / 50229495, 733670 / 11130555, 733671, 825666.

   This is the BATCH/SERIAL source we have been hunting since round
   4, and it covers history rather than a one-month window.

   TWO TRANSACTION TYPES ARE VISIBLE

       TRAN_TP  7   REC_BY = 0, large quantities (400, 222, 130,
                    50), SRCE_PTR around 313,000-316,000.
                    Looks like RECEIPTS.
       TRAN_TP 13   REC_BY = TRAN_BY, smaller quantities,
                    SRCE_PTR around 3,300,000-4,260,000.
                    Looks like ISSUES.

   THE ONE HOP LEFT: WHAT IS SRCE_PTR

   For TRAN_TP 13 it must reach a work order. DATA0067 is the
   leading candidate — it HAS a WO_PTR column, and both work-order
   sweeps hit it (8 rows for 874002/874003, 106 for the parent
   865342). Its 4,235,109 rows sit right in the SRCE_PTR range;
   a row count is a lower bound on max RKEY, not an upper one, so
   the range fits comfortably.

   WHAT ROUND 9 ALSO RULED OUT, PROPERLY

   DATA0048 is finished: every row for WO 874002 has
   PART_BATCH_PTR = 0. It is route-step production reporting
   (TPUT_PTR, WORK_CENTER_PTR, QTY_PROD), nothing to do with
   material. Eliminated on evidence, not on absence of hits.

   And DATA0095.SRCE_PTR is NOT a work-order pointer in general:
   the two rows at SRCE_PTR 874002/874003 are dated 2012 with 2012
   inventory pointers, so those were range collisions, not our work
   order. SRCE_PTR means different things per TRAN_TP.

   AND WE CAN READ THE VIEWS AFTER ALL

   299 modules are readable (201 views, 31 procedures). Round 8
   warned an empty result would mean "no permission"; it does not —
   we have the permission. Section Z4 asks for the list properly,
   because a view named for this report would hand us the finished
   SQL.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   Z1. WHAT DOES SRCE_PTR POINT AT
   -------------------------------------------------------------
   Take real SRCE_PTR values off the rows that touch THIS report's
   lots and see which table owns them. DATA0067 first.
   ------------------------------------------------------------- */
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0067'
ORDER BY ORDINAL_POSITION;

SELECT COUNT(*) AS total_rows, MIN(RKEY) AS min_rkey, MAX(RKEY) AS max_rkey
FROM DATA0067;

-- Issue-side SRCE_PTRs seen on this report's lots
SELECT * FROM DATA0067
WHERE RKEY IN (4258634, 4184770, 4176122, 4174559, 4131080,
               4105341, 4079584, 4057200, 4055556, 3963340);

-- Receipt-side SRCE_PTRs (TRAN_TP 7). DATA0022 is the size match.
SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0022' ORDER BY ORDINAL_POSITION;

SELECT * FROM DATA0022
WHERE RKEY IN (313247, 313754, 314378, 314380, 316246);


/* -------------------------------------------------------------
   Z2. DATA0067 FOR THIS WORK ORDER
   -------------------------------------------------------------
   If DATA0067 is the issue header keyed by work order, these rows
   are the job's material transactions and their RKEYs should be
   the SRCE_PTRs in DATA0095.
   ------------------------------------------------------------- */
SELECT TOP 100 * FROM DATA0067 WHERE WO_PTR IN (874002, 874003)
ORDER BY RKEY;


/* -------------------------------------------------------------
   Z3. THE CANDIDATE REPORT — the whole chain in one query
   -------------------------------------------------------------
   work order -> DATA0067 -> DATA0095 -> DATA0020 (lot)
                                      -> DATA0017 (part)

   If DATA0067.RKEY really is DATA0095.SRCE_PTR for issues, this
   returns the material actually issued to -357152-01-100, with
   lot numbers, and the whole problem is solved. Compare the lot
   list against the printed page: 11130555, 50229495, 2509410039,
   20604707, 20558610, 20764507, 20552981, 20483617, 20552488,
   20467496, 20469990, 20467494, 20467357.

   If Z1 shows SRCE_PTR belongs to some other table, swap DATA0067
   for that one here — the shape of the query does not change.
   ------------------------------------------------------------- */
SELECT
    LTRIM(RTRIM(wo.WORK_ORDER_NUMBER))     AS WorkOrder,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    d17.P_M                                AS PurchasedOrMade,
    LTRIM(RTRIM(lot.BATCH_NO))             AS BatchSerial,
    t.TRAN_TP,
    t.QUANTITY,
    t.TRAN_DATE,
    lot.PO_PTR,
    lot.EXPIRED_DATE,
    LTRIM(RTRIM(loc.CODE))                 AS LocationCode,
    LTRIM(RTRIM(loc.LOCATION))             AS LocationName
FROM DATA0067 src
JOIN DATA0006 wo  ON wo.RKEY  = src.WO_PTR
JOIN DATA0095 t   ON t.SRCE_PTR = src.RKEY
LEFT JOIN DATA0020 lot ON lot.RKEY = t.INVT_LOC_PTR
LEFT JOIN DATA0017 d17 ON d17.RKEY = t.INVT_PTR
LEFT JOIN DATA0016 loc ON loc.RKEY = t.INVT_LOC_PTR
WHERE src.WO_PTR IN (874002, 874003)
ORDER BY WorkOrder, InventoryPart, t.TRAN_DATE;


/* -------------------------------------------------------------
   Z3b. THE SAME QUESTION FROM THE OTHER END
   -------------------------------------------------------------
   Belt and braces, in case Z3's join is wrong. Start from the
   lots the report prints, walk BACK through DATA0095, and see
   which work order they land on. If this names -357152-01-100,
   the chain is confirmed from both directions.
   ------------------------------------------------------------- */
SELECT TOP 200
    t.RKEY, t.TRAN_TP, t.SRCE_PTR, t.QUANTITY, t.TRAN_DATE,
    LTRIM(RTRIM(lot.BATCH_NO))        AS BatchSerial,
    LTRIM(RTRIM(d17.INV_PART_NUMBER)) AS InventoryPart,
    src.WO_PTR,
    LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) AS WorkOrder
FROM DATA0095 t
LEFT JOIN DATA0020 lot ON lot.RKEY = t.INVT_LOC_PTR
LEFT JOIN DATA0017 d17 ON d17.RKEY = t.INVT_PTR
LEFT JOIN DATA0067 src ON src.RKEY = t.SRCE_PTR
LEFT JOIN DATA0006 wo  ON wo.RKEY  = src.WO_PTR
WHERE LTRIM(RTRIM(lot.BATCH_NO)) COLLATE DATABASE_DEFAULT
      IN ('11130555','50229495','2509410039','20604707','20558610',
          '20764507','20552981','20483617','20552488','20467496',
          '20469990','20467494','20467357')
  AND t.TRAN_TP = 13
ORDER BY t.TRAN_DATE DESC;


/* -------------------------------------------------------------
   Z4. THE VIEWS — we CAN read them
   -------------------------------------------------------------
   299 modules readable. Keep the output small: names only, no
   definitions, so nothing gets truncated or lost on the way back.
   ------------------------------------------------------------- */
SELECT o.name AS ObjectName, o.type_desc, LEN(m.definition) AS DefLen
FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
ORDER BY o.name;

-- Then read whichever one looks right:
-- SELECT m.definition FROM sys.sql_modules m
-- JOIN sys.objects o ON o.object_id = m.object_id
-- WHERE o.name = '<name>';


/* -------------------------------------------------------------
   Z5. WHAT THE TRAN_TP CODES MEAN
   -------------------------------------------------------------
   Worth knowing before we filter on 13: if issues are split across
   several codes, filtering on one would quietly drop material.
   ------------------------------------------------------------- */
SELECT TRAN_TP, COUNT(*) AS rows_found,
       MIN(TRAN_DATE) AS oldest, MAX(TRAN_DATE) AS newest,
       MIN(SRCE_PTR)  AS min_srce, MAX(SRCE_PTR) AS max_srce
FROM DATA0095
GROUP BY TRAN_TP
ORDER BY rows_found DESC;

-- And how far back the table really goes
SELECT YEAR(TRAN_DATE) AS yr, COUNT(*) AS rows_in_year
FROM DATA0095
GROUP BY YEAR(TRAN_DATE)
ORDER BY yr;
