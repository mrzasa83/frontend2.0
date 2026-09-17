-- =============================================
-- EHS — add PFAS as a fourth compliance category
--
-- PFAS (per- and polyfluoroalkyl substances) sits alongside REACH, RoHS and
-- Prop 65 rather than inside any of them: the EU restriction proposal and the
-- various US state reporting rules are their own regime, and a part can be
-- clean on all three existing categories while still carrying PFAS.
--
-- Additive only — every column defaults to 'Unknown', so existing rows keep
-- their current meaning and nothing is silently reclassified.
--
-- MySQL 5.6 has no ADD COLUMN IF NOT EXISTS, so re-running this errors with
-- 1060 (duplicate column). That is safe to ignore.
-- =============================================

ALTER TABLE ehs_part_families
  ADD COLUMN pfas_status VARCHAR(30) NOT NULL DEFAULT 'Unknown' AFTER prop65_status;

ALTER TABLE ehs_part_compliance
  ADD COLUMN pfas_status VARCHAR(30) NOT NULL DEFAULT 'Unknown' AFTER prop65_status;

ALTER TABLE ehs_product_assessments
  ADD COLUMN pfas_status VARCHAR(30) NOT NULL DEFAULT 'Unknown' AFTER prop65_status;

ALTER TABLE ehs_product_assessment_lines
  ADD COLUMN pfas_status VARCHAR(30) NOT NULL DEFAULT 'Unknown' AFTER prop65_status;
