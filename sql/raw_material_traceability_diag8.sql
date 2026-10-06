/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 8
   ONE question: which table ties a BATCH/SERIAL to a WORK ORDER.

   THE GOAL, RESTATED, BECAUSE IT NARROWS THE SEARCH

   The quality team needs the certificates for the material that
   actually went into a parent work order, as evidence the part
   meets customer requirements. That is a compliance artifact, so
   "the certs for the parts on this BOM" is not an acceptable
   substitute for "the certs for the lots actually used" — it is
   the wrong answer wearing the right answer's clothes. That is
   exactly the flaw in the old material-certs query we replaced:
   374 rows, 340 lots, none of them issued to the job.

   EVERYTHING EXCEPT THE BATCH IS NOW SOLVED

     part list          DATA0006.BOM_PTR -> DATA0025/DATA0026
     country of origin  DATA9432 per lot, else DATA9421 per part
                        (round 7 resolved all 12 parts, matching
                         the printed USA / CAN / TWN exactly)
     PO number          the cert archive, keyed by lot
     certificate PDF    the cert archive, 177,521 indexed
     location / whse    DATA0016 / DATA0015

   All five become per-LOT facts only once the batch is known. So
   the batch is not one missing column among several; it is the
   join that makes the rest true.

   WHY THE EARLIER SWEEPS MISSED IT, PRECISELY

     round 4 (L3)  searched for batch NUMBERS as strings, but only
                   in columns named %BATCH% or %LOT%. Found
                   DATA0153 and DATA0020 and nothing else.
     round 5 (P1)  searched for DATA0020 RKEYs in %PTR% columns.
     round 6 (S1)  searched for the WORK ORDER's RKEY in %PTR%
                   columns.

   Each asked about one side. None asked for a table that has
   BOTH. Section X1 does, structurally, which cannot miss a table
   because of how its columns happen to be named or how its values
   happen to collide.

   ONE MORE THING THE EARLIER SWEEPS DID NOT TRY

   DATA0006 for -357152-01-100 is RKEY 874002 with PARENT_PTR and
   ROOT_PTR both 865342 — a DIFFERENT work order. The report is for
   a parent, and material may well be issued against children and
   rolled up. S1 searched 874002 and 874003 only. X2 searches the
   parent.

   PERMISSIONS — MY MISTAKE IN THE FIRST CUT

   The first version used sys.dm_db_partition_stats for row counts
   and the size cap, which fails on a read-only login with "The
   user does not have permission to perform this action" — that DMV
   needs VIEW DATABASE STATE. Replaced with sys.partitions, a
   catalog view that ordinary read access can see.

   What each section needs, so a failure is attributable:

     X1 first query   INFORMATION_SCHEMA only. Always works. This
                      is the important one.
     X1 second query  sys.partitions. Convenience only — it just
                      adds row counts so the list reads better.
     X2               the DATA0006 queries need nothing special;
                      the sweep is plain dynamic SELECT.
     X3               sys.partitions for the size cap.
     X4               sys.sql_modules. A read-only login without
                      VIEW DEFINITION sees ZERO ROWS here rather
                      than an error — so an empty X4 means "cannot
                      see definitions", NOT "no such report
                      exists". Worth knowing before concluding
                      anything from it.

   If sys.partitions is also refused, skip X1's second query and
   run X3 with the size-cap join removed; the NOT IN exclusion
   below keeps the one known-huge table out either way.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   X1. TABLES THAT CAN HOLD BOTH A WORK ORDER AND A BATCH
   -------------------------------------------------------------
   Structural, not value-based. Any table listed here is capable of
   being the link; the rest of this file is just picking between
   them. This is the query the last four rounds should have opened
   with.
   ------------------------------------------------------------- */
WITH WoTables AS (
    SELECT DISTINCT TABLE_SCHEMA, TABLE_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME LIKE 'DATA%'
      AND (COLUMN_NAME LIKE '%WO_PTR%'
        OR COLUMN_NAME LIKE '%WORK_ORDER%'
        OR COLUMN_NAME LIKE '%WOPTR%')
),
LotTables AS (
    SELECT DISTINCT TABLE_SCHEMA, TABLE_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME LIKE 'DATA%'
      AND (COLUMN_NAME LIKE '%BATCH%'
        OR COLUMN_NAME LIKE '%LOT%'
        OR COLUMN_NAME LIKE '%SERIAL%'
        OR COLUMN_NAME LIKE '%DATA0020%')
)
SELECT c.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN WoTables  w ON w.TABLE_SCHEMA = c.TABLE_SCHEMA AND w.TABLE_NAME = c.TABLE_NAME
JOIN LotTables l ON l.TABLE_SCHEMA = c.TABLE_SCHEMA AND l.TABLE_NAME = c.TABLE_NAME
ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;

-- Just the table names, with row counts, so the list is readable at
-- a glance and an obviously-huge table can be set aside.
WITH WoTables AS (
    SELECT DISTINCT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME LIKE 'DATA%'
      AND (COLUMN_NAME LIKE '%WO_PTR%' OR COLUMN_NAME LIKE '%WORK_ORDER%'
        OR COLUMN_NAME LIKE '%WOPTR%')
),
LotTables AS (
    SELECT DISTINCT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME LIKE 'DATA%'
      AND (COLUMN_NAME LIKE '%BATCH%' OR COLUMN_NAME LIKE '%LOT%'
        OR COLUMN_NAME LIKE '%SERIAL%' OR COLUMN_NAME LIKE '%DATA0020%')
)
SELECT
    t.name          AS TableName,
    SUM(p.rows)     AS ApproxRows
FROM sys.tables t
-- sys.partitions, NOT sys.dm_db_partition_stats. The DMV needs VIEW DATABASE
-- STATE, which a read-only login does not have; sys.partitions is a catalog
-- view and is visible with ordinary read access.
JOIN sys.partitions p
  ON p.object_id = t.object_id AND p.index_id IN (0, 1)
WHERE t.name IN (SELECT TABLE_NAME FROM WoTables)
  AND t.name IN (SELECT TABLE_NAME FROM LotTables)
GROUP BY t.name
ORDER BY ApproxRows DESC;


/* -------------------------------------------------------------
   X2. THE PARENT WORK ORDER
   -------------------------------------------------------------
   874002 is -357152-01-100; its PARENT_PTR and ROOT_PTR are both
   865342. If material hangs off the parent rather than the child,
   every sweep so far looked at the wrong key.
   ------------------------------------------------------------- */
SELECT RKEY, LTRIM(RTRIM(WORK_ORDER_NUMBER)) AS WorkOrderNumber,
       PARENT_PTR, ROOT_PTR, LOT_NUMBER_COUNT, QUAN_SCH, RELEASE_DATE
FROM DATA0006
WHERE RKEY IN (865342, 865343, 874002, 874003);

-- Everything whose parent or root is 865342 — the full family
SELECT RKEY, LTRIM(RTRIM(WORK_ORDER_NUMBER)) AS WorkOrderNumber,
       PARENT_PTR, ROOT_PTR, LOT_NUMBER_COUNT
FROM DATA0006
WHERE PARENT_PTR = 865342 OR ROOT_PTR = 865342 OR RKEY = 865342
ORDER BY WorkOrderNumber;

-- And the pointer sweep again, this time for the parent
DECLARE @sqlX NVARCHAR(MAX) = N'';
SELECT @sqlX = @sqlX
    + N' UNION ALL SELECT '
    + N'CAST(''' + c.TABLE_NAME  + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceTable, '
    + N'CAST(''' + c.COLUMN_NAME + N''' AS VARCHAR(128)) COLLATE DATABASE_DEFAULT AS SourceColumn, '
    + N'COUNT(*) AS Hits'
    + N' FROM ' + QUOTENAME(c.TABLE_SCHEMA) + N'.' + QUOTENAME(c.TABLE_NAME) + N' t'
    + N' WHERE t.' + QUOTENAME(c.COLUMN_NAME) + N' = 865342'
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES tb
  ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA AND tb.TABLE_NAME = c.TABLE_NAME
 AND tb.TABLE_TYPE = 'BASE TABLE'
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND c.DATA_TYPE IN ('int', 'bigint', 'numeric', 'decimal')
  AND (c.COLUMN_NAME LIKE '%PTR%' OR c.COLUMN_NAME LIKE '%POINTER%');

IF LEN(@sqlX) > 0
BEGIN
    SET @sqlX = N'SELECT * FROM ( ' + STUFF(@sqlX, 1, 11, N'')
              + N' ) q WHERE q.Hits > 0 ORDER BY q.Hits ASC, q.SourceTable';
    EXEC sp_executesql @sqlX;
END
ELSE SELECT 'no candidate pointer columns found' AS note;


/* -------------------------------------------------------------
   X3. THE BATCH VALUE, IN EVERY TEXT COLUMN, NOT JUST BATCH-NAMED
   -------------------------------------------------------------
   Round 4 only looked in columns named %BATCH% or %LOT%, which is
   why it concluded "only two tables" — a clean answer to the wrong
   question. This searches EVERY character column wide enough to
   hold a lot number, in every table under 2 million rows.

   The size cap is the point: without it this would scan DATA0353's
   46.5 million rows and several like it. One distinctive value
   (2509410039) keeps false positives near zero.

   This one will take a few minutes. It is the backstop if X1 does
   not produce an obvious winner.
   ------------------------------------------------------------- */
DECLARE @sqlV NVARCHAR(MAX) = N'';

SELECT @sqlV = @sqlV
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
) sz ON sz.name = c.TABLE_NAME AND sz.rows_total < 2000000
WHERE c.TABLE_NAME LIKE 'DATA%'
  AND c.DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar')
  AND c.CHARACTER_MAXIMUM_LENGTH BETWEEN 8 AND 120
  -- Belt and braces: the one table we have measured as enormous
  -- (46,579,769 rows of GL postings) stays out regardless.
  AND c.TABLE_NAME NOT IN ('DATA0353');

IF LEN(@sqlV) > 0
BEGIN
    SET @sqlV = N'SELECT * FROM ( ' + STUFF(@sqlV, 1, 11, N'')
              + N' ) q WHERE q.Hits > 0 ORDER BY q.Hits DESC';
    EXEC sp_executesql @sqlV;
END
ELSE SELECT 'no candidate text columns found' AS note;


/* -------------------------------------------------------------
   X4. STILL WORTH RUNNING — THE REPORT'S OWN SQL
   -------------------------------------------------------------
   Carried over from round 7 unrun. If Paradigm ships this report
   as a view or procedure, it names the table outright and X1-X3
   become unnecessary. Cheap, so run it first.
   ------------------------------------------------------------- */
SELECT type_desc, COUNT(*) AS objects
FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
GROUP BY type_desc;

SELECT o.type_desc, o.name AS ObjectName, LEN(m.definition) AS DefLen
FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
WHERE m.definition LIKE '%DATA0020%'
   OR m.definition LIKE '%RAW MATERIAL%'
   OR o.name LIKE '%TRACE%'
ORDER BY o.name;
