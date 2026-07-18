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
