-- Adds the compliance-inheritance flag to an existing ehs_part_families table.
-- Run once if create_ehs_part_families.sql was applied before this column existed.
--
--   inherit_compliance = 1  parts inherit the family's REACH/RoHS/Prop 65 position
--   inherit_compliance = 0  the classification does not flow down; every part in
--                           the family needs its own supporting documents
--
-- MySQL has no "ADD COLUMN IF NOT EXISTS"; error 1060 (duplicate column) simply
-- means it is already there and can be ignored.

ALTER TABLE ehs_part_families
  ADD COLUMN inherit_compliance TINYINT(1) NOT NULL DEFAULT 1 AFTER classification_notes;
