-- =============================================
-- EHS — per-part compliance
--
-- Normally a part inherits its family's REACH / RoHS / Prop 65 position. When a
-- family is flagged inherit_compliance = 0 ("per part"), the classification does
-- NOT flow down and each part has to carry its own, backed by its own evidence.
-- Those part-level classifications live here.
--
-- Keyed on the trimmed INV_PART_NUMBER rather than an RKEY: Paradigm RKEYs are
-- not stable across environments, and the part number is what people actually
-- refer to.
-- =============================================

CREATE TABLE IF NOT EXISTS ehs_part_compliance (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  part_number    VARCHAR(120) NOT NULL,
  reach_status   VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  rohs_status    VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  prop65_status  VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  notes          TEXT         NULL,
  updated_by     VARCHAR(50)  NOT NULL DEFAULT '',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_part (part_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
