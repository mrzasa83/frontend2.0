/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 3
   Test work order: -354516-01-000

   SECTION H VALIDATED. 21 rows, 20 at level 0 and 1 at level 1,
   exactly as predicted. Both fan-outs are closed:

     DATA0020 (one row per lot per warehouse location)  -> OUTER APPLY
     recursion (one lot issued under five sources)      -> ROW_NUMBER by RKEY

   The split evidence is now conclusive. S3-354516-01-000 carries
   205 / 27.134348 / 407.015222 / 434.14957, which is precisely what
   the printed report shows, while the base job carries
   360 / 47.650563 / 714.758438 / 762.409.

   AND THE SPLITS TURN OUT TO BE APPORTIONMENTS, NOT SEPARATE
   CONSUMPTION. The five shares of each lot sum to round totals:

       lot               base       S0        S1       S2       S3     sum
       -354590-02-100     360      390       364      192      205    1511
       -340281-01-100      47.651   51.621    48.180   25.414   27.134  200.000
       -354589-01-100     714.758  774.322   722.700  381.205  407.015 3000.000
       -359164-01-100     762.409  825.943   770.880  406.618  434.150 3200.000

   200.000, 3000.000 and 3200.000 to the milli-unit is not a
   coincidence. So "total issued to the job family" and "the share
   Paradigm prints for one split" are both real numbers, 7.37x
   apart. The app now labels which one it is showing, because a
   reviewer reconciling 3000 against 407.015 would otherwise file a
   defect against a correct figure.

   ONE DEFECT REMAINS, NOW DIAGNOSED RATHER THAN SUSPECTED.

   My earlier claim that PO and supplier were "NULL everywhere" was
   wrong, and the output shows why. Every level-0 row is
   PO_PTR = 0, RO_PTR = 0 — they are made lots, and a made lot has
   no purchase order. Nothing is broken there.

   The defect is one row, the purchased leaf:

       BatchSerial  G011595160
       PO_PTR       174187        <- came through, so the lot resolved
       PONumber     null          <- the join to DATA0070 failed

   The OUTER APPLY already prefers a lot row carrying a PO and it
   found one. So this is not lot selection, and it is not the
   tie-break I changed last round. DATA0070 simply has no RKEY
   174187, which means PO_PTR is not a DATA0070 key. Section J finds
   what it is a key to, by searching rather than guessing.

   Sections F1-F3 are carried over unrun. They are the last blocker:
   the recursion reaches only 1 of the 4 purchased leaves the report
   shows.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   J1. CONFIRM DATA0070 DOES NOT HOLD 174187
   -------------------------------------------------------------
   Expected: zero rows. Also shows the key range, so we can see
   whether 174187 is simply beyond the end of the table or sits in
   a gap — a different kind of problem.
   ------------------------------------------------------------- */
SELECT COUNT(*) AS rows_at_174187 FROM DATA0070 WHERE RKEY = 174187;

SELECT COUNT(*) AS total_rows, MIN(RKEY) AS min_rkey, MAX(RKEY) AS max_rkey
FROM DATA0070;


/* -------------------------------------------------------------
   J2. WHAT IS PO_PTR A KEY TO — SWEEP, DO NOT GUESS
   -------------------------------------------------------------
   Builds a UNION over every DATA% table that has both an RKEY and
   a PO_NUMBER or RO_NUMBER column, then looks for two things at
   once: a row at RKEY 174187, and the PO number the report
   actually prints (PURO136354).

   Whichever table answers both is the join we should be making.
   Read-only; the generated text is SELECT only.
   ------------------------------------------------------------- */
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql = @sql
    + N' UNION ALL SELECT '
    + N'''' + c.TABLE_NAME  + N''' AS SourceTable, '
    + N'''' + c.COLUMN_NAME + N''' AS SourceColumn, '
    + N'CAST(t.RKEY AS BIGINT) AS Rkey, '
    + N'CAST(LTRIM(RTRIM(t.' + QUOTENAME(c.COLUMN_NAME) + N')) AS VARCHAR(60)) AS PoNumber'
    + N' FROM ' + QUOTENAME(c.TABLE_NAME) + N' t'
    + N' WHERE t.RKEY = 174187'
    + N'    OR LTRIM(RTRIM(t.' + QUOTENAME(c.COLUMN_NAME) + N')) LIKE ''%136354%'''
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND c.COLUMN_NAME IN ('PO_NUMBER', 'RO_NUMBER')
  -- Only tables keyed the way Paradigm keys everything else, and only
  -- where RKEY is numeric, so the CAST cannot blow up mid-sweep.
  AND EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS r
        WHERE r.TABLE_NAME = c.TABLE_NAME
          AND r.COLUMN_NAME = 'RKEY'
          AND r.DATA_TYPE IN ('int', 'bigint', 'smallint', 'numeric', 'decimal')
      );

IF LEN(@sql) > 0
BEGIN
    -- Strip the leading ' UNION ALL ' (11 characters)
    SET @sql = STUFF(@sql, 1, 11, N'') + N' ORDER BY SourceTable, Rkey';
    EXEC sp_executesql @sql;
END
ELSE
    SELECT 'no candidate tables found' AS note;


/* -------------------------------------------------------------
   J3. THE SWEEP TEXT, IF J2 MISBEHAVES
   -------------------------------------------------------------
   Same build, printed instead of executed, so it can be inspected
   or run in pieces. PRINT truncates at 4000 characters; the SELECT
   shows the whole thing.
   ------------------------------------------------------------- */
DECLARE @sql2 NVARCHAR(MAX) = N'';

SELECT @sql2 = @sql2
    + N' UNION ALL SELECT '
    + N'''' + c.TABLE_NAME + N''' AS SourceTable, CAST(t.RKEY AS BIGINT) AS Rkey, '
    + N'CAST(LTRIM(RTRIM(t.' + QUOTENAME(c.COLUMN_NAME) + N')) AS VARCHAR(60)) AS PoNumber'
    + N' FROM ' + QUOTENAME(c.TABLE_NAME) + N' t WHERE t.RKEY = 174187'
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND c.COLUMN_NAME IN ('PO_NUMBER', 'RO_NUMBER');

SELECT @sql2 AS generated_sql;


/* -------------------------------------------------------------
   J4. WHERE ELSE DOES 174187 LOOK LIKE A KEY
   -------------------------------------------------------------
   If no PO_NUMBER table holds it, PO_PTR may point at a receipt or
   receiver line that then points at the PO. Lists the tables that
   could plausibly be it, by column name.
   ------------------------------------------------------------- */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%PO_PTR%'
    OR COLUMN_NAME LIKE '%PO_POINTER%'
    OR COLUMN_NAME LIKE '%RECEIV%'
    OR COLUMN_NAME LIKE '%SUPPLIER_POINTER%')
ORDER BY TABLE_NAME, COLUMN_NAME;


/* -------------------------------------------------------------
   F1. DO THE OTHER THREE WORK ORDERS HAVE ISSUES AT ALL
   -------------------------------------------------------------
   Carried over unrun. The recursion reached only -359164-01-100.
   All four batches start with a dash so the gate passed for every
   one of them; the JOIN found nothing for three.
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
   The report lists these under -354590-02-100. Zero rows means
   DATA0153 does not hold them and we need a second source.
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
   ~15,700 rows is very small for a complete issue ledger at our
   volume. If this is a current-period window with history archived
   elsewhere, the three missing work orders predate it and no LIKE
   pattern will ever find them — the walk needs a second table.

   Note the timing evidence pointing the same way: the one branch
   that DID recurse, -359164-01-100, was issued 2026-09-21, the
   latest of the four. The other three were issued 2026-09-17.
   ------------------------------------------------------------- */
SELECT COUNT(*) AS total_rows, MIN(TDATE) AS oldest, MAX(TDATE) AS newest
FROM DATA0153;

SELECT YEAR(TDATE) AS yr, COUNT(*) AS rows_in_year
FROM DATA0153
GROUP BY YEAR(TDATE)
ORDER BY yr;

-- And per month for the covered period, which distinguishes a
-- rolling window from a table that simply started being used.
SELECT YEAR(TDATE) AS yr, MONTH(TDATE) AS mo, COUNT(*) AS rows_in_month
FROM DATA0153
GROUP BY YEAR(TDATE), MONTH(TDATE)
ORDER BY yr, mo;
