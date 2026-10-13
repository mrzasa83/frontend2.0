/* ───────────────────────────────────────────────────────────────────────────
   How common is the temper suffix, and is stripping it safe?

   Paradigm issues the lot as 283346300-HH (HH = half hard, on a part described
   "CU C110 HALF HRD"); the supplier's certificate is filed as 283346300. The
   cert lookup now strips a trailing ALL-LETTER suffix as a last resort, after
   exact and punctuation-insensitive matching have both failed.

   Q1 runs on PARADIGM (MSSQL / PDMLIV). Q2 and Q3 run on the APP database
   (MySQL / node_app). Both are read-only.
   ─────────────────────────────────────────────────────────────────────────── */


/* ── Q1 — PARADIGM. How many lots carry a suffix like this, and what are they?
      Tells us whether -HH is one part's quirk or a convention worth relying
      on. A short list of repeated codes (HH, SH, FH) is a convention; a long
      tail of one-offs means the rule is too loose and should be narrowed to
      an explicit list. ───────────────────────────────────────────────────── */
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

SELECT
    RIGHT(LTRIM(RTRIM(d20.BATCH_NO)),
          LEN(LTRIM(RTRIM(d20.BATCH_NO))) - CHARINDEX('-', REVERSE(LTRIM(RTRIM(d20.BATCH_NO))))
         )                                              AS Dummy_IgnoreThis,
    -- The trailing segment after the last dash.
    REVERSE(LEFT(REVERSE(LTRIM(RTRIM(d20.BATCH_NO))),
                 CHARINDEX('-', REVERSE(LTRIM(RTRIM(d20.BATCH_NO)))) - 1)) AS Suffix,
    COUNT(*)                                            AS Lots,
    MIN(LTRIM(RTRIM(d20.BATCH_NO)))                     AS Example
FROM DATA0020 d20 WITH (NOLOCK)
WHERE CHARINDEX('-', d20.BATCH_NO) > 0
  -- Suffix is 1-3 characters and contains no digit: the shape being stripped.
  AND LEN(REVERSE(LEFT(REVERSE(LTRIM(RTRIM(d20.BATCH_NO))),
          CHARINDEX('-', REVERSE(LTRIM(RTRIM(d20.BATCH_NO)))) - 1))) BETWEEN 1 AND 3
  AND REVERSE(LEFT(REVERSE(LTRIM(RTRIM(d20.BATCH_NO))),
          CHARINDEX('-', REVERSE(LTRIM(RTRIM(d20.BATCH_NO)))) - 1)) NOT LIKE '%[0-9]%'
GROUP BY
    RIGHT(LTRIM(RTRIM(d20.BATCH_NO)),
          LEN(LTRIM(RTRIM(d20.BATCH_NO))) - CHARINDEX('-', REVERSE(LTRIM(RTRIM(d20.BATCH_NO))))),
    REVERSE(LEFT(REVERSE(LTRIM(RTRIM(d20.BATCH_NO))),
                 CHARINDEX('-', REVERSE(LTRIM(RTRIM(d20.BATCH_NO)))) - 1))
ORDER BY Lots DESC;


/* ── Q2 — APP DB. Do the three certs from the screenshot resolve now?
      Expect one row per lot: the bare number is what the archive holds, and
      the -HH version is what Paradigm issues. ──────────────────────────────── */
SELECT lot, po_number, apc_part, file_name
FROM material_cert_pos
WHERE lot IN ('283346300', '301918300', '186367')
ORDER BY lot;


/* ── Q3 — APP DB. THE SAFETY CHECK.
      Could stripping a suffix land on more than one archived lot? Each base
      below should return exactly 1. More than 1 means the shortened number is
      not unique and the cert shown could be the wrong one — the code flags
      that case with an amber "!" rather than picking, but it is worth knowing
      how often it happens. ─────────────────────────────────────────────────── */
SELECT
    b.base,
    COUNT(DISTINCT c.lot)  AS DistinctArchiveLots,
    COUNT(*)               AS Files
FROM (
    SELECT '283346300' AS base
    UNION ALL SELECT '301918300'
    UNION ALL SELECT '186367'
) b
LEFT JOIN material_cert_pos c
       ON UPPER(REPLACE(REPLACE(REPLACE(REPLACE(c.lot,'-',''),'.',''),' ',''),'_','')) = b.base
GROUP BY b.base
ORDER BY b.base;
