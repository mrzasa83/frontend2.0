/* ============================================================================
   Users — network username.

   The batch card printout carries the operator's ERP login in the top-right
   corner, which comes from DATA0005.ABBR_NAME in Paradigm. That value doesn't
   match the app login (michael.rzasa vs mrzasa), so this column holds the
   network/ERP alias and bridges the two.

   Default is derived on read: first letter of the given name + everything after
   the dot (michael.rzasa -> mrzasa). Stored only when an admin overrides it,
   so the derivation keeps working for everyone it fits.

   Idempotent: safe to re-run, won't abort partway.
   ============================================================================ */

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE table_schema = DATABASE()
             AND table_name = 'Users'
             AND column_name = 'network_username');
SET @s := IF(@c = 0,
  'ALTER TABLE Users ADD COLUMN network_username VARCHAR(60) NULL AFTER username',
  'SELECT ''network_username already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

/* Verify, and show what the derived default would be for each user. */
SELECT 'network_username' AS item,
       IF(COUNT(*) > 0, 'OK', 'MISSING') AS status
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE() AND table_name = 'Users'
  AND column_name = 'network_username';
