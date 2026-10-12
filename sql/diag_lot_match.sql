/* ───────────────────────────────────────────────────────────────────────────
   Why do lots with a dash or a period come back unresolved?

   The PO number on a traceability row comes from material_cert_pos, joined on
   the lot with plain equality:

       WHERE lot IN ('F160426-01B', '200526AB04-3', ...)

   The filename parser (lib/certs/cocParser.ts) does NOT strip dashes or
   periods — traced by hand, "PUR0176145 - LOT F160426-01B.pdf" parses to
   F160426-01B intact. So the punctuation is probably not being destroyed on
   the way in, and the mismatch is in the DATA: either the archive spells
   these lots differently from Paradigm, or there is genuinely no cert on file
   for them.

   Those two have very different fixes, and this tells them apart. Run against
   the app's MySQL (node_app).
   ─────────────────────────────────────────────────────────────────────────── */

/* Q1 — THE decisive one. Does the archive hold ANY punctuated lot?
        If DashedLots and DottedLots are both 0 across 177k rows, something
        strips punctuation on the way in and the parser trace above is wrong.
        If they are healthy numbers, punctuation survives indexing and the
        failing lots are a data problem, not a parsing one. */
SELECT
    COUNT(*)                                                   AS TotalCerts,
    SUM(CASE WHEN lot LIKE '%-%'  THEN 1 ELSE 0 END)           AS DashedLots,
    SUM(CASE WHEN lot LIKE '%.%'  THEN 1 ELSE 0 END)           AS DottedLots,
    SUM(CASE WHEN lot LIKE '% %'  THEN 1 ELSE 0 END)           AS SpacedLots,
    SUM(CASE WHEN lot = ''        THEN 1 ELSE 0 END)           AS EmptyLots
FROM material_cert_pos;


/* Q2 — a sample of punctuated lots, if there are any.
        Shows the shape the archive actually stores, next to the file it came
        from, so the spelling can be compared with Paradigm's BATCH_NO. */
SELECT lot, po_number, apc_part, file_name
FROM material_cert_pos
WHERE lot LIKE '%-%' OR lot LIKE '%.%'
ORDER BY id DESC
LIMIT 25;


/* Q3 — the six failing lots from the screenshot, three ways.
        Exact: what the app does today.
        Normalised: punctuation and case removed from both sides.
        Fuzzy: anything sharing the leading run of characters.

        Read it like this —
          Exact 0, Normalised 1+  -> the archive spells it differently; the
                                     normalised fallback fixes it outright.
          Exact 0, Normalised 0,
            Fuzzy 1+             -> a near miss worth eyeballing in Q4.
          All three 0            -> there is no cert on file for that lot.
                                     Nothing to resolve, and "unresolved" is
                                     the honest answer. */
SELECT
    w.lot                                                      AS ParadigmLot,
    (SELECT COUNT(*) FROM material_cert_pos c
      WHERE c.lot = w.lot)                                     AS ExactHits,
    (SELECT COUNT(*) FROM material_cert_pos c
      WHERE REPLACE(REPLACE(REPLACE(UPPER(c.lot), '-', ''), '.', ''), ' ', '')
          = REPLACE(REPLACE(REPLACE(UPPER(w.lot), '-', ''), '.', ''), ' ', '')) AS NormalisedHits,
    (SELECT COUNT(*) FROM material_cert_pos c
      WHERE c.lot LIKE CONCAT(LEFT(w.lot, 6), '%'))            AS FuzzyPrefixHits
FROM (
    SELECT 'F160426-01B'  AS lot
    UNION ALL SELECT 'F300326-04C'
    UNION ALL SELECT 'F170326-04A'
    UNION ALL SELECT '200526AB04-3'
    UNION ALL SELECT '280426X02-2'
    UNION ALL SELECT '130226Y04-8'
) w;


/* Q4 — the near misses themselves, so a spelling difference is visible.
        Whatever the archive holds that starts the same way as each failing
        lot. If the answer is "nothing", these lots were never archived. */
SELECT c.lot, c.po_number, c.apc_part, c.material_type, c.file_name
FROM material_cert_pos c
WHERE c.lot LIKE 'F160426%' OR c.lot LIKE 'F300326%' OR c.lot LIKE 'F170326%'
   OR c.lot LIKE '200526%'  OR c.lot LIKE '280426%'  OR c.lot LIKE '130226%'
ORDER BY c.lot
LIMIT 50;


/* Q5 — do the PO numbers on those rows exist in the archive at all?
        The screenshot shows "ref 176145 (unresolved)" — a Paradigm PO
        POINTER, not a PO number. If PUR0176145 and friends are in the
        archive, then the certs ARE there and only the lot spelling is
        keeping them apart, which would be the strongest possible case for
        matching on the PO as a second fallback. */
SELECT po_number, COUNT(*) AS Files, MIN(lot) AS AnyLot, MIN(file_name) AS AnyFile
FROM material_cert_pos
WHERE po_number IN ('PUR0176145','PUR0175731','PUR0175542',
                    'PUR0176144','PUR0175213','PUR0173632')
GROUP BY po_number
ORDER BY po_number;


/* Q6 — how much of the archive would a normalised match newly reach?
        Counts lots that are distinct as stored but identical once punctuation
        is removed. A high number means normalising merges genuinely different
        lots and would be unsafe; near zero means punctuation is pure noise in
        this column and normalising is free. Run before trusting the fix. */
SELECT COUNT(*) AS LotsThatCollideWhenNormalised
FROM (
    SELECT REPLACE(REPLACE(REPLACE(UPPER(lot), '-', ''), '.', ''), ' ', '') AS norm,
           COUNT(DISTINCT lot) AS spellings
    FROM material_cert_pos
    WHERE lot <> ''
    GROUP BY norm
    HAVING COUNT(DISTINCT lot) > 1
) x;
