-- =============================================
-- Customer POs (received / sales orders) + shared index freshness
--
-- Source:  S:\Quality\QCDept\PO\<Customer>\[<SubGroup>\]<file>.pdf
-- File:    <APC part> [<APC part> ...] <customer PO number>[<rev>] [revised]
--
-- One row per APC PART, because a single PO file can cover several parts:
--   "30844 30845 3506869069_9.pdf"  ->  two rows, same PO number and rev.
-- =============================================

CREATE TABLE IF NOT EXISTS customer_po_files (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer    VARCHAR(190) NOT NULL DEFAULT '',   -- first level below the PO root
  sub_group   VARCHAR(190) NOT NULL DEFAULT '',   -- optional second level
  apc_part    VARCHAR(40)  NOT NULL DEFAULT '',   -- one row per part
  po_number   VARCHAR(60)  NOT NULL DEFAULT '',   -- the customer's PO number
  rev         VARCHAR(10)  NOT NULL DEFAULT '',   -- E, 8, 9, C …
  rev_rank    INT          NULL,                  -- digits as-is, letters A=1 … for "latest"
  version     VARCHAR(4)   NOT NULL DEFAULT 'V0', -- V1 when the name says "revised"
  file_name   VARCHAR(300) NOT NULL,
  file_path   VARCHAR(700) NOT NULL,
  file_mtime  DATETIME     NULL,                  -- filesystem modified date
  file_size   BIGINT       NULL,
  path_hash   CHAR(40)     NOT NULL,              -- sha1(file_path + '|' + apc_part)
  indexed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_path_part (path_hash),
  INDEX idx_po (po_number),
  INDEX idx_part (apc_part),
  INDEX idx_customer (customer),
  INDEX idx_subgroup (sub_group),
  INDEX idx_mtime (file_mtime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Files that couldn't be parsed, kept so they can be found and corrected rather
-- than silently dropped (e.g. the legacy 6-digit leading numbers).
CREATE TABLE IF NOT EXISTS customer_po_skipped (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  customer   VARCHAR(190) NOT NULL DEFAULT '',
  sub_group  VARCHAR(190) NOT NULL DEFAULT '',
  file_name  VARCHAR(300) NOT NULL,
  file_path  VARCHAR(700) NOT NULL,
  reason     VARCHAR(200) NOT NULL DEFAULT '',
  file_mtime DATETIME     NULL,
  path_hash  CHAR(40)     NOT NULL,
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_path (path_hash),
  INDEX idx_customer (customer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Shared freshness tracker for background index refreshes.
-- One row per index ('customer_pos', 'supplier_cert_pos'). A page read checks
-- last_finished; if it's older than the refresh window, a rebuild is kicked off
-- in the background and the page still renders immediately from what's there.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS index_state (
  index_name    VARCHAR(60) PRIMARY KEY,
  last_started  DATETIME    NULL,
  last_finished DATETIME    NULL,
  running       TINYINT(1)  NOT NULL DEFAULT 0,
  last_count    INT         NOT NULL DEFAULT 0,
  last_status   VARCHAR(20) NOT NULL DEFAULT '',
  last_message  VARCHAR(1000) NOT NULL DEFAULT '',
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO index_state (index_name) VALUES ('customer_pos'), ('supplier_cert_pos')
ON DUPLICATE KEY UPDATE index_name = VALUES(index_name);
