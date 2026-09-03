/* ============================================================================
   Users — office location and legacy MCN name.

   office_location    Which site the person sits at: Mesa, Nashua or Nogales.
                      Shown on the Personal tab.

   legacy_mcn_name    How this person appears in the legacy MCN data, e.g.
                      "Woodbury:Todd" for todd.woodbury. The legacy app stored
                      names in Surname:Firstname form with no link back to a
                      login, so this column is the bridge — it lets an MCN's PE
                      be resolved to a user, and from there to an office
                      location. Set on the Engineer Roles tab.

   Idempotent: checks information_schema first, so re-running is safe and the
   script won't abort partway.
   ============================================================================ */

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE table_schema = DATABASE()
             AND table_name = 'Users'
             AND column_name = 'office_location');
SET @s := IF(@c = 0,
  'ALTER TABLE Users ADD COLUMN office_location VARCHAR(30) NULL AFTER name',
  'SELECT ''office_location already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE table_schema = DATABASE()
             AND table_name = 'Users'
             AND column_name = 'legacy_mcn_name');
SET @s := IF(@c = 0,
  'ALTER TABLE Users ADD COLUMN legacy_mcn_name VARCHAR(120) NULL AFTER cc_name',
  'SELECT ''legacy_mcn_name already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

/* Index it: the MCN list resolves every PE name through this column. */
SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE table_schema = DATABASE()
             AND table_name = 'Users'
             AND index_name = 'idx_legacy_mcn_name');
SET @s := IF(@c = 0,
  'ALTER TABLE Users ADD INDEX idx_legacy_mcn_name (legacy_mcn_name)',
  'SELECT ''idx_legacy_mcn_name already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

/* Verify */
SELECT 'office_location' AS item, IF(COUNT(*) > 0, 'OK', 'MISSING') AS status
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE() AND table_name = 'Users' AND column_name = 'office_location'
UNION ALL
SELECT 'legacy_mcn_name', IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE() AND table_name = 'Users' AND column_name = 'legacy_mcn_name'
UNION ALL
SELECT 'idx_legacy_mcn_name', IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.STATISTICS
WHERE table_schema = DATABASE() AND table_name = 'Users' AND index_name = 'idx_legacy_mcn_name';
