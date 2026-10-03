/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 2
   Test work order: -354516-01-000

   WHAT ROUND 1 ESTABLISHED

   1. DATA0153 is the material-issue table. It is the only table
      carrying BOTH a batch column and the work order:
          BATCH_SERIAL_NO  7 hits
          TRAN_SOURCE      4 hits, sample '  -354516-01-000    '
      Everything below is about confirming its shape.

   2. DATA0020 is a LOT / warehouse-location record, not a
      transaction: RKEY, INVENTORY_POINTER, BATCH_NO, QUAN_ON_HAND,
      QUAN_ALLOCATED, INV_WHOUSE_LOC_PTR, EXPIRED_DATE, PO_PTR,
      RO_PTR, PRICE. There is NO work-order column, which confirms
      it cannot answer "what was issued to this job".

   3. A manufactured lot really is identified by the work order
      that made it — DATA0020 holds BATCH_NO = '  -354590-02-100'
      with PO_PTR = 0, alongside purchased lots like 'G011595160'
      with PO_PTR = 174187. One table, two kinds of lot,
      distinguished by whether PO_PTR is set.

   4. THE CURRENT MATERIAL CERTS QUERY IS RETURNING THE WRONG LOTS.
      Section 0 returned 374 rows covering 340 distinct lots with
      expiry dates from 2008 to 2029 — and NOT ONE of the four lots
      the report says were actually issued (G011595160, F204594916,
      4WA5N.1, 5508-0104) appears anywhere in it. It gets the three
      purchased part numbers right and then lists every lot of
      those parts ever received, none of which are the ones that
      went into this job.

   SO THE GOAL OF THIS ROUND
      Pin down DATA0153's columns and how it joins to DATA0020,
      DATA0017 and the warehouse location, so the report can be
      reproduced exactly. Run one section at a time. No GO
      separators — see round 1. Everything is read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   5. DATA0153 STRUCTURE
   ------------------------------------------------------------- */
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0153'
ORDER BY ORDINAL_POSITION;


/* -------------------------------------------------------------
   6. EVERY DATA0153 ROW FOR THE TEST WORK ORDER
   -------------------------------------------------------------
   The report's first section lists five materials issued to
   -354516-01-000 (COMPOSITE, and four PSA lines). If this returns
   those five, DATA0153 is confirmed and the shape of the real
   query follows directly.

   TRAN_SOURCE is a char column holding the work order with
   leading spaces, so match on LTRIM/RTRIM.
   ------------------------------------------------------------- */
SELECT *
FROM DATA0153
WHERE LTRIM(RTRIM(TRAN_SOURCE)) = '-354516-01-000';


/* -------------------------------------------------------------
   7. THE SAME ROWS, RESOLVED TO PART AND LOT
   -------------------------------------------------------------
   Speculative joins — adjust the column names once section 5
   shows what DATA0153 actually calls things. The guesses are:
     INVENTORY_PTR / INVENTORY_POINTER -> DATA0017.RKEY
     BATCH_SERIAL_NO                   -> DATA0020.BATCH_NO
   If section 5 shows a direct lot pointer (something like
   LOT_PTR or BATCH_PTR), prefer that over matching on the batch
   string — a string join here would be both slower and ambiguous.
   ------------------------------------------------------------- */
SELECT TOP 100
    t.*,
    d17.INV_PART_NUMBER,
    d17.INV_PART_DESCRIPTION,
    d17.P_M
FROM DATA0153 t
LEFT JOIN DATA0017 d17
       ON d17.RKEY = t.INVENTORY_PTR          -- adjust after section 5
WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) = '-354516-01-000';


/* -------------------------------------------------------------
   8. WHAT ELSE USES THE SAME TRAN_SOURCE CONVENTION
   -------------------------------------------------------------
   TRAN_SOURCE is probably a generic "where did this transaction
   come from" column, so DATA0153 likely holds receipts and
   adjustments too, not just issues. Whatever distinguishes them
   is the filter the report must apply — look for a type/code
   column and its distribution.
   ------------------------------------------------------------- */
SELECT TOP 50
    TRAN_SOURCE,
    COUNT(*) AS rows_for_source
FROM DATA0153
WHERE LTRIM(RTRIM(TRAN_SOURCE)) LIKE '-3545%'
GROUP BY TRAN_SOURCE
ORDER BY rows_for_source DESC;


/* -------------------------------------------------------------
   9. THE SUB-LEVEL STEP
   -------------------------------------------------------------
   This is the whole "Include Sub Levels" mechanism in one query.
   -354590-02-100 appears as a BATCH_SERIAL_NO under the top work
   order; it is itself a work order, so asking DATA0153 for its
   own issues should return the second section of the report
   (CU FOIL, two COVERLAY lines).

   If this works, the recursion is simply: issued batch -> treat as
   TRAN_SOURCE -> repeat.
   ------------------------------------------------------------- */
SELECT *
FROM DATA0153
WHERE LTRIM(RTRIM(TRAN_SOURCE)) = '-354590-02-100';


/* -------------------------------------------------------------
   10. LOCATION AND COUNTRY OF ORIGIN
   -------------------------------------------------------------
   The report shows LOCATION ('NPP01 PPG PREP', 'NASKT N ASSY
   KIT') and C OF O ('USA'), neither of which is in DATA0020.
   DATA0020.INV_WHOUSE_LOC_PTR should resolve the location; find
   its table, and find where country of origin lives.
   ------------------------------------------------------------- */
SELECT TOP 20 *
FROM DATA0020
WHERE RKEY IN (835303, 848946, 847810, 857132);

-- Which table do those INV_WHOUSE_LOC_PTR values (209319, 209329,
-- 243495, 66217) point at? Look for a warehouse/location table.
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%WHOUSE%'
    OR COLUMN_NAME LIKE '%WAREHOUSE%'
    OR COLUMN_NAME LIKE '%LOCATION%')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Country of origin: the report prints 'USA'.
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%ORIGIN%'
    OR COLUMN_NAME LIKE '%COUNTRY%'
    OR COLUMN_NAME LIKE '%C_OF_O%'
    OR COLUMN_NAME LIKE '%COFO%')
ORDER BY TABLE_NAME, COLUMN_NAME;


/* -------------------------------------------------------------
   11. SECONDARY CANDIDATES (only if DATA0153 disappoints)
   -------------------------------------------------------------
   Round 1 also flagged these as containing the work order string.
   DATA0095.REFERENCE_NUMBER and DATA0318/DATA0354 are more likely
   audit or label trails than the issue ledger, but worth a look
   if section 6 comes back thin.
   ------------------------------------------------------------- */
SELECT TOP 20 * FROM DATA0095
WHERE LTRIM(RTRIM(REFERENCE_NUMBER)) IN ('-354516-01-000', '-354590-02-100');

SELECT TOP 20 * FROM DATA0354
WHERE LTRIM(RTRIM(SOURCE_DESC)) IN ('-354516-01-000', '-354590-02-100');
