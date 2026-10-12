/* ───────────────────────────────────────────────────────────────────────────
   Why did FAI-2026-0013 collide?

   The old allocator was COUNT(*) + 1 over rows of that inspection_type created
   this year. That number says how many rows EXIST, not which numbers were
   ISSUED — so once a row is deleted the count falls back onto a number still
   in use, and every create from then on fails on the same number.

   Q1 confirms it: if the count is lower than the highest number issued, the
   gap is the bug. Q2 shows exactly which numbers are missing.

   Read-only.
   ─────────────────────────────────────────────────────────────────────────── */

/* Q1 — the arithmetic behind the error, per prefix and year.
        OldAllocatorWouldPick is what the deployed code computed.
        NewAllocatorWillPick is what the fix computes.
        Colliding = 1 means the old number is on a live row, which is the
        failure the user hit. */
SELECT
    SUBSTRING(inspection_number, 1, 8)                               AS Series,
    COUNT(*)                                                         AS RowsNow,
    MAX(CAST(SUBSTRING(inspection_number, 10) AS UNSIGNED))          AS HighestIssued,
    MAX(CAST(SUBSTRING(inspection_number, 10) AS UNSIGNED)) - COUNT(*) AS MissingFromSeries,
    CONCAT(SUBSTRING(inspection_number, 1, 9),
           LPAD(COUNT(*) + 1, 4, '0'))                               AS OldAllocatorWouldPick,
    CONCAT(SUBSTRING(inspection_number, 1, 9),
           LPAD(MAX(CAST(SUBSTRING(inspection_number, 10) AS UNSIGNED)) + 1, 4, '0'))
                                                                     AS NewAllocatorWillPick,
    CASE WHEN COUNT(*) + 1 <= MAX(CAST(SUBSTRING(inspection_number, 10) AS UNSIGNED))
         THEN 1 ELSE 0 END                                           AS Colliding
FROM inspections
WHERE inspection_number REGEXP '^[A-Z]+-[0-9]{4}-[0-9]+$'
GROUP BY SUBSTRING(inspection_number, 1, 8)
ORDER BY Series;


/* Q2 — every FAI-2026 number on a live row, so the gaps are visible.
        The numbers NOT listed here were issued and then deleted. Under the
        fix they stay retired: an inspection number appears in history and on
        paperwork, so handing the same one to a second inspection would make
        the two indistinguishable afterwards. */
SELECT
    inspection_number,
    inspection_type,
    part_number,
    work_order,
    phase,
    created_by,
    created_at
FROM inspections
WHERE inspection_number LIKE 'FAI-2026-%'
ORDER BY CAST(SUBSTRING(inspection_number, 10) AS UNSIGNED);


/* Q3 — is anything already duplicated, or shaped unexpectedly?
        The unique key should make the first impossible; run it to be sure
        nothing predates the constraint. The second list is numbers that do
        not fit PREFIX-YYYY-NNNN at all — those are invisible to both the old
        and the new allocator, so a stray one could still collide. */
SELECT inspection_number, COUNT(*) AS Copies
FROM inspections
GROUP BY inspection_number
HAVING COUNT(*) > 1;

SELECT id, inspection_number, inspection_type, created_at
FROM inspections
WHERE inspection_number NOT REGEXP '^[A-Z]+-[0-9]{4}-[0-9]{4}$'
ORDER BY id;


/* Q4 — do two inspection_types share one prefix?
        The prefix is XS for X-Section, AOI for AOI and FAI for everything
        else. The old allocator counted per inspection_type, so two types both
        landing on FAI would each count separately and collide. If this
        returns more than one row per Prefix, that is a second cause. */
SELECT
    CASE inspection_type
        WHEN 'X-Section' THEN 'XS'
        WHEN 'AOI'       THEN 'AOI'
        ELSE 'FAI'
    END                AS Prefix,
    inspection_type,
    COUNT(*)           AS Rows_
FROM inspections
GROUP BY Prefix, inspection_type
ORDER BY Prefix, inspection_type;
