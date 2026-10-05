/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 5
   Finding the table Paradigm's report actually reads.

   ROUND 4 SETTLED THE BIG QUESTION, AND THE ANSWER IS THAT WE HAVE
   BEEN READING THE WRONG TABLE FOR THIS REPORT.

   DATA0153 holds 15,674 rows and EVERY ONE of them is in 2026-09.
   It is a rolling window of roughly a month, not a historical
   ledger. That single fact explains every symptom we have chased:

     - the recursion reaching only -359164-01-100 (issued 09-21)
       and silently missing -354590-02-100, -340281-01-100 and
       -354589-01-100 (all issued 09-17 but whose OWN component
       issues happened earlier, outside the window)
     - the blank page for -357152-01-100
     - the concise page returning 1 purchased leaf instead of 4

   None of it was a search bug. No LIKE pattern, wildcard or
   normalising rule could have fixed it.

   THE DECISIVE PAIR OF FACTS

     DATA0006 has -357152-01-100 through -357152-05-100.
     DATA0153 has issues for -357152-02-100 only, 6 rows.
     The printed report for -357152-01-100 has 20 material lines.

   A report cannot read 20 lines out of a table holding 0 rows for
   that job. So Paradigm's Raw Material Traceability page does NOT
   read DATA0153. It reads something that persists: the work
   order's material/lot assignment.

   Supporting evidence from the printed page, which I noted last
   round and now matters: it has NO quantity column. It has
   LOCATION and C OF O instead. That is the shape of an allocation
   view, not of a quantity-bearing transaction log.

   WHY THE L3 SWEEP MISSED IT

   My fault. L3 searched for the lot NUMBERS as strings, and found
   only DATA0153.BATCH_SERIAL_NO and DATA0020.BATCH_NO. But a link
   table would not store the batch string — it would store a
   POINTER to the DATA0020 row, as an integer. The sweep was
   looking for the wrong kind of value, so a clean "only two
   tables" result does not mean what it appears to mean.

   Section P searches by pointer instead.

   WHAT ROUND 4 ALSO GAVE US

   Lookup tables for the two columns we cannot fill:
     DATA0015  WAREHOUSE_CODE / WAREHOUSE_NAME
     DATA0016  LOCATION (char 20)        <- 'NLYM1', 'NM09C'
     DATA0012  LOCATION + WAREHOUSE_POINTER
     DATA0250  COUNTRY_CODE / COUNTRY_NAME  <- 'USA','CAN','TWN'
     DATA9419 / DATA9421 / DATA9432  C_OF_O_PTR

   And a normalising bug in the app, already fixed: TRAN_SOURCE
   carries A1- and A5- prefixes (A5-350167-01-100) as well as
   S0-/S1-. The rule only stripped S.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   O1. THE WORK ORDER ROW ITSELF
   -------------------------------------------------------------
   Everything downstream keys off its RKEY. The full row also shows
   which date columns exist, so the app can eventually say "this
   job ran before the ledger window" rather than guessing.
   ------------------------------------------------------------- */
SELECT TOP 10 *
FROM DATA0006
WHERE LTRIM(RTRIM(WORK_ORDER_NUMBER)) COLLATE DATABASE_DEFAULT
      IN ('-357152-01-100', '-357152-02-100');


/* -------------------------------------------------------------
   O2. THE WORK-ORDER TABLE FAMILY
   -------------------------------------------------------------
   Every table that references a work order by number or pointer.
   The report's source is almost certainly in this list.
   ------------------------------------------------------------- */
SELECT c.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES tb
  ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA AND tb.TABLE_NAME = c.TABLE_NAME
 AND tb.TABLE_TYPE = 'BASE TABLE'
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND (c.COLUMN_NAME LIKE '%WORK_ORDER%' OR c.COLUMN_NAME LIKE '%WO_PTR%'
    OR c.COLUMN_NAME LIKE '%WORKORDER%')
ORDER BY c.TABLE_NAME, c.COLUMN_NAME;


/* -------------------------------------------------------------
   P1. FIND THE LINK BY POINTER, NOT BY BATCH STRING
   -------------------------------------------------------------
   These are the DATA0020 RKEYs of the exact lots the report prints
   for this job. Any table holding one of them in a numeric column
   is a candidate for the work-order-to-lot link.

   Restricted to pointer-looking column names so this stays a
   bounded sweep rather than every numeric column in the database.
   ------------------------------------------------------------- */
DECLARE @sqlP NVARCHAR(MAX) = N'';

SELECT @sqlP = @sqlP
    + N' UNION ALL SELECT '
    + N'CAST(''' + c.TABLE_NAME  + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceTable, '
    + N'CAST(''' + c.COLUMN_NAME + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceColumn, '
    + N'COUNT(*) AS Hits'
    + N' FROM ' + QUOTENAME(c.TABLE_SCHEMA) + N'.' + QUOTENAME(c.TABLE_NAME) + N' t'
    + N' WHERE t.' + QUOTENAME(c.COLUMN_NAME) + N' IN '
    + N'(733670,733671,743262,827049,826808,827607,832725,832727,'
    + N'832949,835305,844652,825666,825667,834127,834128)'
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES tb
  ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA AND tb.TABLE_NAME = c.TABLE_NAME
 AND tb.TABLE_TYPE = 'BASE TABLE'
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND c.DATA_TYPE IN ('int', 'bigint', 'numeric', 'decimal')
  AND (c.COLUMN_NAME LIKE '%PTR%' OR c.COLUMN_NAME LIKE '%POINTER%')
  AND c.TABLE_NAME <> 'DATA0020';

IF LEN(@sqlP) > 0
BEGIN
    SET @sqlP = N'SELECT * FROM ( ' + STUFF(@sqlP, 1, 11, N'')
              + N' ) q WHERE q.Hits > 0 ORDER BY q.Hits DESC';
    EXEC sp_executesql @sqlP;
END
ELSE SELECT 'no candidate pointer columns found' AS note;


/* -------------------------------------------------------------
   Q1. WHERE PO_NUMBER LIVES  — the EXEC output got lost last time
   -------------------------------------------------------------
   Round 4 reported "292 rows affected", which was the string being
   built, not the sweep's result. Start with the plain list of
   tables that even have the column; it is three rows of output and
   settles most of it.
   ------------------------------------------------------------- */
SELECT c.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES tb
  ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA AND tb.TABLE_NAME = c.TABLE_NAME
 AND tb.TABLE_TYPE = 'BASE TABLE'
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND (c.COLUMN_NAME LIKE '%PO_NUMBER%' OR c.COLUMN_NAME LIKE '%RO_NUMBER%')
ORDER BY c.TABLE_NAME, c.COLUMN_NAME;


/* -------------------------------------------------------------
   Q2. DOES DATA0070 HOLD THESE PO POINTERS AT ALL
   -------------------------------------------------------------
   Real PO_PTR values off the report's own lots, spanning old and
   new (148420 up to 176498). If DATA0070 returns nothing for any
   of them, it is simply not the table these point at — which would
   finally close the question we have been circling since round 2.
   ------------------------------------------------------------- */
SELECT COUNT(*) AS rows_found, MIN(RKEY) AS min_rkey, MAX(RKEY) AS max_rkey
FROM DATA0070;

SELECT RKEY, LTRIM(RTRIM(PO_NUMBER)) AS PONumber, SUPPLIER_POINTER
FROM DATA0070
WHERE RKEY IN (148420, 148422, 152493, 171990, 171991, 172895, 172896,
               173069, 173574, 173576, 173862, 174015, 174020, 174022,
               174187, 176498)
ORDER BY RKEY;


/* -------------------------------------------------------------
   R1. THE LOCATION AND C OF O LOOKUPS
   -------------------------------------------------------------
   DATA0153.LOC_PTR is small (286, 3490, 3491) while
   DATA0020.INV_WHOUSE_LOC_PTR is large (168078, 245229, 254147),
   so they almost certainly point at different tables. Sample both
   and see which produces 'NLYM1 MODULA 1' / 'NM09C MATL PREP'.
   ------------------------------------------------------------- */
SELECT TOP 20 * FROM DATA0016;   -- LOCATION char(20)
SELECT TOP 20 * FROM DATA0015;   -- WAREHOUSE_CODE / WAREHOUSE_NAME
SELECT TOP 20 * FROM DATA0012;   -- LOCATION + WAREHOUSE_POINTER
SELECT TOP 20 * FROM DATA0250;   -- COUNTRY_CODE / COUNTRY_NAME

-- The specific pointers off this job's lots and issues
SELECT TOP 20 * FROM DATA0016 WHERE RKEY IN (286, 3490, 3491, 439);
SELECT TOP 20 * FROM DATA0012 WHERE RKEY IN (168078, 245229, 254147, 255405, 227874);

-- C of O: three tables carry C_OF_O_PTR. Which one is per-lot?
SELECT 'DATA9419' AS t, COUNT(*) AS rows_found FROM DATA9419;
SELECT 'DATA9421' AS t, COUNT(*) AS rows_found FROM DATA9421;
SELECT 'DATA9432' AS t, COUNT(*) AS rows_found FROM DATA9432;

SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('DATA9419','DATA9421','DATA9432')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
