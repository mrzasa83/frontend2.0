-- =============================================
-- EHS — per-part evidence documents
--
-- Mirrors ehs_family_documents, but keyed on the part number. A family-level
-- document covers every part in the family; this is for the case where a single
-- part carries its own evidence — the usual situation in an inherit_compliance
-- = 0 family such as HDW, where each hardware item has its own certificate.
--
-- Keyed on the trimmed INV_PART_NUMBER, matching ehs_part_compliance, because
-- Paradigm RKEYs are not stable across environments.
--
-- NOTE: files land in the same share as family documents (MTRL_COMP_PATH),
-- which must exist and be writable by the container. It is created on demand,
-- but on a read-only mount that fails at upload time rather than at startup.
-- =============================================

CREATE TABLE IF NOT EXISTS ehs_part_documents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  part_number VARCHAR(120) NOT NULL,
  doc_type    VARCHAR(30)  NOT NULL DEFAULT 'General', -- REACH | RoHS | Prop 65 | SDS | General
  title       VARCHAR(200) NOT NULL DEFAULT '',
  file_name   VARCHAR(300) NOT NULL,
  file_path   VARCHAR(700) NOT NULL,
  file_size   BIGINT       NULL,
  uploaded_by VARCHAR(50)  NOT NULL DEFAULT '',
  uploaded_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  -- part_number is VARCHAR(120) = 480 bytes in utf8mb4, under the 767-byte
  -- per-column index cap on MySQL 5.6, so no prefix is needed here.
  INDEX idx_part (part_number),
  INDEX idx_type (doc_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
