-- frontImage LDI Tables
-- Run this on the MySQL database (node_app) alongside the existing activity_log_mdi table

-- Activity log table (rename from mdi to image if desired, or keep using the same one)
CREATE TABLE IF NOT EXISTS activity_log_image (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operator VARCHAR(100) NOT NULL,
  work_order VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  machine VARCHAR(100),
  data TEXT,
  created_at DATETIME NOT NULL,
  INDEX idx_operator (operator),
  INDEX idx_work_order (work_order),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Config table (shared with MDI or separate for IMAGE)
CREATE TABLE IF NOT EXISTS config_image (
  id INT AUTO_INCREMENT PRIMARY KEY,
  system VARCHAR(50) NOT NULL DEFAULT 'IMAGE',
  config_key VARCHAR(100) NOT NULL,
  config_value LONGTEXT NOT NULL,
  updated_at DATETIME,
  updated_by VARCHAR(100),
  UNIQUE KEY idx_system_key (system, config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LDI output log - tracks every OPFX output for auditing
CREATE TABLE IF NOT EXISTS ldi_output_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job VARCHAR(20) NOT NULL,
  operator VARCHAR(20),
  revision VARCHAR(100),
  layers TEXT,
  date_code VARCHAR(50),
  date_code_format VARCHAR(20),
  status ENUM('started', 'completed', 'failed') DEFAULT 'started',
  error_message TEXT,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  INDEX idx_job (job),
  INDEX idx_operator (operator),
  INDEX idx_status (status),
  INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
