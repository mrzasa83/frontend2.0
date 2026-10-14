/* ═══════════════════════════════════════════════════════════════════════════
   MCN reason-for-change vs Paradigm rejects — DISCOVERY

   Before any report gets built, three things have to come from the data rather
   than from me:

     1. WHAT THE LEGACY REASON FIELD ACTUALLY HOLDS. The form in the screenshot
        offers PPE Error / CAM Error / Paradigm Input Error / Process
        Enhancement / Process Guidelines / BOM Change / New Process / MFG
        Rework / P&S Template / Customer / Other. The app already selects a
        column called `chngreason`, but nothing says those are the values in
        it, or how they are spelled, or whether one record can carry several.
        The whole "which team made the error" ranking rests on this.

     2. WHICH REJECT CODE MEANS "POOR METHODIZING". There is a reject-code
        table (DATA0039) with REJ_CODE and REJECT_DESCRIPTION. Guessing the
        code would silently produce a report about the wrong defect.

     3. WHICH MCN COLUMN JOINS TO PARADIGM. The request says "part number
        (toolNum)" and then "MCN calls this Part #". Those are two different
        columns — `toolnum` and `partnum` — and the list screen shows them
        holding different values (Tool # 76426 against Part # 30834). Q7 and
        Q8 measure which one actually matches DATA0050, rather than picking.

   Sections A (MySQL / node_app) and B (MSSQL / PDMLIV) run on different
   servers. All read-only.
   ═══════════════════════════════════════════════════════════════════════════ */


/* ═════════════ SECTION A — MySQL (node_app), the MCN side ═════════════ */

/* A1 — every column on MCN, so the legacy fields that were never carried over
        are visible by name and type. The app currently reads only 30-odd of
        them; this says what else is there to use. */
SELECT ORDINAL_POSITION, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mcn'
ORDER BY ORDINAL_POSITION;


/* A2 — the closed-last-12-months population, and whether the dates parse.
        subdate/closeddate are stored as strings like '14Oct2026', so every
        date filter has to go through STR_TO_DATE. Unparseable is counted
        separately: if that number is large, the window itself is unreliable
        and nothing downstream can be trusted. */
SELECT
    COUNT(*)                                                          AS AllRows,
    SUM(CASE WHEN mcn_status = 1 THEN 1 ELSE 0 END)                   AS ClosedRows,
    SUM(CASE WHEN mcn_status = 1
              AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') IS NULL
             THEN 1 ELSE 0 END)                                       AS ClosedButDateUnparseable,
    SUM(CASE WHEN mcn_status = 1
              AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y')
                  >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
             THEN 1 ELSE 0 END)                                       AS ClosedLast12Months,
    MIN(STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y'))                 AS EarliestClose,
    MAX(STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y'))                 AS LatestClose
FROM mcn;


/* A3 — THE KEY ONE. The reason vocabulary as actually recorded, over the
        window the report will cover.
        Expect the eleven form options. What to watch for: spelling variants,
        values not on the form, blanks, and — if a value ever contains a comma
        or semicolon — a record carrying more than one reason, which changes
        the ranking from a count of records to a count of selections. */
SELECT
    COALESCE(NULLIF(TRIM(chngreason), ''), '(blank)')                 AS ChangeReason,
    COUNT(*)                                                          AS Records,
    SUM(CASE WHEN chngreason LIKE '%,%' OR chngreason LIKE '%;%'
             THEN 1 ELSE 0 END)                                       AS LooksMultiValued,
    MIN(closeddate)                                                   AS FirstSeen,
    MAX(closeddate)                                                   AS LastSeen
FROM mcn
WHERE mcn_status = 1
  AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY ChangeReason
ORDER BY Records DESC;


/* A4 — the neighbouring legacy fields, same window. chngeffect, software, wip
        and batchcard map to the rest of that form ("Is WIP, INV or FG
        affected?", "Software Affected"). Shown as value counts so it is clear
        whether each is a flag, a code or free text before anything relies on
        it. Capped at the top few per field so the output stays readable. */
SELECT 'chngeffect' AS Field, COALESCE(NULLIF(TRIM(chngeffect),''),'(blank)') AS Value, COUNT(*) AS Records
FROM mcn WHERE mcn_status = 1
  AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY Value
UNION ALL
SELECT 'software', COALESCE(NULLIF(TRIM(software),''),'(blank)'), COUNT(*)
FROM mcn WHERE mcn_status = 1
  AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY 2
UNION ALL
SELECT 'wip', COALESCE(NULLIF(TRIM(wip),''),'(blank)'), COUNT(*)
FROM mcn WHERE mcn_status = 1
  AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY 2
UNION ALL
SELECT 'batchcard', COALESCE(NULLIF(TRIM(batchcard),''),'(blank)'), COUNT(*)
FROM mcn WHERE mcn_status = 1
  AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY 2
ORDER BY Field, Records DESC;


/* A5 — toolnum against partnum. Are they the same column in disguise?
        If SameValue is most of the rows, the join-key question is moot. If
        they diverge often, Q7/Q8 decide it. */
SELECT
    COUNT(*)                                                               AS Rows_,
    SUM(CASE WHEN TRIM(COALESCE(toolnum,'')) = TRIM(COALESCE(partnum,''))
             THEN 1 ELSE 0 END)                                            AS SameValue,
    SUM(CASE WHEN TRIM(COALESCE(toolnum,'')) <> TRIM(COALESCE(partnum,''))
             THEN 1 ELSE 0 END)                                            AS Differ,
    SUM(CASE WHEN TRIM(COALESCE(toolnum,'')) = '' THEN 1 ELSE 0 END)       AS ToolnumBlank,
    SUM(CASE WHEN TRIM(COALESCE(partnum,''))  = '' THEN 1 ELSE 0 END)      AS PartnumBlank
FROM mcn
WHERE mcn_status = 1
  AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH);


/* A6 — the distinct part numbers in the window, for pasting into Section B.
        Keep this result: B4 needs it to measure the join. */
SELECT DISTINCT TRIM(partnum) AS PartNum, TRIM(toolnum) AS ToolNum
FROM mcn
WHERE mcn_status = 1
  AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
  AND (TRIM(COALESCE(partnum,'')) <> '' OR TRIM(COALESCE(toolnum,'')) <> '')
ORDER BY PartNum;


/* ═════════════ SECTION B — MSSQL (PDMLIV), the reject side ═════════════ */
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

/* B1 — THE OTHER KEY ONE. Every reject code used in the last 12 months.
        Find the one that means poor methodizing and tell me the REJ_CODE —
        the report will filter on the code, not on description text, which
        gets re-typed over the years. If several codes look like candidates,
        say so; grouping them is a decision, not a detail. */
SELECT
    LTRIM(RTRIM(d39.REJ_CODE))                AS RejCode,
    LTRIM(RTRIM(d39.REJECT_DESCRIPTION))      AS RejDescription,
    LTRIM(RTRIM(d39.REJECT_DEFECT_FLAG))      AS DefectFlag,
    COUNT(*)                                  AS Transactions,
    SUM(ISNULL(d58.QTY_REJECT, 0))            AS QtyRejected,
    MIN(d58.TDATE)                            AS FirstSeen,
    MAX(d58.TDATE)                            AS LastSeen
FROM DATA0058 d58 WITH (NOLOCK)
JOIN DATA0039 d39 WITH (NOLOCK) ON d39.RKEY = d58.REJECT_PTR
WHERE d58.TDATE >= DATEADD(MONTH, -12, CAST(GETDATE() AS DATE))
GROUP BY
    LTRIM(RTRIM(d39.REJ_CODE)),
    LTRIM(RTRIM(d39.REJECT_DESCRIPTION)),
    LTRIM(RTRIM(d39.REJECT_DEFECT_FLAG))
ORDER BY Transactions DESC;


/* B2 — anything whose wording points at methodizing, engineering or setup,
        in case the code is not obvious from B1's volume ordering. A wider net
        than B1's top rows, run separately so a low-volume code is not missed
        simply for being rare. */
SELECT
    LTRIM(RTRIM(d39.REJ_CODE))           AS RejCode,
    LTRIM(RTRIM(d39.REJECT_DESCRIPTION)) AS RejDescription,
    COUNT(*)                             AS Transactions
FROM DATA0058 d58 WITH (NOLOCK)
JOIN DATA0039 d39 WITH (NOLOCK) ON d39.RKEY = d58.REJECT_PTR
WHERE d58.TDATE >= DATEADD(MONTH, -12, CAST(GETDATE() AS DATE))
  AND (
        d39.REJECT_DESCRIPTION LIKE '%METHOD%'
     OR d39.REJECT_DESCRIPTION LIKE '%ENGINEER%'
     OR d39.REJECT_DESCRIPTION LIKE '%SETUP%'
     OR d39.REJECT_DESCRIPTION LIKE '%SET UP%'
     OR d39.REJECT_DESCRIPTION LIKE '%CAM%'
     OR d39.REJECT_DESCRIPTION LIKE '%PROGRAM%'
     OR d39.REJECT_DESCRIPTION LIKE '%TOOL%'
      )
GROUP BY LTRIM(RTRIM(d39.REJ_CODE)), LTRIM(RTRIM(d39.REJECT_DESCRIPTION))
ORDER BY Transactions DESC;


/* B3 — the whole reject-code catalogue, however old.
        B1 only shows codes actually used this year. If poor methodizing does
        not appear there, it is either spelled differently or has not been
        used — and those mean opposite things for the report. */
SELECT
    LTRIM(RTRIM(REJ_CODE))           AS RejCode,
    LTRIM(RTRIM(REJECT_DESCRIPTION)) AS RejDescription,
    LTRIM(RTRIM(REJECT_DEFECT_FLAG)) AS DefectFlag
FROM DATA0039 WITH (NOLOCK)
ORDER BY RejCode;


/* B4 — the join test. Paste a sample of part numbers from A6 into @Sample,
        then run. Whichever of PartNum / ToolNum matches more rows is the
        column the report should join on.

        Twenty is plenty: this is a direction check, not a census. */
DECLARE @Sample TABLE (PartNum VARCHAR(60), ToolNum VARCHAR(60));
INSERT INTO @Sample (PartNum, ToolNum) VALUES
    -- ►►► replace these with real pairs from A6 ◄◄◄
    ('72624', '72624'),
    ('30834', '76426'),
    ('12167', '12167'),
    ('76181', '76181'),
    ('75014', '75014'),
    ('10339', '70637'),
    ('11826', '74477'),
    ('76440', '76440'),
    ('11559', '11559'),
    ('30561', '30561');

SELECT
    COUNT(*)                                                   AS SampleRows,
    SUM(CASE WHEN p.MatchedOnPart IS NOT NULL THEN 1 ELSE 0 END) AS PartNumMatches,
    SUM(CASE WHEN t.MatchedOnTool IS NOT NULL THEN 1 ELSE 0 END) AS ToolNumMatches
FROM @Sample s
OUTER APPLY (
    SELECT TOP 1 1 AS MatchedOnPart FROM DATA0050 d50 WITH (NOLOCK)
    WHERE d50.RKEY = d50.PRODUCTION_PART_PTR
      AND ( LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT = s.PartNum COLLATE DATABASE_DEFAULT
         OR LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT LIKE (s.PartNum + ' %') COLLATE DATABASE_DEFAULT )
) p
OUTER APPLY (
    SELECT TOP 1 1 AS MatchedOnTool FROM DATA0050 d50 WITH (NOLOCK)
    WHERE d50.RKEY = d50.PRODUCTION_PART_PTR
      AND ( LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT = s.ToolNum COLLATE DATABASE_DEFAULT
         OR LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT LIKE (s.ToolNum + ' %') COLLATE DATABASE_DEFAULT )
) t;
