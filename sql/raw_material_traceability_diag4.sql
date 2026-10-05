/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 4
   Test work order: -357152-01-100   (the one returning nothing)

   WHAT THE EMPTY RESULT ACTUALLY TELLS US

   This is not a new bug. It is defect (3) from round 2 — the one
   never diagnosed because F1-F3 went unrun — now showing up as a
   user-facing blank page.

   Look at the shape of the number. The three lots the recursion
   FAILED to descend into last round were:

       -354590-02-100   -340281-01-100   -354589-01-100

   and the one it succeeded on was -359164-01-100. This work order
   is -357152-01-100. Same -100 suffix family. DATA0153 has issues
   for exactly one member of that family and silence for the rest.

   The printed report proves the material exists: CU foil, Tachyon
   prepreg and laminate, with POs and lots. So either DATA0153
   spells these jobs differently, or it does not hold them at all
   and the lamination issues live somewhere else.

   WHAT THE REPORT HANDED US

   Real keys, which is what the earlier sweeps lacked:

       POs    PURO136141  PURO134929  PURO114865  PURO135742
       lots   11130555    20467496    20604707    50229495
       parts  AL0100CU1022529  PPGWI0010272824  WIA0035R2RH2824

   Section M uses them to settle the PO join by searching for a
   value we KNOW exists, rather than guessing at RKEY 174187.

   Also note what the report does NOT have: a quantity column. It
   has LOCATION and C OF O instead. That is worth keeping in mind —
   a lot-allocation view would look like this, and a quantity-
   bearing issue ledger would not.

   COLLATION, AGAIN

   First run of this file hit:

     "Implicit conversion of varchar value to varchar cannot be
      performed because the collation of the value is unresolved
      due to a collation conflict between Latin1_General_CI_AI and
      Latin1_General_BIN in UNION ALL operator."

   My bug, and the same one that broke the recursive CTE in round 1.
   The sweeps in L3 and M1 union one branch per table, and a branch
   selecting CAST(LTRIM(RTRIM(t.[COL])) AS VARCHAR(60)) inherits
   whatever collation that column has. Union a CI_AI table's column
   with a BIN one and SQL Server has no basis for comparing them.

   Every character expression in the generated SQL now carries
   COLLATE DATABASE_DEFAULT, including the table- and column-name
   literals. The IN-list comparisons in L1 and L2 got it too: on a
   BIN column those are case-SENSITIVE, so a part number stored in
   mixed case would silently return nothing — a false "not found"
   being the worst possible answer from a diagnostic.

   Two other fixes while in there: the sweeps now schema-qualify
   table names rather than assuming dbo, and skip views, so a
   reporting view cannot turn a lookup into a table scan.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   K1. IS THIS WORK ORDER ANYWHERE AT ALL
   -------------------------------------------------------------
   Three questions in three queries: does the ledger know it, does
   the work order master know it, and how far back does the ledger
   reach. The app now runs these automatically on an empty result,
   but run them by hand once so we can read them together.
   ------------------------------------------------------------- */
SELECT
    LTRIM(RTRIM(t.TRAN_SOURCE)) AS TranSource,
    LTRIM(RTRIM(t.TRAN_TYPE))   AS TranType,
    COUNT(*)                    AS rows_found,
    MIN(t.TDATE)                AS first_tran,
    MAX(t.TDATE)                AS last_tran
FROM DATA0153 t
WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) LIKE '%357152%'
GROUP BY LTRIM(RTRIM(t.TRAN_SOURCE)), LTRIM(RTRIM(t.TRAN_TYPE))
ORDER BY TranSource;

SELECT TOP 25 LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) AS WorkOrderNumber
FROM DATA0006 wo
WHERE LTRIM(RTRIM(wo.WORK_ORDER_NUMBER)) LIKE '%357152%'
ORDER BY WorkOrderNumber;

SELECT COUNT(*) AS total_rows, MIN(TDATE) AS oldest, MAX(TDATE) AS newest
FROM DATA0153;

SELECT YEAR(TDATE) AS yr, MONTH(TDATE) AS mo, COUNT(*) AS rows_in_month
FROM DATA0153
GROUP BY YEAR(TDATE), MONTH(TDATE)
ORDER BY yr, mo;


/* -------------------------------------------------------------
   L1. THE LOTS FROM THE REPORT — DO THEY EXIST, AND WHERE
   -------------------------------------------------------------
   These came off the printed page, so they are real. If DATA0020
   holds them, the lot side is fine and only the work-order link is
   missing — which is a completely different fix from the lots not
   being there.
   ------------------------------------------------------------- */
SELECT
    lot.RKEY, lot.INVENTORY_POINTER,
    LTRIM(RTRIM(lot.BATCH_NO)) AS BatchNo,
    lot.INV_WHOUSE_LOC_PTR, lot.INVT_WHSE_LOC_PTR,
    lot.QUAN_ON_HAND, lot.QUAN_ALLOCATED,
    lot.EXPIRED_DATE, lot.PO_PTR, lot.RO_PTR,
    LTRIM(RTRIM(lot.REFERENCE_NUMBER)) AS ReferenceNumber,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))  AS InventoryPart
FROM DATA0020 lot
LEFT JOIN DATA0017 d17 ON d17.RKEY = lot.INVENTORY_POINTER
WHERE LTRIM(RTRIM(lot.BATCH_NO)) COLLATE DATABASE_DEFAULT IN
    ('11130555', '50229495', '2509410039', '20604707', '20558610',
     '20764507', '20552981', '20483617', '20552488', '20467496',
     '20469990', '20467494', '20467357')
ORDER BY BatchNo, lot.RKEY;


/* -------------------------------------------------------------
   L2. ARE THESE LOTS IN THE ISSUE LEDGER UNDER ANY SOURCE
   -------------------------------------------------------------
   If they appear with a TRAN_SOURCE we are not matching, that is
   the fix. If they do not appear at all, DATA0153 is not where
   lamination material gets recorded and the walk needs a second
   table.
   ------------------------------------------------------------- */
SELECT TOP 100
    LTRIM(RTRIM(t.TRAN_SOURCE))     AS TranSource,
    LTRIM(RTRIM(t.TRAN_TYPE))       AS TranType,
    LTRIM(RTRIM(t.PART_NUMBER))     AS PartNumber,
    LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS BatchSerial,
    t.QUANTITY, t.TDATE
FROM DATA0153 t
WHERE LTRIM(RTRIM(t.BATCH_SERIAL_NO)) COLLATE DATABASE_DEFAULT IN
    ('11130555', '50229495', '2509410039', '20604707', '20558610',
     '20764507', '20552981', '20483617', '20552488', '20467496',
     '20469990', '20467494', '20467357')
ORDER BY t.TDATE DESC;

-- Same question from the part side, since the report names the parts
SELECT TOP 100
    LTRIM(RTRIM(t.TRAN_SOURCE))     AS TranSource,
    LTRIM(RTRIM(t.TRAN_TYPE))       AS TranType,
    LTRIM(RTRIM(t.PART_NUMBER))     AS PartNumber,
    LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS BatchSerial,
    t.QUANTITY, t.TDATE
FROM DATA0153 t
WHERE LTRIM(RTRIM(t.PART_NUMBER)) COLLATE DATABASE_DEFAULT IN
    ('AL0100CU1022529', 'AL0100CUAFTO22529', 'CU1OZAL01002529',
     'CUAFTOZAL01002529', 'PPGWI0010272824', 'PPGWI0010352824',
     'PPGWI0010602824', 'WIA0035R2RH2824', 'WIA0035RHRH2824')
ORDER BY t.TDATE DESC;


/* -------------------------------------------------------------
   L3. WHAT TABLE LINKS A LOT TO A WORK ORDER
   -------------------------------------------------------------
   The real question. Sweeps every DATA% table that has a batch-ish
   column, looking for one of the report's lot numbers. Whatever
   comes back besides DATA0020 and DATA0153 is a candidate for the
   missing link — and its other columns will show how the work
   order is attached.

   Read-only; the generated text is SELECT only.
   ------------------------------------------------------------- */
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql = @sql
    + N' UNION ALL SELECT '
    + N'CAST(''' + c.TABLE_NAME  + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceTable, '
    + N'CAST(''' + c.COLUMN_NAME + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceColumn, '
    + N'COUNT(*) AS Hits'
    + N' FROM ' + QUOTENAME(c.TABLE_SCHEMA) + N'.' + QUOTENAME(c.TABLE_NAME) + N' t'
    + N' WHERE LTRIM(RTRIM(t.' + QUOTENAME(c.COLUMN_NAME) + N')) COLLATE DATABASE_DEFAULT IN '
    + N'(''11130555'',''20467496'',''20604707'',''50229495'',''20558610'')'
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES tb
  ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA
 AND tb.TABLE_NAME   = c.TABLE_NAME
 AND tb.TABLE_TYPE   = 'BASE TABLE'          -- skip views
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND (c.COLUMN_NAME LIKE '%BATCH%' OR c.COLUMN_NAME LIKE '%LOT%')
  AND c.DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar');

IF LEN(@sql) > 0
BEGIN
    SET @sql = N'SELECT * FROM ( ' + STUFF(@sql, 1, 11, N'')
             + N' ) q WHERE q.Hits > 0 ORDER BY q.Hits DESC';
    EXEC sp_executesql @sql;
END
ELSE SELECT 'no candidate batch columns found' AS note;


/* -------------------------------------------------------------
   M1. SETTLE THE PO JOIN WITH A VALUE WE KNOW EXISTS
   -------------------------------------------------------------
   Round 3 searched for RKEY 174187 and for '%136354%'. This
   searches for PURO136141 and PURO134929, which are printed on the
   report in front of us, so a miss here means the sweep is looking
   in the wrong column names rather than that the value is absent.
   ------------------------------------------------------------- */
DECLARE @sql2 NVARCHAR(MAX) = N'';

SELECT @sql2 = @sql2
    + N' UNION ALL SELECT TOP 5 '
    + N'CAST(''' + c.TABLE_NAME  + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceTable, '
    + N'CAST(''' + c.COLUMN_NAME + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceColumn, '
    + N'CAST(t.RKEY AS BIGINT) AS Rkey, '
    + N'CAST(LTRIM(RTRIM(t.' + QUOTENAME(c.COLUMN_NAME) + N')) AS VARCHAR(60))'
    + N' COLLATE DATABASE_DEFAULT AS Val'
    + N' FROM ' + QUOTENAME(c.TABLE_SCHEMA) + N'.' + QUOTENAME(c.TABLE_NAME) + N' t'
    + N' WHERE LTRIM(RTRIM(t.' + QUOTENAME(c.COLUMN_NAME) + N')) COLLATE DATABASE_DEFAULT IN '
    + N'(''PURO136141'',''PURO134929'',''PURO114865'')'
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES tb
  ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA
 AND tb.TABLE_NAME   = c.TABLE_NAME
 AND tb.TABLE_TYPE   = 'BASE TABLE'
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND c.DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar')
  AND (c.COLUMN_NAME LIKE '%PO_NUMBER%'
    OR c.COLUMN_NAME LIKE '%RO_NUMBER%'
    OR c.COLUMN_NAME LIKE '%ORDER_NUMBER%'
    OR c.COLUMN_NAME LIKE '%REFERENCE%')
  AND EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS r
        WHERE r.TABLE_SCHEMA = c.TABLE_SCHEMA
          AND r.TABLE_NAME   = c.TABLE_NAME
          AND r.COLUMN_NAME  = 'RKEY'
          AND r.DATA_TYPE IN ('int', 'bigint', 'smallint', 'numeric', 'decimal')
      );

IF LEN(@sql2) > 0
BEGIN
    SET @sql2 = STUFF(@sql2, 1, 11, N'');
    EXEC sp_executesql @sql2;
END
ELSE SELECT 'no candidate PO columns found' AS note;


/* -------------------------------------------------------------
   N1. THE TWO COLUMNS WE STILL CANNOT FILL
   -------------------------------------------------------------
   The report prints LOCATION ('NLYM1 MODULA 1', 'NM09C MATL PREP')
   and C OF O ('USA', 'CAN', 'TWN'). We carry LOC_PTR and
   INV_WHOUSE_LOC_PTR as raw integers and show neither column.
   Find what they resolve against.
   ------------------------------------------------------------- */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND (COLUMN_NAME LIKE '%LOCATION%'
    OR COLUMN_NAME LIKE '%WHSE%'
    OR COLUMN_NAME LIKE '%WAREHOUSE%'
    OR COLUMN_NAME LIKE '%COUNTRY%'
    OR COLUMN_NAME LIKE '%ORIGIN%'
    OR COLUMN_NAME LIKE '%C_OF_O%')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Round 1 mapped LOC_PTR 286 -> NASKT N ASSY KIT, 3490/3491 -> N HARDWARE,
-- so some table holds those names. The report's NLYM1 / NM09C should be in
-- the same one.
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE 'DATA%'
  AND COLUMN_NAME IN ('LOCATION', 'LOC_NAME', 'LOCATION_NAME',
                      'DESCRIPTION', 'CODE', 'NAME')
  AND TABLE_NAME IN (
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE COLUMN_NAME LIKE '%LOC%' AND TABLE_NAME LIKE 'DATA%'
  )
ORDER BY TABLE_NAME, COLUMN_NAME;
