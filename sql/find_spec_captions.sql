/* ============================================================================
   Where do the PROD_SPEC / PROD_PARA captions live?

   DATA0045 holds the VALUES (PROD_SPEC_01..20) but no captions. The batch card
   currently uses a positional list read off the 12807 printout — "01 is
   MATERIAL, 02 is WELDABLE" and so on — which works but is inferred, not
   sourced. Positions 13 (EDGE DIST) and 15 (HOMOGENOUS) are unconfirmed
   because they're blank on 12807.

   These queries find the real caption table by searching for the caption TEXT
   itself. Same technique that located the notepad table earlier.
   ============================================================================ */


/* ---------------------------------------------------------------------------
   1. Hunt for the word WELDABLE anywhere in the database.
   Whichever table holds it is the caption source. Slow-ish (a few minutes) but
   definitive; it only has to be run once.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('tempdb..#hits') IS NOT NULL DROP TABLE #hits;
CREATE TABLE #hits (table_name sysname, column_name sysname, hits int);

DECLARE @sql nvarchar(max), @t sysname, @c sysname;
DECLARE @needle nvarchar(100) = N'%WELDABLE%';

DECLARE cur CURSOR FAST_FORWARD FOR
    SELECT t.name, c.name
    FROM sys.tables t
    JOIN sys.columns c  ON c.object_id = t.object_id
    JOIN sys.types  ty  ON ty.user_type_id = c.user_type_id
    WHERE ty.name IN ('char','varchar','nchar','nvarchar','text','ntext')
      AND (c.max_length >= 6 OR c.max_length = -1)
    ORDER BY t.name, c.name;

OPEN cur;
FETCH NEXT FROM cur INTO @t, @c;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'INSERT INTO #hits (table_name, column_name, hits)
                 SELECT N' + QUOTENAME(@t, '''') + N', N' + QUOTENAME(@c, '''') + N', COUNT(*)
                 FROM ' + QUOTENAME(@t) + N' WITH (NOLOCK)
                 WHERE CAST(' + QUOTENAME(@c) + N' AS NVARCHAR(MAX)) LIKE @needle';
    BEGIN TRY EXEC sp_executesql @sql, N'@needle nvarchar(100)', @needle = @needle; END TRY
    BEGIN CATCH END CATCH
    FETCH NEXT FROM cur INTO @t, @c;
END
CLOSE cur; DEALLOCATE cur;

SELECT * FROM #hits WHERE hits > 0 ORDER BY hits DESC;


/* ---------------------------------------------------------------------------
   2. Likely candidates, checked directly — cheaper than the sweep above.
   A caption table usually sits next to the data table it describes.
   --------------------------------------------------------------------------- */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('DATA0043','DATA0046','DATA0048','DATA0049','DATA0042')
ORDER BY TABLE_NAME, ORDINAL_POSITION;


/* ---------------------------------------------------------------------------
   3. Any column ANYWHERE named like a spec/parameter caption holder.
   --------------------------------------------------------------------------- */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE (COLUMN_NAME LIKE '%SPEC%NAME%' OR COLUMN_NAME LIKE '%SPEC%DESC%'
    OR COLUMN_NAME LIKE '%SPEC%LABEL%' OR COLUMN_NAME LIKE '%SPEC%CAPTION%'
    OR COLUMN_NAME LIKE '%PARA%NAME%'  OR COLUMN_NAME LIKE '%PARA%DESC%'
    OR COLUMN_NAME LIKE '%PROMPT%')
  AND TABLE_NAME LIKE 'DATA%'
ORDER BY TABLE_NAME, COLUMN_NAME;


/* ---------------------------------------------------------------------------
   4. Meanwhile — confirm positions 13 and 15 from real data.
   Find parts where PROD_SPEC_13 or PROD_SPEC_15 is populated; whatever those
   values look like says which caption belongs where. A dimension is EDGE DIST;
   a Y/N is HOMOGENOUS.
   --------------------------------------------------------------------------- */
SELECT TOP 20
    LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) AS PART,
    LTRIM(RTRIM(d45.PROD_SPEC_13))         AS SPEC_13,
    LTRIM(RTRIM(d45.PROD_SPEC_15))         AS SPEC_15,
    LTRIM(RTRIM(d45.PROD_SPEC_18))         AS SPEC_18,
    LTRIM(RTRIM(d45.PROD_SPEC_19))         AS SPEC_19,
    LTRIM(RTRIM(d45.PROD_SPEC_20))         AS SPEC_20
FROM DATA0045 d45 WITH (NOLOCK)
JOIN DATA0050 d50 WITH (NOLOCK) ON d50.RKEY = d45.SOURCE_PTR
WHERE d45.SOURCE_TYPE = 2
  AND (LTRIM(RTRIM(COALESCE(d45.PROD_SPEC_13,''))) <> ''
    OR LTRIM(RTRIM(COALESCE(d45.PROD_SPEC_15,''))) <> ''
    OR LTRIM(RTRIM(COALESCE(d45.PROD_SPEC_18,''))) <> '')
ORDER BY d50.CUSTOMER_PART_NUMBER;
