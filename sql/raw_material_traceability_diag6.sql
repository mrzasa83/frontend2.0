/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 6
   Two questions left. Both now narrow.

   ROUND 5 CLOSED THREE THINGS

   1. DATA0070 IS NOT THE PO TABLE. Conclusively, by arithmetic
      rather than by a failed join:

          DATA0070   141,509 rows, RKEY 1 .. 143,116
          PO_PTR     148,420 .. 176,498 on real lots

      Every pointer is past the END of the table. Not one could
      ever resolve. PONumber was never going to be anything but
      NULL, for any lot, in any of the four rounds we spent on it.

   2. THE LOOKUPS RESOLVED, and are now in the app:
          DATA0016   LOC_PTR -> code + name. Verified: 286 NASKT
                     N ASSY KIT, 3490 NBW22 N HARDWARE, 439 NPP01
                     PPG PREP.
          DATA0015   WHSE_PTR 1 -> WHSE1 NASHUA - APC WAREHOUSE,
                     matching the report header exactly.
          DATA9432   DATA0020_PTR -> C_OF_O_PTR -> DATA0250. This
                     is country of origin PER LOT. DATA9419 is per
                     customer part and DATA9421 per inventory part,
                     so neither answers "where did this lot come
                     from" — only DATA9432 does, and it was the
                     3-hit row in the sweep, not the 1,126-hit one.

   3. DATA0012 IS CUSTOMER SHIP-TO ADDRESSES, not warehouse
      locations, so DATA0020.INV_WHOUSE_LOC_PTR still points
      somewhere unknown. Not urgent: the issue's own LOC_PTR
      resolves, and that is what the app now shows.

   READ THE SWEEP CAREFULLY — HIT COUNT IS NOT EVIDENCE

   DATA0353.WOPTR came back with 1,126 hits and DATA9432.DATA0020_PTR
   with 3. The 3 is the real answer and the 1,126 is noise: I fed
   the sweep fifteen integers, and any pointer column whose values
   span the same numeric range will match some of them by accident.
   A column NAMED DATA0020_PTR matching a DATA0020 RKEY means
   something; a WOPTR matching one does not.

   That is also why section S below sweeps for ONE value — the work
   order's own RKEY, 874002 — instead of fifteen. A single
   distinctive integer produces far fewer coincidences.

   STILL OPEN

     (a) Which table holds PO numbers like PURO136141.
     (b) Which table links a work order to its material, since
         DATA0153 is a one-month window and cannot be the source of
         a report covering -357152-01-100 (which has ZERO rows in
         it, while the printed report shows 20 material lines).

   Useful context from DATA0006 for -357152-01-100:
         RKEY 874002, ROOT_PTR 865342, PARENT_PTR 865342,
         BASE_WO '357152', LOT_NUMBER_COUNT 3,
         RELEASE_DATE 2026-08-18, SCH_COMPL_DATE 2026-12-04

   LOT_NUMBER_COUNT is interesting: the work order knows how many
   lots it has, so something must hold them.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   S1. SWEEP FOR THE WORK ORDER'S OWN RKEY
   -------------------------------------------------------------
   874002 is -357152-01-100; 874003 is -357152-02-100; 865342 is
   the root both point at. A table linking a work order to its
   material will hold one of these in a pointer column.

   Two values only, to keep coincidental matches down. Ordered by
   hits ASCENDING this time — a table holding a handful of rows for
   one work order is far more interesting than one holding
   thousands, which is almost certainly a range collision.
   ------------------------------------------------------------- */
DECLARE @sqlS NVARCHAR(MAX) = N'';

SELECT @sqlS = @sqlS
    + N' UNION ALL SELECT '
    + N'CAST(''' + c.TABLE_NAME  + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceTable, '
    + N'CAST(''' + c.COLUMN_NAME + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceColumn, '
    + N'COUNT(*) AS Hits'
    + N' FROM ' + QUOTENAME(c.TABLE_SCHEMA) + N'.' + QUOTENAME(c.TABLE_NAME) + N' t'
    + N' WHERE t.' + QUOTENAME(c.COLUMN_NAME) + N' IN (874002, 874003)'
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES tb
  ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA AND tb.TABLE_NAME = c.TABLE_NAME
 AND tb.TABLE_TYPE = 'BASE TABLE'
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND c.DATA_TYPE IN ('int', 'bigint', 'numeric', 'decimal')
  AND (c.COLUMN_NAME LIKE '%PTR%' OR c.COLUMN_NAME LIKE '%POINTER%');

IF LEN(@sqlS) > 0
BEGIN
    SET @sqlS = N'SELECT * FROM ( ' + STUFF(@sqlS, 1, 11, N'')
              + N' ) q WHERE q.Hits > 0 ORDER BY q.Hits ASC, q.SourceTable';
    EXEC sp_executesql @sqlS;
END
ELSE SELECT 'no candidate pointer columns found' AS note;


/* -------------------------------------------------------------
   T1. WHERE PURO136141 LIVES — no dynamic SQL this time
   -------------------------------------------------------------
   The sweep's EXEC output went missing twice (reported as "rows
   affected" from the string being built). This is a plain UNION
   over the tables round 5 showed actually have a PO_NUMBER column,
   so there is nothing to lose. Every branch collates, because
   these columns differ in collation and UNION ALL will refuse
   otherwise — that was the error last round.

   DATA0171.PO_NUMBER is numeric and cannot hold 'PURO136141', so
   it is left out deliberately rather than by oversight.
   ------------------------------------------------------------- */
SELECT 'DATA0070' AS SourceTable, RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT AS PONumber
FROM DATA0070 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0097', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0097 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0222', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0222 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0239', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0239 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0240', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0240 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0301', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0301 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0302', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0302 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0312', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0312 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0325', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0325 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0384', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0384 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA9414', RKEY, LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA9414 WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
ORDER BY SourceTable, RKEY;


/* -------------------------------------------------------------
   T2. AND THE RO SIDE
   -------------------------------------------------------------
   The report column is "RO/P.O. NUMBER", so it may not be a
   purchase order at all.
   ------------------------------------------------------------- */
SELECT 'DATA0239' AS SourceTable, RKEY, LTRIM(RTRIM(RO_NUMBER)) COLLATE DATABASE_DEFAULT AS RONumber
FROM DATA0239 WHERE LTRIM(RTRIM(RO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%'
UNION ALL
SELECT 'DATA0466', RKEY, LTRIM(RTRIM(RO_NUMBER)) COLLATE DATABASE_DEFAULT
FROM DATA0466 WHERE LTRIM(RTRIM(RO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO13%';


/* -------------------------------------------------------------
   T3. WHICHEVER TABLE T1 NAMES — does RKEY 174015 sit in it
   -------------------------------------------------------------
   Run this once T1 identifies the table; swap the name in. If the
   PO_PTR values land in the same table that holds PURO numbers,
   the join is settled and the app can be fixed in one line.
   ------------------------------------------------------------- */
-- SELECT * FROM <table from T1>
-- WHERE RKEY IN (148420, 171990, 172895, 173862, 174015, 174020, 176498);


/* -------------------------------------------------------------
   U1. CONFIRM THE C OF O CHAIN END TO END
   -------------------------------------------------------------
   The app now joins DATA0020 -> DATA9432 -> DATA0250. The printed
   report shows USA / CAN / TWN for these exact lots, so this
   should reproduce it. If it does not, the chain is wrong and the
   new column is worse than no column.

   Note TWN is not in the DATA0250 sample we saw (which stopped at
   TUR alphabetically by RKEY); worth confirming it exists.
   ------------------------------------------------------------- */
SELECT
    LTRIM(RTRIM(lot.BATCH_NO))        AS BatchNo,
    LTRIM(RTRIM(d17.INV_PART_NUMBER)) AS InventoryPart,
    lot.RKEY                          AS LotRkey,
    coo.C_OF_O_PTR,
    LTRIM(RTRIM(ctry.COUNTRY_CODE))   AS CountryCode,
    LTRIM(RTRIM(ctry.COUNTRY_NAME))   AS CountryName
FROM DATA0020 lot
LEFT JOIN DATA0017 d17 ON d17.RKEY = lot.INVENTORY_POINTER
OUTER APPLY (
    SELECT TOP 1 c.C_OF_O_PTR FROM DATA9432 c
    WHERE c.DATA0020_PTR = lot.RKEY ORDER BY c.RKEY DESC
) coo
LEFT JOIN DATA0250 ctry ON ctry.COUNTRY_RKEY = coo.C_OF_O_PTR
WHERE lot.RKEY IN (733670, 733671, 827049, 826808, 832949, 835305,
                   844652, 825666, 834127, 834128)
ORDER BY BatchNo;

SELECT COUNT(*) AS country_rows FROM DATA0250;
SELECT * FROM DATA0250
WHERE LTRIM(RTRIM(COUNTRY_CODE)) COLLATE DATABASE_DEFAULT IN ('TWN','USA','CAN');


/* -------------------------------------------------------------
   V1. WHAT DATA0353 ACTUALLY IS
   -------------------------------------------------------------
   Only to rule it out properly rather than on reasoning alone. If
   its row count is large, the 1,126 hits were range collisions and
   it is not our link table.
   ------------------------------------------------------------- */
SELECT COUNT(*) AS total_rows FROM DATA0353;

SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0353'
ORDER BY ORDINAL_POSITION;

-- And DATA0618, whose INV_BATCH_PTR is named like a real lot pointer
SELECT COUNT(*) AS total_rows FROM DATA0618;

SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0618'
ORDER BY ORDINAL_POSITION;
