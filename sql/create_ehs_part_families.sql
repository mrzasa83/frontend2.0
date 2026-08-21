-- =============================================
-- EHS module — Part Family Management
--
-- Purchased parts live in Paradigm (MSSQL DATA0017) and are read-only. A
-- "family" is a saved set of search criteria that buckets those parts, plus the
-- material-compliance classification and the evidence backing it.
--
-- The base search is fixed and applied to every family:
--     P_M = 'P' AND ACTIVE_FLAG = 'Y' AND INV_PART_NUMBER NOT LIKE 'Z%'
-- Each family then adds one or more criteria, AND'd together, e.g.
--     INV_PART_NUMBER LIKE 'PPGLB%'
--
-- Supporting documents are filed on the S drive at
--     S:\FrontEndQCFolders\MtrlComp\{familyName}-{date}.pdf
-- and indexed here.
-- =============================================

CREATE TABLE IF NOT EXISTS ehs_part_families (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  family_name    VARCHAR(120) NOT NULL,
  description    VARCHAR(500) NOT NULL DEFAULT '',
  -- Compliance classification. Values: Compliant | Non-Compliant | Exempt |
  -- Unknown  (Unknown is the default until evidence is filed).
  reach_status   VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  rohs_status    VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  prop65_status  VARCHAR(30)  NOT NULL DEFAULT 'Unknown',
  classification_notes TEXT   NULL,
  sort_order     INT          NOT NULL DEFAULT 100,  -- lower wins when a part matches two families
  active         TINYINT(1)   NOT NULL DEFAULT 1,
  created_by     VARCHAR(50)  NOT NULL DEFAULT '',
  updated_by     VARCHAR(50)  NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_family (family_name),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ehs_family_criteria (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  family_id   INT NOT NULL,
  field       VARCHAR(40) NOT NULL,             -- INV_PART_NUMBER | INV_PART_DESCRIPTION | MANUFACTURER_NAME
  operator    VARCHAR(20) NOT NULL DEFAULT 'LIKE', -- LIKE | NOT LIKE
  pattern     VARCHAR(200) NOT NULL,            -- e.g. PPGLB%
  seq         INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_family (family_id),
  CONSTRAINT fk_crit_family FOREIGN KEY (family_id) REFERENCES ehs_part_families(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ehs_family_documents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  family_id   INT NOT NULL,
  doc_type    VARCHAR(30)  NOT NULL DEFAULT 'General', -- REACH | RoHS | Prop 65 | General
  title       VARCHAR(200) NOT NULL DEFAULT '',
  file_name   VARCHAR(300) NOT NULL,
  file_path   VARCHAR(700) NOT NULL,
  file_size   BIGINT       NULL,
  uploaded_by VARCHAR(50)  NOT NULL DEFAULT '',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_family (family_id),
  CONSTRAINT fk_doc_family FOREIGN KEY (family_id) REFERENCES ehs_part_families(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed the two families that are known up front. Both are their own bucket.
INSERT INTO ehs_part_families (family_name, description, sort_order, created_by)
VALUES
  ('HDW',    'Hardware — all part numbers beginning HDW', 10, 'system'),
  ('CHASSY', 'Chassis — all part numbers beginning CHASSY', 10, 'system')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO ehs_family_criteria (family_id, field, operator, pattern, seq)
SELECT f.id, 'INV_PART_NUMBER', 'LIKE', CONCAT(f.family_name, '%'), 0
FROM ehs_part_families f
WHERE f.family_name IN ('HDW', 'CHASSY')
  AND NOT EXISTS (SELECT 1 FROM ehs_family_criteria c WHERE c.family_id = f.id);
