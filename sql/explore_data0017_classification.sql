/*
  Is there already a classification code on DATA0017, or do we parse names?

  Q2 turned up something the column list alone didn't: every one of the five
  copper-foil rows carries ANALYSIS_CODE5 = 'IPREP'. If that column is
  populated across the board-material families and NOT on hardware, chemicals
  and tooling, then board material is already classified in Paradigm and the
  name parsing is only needed for sizes — not for deciding what counts.

  These run in order of what they'd save us. Q1 is the one that matters.

  Read-only. SELECT only, NOLOCK throughout.
*/

-- ---------------------------------------------------------------------------
-- Q1. ANALYSIS_CODE5 census, with the prefixes that carry each value.
--     Hoping to see: IPREP (or similar) covering the laminate/prepreg/foil
--     prefixes, and something else entirely on HDW / CSM / TOOL_ / CH.
-- ---------------------------------------------------------------------------
SELECT  ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE5)), ''), '(blank)') AS Code5,
        COUNT(*)                                       AS Parts,
        COUNT(DISTINCT LEFT(LTRIM(INV_PART_NUMBER), 2)) AS DistinctPrefixes,
        MIN(LTRIM(RTRIM(INV_PART_NUMBER)))             AS Example1,
        MAX(LTRIM(RTRIM(INV_PART_NUMBER)))             AS Example2
FROM    DATA0017 WITH (NOLOCK)
WHERE   P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE5)), ''), '(blank)')
ORDER BY COUNT(*) DESC;


-- ---------------------------------------------------------------------------
-- Q2. The same for ANALYSIS_CODE1..4, in case a different one is the live one.
--     All four were null on the copper-foil rows, so this is mostly to confirm
--     they are dead columns rather than a second classification we're missing.
-- ---------------------------------------------------------------------------
SELECT 'CODE1' AS Col, ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE1)), ''), '(blank)') AS Val, COUNT(*) AS Parts
FROM DATA0017 WITH (NOLOCK)
WHERE P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE1)), ''), '(blank)')
UNION ALL
SELECT 'CODE2', ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE2)), ''), '(blank)'), COUNT(*)
FROM DATA0017 WITH (NOLOCK)
WHERE P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE2)), ''), '(blank)')
UNION ALL
SELECT 'CODE3', ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE3)), ''), '(blank)'), COUNT(*)
FROM DATA0017 WITH (NOLOCK)
WHERE P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE3)), ''), '(blank)')
UNION ALL
SELECT 'CODE4', ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE4)), ''), '(blank)'), COUNT(*)
FROM DATA0017 WITH (NOLOCK)
WHERE P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE4)), ''), '(blank)')
ORDER BY Col, Parts DESC;


-- ---------------------------------------------------------------------------
-- Q3. Cross-tab: ANALYSIS_CODE5 against the 2-character prefix, for the
--     prefixes that look like board material. Confirms the code lines up with
--     the naming families rather than cutting across them.
-- ---------------------------------------------------------------------------
SELECT  LEFT(LTRIM(INV_PART_NUMBER), 2) AS Prefix2,
        ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE5)), ''), '(blank)') AS Code5,
        COUNT(*) AS Parts
FROM    DATA0017 WITH (NOLOCK)
WHERE   P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
    AND LEFT(LTRIM(INV_PART_NUMBER), 2) IN
        ('PP','LB','MY','MW','RP','LD','TE','FC','CU','AL','SP','MZ','WI','TL',
         'SI','SW','SO','TF','MT','WH','LQ','LK','RQ','RK','RH','MC','HD','CS',
         'TO','CH','PC','UL','DF','EB','EE','MR','B-','UP')
GROUP BY LEFT(LTRIM(INV_PART_NUMBER), 2),
         ISNULL(NULLIF(LTRIM(RTRIM(ANALYSIS_CODE5)), ''), '(blank)')
ORDER BY Prefix2, COUNT(*) DESC;


-- ---------------------------------------------------------------------------
-- Q4. The other candidate flags, on the same prefixes.
--     TTYPE was 'R' and S_B_N 'B' on the foil rows; PROD_CODE_SELL_PTR was 5.
--     If one of these separates board material cleanly it is a cheaper filter
--     than a 20-value IN list of prefixes.
-- ---------------------------------------------------------------------------
SELECT  TTYPE, S_B_N, PROD_CODE_SELL_PTR, STOCK_UNIT_PTR,
        COUNT(*) AS Parts,
        MIN(LTRIM(RTRIM(INV_PART_NUMBER))) AS Example
FROM    DATA0017 WITH (NOLOCK)
WHERE   P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
GROUP BY TTYPE, S_B_N, PROD_CODE_SELL_PTR, STOCK_UNIT_PTR
ORDER BY COUNT(*) DESC;
