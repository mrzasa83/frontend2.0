-- =============================================
-- Config table backing Admin Config (Genesis host/user, archive path,
-- output configs, MDI output path, MDI dept-interest list, etc).
-- Keyed by (system, config_key) so ON DUPLICATE KEY UPDATE upserts cleanly.
-- Without this table (or without the unique key), every Admin Config "Save"
-- fails silently and settings never persist.
-- =============================================

CREATE TABLE IF NOT EXISTS config_mdi (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  system       VARCHAR(64)  NOT NULL DEFAULT 'MDI',
  config_key   VARCHAR(128) NOT NULL,
  config_value TEXT         NOT NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by   VARCHAR(128) NULL,
  UNIQUE KEY uq_system_key (system, config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Also ensure the activity log table the app writes to exists.
CREATE TABLE IF NOT EXISTS activity_log_mdi (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  operator    VARCHAR(128) NULL,
  work_order  VARCHAR(64)  NULL,
  action      VARCHAR(128) NULL,
  machine     VARCHAR(128) NULL,
  data        TEXT         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_work_order (work_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
