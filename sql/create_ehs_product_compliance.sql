-- =============================================
-- EHS module — Product Compliance
--
-- A product assessment is a dated signoff stating that, on that date, the
-- material families backing every purchased item on the product's BOM carried
-- the evidence needed to classify the product pass/fail for REACH, RoHS and
-- Prop 65.
--
-- ehs_product_assessments
--   The signoff header: what was assessed, the verdicts, who signed and when.
--
-- ehs_product_assessment_lines
--   A snapshot of the BOM as it stood at signoff — each purchased material, the
--   family it resolved to and that family's position. Kept because family
--   definitions and classifications change over time, and a signoff has to
--   remain readable against the evidence that existed on the day.
-- =============================================

CREATE TABLE IF NOT EXISTS ehs_product_assessments (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  apc_part       VARCHAR(120) NOT NULL,
  customer_part  VARCHAR(120) NOT NULL DEFAULT '',
  part_type      VARCHAR(20)  NOT NULL DEFAULT '',  -- PCB | ASM (from the part number)
  reach_status   VARCHAR(20)  NOT NULL DEFAULT 'Fail',  -- Pass | Fail
  rohs_status    VARCHAR(20)  NOT NULL DEFAULT 'Fail',
  prop65_status  VARCHAR(20)  NOT NULL DEFAULT 'Fail',
  material_count INT          NOT NULL DEFAULT 0,
  covered_count  INT          NOT NULL DEFAULT 0,   -- materials resolved to a family
  notes          TEXT         NULL,
  assessed_by    VARCHAR(50)  NOT NULL,
  assessed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_part (apc_part),
  INDEX idx_when (assessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ehs_product_assessment_lines (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT NOT NULL,
  part_number   VARCHAR(120) NOT NULL,
  description   VARCHAR(300) NOT NULL DEFAULT '',
  manufacturer  VARCHAR(200) NOT NULL DEFAULT '',
  family_name   VARCHAR(120) NOT NULL DEFAULT '',   -- blank when unassigned at signoff
  reach_status  VARCHAR(30)  NOT NULL DEFAULT '',
  rohs_status   VARCHAR(30)  NOT NULL DEFAULT '',
  prop65_status VARCHAR(30)  NOT NULL DEFAULT '',
  per_part_evidence TINYINT(1) NOT NULL DEFAULT 0,  -- family did not flow down
  INDEX idx_assessment (assessment_id),
  CONSTRAINT fk_line_assessment FOREIGN KEY (assessment_id)
    REFERENCES ehs_product_assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
