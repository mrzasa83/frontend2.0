/* ============================================================================
   Batch card — the questions still open after your review.

   Fixed in code already (no query needed):
     - COST_PROD_CODE / APC TOP LVL P/N shown in full (PARAMETER_NAME is
       char(10), so Paradigm stores them truncated; the card now restores them)
     - COSTING hidden but its line kept blank, so HOMOGENOUS doesn't shift up
     - Additional route parameters now show DATA0469.PARAMETER_CODE
       ("Cu Thickness") instead of PARAMETER_DESC ("Engenix Route Step
       Parameter")
     - Instruction text now read from ALL FIVE instruction records and each
       stored line kept separate — previously only the first record's four lines
       were read, joined with spaces, which is very likely why the Operator line
       was missing
     - Unit loading factors sorted by UNIT_CODE

   Below are the ones that need data to answer.
   ============================================================================ */


/* ---------------------------------------------------------------------------
   1. UNIT CODE — the printout shows "BDDPT/PART" and "PART/PNL", i.e. a ratio,
   not a plain code. Something holds the second half. This dumps everything
   about the units on one part so the pairing is visible.
   --------------------------------------------------------------------------- */
DECLARE @PART VARCHAR(50) = '12807';
DECLARE @RKEY NUMERIC(18,0) =
    (SELECT TOP 1 RKEY FROM DATA0050 WITH (NOLOCK)
     WHERE LTRIM(RTRIM(CUSTOMER_PART_NUMBER)) = @PART
        OR LTRIM(RTRIM(CUSTOMER_PART_NUMBER)) LIKE @PART + ' %'
     ORDER BY LEN(LTRIM(RTRIM(CUSTOMER_PART_NUMBER))));

SELECT
    d47.RKEY, d47.TTYPE, d47.SOURCE_POINTER, d47.UNIT_POINTER, d47.UNIT_VALUE,
    d2.UNIT_CODE, d2.UNIT_NAME, d2.UNIT_BASE, d2.UNIT_TYPE,
    d2.DERIVED, d2.EXPRESSION,
    d2.POT_OUTER_LAYER, d2.POT_INNER_LAYER
FROM DATA0047 d47 WITH (NOLOCK)
LEFT JOIN DATA0002 d2 WITH (NOLOCK) ON d2.RKEY = d47.UNIT_POINTER
WHERE d47.SOURCE_POINTER = @RKEY AND d47.TTYPE = 2
ORDER BY d2.UNIT_CODE;
-- Compare against the printout: is "BDDPT/PART" = UNIT_CODE + '/' + UNIT_BASE
-- expanded, or does EXPRESSION hold it? PART shows as "PART/PART" and
-- NUMBER UP as "PART/PNL", which suggests a numerator/denominator pair.


/* ---------------------------------------------------------------------------
   2. UNIT SORT ORDER — DATA0047 has no sequence column, so the order must come
   from DATA0002. Is it alphabetical by UNIT_CODE (which is what the card does
   now), or by RKEY, or something else?
   --------------------------------------------------------------------------- */
SELECT RKEY, UNIT_CODE, UNIT_NAME, UNIT_BASE, ACTIVE_FLAG
FROM DATA0002 WITH (NOLOCK)
ORDER BY RKEY;
-- Then compare that ordering against the printout's Unit Loading Factors list.


/* ---------------------------------------------------------------------------
   3. INVENTORY PARAMS / SPECS — are they really the inventory part's own, or
   the customer part's showing through? Run for A-12797-ASM and compare the
   SOURCE_PTR values against the customer part's RKEY from query 1.
   --------------------------------------------------------------------------- */
DECLARE @INV VARCHAR(50) = 'A-12797-ASM';
DECLARE @INVRKEY NUMERIC(18,0) =
    (SELECT TOP 1 RKEY FROM DATA0017 WITH (NOLOCK)
     WHERE LTRIM(RTRIM(INV_PART_NUMBER)) = @INV);

SELECT 'customer part rkey' AS which, @RKEY AS rkey
UNION ALL SELECT 'inventory part rkey', @INVRKEY;

SELECT 'DATA0044 type 1 (inventory)' AS src, * FROM DATA0044 WITH (NOLOCK)
WHERE SOURCE_PTR = @INVRKEY AND SOURCE_TYPE = 1;

SELECT 'DATA0045 type 1 (inventory)' AS src, * FROM DATA0045 WITH (NOLOCK)
WHERE SOURCE_PTR = @INVRKEY AND SOURCE_TYPE = 1;
-- If these come back empty, the values on the card are NOT the inventory
-- part's, and the source type for inventory parameters/specs is something
-- other than 1. If they come back populated and match the card, the card is
-- right and the resemblance to the customer part is a coincidence of the data.


/* ---------------------------------------------------------------------------
   4. CAPTIONS FOR INVENTORY SPECS — DATA0278 had no rows for source type 1, so
   the card currently borrows the customer-part captions. Does a set exist under
   another source type?
   --------------------------------------------------------------------------- */
SELECT SOURCE_TYPE, COUNT(*) AS rows_, MIN(SOURCE_INDEX) AS min_idx, MAX(SOURCE_INDEX) AS max_idx
FROM DATA0278 WITH (NOLOCK)
WHERE STATUS = 1
GROUP BY SOURCE_TYPE
ORDER BY SOURCE_TYPE;

SELECT SOURCE_TYPE, SOURCE_INDEX, LTRIM(RTRIM(PARAMETER_NAME)) AS name,
       LTRIM(RTRIM(PARAMETER_DESC)) AS descr
FROM DATA0278 WITH (NOLOCK)
WHERE STATUS = 1
ORDER BY SOURCE_TYPE, SOURCE_INDEX;


/* ---------------------------------------------------------------------------
   5. INSTRUCTION TEXT — how many lines does an instruction record really hold?
   If DATA0036 has PROD_ROUT_INST_5 and beyond, the card is truncating.
   --------------------------------------------------------------------------- */
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0036'
ORDER BY ORDINAL_POSITION;

/* And how many instruction pointers a route step can carry — the card reads
   five (DEF_ROUT_INST_1..5_PTR). If there are more, later ones are being lost. */
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DATA0038'
  AND (COLUMN_NAME LIKE 'DEF_ROUT_INST%' OR COLUMN_NAME LIKE 'DEF_ROUT_PARA%'
    OR COLUMN_NAME LIKE 'PARAMETER_%')
ORDER BY COLUMN_NAME;


/* ---------------------------------------------------------------------------
   6. ROUTE STEP ORDER — the card sorts by STEP_NUMBER. If the printout differs,
   there's another ordering column.
   --------------------------------------------------------------------------- */
SELECT TOP 40
    d38.STEP_NUMBER, d38.RKEY,
    RTRIM(d34.DEPT_CODE) AS DEPT_CODE, RTRIM(d34.DEPT_NAME) AS DEPT_NAME
FROM DATA0038 d38 WITH (NOLOCK)
LEFT JOIN DATA0034 d34 WITH (NOLOCK) ON d34.RKEY = d38.DEPT_PTR
WHERE d38.SOURCE_PTR = @INVRKEY AND d38.TTYPE = 3
ORDER BY d38.STEP_NUMBER;
-- Compare to the printout for A-12797-ASM: same order, or not?
