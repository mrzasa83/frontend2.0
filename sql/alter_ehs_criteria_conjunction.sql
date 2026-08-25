/* ============================================================================
   Material families — allow OR between criteria.

   Until now every criterion was AND'd, so a family like
       INV_PART_NUMBER like 'PPGRF001060%'
       INV_PART_NUMBER like 'PPGRF0U1060%'
   could never match anything: a part number can't be both at once.

   conjunction says how a criterion joins to the one ABOVE it. The first
   criterion's value is ignored — it always attaches to the base search.
   AND binds tighter than OR, the same as SQL, so
       A and B or C   ==   (A and B) or C
   ============================================================================ */

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE table_schema = DATABASE()
             AND table_name = 'ehs_family_criteria'
             AND column_name = 'conjunction');
SET @s := IF(@c = 0,
  'ALTER TABLE ehs_family_criteria ADD COLUMN conjunction VARCHAR(3) NOT NULL DEFAULT ''AND'' AFTER operator',
  'SELECT ''conjunction already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT 'conjunction' AS item,
       IF(COUNT(*) > 0, 'OK', 'MISSING') AS status
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE() AND table_name = 'ehs_family_criteria'
  AND column_name = 'conjunction';
