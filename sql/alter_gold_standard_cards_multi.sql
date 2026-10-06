-- =============================================
-- Gold Standard — allow more than one card per level.
--
-- WHY
--   gold_standard_cards shipped with UNIQUE KEY (gold_standard_id, level),
--   which encoded the assumption that a batch card set is one card deep per
--   level. That is false for any real board: a 2-level capture of 76443 has
--   seven manufactured lines at level 1 (three inner layers, two adhesives,
--   two coverlays), each needing its own card.
--
--   The symptom was quiet. The first level-1 card inserted, the second hit
--   the unique key and threw, and storeCards aborted mid-loop — so the
--   standard came back with one level-1 card AND a card_count of 0, because
--   the UPDATE that sets it never ran.
--
-- SAFE TO RE-RUN. Each step checks INFORMATION_SCHEMA first, because MySQL
-- 5.6 has no DROP INDEX IF EXISTS or ADD COLUMN IF NOT EXISTS.
--
-- Existing captures are left in place but are INCOMPLETE by definition — they
-- were truncated by the bug. Re-capture each standard after running this.
-- =============================================

-- 1. Drop the unique key that caused it.
SET @sql := (
  SELECT IF(COUNT(*) > 0,
    'ALTER TABLE gold_standard_cards DROP INDEX uq_gs_level',
    'SELECT ''uq_gs_level already gone'' AS note')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'gold_standard_cards'
    AND INDEX_NAME = 'uq_gs_level'
);
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

-- 2. Position within the level.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE gold_standard_cards ADD COLUMN seq INT NOT NULL DEFAULT 0 AFTER source_rkey',
    'SELECT ''seq already present'' AS note')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'gold_standard_cards' AND COLUMN_NAME = 'seq'
);
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

-- 3. The parent card. The set is a tree, not a flat list of levels.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE gold_standard_cards ADD COLUMN parent_card_id INT NULL AFTER seq',
    'SELECT ''parent_card_id already present'' AS note')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'gold_standard_cards' AND COLUMN_NAME = 'parent_card_id'
);
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

-- 4. The replacement uniqueness: one card per part per level.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE gold_standard_cards ADD UNIQUE KEY uq_gs_level_part (gold_standard_id, level, part_number)',
    'SELECT ''uq_gs_level_part already present'' AS note')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'gold_standard_cards' AND INDEX_NAME = 'uq_gs_level_part'
);
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE gold_standard_cards ADD INDEX idx_gs_level (gold_standard_id, level, seq)',
    'SELECT ''idx_gs_level already present'' AS note')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'gold_standard_cards' AND INDEX_NAME = 'idx_gs_level'
);
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE gold_standard_cards ADD INDEX idx_parent (parent_card_id)',
    'SELECT ''idx_parent already present'' AS note')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'gold_standard_cards' AND INDEX_NAME = 'idx_parent'
);
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

-- 5. The self-referential FK, added last so the index it needs exists.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE gold_standard_cards ADD CONSTRAINT fk_gsc_parent FOREIGN KEY (parent_card_id) REFERENCES gold_standard_cards (id) ON DELETE CASCADE',
    'SELECT ''fk_gsc_parent already present'' AS note')
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'gold_standard_cards' AND CONSTRAINT_NAME = 'fk_gsc_parent'
);
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gold_standard_cards'
ORDER BY ORDINAL_POSITION;
