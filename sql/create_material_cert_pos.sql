-- =============================================
-- Material certs — purchase-order C of C inventory
--
-- A file-level index of the certificate-of-conformance archive on the L drive.
-- The existing material_cert_folders table indexes FOLDERS; this one indexes the
-- PDFs themselves so certs can be searched by PO number, lot, APC part, material
-- type, site or scan date without walking the tree.
--
-- Source layout, one root per site:
--   L:\NashuaScanDocStorage\C_of_Cs_by_Part_Number\Paradigm C of Cs
--   L:\MesaScanDocStorage\C_of_Cs_by_Part_Number\Paradigm C of Cs
--   L:\MexicoDocStorage\C_of_Cs_by_Part_Number\Paradigm C of Cs
--     <Material Type>\<APC Part Number>\<PUR number> - LOT <lot>.pdf
-- =============================================

CREATE TABLE IF NOT EXISTS material_cert_pos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  site          VARCHAR(30)  NOT NULL DEFAULT '',   -- Nashua | Mesa | Mexico
  material_type VARCHAR(190) NOT NULL DEFAULT '',   -- first level below the root
  apc_part      VARCHAR(190) NOT NULL DEFAULT '',   -- second level below the root
  apc_part_norm VARCHAR(190) NOT NULL DEFAULT '',   -- upper-cased, punctuation stripped
  po_number     VARCHAR(60)  NOT NULL DEFAULT '',   -- PUR0133783
  lot           VARCHAR(120) NOT NULL DEFAULT '',   -- 2507410115
  file_name     VARCHAR(300) NOT NULL,
  file_path     VARCHAR(700) NOT NULL,
  rel_dir       VARCHAR(500) NOT NULL DEFAULT '',   -- path below the root, for deeper nesting
  file_mtime    DATETIME     NULL,                  -- filesystem modified date
  file_size     BIGINT       NULL,
  path_hash     CHAR(40)     NOT NULL,              -- sha1 of file_path, the upsert key
  indexed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_path (path_hash),
  INDEX idx_po (po_number),
  INDEX idx_part (apc_part_norm),
  INDEX idx_lot (lot),
  INDEX idx_type (material_type),
  INDEX idx_site (site),
  INDEX idx_mtime (file_mtime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per indexing run, so the UI can report when the inventory was last
-- refreshed and whether a root was unreachable.
CREATE TABLE IF NOT EXISTS material_cert_po_runs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  started_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at  DATETIME     NULL,
  files_found  INT          NOT NULL DEFAULT 0,
  files_written INT         NOT NULL DEFAULT 0,
  removed      INT          NOT NULL DEFAULT 0,
  status       VARCHAR(20)  NOT NULL DEFAULT '',
  message      VARCHAR(1000) NOT NULL DEFAULT '',
  run_by       VARCHAR(50)  NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
