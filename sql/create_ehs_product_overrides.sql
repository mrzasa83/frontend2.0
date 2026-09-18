-- =============================================
-- EHS — assembly-level classification and evidence
--
-- WHY THIS EXISTS
--   The material roll-up answers "do all the purchased materials on this BOM
--   clear each category". That is the right default and a poor final answer,
--   because the assembly is not just its materials:
--
--     * a route step removes the offending material (an etch, a strip, a
--       machining operation that takes the plating off)
--     * a route step qualifies it (a bake, a seal, a coating that takes the
--       part out of scope)
--     * the material is present below a threshold once it is in the assembly
--     * an exemption applies to the finished article but not to the input
--
--   So the assessor has to be able to conclude something different from what
--   the materials alone imply — and, crucially, to say WHY.
--
-- WHAT IS DEDUCIBLE FROM THIS TABLE
--   Both numbers are kept: what the materials computed, and what the assessor
--   concluded. A row where they differ with no reason is the thing an auditor
--   looks for, and that is only visible if the computed value is stored rather
--   than recalculated later against a family that has since changed.
--
-- Keyed on apc_part, not on an assessment id: the override is a standing
-- position on the assembly that survives re-assessment, whereas
-- ehs_product_assessments is the dated record of each sign-off.
-- =============================================

CREATE TABLE IF NOT EXISTS ehs_product_overrides (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  apc_part       VARCHAR(120) NOT NULL,
  -- What the assessor concluded for the finished assembly.
  reach_status   VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  rohs_status    VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  prop65_status  VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  pfas_status    VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  -- What the material roll-up said at the moment they concluded it.
  computed_reach  VARCHAR(20) NOT NULL DEFAULT '',
  computed_rohs   VARCHAR(20) NOT NULL DEFAULT '',
  computed_prop65 VARCHAR(20) NOT NULL DEFAULT '',
  computed_pfas   VARCHAR(20) NOT NULL DEFAULT '',
  -- The justification. Required by the API whenever a conclusion differs from
  -- the computed value — an unexplained override is worse than no override.
  reason         TEXT         NULL,
  -- The route step relied on, when the justification is a process step.
  -- Free text: the operation code, the step number, or a description.
  route_step     VARCHAR(200) NOT NULL DEFAULT '',
  updated_by     VARCHAR(50)  NOT NULL DEFAULT '',
  created_at     TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_apc_part (apc_part)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- Evidence held against the assembly rather than a material — a customer
-- declaration for the finished article, a test report, a process spec backing
-- a route-step justification.
--
-- Same shape and same share as ehs_part_documents, one folder per part on the
-- J drive (the S drive is mounted read-only in the containers).
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ehs_product_documents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  apc_part    VARCHAR(120) NOT NULL,
  doc_type    VARCHAR(30)  NOT NULL DEFAULT 'General', -- REACH | RoHS | Prop 65 | PFAS | Route | General
  title       VARCHAR(200) NOT NULL DEFAULT '',
  file_name   VARCHAR(300) NOT NULL,
  file_path   VARCHAR(700) NOT NULL,
  file_size   BIGINT       NULL,
  uploaded_by VARCHAR(50)  NOT NULL DEFAULT '',
  uploaded_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_part (apc_part),
  INDEX idx_type (doc_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
