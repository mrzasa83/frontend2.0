/* ───────────────────────────────────────────────────────────────────────────
   gold_standard_route_params.value -> TEXT

   Additional Route Step Parameters carry their content in DATA0471.PARAM_NOTE,
   free text with line breaks, not in the Value column. VARCHAR(500) truncated
   a long note silently — and a truncated note in a captured standard reads as
   a real difference the next time it is compared against a part whose note is
   intact, which is the worst kind of wrong: a finding that is an artefact.

   value is not indexed (only name is), so TEXT is free here.

   MySQL 5.6: no ALTER ... IF EXISTS, so each step is guarded by an
   INFORMATION_SCHEMA check and run through PREPARE/EXECUTE. Safe to re-run.
   ─────────────────────────────────────────────────────────────────────────── */

SET @db := DATABASE();

-- Widen value to TEXT, only if it is not already.
SET @needed := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'gold_standard_route_params'
    AND COLUMN_NAME  = 'value'
    AND DATA_TYPE    <> 'text'
);
SET @sql := IF(@needed > 0,
  'ALTER TABLE gold_standard_route_params MODIFY COLUMN value TEXT NULL',
  'SELECT "gold_standard_route_params.value is already TEXT" AS note');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


/* The route instruction text has the same exposure: instructions are stored
   one line per row, but a long line is still a long line. Widened to TEXT for
   the same reason, if it is not already. */
SET @needed2 := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME   = 'gold_standard_route_instructions'
    AND COLUMN_NAME  = 'text'
    AND DATA_TYPE    <> 'text'
);
SET @sql2 := IF(@needed2 > 0,
  'ALTER TABLE gold_standard_route_instructions MODIFY COLUMN text TEXT NULL',
  'SELECT "gold_standard_route_instructions.text is already TEXT" AS note');
PREPARE s2 FROM @sql2; EXECUTE s2; DEALLOCATE PREPARE s2;


-- What the two columns look like now.
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME IN ('gold_standard_route_params', 'gold_standard_route_instructions')
  AND COLUMN_NAME IN ('value', 'text');
