/* ───────────────────────────────────────────────────────────────────────────
   Where does the "Additional Route Step Parameters" NOTE live?

   Step 31 of 76453 has a parameter named INSTRUCTIONS whose Value column is
   empty and whose text sits in the Note box beside it. Our ROUTE_SQL reads
   DATA0471.PARAMETER_VALUE and nothing else, so the card prints
   "INSTRUCTIONS =" with nothing after it.

   This does NOT assume where the note is. Q3 reads every column of the row so
   a note column on DATA0471 itself would show; Q5 and Q6 look for it in the
   two notepad tables we already use, by pointer AND by text. Both approaches
   are included on purpose: a name-based hunt alone has already produced a
   confident wrong answer in this project once.

   Read-only.
   ─────────────────────────────────────────────────────────────────────────── */
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

DECLARE @Part VARCHAR(60) = '76453';
DECLARE @Step INT         = 31;


/* Q1 — the route step row itself. Note the RKEY: Q3/Q6 key off it.
        Expect one row (TTYPE 4 = the released customer-part route). If more
        than one comes back, say which, because the rest of this file assumes
        a single step. */
SELECT
    d38.RKEY            AS Data0038_RKEY,
    d38.TTYPE,
    d38.SOURCE_PTR,
    d38.STEP_NUMBER,
    RTRIM(d34.DEPT_CODE)                   AS DeptCode,
    RTRIM(d34.DEPT_NAME)                   AS DeptName,
    LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) AS AsCustomerPart,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS AsInventoryPart
FROM DATA0038 d38 WITH (NOLOCK)
LEFT JOIN DATA0034 d34 WITH (NOLOCK) ON d34.RKEY = d38.DEPT_PTR
-- The step hangs off either a customer part or an inventory part, depending
-- on the route; both are resolved so it is clear which this is.
LEFT JOIN DATA0050 d50 WITH (NOLOCK) ON d50.RKEY = d38.SOURCE_PTR
LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d38.SOURCE_PTR
WHERE d38.STEP_NUMBER = @Step
  AND (  LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT = @Part COLLATE DATABASE_DEFAULT
      OR LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT LIKE (@Part + ' %') COLLATE DATABASE_DEFAULT
      OR LTRIM(RTRIM(d17.INV_PART_NUMBER))      COLLATE DATABASE_DEFAULT = @Part COLLATE DATABASE_DEFAULT )
ORDER BY d38.TTYPE, d38.RKEY;


/* Q2 — every column DATA0471 has, with type and length.
        This is the cheapest way to see whether the note is a column on the
        value row itself (a NOTE/TEXT/MEMO column, or a pointer to one). */
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0471'
ORDER BY ORDINAL_POSITION;


/* Q3 — the actual additional-parameter rows for that step, ALL columns.
        Expect a row whose definition is INSTRUCTIONS with PARAMETER_VALUE
        blank. Whatever column carries "MEASURE THE FINISHED ETCH CRITERIA…"
        will be visible here if it lives on this table. */
SELECT
    d469.PARAMETER_CODE,
    d469.PARAMETER_DESC,
    d471.*
FROM DATA0471 d471 WITH (NOLOCK)
INNER JOIN DATA0469 d469 WITH (NOLOCK) ON d469.RKEY = d471.DATA0469_PTR
WHERE d471.DATA0038_PTR IN (
    SELECT d38.RKEY
    FROM DATA0038 d38 WITH (NOLOCK)
    LEFT JOIN DATA0050 d50 WITH (NOLOCK) ON d50.RKEY = d38.SOURCE_PTR
    LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d38.SOURCE_PTR
    WHERE d38.STEP_NUMBER = @Step
      AND (  LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT = @Part COLLATE DATABASE_DEFAULT
          OR LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT LIKE (@Part + ' %') COLLATE DATABASE_DEFAULT
          OR LTRIM(RTRIM(d17.INV_PART_NUMBER))      COLLATE DATABASE_DEFAULT = @Part COLLATE DATABASE_DEFAULT )
)
ORDER BY d471.SEQUENCE_NO;


/* Q4 — the INSTRUCTIONS definition row, all columns.
        Tells us whether INSTRUCTIONS is flagged as a note-bearing parameter
        rather than a value-bearing one — which would mean the fix is general,
        not specific to this part. */
SELECT * FROM DATA0469 WITH (NOLOCK)
WHERE LTRIM(RTRIM(ISNULL(PARAMETER_CODE,''))) COLLATE DATABASE_DEFAULT
        LIKE '%INSTRUCTION%' COLLATE DATABASE_DEFAULT
   OR LTRIM(RTRIM(ISNULL(PARAMETER_DESC,''))) COLLATE DATABASE_DEFAULT
        LIKE '%INSTRUCTION%' COLLATE DATABASE_DEFAULT
ORDER BY RKEY;


/* Q5 — find the note TEXT in the two notepad tables we already read.
        DATA0211 (SOURCE_POINTER + SOURCE_TYPE) is the customer-part notepad;
        DATA0011 (FILE_POINTER + SOURCE_TYPE) is the comments table. Searching
        for the known string is the one method that cannot give a false
        positive: if the text is here, this finds it and names the SOURCE_TYPE
        and the pointer, which is everything the fix needs.

        If BOTH come back empty the note is somewhere else entirely — say so
        and do not assume it is on DATA0471. */
SELECT 'DATA0211' AS Src, d211.RKEY, d211.SOURCE_POINTER, d211.SOURCE_TYPE,
       d211.SEQUENCE_NUMBER, LTRIM(RTRIM(d211.NOTEPAD_TEXT)) AS NoteText
FROM DATA0211 d211 WITH (NOLOCK)
WHERE d211.NOTEPAD_TEXT COLLATE DATABASE_DEFAULT
      LIKE '%FINISHED ETCH CRITERIA%' COLLATE DATABASE_DEFAULT

UNION ALL

SELECT 'DATA0011', d11.RKEY, d11.FILE_POINTER, d11.SOURCE_TYPE,
       NULL, LTRIM(RTRIM(CAST(d11.NOTE_PAD_LINE_1 AS NVARCHAR(MAX))))
FROM DATA0011 d11 WITH (NOLOCK)
WHERE CAST(d11.NOTE_PAD_LINE_1 AS NVARCHAR(MAX)) COLLATE DATABASE_DEFAULT
      LIKE '%FINISHED ETCH CRITERIA%' COLLATE DATABASE_DEFAULT;


/* Q6 — the same two tables, reached by POINTER instead of by text.
        Runs independently of Q5 on purpose. A note attached to the DATA0471
        row (or to the DATA0038 step) shows here even if the text search
        missed because the wording differs from the screenshot. Report the
        SOURCE_TYPE values that come back — that is what the fix filters on. */
DECLARE @StepRkey INT, @ParamRkey INT;

SELECT TOP 1 @StepRkey = d38.RKEY
FROM DATA0038 d38 WITH (NOLOCK)
LEFT JOIN DATA0050 d50 WITH (NOLOCK) ON d50.RKEY = d38.SOURCE_PTR
LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d38.SOURCE_PTR
WHERE d38.STEP_NUMBER = @Step
  AND (  LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT = @Part COLLATE DATABASE_DEFAULT
      OR LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT LIKE (@Part + ' %') COLLATE DATABASE_DEFAULT
      OR LTRIM(RTRIM(d17.INV_PART_NUMBER))      COLLATE DATABASE_DEFAULT = @Part COLLATE DATABASE_DEFAULT )
ORDER BY d38.TTYPE, d38.RKEY;

SELECT TOP 1 @ParamRkey = d471.RKEY
FROM DATA0471 d471 WITH (NOLOCK)
INNER JOIN DATA0469 d469 WITH (NOLOCK) ON d469.RKEY = d471.DATA0469_PTR
WHERE d471.DATA0038_PTR = @StepRkey
  AND LTRIM(RTRIM(ISNULL(d469.PARAMETER_CODE, d469.PARAMETER_DESC))) COLLATE DATABASE_DEFAULT
      LIKE '%INSTRUCTION%' COLLATE DATABASE_DEFAULT;

SELECT @StepRkey AS StepRkey, @ParamRkey AS InstructionsParamRkey;

SELECT 'DATA0211 by param' AS Via, RKEY, SOURCE_POINTER, SOURCE_TYPE,
       SEQUENCE_NUMBER, LTRIM(RTRIM(NOTEPAD_TEXT)) AS NoteText
FROM DATA0211 WITH (NOLOCK) WHERE SOURCE_POINTER = @ParamRkey
UNION ALL
SELECT 'DATA0211 by step', RKEY, SOURCE_POINTER, SOURCE_TYPE,
       SEQUENCE_NUMBER, LTRIM(RTRIM(NOTEPAD_TEXT))
FROM DATA0211 WITH (NOLOCK) WHERE SOURCE_POINTER = @StepRkey
ORDER BY Via, SOURCE_TYPE, SEQUENCE_NUMBER;

SELECT 'DATA0011 by param' AS Via, RKEY, FILE_POINTER, SOURCE_TYPE,
       LTRIM(RTRIM(CAST(NOTE_PAD_LINE_1 AS NVARCHAR(MAX)))) AS Line1
FROM DATA0011 WITH (NOLOCK) WHERE FILE_POINTER = @ParamRkey
UNION ALL
SELECT 'DATA0011 by step', RKEY, FILE_POINTER, SOURCE_TYPE,
       LTRIM(RTRIM(CAST(NOTE_PAD_LINE_1 AS NVARCHAR(MAX))))
FROM DATA0011 WITH (NOLOCK) WHERE FILE_POINTER = @StepRkey
ORDER BY Via, SOURCE_TYPE;


/* ───────────────────────────────────────────────────────────────────────────
   SEPARATE ISSUE, found while reading ROUTE_SQL. Worth running regardless.
   ─────────────────────────────────────────────────────────────────────────── */

/* Q7 — how often a DEFINED inline parameter carries a BLANK value.
        The old query built the name list from "a definition exists" and the
        value list from "a value is non-empty", then zipped them by position.
        Every row counted here had its values shifted up onto the wrong names
        — a wrong value printed, not a missing one. The fix keys both lists on
        the definition. A non-zero count here says the fix was needed; the
        size says how much of the card data was affected. */
SELECT
    COUNT(*) AS StepsWithABlankDefinedParameter
FROM DATA0038 d38 WITH (NOLOCK)
LEFT JOIN DATA0035 p1 WITH (NOLOCK) ON p1.RKEY = d38.DEF_ROUT_PARA_1_PTR
LEFT JOIN DATA0035 p2 WITH (NOLOCK) ON p2.RKEY = d38.DEF_ROUT_PARA_2_PTR
LEFT JOIN DATA0035 p3 WITH (NOLOCK) ON p3.RKEY = d38.DEF_ROUT_PARA_3_PTR
LEFT JOIN DATA0035 p4 WITH (NOLOCK) ON p4.RKEY = d38.DEF_ROUT_PARA_4_PTR
LEFT JOIN DATA0035 p5 WITH (NOLOCK) ON p5.RKEY = d38.DEF_ROUT_PARA_5_PTR
LEFT JOIN DATA0035 p6 WITH (NOLOCK) ON p6.RKEY = d38.DEF_ROUT_PARA_6_PTR
WHERE (p1.PRODUCTION_PARAMETER IS NOT NULL AND LTRIM(RTRIM(ISNULL(d38.PARAMETER_1,''))) = '')
   OR (p2.PRODUCTION_PARAMETER IS NOT NULL AND LTRIM(RTRIM(ISNULL(d38.PARAMETER_2,''))) = '')
   OR (p3.PRODUCTION_PARAMETER IS NOT NULL AND LTRIM(RTRIM(ISNULL(d38.PARAMETER_3,''))) = '')
   OR (p4.PRODUCTION_PARAMETER IS NOT NULL AND LTRIM(RTRIM(ISNULL(d38.PARAMETER_4,''))) = '')
   OR (p5.PRODUCTION_PARAMETER IS NOT NULL AND LTRIM(RTRIM(ISNULL(d38.PARAMETER_5,''))) = '');


/* Q8 — are parameter slots 7..10 ever used?
        ROUTE_SQL joins DATA0035 for slots 7, 8, 9 and 10 but never reads
        their names or their values, so anything stored there is silently
        dropped from the card. If this returns zero the joins are dead weight;
        if not, the card is missing parameters and that is a third fix. */
SELECT
    SUM(CASE WHEN p7.PRODUCTION_PARAMETER  IS NOT NULL THEN 1 ELSE 0 END) AS Slot7Defined,
    SUM(CASE WHEN p8.PRODUCTION_PARAMETER  IS NOT NULL THEN 1 ELSE 0 END) AS Slot8Defined,
    SUM(CASE WHEN p9.PRODUCTION_PARAMETER  IS NOT NULL THEN 1 ELSE 0 END) AS Slot9Defined,
    SUM(CASE WHEN p10.PRODUCTION_PARAMETER IS NOT NULL THEN 1 ELSE 0 END) AS Slot10Defined
FROM DATA0038 d38 WITH (NOLOCK)
LEFT JOIN DATA0035 p7  WITH (NOLOCK) ON p7.RKEY  = d38.DEF_ROUT_PARA_7_PTR
LEFT JOIN DATA0035 p8  WITH (NOLOCK) ON p8.RKEY  = d38.DEF_ROUT_PARA_8_PTR
LEFT JOIN DATA0035 p9  WITH (NOLOCK) ON p9.RKEY  = d38.DEF_ROUT_PARA_9_PTR
LEFT JOIN DATA0035 p10 WITH (NOLOCK) ON p10.RKEY = d38.DEF_ROUT_PARA_10_PTR;
