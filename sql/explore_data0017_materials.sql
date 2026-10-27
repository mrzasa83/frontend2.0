/*
  DATA0017 — what do we actually have, and is "size" a column or part of a name?

  Context: Material Mgt lists ~21k active purchased parts. The goal is to pull
  out BOARD materials (laminate, prepreg, copper foil) and find their sizes.
  Before writing any of that into the app, these four answer whether the data
  supports it or whether it all has to be parsed out of free text.

  Read-only. SELECT only, NOLOCK throughout.
*/

-- ---------------------------------------------------------------------------
-- Q1. Every column on DATA0017, with type and length.
--     Looking for: dimension/size/thickness/width/length columns, a unit of
--     measure, and above all a CLASS / COMMODITY / GROUP / TYPE code. If a
--     commodity code exists and is populated, board materials are already
--     classified and none of the name archaeology is necessary.
-- ---------------------------------------------------------------------------
SELECT  ORDINAL_POSITION, COLUMN_NAME, DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH AS Len, NUMERIC_PRECISION AS Prec, IS_NULLABLE
FROM    INFORMATION_SCHEMA.COLUMNS
WHERE   TABLE_NAME = 'DATA0017'
ORDER BY ORDINAL_POSITION;


-- ---------------------------------------------------------------------------
-- Q2. Five real laminate-ish rows, every column.
--     Faster than guessing from the column list: it shows which columns are
--     actually populated and what the values look like. Swap the LIKE for a
--     prefix you know is board material if AL isn't the right one.
-- ---------------------------------------------------------------------------
SELECT TOP 5 *
FROM   DATA0017 WITH (NOLOCK)
WHERE  P_M = 'P' AND ACTIVE_FLAG = 'Y'
   AND INV_PART_NUMBER LIKE 'AL%'
ORDER BY INV_PART_NUMBER;


-- ---------------------------------------------------------------------------
-- Q3. Naming archaeology: how many active purchased parts sit under each
--     2-character prefix, with examples.
--     This is the map of how numbering has drifted. A prefix with 400 parts
--     and a consistent description shape is a convention; a prefix with 3 is
--     someone's afternoon in 2009.
-- ---------------------------------------------------------------------------
SELECT  LEFT(LTRIM(INV_PART_NUMBER), 2)              AS Prefix2,
        COUNT(*)                                     AS Parts,
        MIN(LTRIM(RTRIM(INV_PART_NUMBER)))           AS FirstExample,
        MAX(LTRIM(RTRIM(INV_PART_NUMBER)))           AS LastExample,
        MIN(LTRIM(RTRIM(INV_PART_DESCRIPTION)))      AS ExampleDescription
FROM    DATA0017 WITH (NOLOCK)
WHERE   P_M = 'P' AND ACTIVE_FLAG = 'Y'
    AND INV_PART_NUMBER NOT LIKE 'Z%'
GROUP BY LEFT(LTRIM(INV_PART_NUMBER), 2)
ORDER BY COUNT(*) DESC;


-- ---------------------------------------------------------------------------
-- Q4. Where the board materials probably are: description keyword counts.
--     Each row is independent, so a part containing both "LAMINATE" and "FR4"
--     is counted twice. That is deliberate — the point is which words are
--     worth keying on, not a clean partition.
-- ---------------------------------------------------------------------------
SELECT k.Keyword,
       (SELECT COUNT(*) FROM DATA0017 WITH (NOLOCK)
         WHERE P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
           AND INV_PART_DESCRIPTION LIKE '%' + k.Keyword + '%') AS Parts
FROM  (VALUES
        ('LAMINATE'), ('LAM '), ('PREPREG'), ('PP '), ('CORE'),
        ('COPPER'), ('CU '), ('FOIL'), ('OZ'),
        ('FR4'), ('FR-4'), ('370'), ('IS400'), ('IS410'), ('TU-'), ('MEGTRON'),
        ('ROGERS'), ('RO4'), ('POLYIMIDE'), ('PI '), ('COVERLAY'), ('BONDPLY'),
        ('STIFFENER'), ('ADHESIVE'), ('MASK'), ('DRILL'), ('ENTRY'), ('BACKUP')
      ) AS k(Keyword)
ORDER BY Parts DESC;
