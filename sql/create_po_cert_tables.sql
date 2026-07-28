-- =============================================
-- PO Cert feature
--
-- 1) po_customer_mapping
--    Maps a Paradigm customer (DATA0010.ABBR_NAME, e.g. "NORTBALT") to one or
--    more PO folder names under  S:\Quality\QCDept\PO  (e.g. "NGC", "NGC SPACE").
--    Managed from Admin ▸ PO Folders, mirroring the Work Centers mapping app.
--
-- 2) inspection_po_cert_selections
--    Persists the PO cert PDF(s) a reviewer relates to a specific First Article
--    inspection, keyed by the inspection + the file path.
-- =============================================

CREATE TABLE IF NOT EXISTS po_customer_mapping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paradigm_customer   VARCHAR(100) NOT NULL,   -- DATA0010.ABBR_NAME
  paradigm_rkey       INT DEFAULT NULL,        -- DATA0010.RKEY (optional)
  po_folder           VARCHAR(190) NOT NULL,   -- folder basename under the PO root
  created_by          VARCHAR(50)  NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_po_map (paradigm_customer, po_folder),
  INDEX idx_customer (paradigm_customer),
  INDEX idx_folder   (po_folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS inspection_po_cert_selections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id   INT NOT NULL,
  apc_part        VARCHAR(20)  NOT NULL DEFAULT '',  -- 5-digit APC part parsed from the filename
  customer_part   VARCHAR(190) NOT NULL DEFAULT '',  -- customer part number (reference)
  version_label   VARCHAR(60)  NOT NULL DEFAULT '',  -- e.g. Version00003 / CO2 / Original
  po_folder       VARCHAR(190) NOT NULL DEFAULT '',
  file_path       VARCHAR(700) NOT NULL,
  path_hash       CHAR(40)     NOT NULL,             -- SHA1(file_path) for the unique key
  selected_by     VARCHAR(50)  NOT NULL,
  selected_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_po_cert (inspection_id, path_hash),
  INDEX idx_inspection (inspection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================
-- 3) po_cert_files  (file catalog)
--    One row per (file × APC part) parsed from the PO folder tree. Populated by
--    a scan of the drive (Admin/Refresh) so the FAI PO Certs tab can filter by
--    part number instantly instead of walking the network share on every open.
--    A file naming several APC parts (e.g. "76272 76273 5000611123-Version00")
--    yields one row per part, so an exact part match still finds multi-part POs.
-- =============================================

CREATE TABLE IF NOT EXISTS po_cert_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_folder      VARCHAR(190) NOT NULL,            -- top-level customer PO folder
  apc_part       VARCHAR(20)  NOT NULL DEFAULT '', -- 5-digit APC part ('' if unparsed)
  customer_part  VARCHAR(190) NOT NULL DEFAULT '', -- customer part number (reference)
  version_label  VARCHAR(60)  NOT NULL DEFAULT '', -- Version00003 / CO2 / Original
  version_rank   INT DEFAULT NULL,                 -- numeric rank for "latest"
  file_name      VARCHAR(400) NOT NULL,
  file_path      VARCHAR(700) NOT NULL,
  rel_dir        VARCHAR(500) NOT NULL DEFAULT '', -- sub-path within the folder
  file_mtime     DATETIME     NULL,                -- filesystem last-modified (sort key)
  file_size      BIGINT       NULL,
  path_hash      CHAR(40)     NOT NULL,            -- SHA1(file_path)
  scanned_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pocf (path_hash, apc_part),
  INDEX idx_part    (apc_part),
  INDEX idx_folder  (po_folder),
  INDEX idx_mtime   (file_mtime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
