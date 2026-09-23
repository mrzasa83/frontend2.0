-- =============================================
-- Inspections — new FAI phase list
--
-- Two changes, and the first matters more than the second.
--
-- 1. phase becomes VARCHAR instead of ENUM.
--
--    It was ENUM('Setup','Measurement','Verify','Submitted','Rework',
--    'Completed','Canceled'). An ENUM means every change to the phase list is
--    a schema migration, and — worse on a server not running STRICT mode — an
--    unlisted value is not rejected loudly but stored as the empty string.
--    Saving "Ballooned" against the old ENUM would have silently blanked the
--    phase rather than erroring.
--
--    The app is the right owner of this list (lib/inspections/phases.ts), so
--    the column becomes free text and the next phase added needs no DDL at all.
--    The trade-off is losing database-level validation; the API validates
--    against PHASES on write, which is where a typo would come from anyway.
--
-- 2. Existing rows are mapped to the new names.
--
--    CHECK THE MAPPING BELOW BEFORE RUNNING. Two of them are judgement calls:
--      Rework   -> Rejected   (both mean "went backwards", but Rejected is
--                              harder-edged than Rework was)
--      Canceled -> Hold       (Canceled was terminal, Hold reads as temporary;
--                              there is no exact successor in the new list)
--    If those are wrong for your data, edit the UPDATEs — nothing else depends
--    on the choice.
--
-- Safe to re-run: the column change is idempotent, and the UPDATEs match
-- nothing the second time.
-- =============================================

ALTER TABLE inspections
  MODIFY COLUMN phase VARCHAR(40) NOT NULL DEFAULT 'Setup';

UPDATE inspections SET phase = 'Measurements' WHERE phase = 'Measurement';
UPDATE inspections SET phase = 'Review'       WHERE phase = 'Submitted';
UPDATE inspections SET phase = 'Rejected'     WHERE phase = 'Rework';
UPDATE inspections SET phase = 'Complete'     WHERE phase = 'Completed';
UPDATE inspections SET phase = 'Hold'         WHERE phase = 'Canceled';

-- Sign-off rows record which phase was approved, so they carry the same names
-- and must move together or the signoff pipeline loses its history.
UPDATE inspection_signoffs SET phase = 'Measurements' WHERE phase = 'Measurement';
UPDATE inspection_signoffs SET phase = 'Review'       WHERE phase = 'Submitted';
UPDATE inspection_signoffs SET phase = 'Rejected'     WHERE phase = 'Rework';
UPDATE inspection_signoffs SET phase = 'Complete'     WHERE phase = 'Completed';
UPDATE inspection_signoffs SET phase = 'Hold'         WHERE phase = 'Canceled';
