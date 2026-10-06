/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 9
   DATA0095, and the two gaps in round 8's sweeps.

   WHAT ROUND 8 ELIMINATED

   X1 returned a short list, which is the valuable part. Tables that
   can structurally hold BOTH a work order and a batch:

       DATA0048   7,834,232   WO_PTR + PART_BATCH_PTR
       DATA0006     828,338   the WO header itself
       DATA0620      11,707   WIP counting
       DATA9473, DATA0243, DATA0358, DATA0436   all EMPTY

   Four empty, one is the header, one is WIP counting. DATA0048 is
   the only real candidate — and round 5 already rules it out: the
   pointer sweep searched DATA0048.PART_BATCH_PTR for the fifteen
   DATA0020 RKEYs of this report's lots and got zero hits. So
   PART_BATCH_PTR is the batch PRODUCED by the step, not the
   material consumed by it.

   GAP 1 — X1 IS NOT EXHAUSTIVE, AND I SHOULD HAVE SAID SO

   X1 matches on column NAMES, so a link table using generic names
   escapes both filters. DATA0095 is exactly that case:

       SRCE_PTR       does not match %WO_PTR% / %WORK_ORDER%
       INVT_LOC_PTR   does not match %BATCH% / %LOT% / %SERIAL%

   and yet the VALUE sweeps hit it from both directions:

       round 5, DATA0020 RKEYs   DATA0095.INVT_LOC_PTR   470 hits
       round 6, WO RKEY 874002   DATA0095.SRCE_PTR         2 hits
       round 8, parent  865342   DATA0095.SRCE_PTR         2 hits

   On top of that, DATA0153 carries a DATA0095_PTR column — the
   issue ledger points AT this table. If DATA0095 is the persistent
   transaction header and DATA0153 the windowed detail, that is
   precisely the shape that would explain everything we have seen.

   We have never looked at its schema. Section Y1 does.

   GAP 2 — THE STRING SWEEP SKIPPED EVERY LARGE TABLE

   X3 found the lot numbers only in DATA0020 and DATA0153, which
   looks conclusive but is not: it only searched tables under 2
   million rows. DATA0048 (7.8M) and DATA0353 (46.5M) were excluded
   by the cap, and we have never had a size listing, so we do not
   know what else was. Section Y3 runs the complement — the same
   search over the tables X3 skipped — so the two together cover
   the database rather than most of it.

   ALSO WORTH KNOWING: THE "PARENT" IS NOT A BOM PARENT

   -357152-01-100's PARENT_PTR and ROOT_PTR are both 865342, which
   is -353460-02-000 — a different part number entirely, with
   LOT_NUMBER_COUNT 0 and no release date. The family under it
   includes A1-350168-01-100 and A1-354990-01-100. So this is an
   order-level grouping, not an assembly hierarchy, and chasing the
   parent for material is probably a dead end. Worth confirming
   with whoever plans these jobs before we spend another round on
   it.

   IF THIS ROUND COMES UP EMPTY

   Nine rounds of inference is past the point where asking is
   cheaper. CSI support can say which table backs the Raw Material
   Traceability page in one email, and we have the exact report and
   work order to quote. Worth doing in parallel with running this.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   Y1. DATA0095 — the strongest remaining lead
   ------------------------------------------------------------- */
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0095'
ORDER BY ORDINAL_POSITION;

SELECT COUNT(*) AS total_rows FROM DATA0095;

-- Its rows for this job, by the column that held the WO RKEY
SELECT TOP 50 * FROM DATA0095 WHERE SRCE_PTR IN (874002, 874003);

-- And for the parent, in case material hangs off the order
SELECT TOP 50 * FROM DATA0095 WHERE SRCE_PTR = 865342;

-- Does it reach the report's lots? These are DATA0020 RKEYs.
SELECT TOP 50 * FROM DATA0095
WHERE INVT_LOC_PTR IN (733670, 733671, 827049, 826808, 832949,
                       835305, 844652, 825666, 834127, 834128);

-- How DATA0153 uses it: one header to many detail rows, or 1:1?
SELECT TOP 20
    t.DATA0095_PTR,
    COUNT(*) AS ledger_rows
FROM DATA0153 t
WHERE t.DATA0095_PTR > 0
GROUP BY t.DATA0095_PTR
ORDER BY ledger_rows DESC;


/* -------------------------------------------------------------
   Y2. THE SIZE LANDSCAPE — context we have never had
   -------------------------------------------------------------
   Every DATA table with its row count. Tells us what Y3 has to
   cover, and is worth keeping for any future question.
   ------------------------------------------------------------- */
SELECT
    t.name       AS TableName,
    SUM(p.rows)  AS ApproxRows
FROM sys.tables t
JOIN sys.partitions p
  ON p.object_id = t.object_id AND p.index_id IN (0, 1)
WHERE t.name LIKE 'DATA%'
GROUP BY t.name
HAVING SUM(p.rows) > 0
ORDER BY ApproxRows DESC;


/* -------------------------------------------------------------
   Y3. THE STRING SWEEP X3 SKIPPED
   -------------------------------------------------------------
   Same three lot numbers, but ONLY the tables at or above 2
   million rows — the complement of X3. Together they cover
   everything.

   This will be slow; it is scanning the big tables. Run it when
   nobody needs the server, or narrow it by removing DATA0353
   (46.5M rows of GL postings, already ruled out) from the join.
   ------------------------------------------------------------- */
DECLARE @sqlY NVARCHAR(MAX) = N'';

SELECT @sqlY = @sqlY
    + N' UNION ALL SELECT '
    + N'CAST(''' + c.TABLE_NAME  + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceTable, '
    + N'CAST(''' + c.COLUMN_NAME + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceColumn, '
    + N'COUNT(*) AS Hits'
    + N' FROM ' + QUOTENAME(c.TABLE_SCHEMA) + N'.' + QUOTENAME(c.TABLE_NAME) + N' t'
    + N' WHERE LTRIM(RTRIM(t.' + QUOTENAME(c.COLUMN_NAME) + N')) COLLATE DATABASE_DEFAULT'
    + N' IN (''2509410039'', ''20604707'', ''20764507'')'
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES tb
  ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA AND tb.TABLE_NAME = c.TABLE_NAME
 AND tb.TABLE_TYPE = 'BASE TABLE'
JOIN (
    SELECT t.name, SUM(p.rows) AS rows_total
    FROM sys.tables t
    JOIN sys.partitions p
      ON p.object_id = t.object_id AND p.index_id IN (0, 1)
    GROUP BY t.name
) sz ON sz.name = c.TABLE_NAME AND sz.rows_total >= 2000000
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND c.DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar')
  AND c.CHARACTER_MAXIMUM_LENGTH BETWEEN 8 AND 120
  AND c.TABLE_NAME <> 'DATA0353';

IF LEN(@sqlY) > 0
BEGIN
    SET @sqlY = N'SELECT * FROM ( ' + STUFF(@sqlY, 1, 11, N'')
              + N' ) q WHERE q.Hits > 0 ORDER BY q.Hits DESC';
    EXEC sp_executesql @sqlY;
END
ELSE SELECT 'no large-table text columns to search' AS note;


/* -------------------------------------------------------------
   Y4. DATA0048, FOR COMPLETENESS
   -------------------------------------------------------------
   Confirm PART_BATCH_PTR is the produced lot rather than the
   consumed one, so it is eliminated on evidence and not just on
   the absence of hits in an earlier sweep.
   ------------------------------------------------------------- */
SELECT TOP 30
    d48.RKEY, d48.WO_PTR, d48.TPUT_PTR, d48.PART_BATCH_PTR,
    d48.TDATE, d48.QTY_PROD, d48.WORK_CENTER_PTR,
    LTRIM(RTRIM(lot.BATCH_NO))        AS BatchNo,
    LTRIM(RTRIM(d17.INV_PART_NUMBER)) AS BatchPart
FROM DATA0048 d48
LEFT JOIN DATA0020 lot ON lot.RKEY = d48.PART_BATCH_PTR
LEFT JOIN DATA0017 d17 ON d17.RKEY = lot.INVENTORY_POINTER
WHERE d48.WO_PTR IN (874002, 874003)
ORDER BY d48.TDATE;


/* -------------------------------------------------------------
   Y5. THE REPORT'S OWN SQL — still unrun, still cheap
   -------------------------------------------------------------
   Reminder from round 8: with a read-only login lacking VIEW
   DEFINITION, this returns ZERO ROWS rather than an error. An
   empty result means "cannot see definitions", NOT "no such
   object". The first query distinguishes the two — if it reports
   objects exist but the second returns nothing, it is permissions.
   ------------------------------------------------------------- */
SELECT type_desc, COUNT(*) AS objects
FROM sys.objects
WHERE type_desc IN ('SQL_STORED_PROCEDURE', 'VIEW', 'SQL_SCALAR_FUNCTION',
                    'SQL_TABLE_VALUED_FUNCTION')
GROUP BY type_desc;

SELECT COUNT(*) AS modules_readable FROM sys.sql_modules;

SELECT o.type_desc, o.name AS ObjectName, LEN(m.definition) AS DefLen
FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
WHERE m.definition LIKE '%DATA0020%'
   OR m.definition LIKE '%RAW MATERIAL%'
   OR o.name LIKE '%TRACE%'
ORDER BY o.name;
