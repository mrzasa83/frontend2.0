-- =============================================
-- FAI enhancements: due date, net inspect #, report type/destination, source,
-- plus an app_settings table (for the encrypted "delete FAI password").
-- Safe to run on an existing inspections table.
-- =============================================

ALTER TABLE inspections ADD COLUMN due_date DATE DEFAULT NULL AFTER start_date;
ALTER TABLE inspections ADD COLUMN net_inspect_number VARCHAR(60) DEFAULT NULL AFTER due_date;
ALTER TABLE inspections ADD COLUMN report_type VARCHAR(20) DEFAULT NULL AFTER net_inspect_number;          -- Internal | Customer
ALTER TABLE inspections ADD COLUMN report_destination VARCHAR(20) DEFAULT NULL AFTER report_type;          -- Net Inspect | SSR | Other
ALTER TABLE inspections ADD COLUMN report_destination_other VARCHAR(120) DEFAULT NULL AFTER report_destination;
ALTER TABLE inspections ADD COLUMN source_flag TINYINT(1) NOT NULL DEFAULT 0 AFTER report_destination_other; -- Source y/n

CREATE INDEX idx_due_date ON inspections (due_date);

-- Key/value app settings (values may be encrypted, e.g. delete FAI password)
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(60) PRIMARY KEY,
  setting_value TEXT DEFAULT NULL,
  is_encrypted TINYINT(1) NOT NULL DEFAULT 0,
  updated_by VARCHAR(50) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
