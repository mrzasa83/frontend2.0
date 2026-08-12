-- Activity Log Table for Shop Floor Application
-- Run this on the MySQL database (node_app) to create the logging table

CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operator VARCHAR(100) NOT NULL,
  work_order VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  data TEXT,
  created_at DATETIME NOT NULL,
  INDEX idx_operator (operator),
  INDEX idx_work_order (work_order),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
