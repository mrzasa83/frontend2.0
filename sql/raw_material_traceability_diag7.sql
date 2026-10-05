/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — round 7
   Stop reverse-engineering. Ask the database for the answer.

   WHY THIS ROUND LOOKS DIFFERENT

   Six rounds of inferring a report's sources from its output is a
   lot, and section W1 is the query I should have written first: if
   Paradigm's Raw Material Traceability page is backed by a stored
   procedure or a view, its SQL is sitting in sys.sql_modules and
   every remaining question — the PO table, the work-order-to-
   material link, the C of O fallback — is answered at once, from
   the source rather than by deduction.

   Run W1 first. If it finds the report, most of the rest of this
   file is unnecessary.

   WHAT ROUND 6 SETTLED

   DATA0353 is ruled out properly: 46,579,769 rows, and its columns
   are JOURNAL_PTR / GL_ACCT_PTR / DEBIT_AMOUNT / CREDIT_AMOUNT. It
   is general-ledger postings. The 688 hits were range collisions,
   exactly as the hit-count warning predicted — the sweep's biggest
   number was again its least meaningful.

   DATA0618 is ruled out too: PHY_COUNT_NO, COUNT_QTY, QTY_ON_HAND
   make it physical/cycle counting, not work-order material.

   AND MY C OF O COLUMN IS ONLY 30% POPULATED

   DATA9432 resolved 3 of 10 lots. Where it resolves it is right —
   50229495 -> CAN and 20558610 -> TWN both match the printed page.
   But the page shows a country on EVERY line, so Paradigm falls
   back to something else. W2 tests the obvious candidate: the
   inventory part's own C of O in DATA9421, keyed DATA0017_PTR.

   The app now warns that a blank means "not recorded against that
   lot", because an empty country-of-origin cell in a compliance
   context otherwise reads as "unrestricted".

   REMAINING LINK CANDIDATES, after the eliminations above

       DATA0038.SOURCE_PTR      160 hits
       DATA0048.WO_PTR          117
       DATA0056.WO_PTR          117
       DATA0463.WO_PTR          117
       DATA0505.WO_PTR          108
       DATA0047.SOURCE_POINTER   68

   The three at exactly 117 for two work orders (~58 each) smell
   like route steps rather than material. W3 settles it by looking.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   W1. FIND THE REPORT'S OWN SQL
   -------------------------------------------------------------
   Any stored procedure, view or function whose text mentions raw
   material traceability, or which joins the lot table to the work
   order table. If Paradigm ships this report as a database object,
   this hands us the definitive answer.
   ------------------------------------------------------------- */
SELECT
    o.type_desc,
    SCHEMA_NAME(o.schema_id) AS SchemaName,
    o.name                   AS ObjectName,
    LEN(m.definition)        AS DefinitionLength
FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
WHERE m.definition LIKE '%RAW MATERIAL%'
   OR m.definition LIKE '%RAW_MATERIAL%'
   OR o.name LIKE '%RAW%MAT%'
   OR o.name LIKE '%TRACE%'
ORDER BY o.name;

-- Anything that joins lots to work orders, whatever it is called
SELECT
    o.type_desc,
    o.name            AS ObjectName,
    LEN(m.definition) AS DefinitionLength
FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
WHERE m.definition LIKE '%DATA0020%'
  AND (m.definition LIKE '%DATA0006%' OR m.definition LIKE '%WORK_ORDER%')
ORDER BY LEN(m.definition);

-- How many programmable objects exist at all. Zero means Paradigm
-- builds its reports in the client, and W1 is a dead end.
SELECT type_desc, COUNT(*) AS objects
FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
GROUP BY type_desc;

-- To read one once W1 names it:
-- SELECT m.definition FROM sys.sql_modules m
-- JOIN sys.objects o ON o.object_id = m.object_id
-- WHERE o.name = '<name from above>';


/* -------------------------------------------------------------
   W2. THE C OF O FALLBACK
   -------------------------------------------------------------
   DATA9421 is keyed DATA0017_PTR — the inventory PART rather than
   the lot. If the parts whose lots had no DATA9432 row resolve
   here to the countries the report prints, the rule is simply
   "lot first, else part".

   Expected from the printed page:
       AL0100CU1OZ2529     (part 1797)   -> USA
       CU1OZAL01002529     (part 22606)  -> USA
       PPGWI0010272824     (part 126047) -> TWN
       PPGWI0010602824     (part 111384) -> TWN
       WIA0035R2RH2824     (part 126048) -> TWN
       WIA0035RHRH2824     (part 122489) -> TWN
   ------------------------------------------------------------- */
SELECT
    LTRIM(RTRIM(d17.INV_PART_NUMBER)) AS InventoryPart,
    d17.RKEY                          AS PartRkey,
    p.C_OF_O_PTR,
    LTRIM(RTRIM(ctry.COUNTRY_CODE))   AS CountryCode,
    LTRIM(RTRIM(ctry.COUNTRY_NAME))   AS CountryName
FROM DATA0017 d17
OUTER APPLY (
    SELECT TOP 1 x.C_OF_O_PTR FROM DATA9421 x
    WHERE x.DATA0017_PTR = d17.RKEY ORDER BY x.RKEY DESC
) p
LEFT JOIN DATA0250 ctry ON ctry.COUNTRY_RKEY = p.C_OF_O_PTR
WHERE d17.RKEY IN (1797, 22606, 122489, 126047, 126048, 111384,
                   111382, 125794, 125807, 109585, 113477, 113478);

-- How complete is each source overall? If DATA9421 covers nearly
-- every part, the fallback is worth having; if it is as sparse as
-- DATA9432, the report gets C of O from somewhere else entirely.
SELECT 'DATA9432 (per lot)'  AS Source, COUNT(*) AS rows_total,
       SUM(CASE WHEN C_OF_O_PTR > 0 THEN 1 ELSE 0 END) AS with_country
FROM DATA9432
UNION ALL
SELECT 'DATA9421 (per part)', COUNT(*),
       SUM(CASE WHEN C_OF_O_PTR > 0 THEN 1 ELSE 0 END)
FROM DATA9421;


/* -------------------------------------------------------------
   W3. THE LINK CANDIDATES — just look at them
   -------------------------------------------------------------
   Shape first, then this work order's rows. A material table will
   have an inventory pointer and ideally a lot/batch pointer; a
   route table will have step numbers and work centres.
   ------------------------------------------------------------- */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('DATA0038','DATA0047','DATA0048','DATA0056',
                     'DATA0463','DATA0505')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT 'DATA0038' AS t, COUNT(*) AS rows_total FROM DATA0038
UNION ALL SELECT 'DATA0047', COUNT(*) FROM DATA0047
UNION ALL SELECT 'DATA0048', COUNT(*) FROM DATA0048
UNION ALL SELECT 'DATA0056', COUNT(*) FROM DATA0056
UNION ALL SELECT 'DATA0463', COUNT(*) FROM DATA0463
UNION ALL SELECT 'DATA0505', COUNT(*) FROM DATA0505;

-- This job's rows in the two most promising ones
SELECT TOP 30 * FROM DATA0056 WHERE WO_PTR IN (874002, 874003);
SELECT TOP 30 * FROM DATA0505 WHERE WO_PTR IN (874002, 874003);


/* -------------------------------------------------------------
   W4. THE PO TABLE — counts only, so nothing gets lost
   -------------------------------------------------------------
   T1 returned "2134 rows" twice with no visible output, so this
   asks for one small number per table instead. Whichever table has
   a non-zero count is where PURO numbers live; then drill in.
   ------------------------------------------------------------- */
SELECT 'DATA0070' AS SourceTable, COUNT(*) AS puro_rows FROM DATA0070
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA0097', COUNT(*) FROM DATA0097
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA0222', COUNT(*) FROM DATA0222
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA0239', COUNT(*) FROM DATA0239
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA0240', COUNT(*) FROM DATA0240
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA0301', COUNT(*) FROM DATA0301
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA0302', COUNT(*) FROM DATA0302
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA0312', COUNT(*) FROM DATA0312
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA0325', COUNT(*) FROM DATA0325
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA0384', COUNT(*) FROM DATA0384
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%'
UNION ALL SELECT 'DATA9414', COUNT(*) FROM DATA9414
  WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT LIKE 'PURO%';

-- The exact PO the report prints, and whether its RKEY matches a
-- PO_PTR we hold. Swap in whichever table W4 names.
-- SELECT RKEY, LTRIM(RTRIM(PO_NUMBER)) AS PONumber
-- FROM <table> WHERE LTRIM(RTRIM(PO_NUMBER)) COLLATE DATABASE_DEFAULT
--     IN ('PURO136141','PURO134929','PURO114865','PURO135742');
