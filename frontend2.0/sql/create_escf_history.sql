-- =============================================
-- ESCF Change History Log
-- Tracks edits to engineering standards (escf table)
-- =============================================

CREATE TABLE IF NOT EXISTS escf_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  escf_id INT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT DEFAULT NULL,
  new_value TEXT DEFAULT NULL,
  changed_by VARCHAR(50) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_escf_id (escf_id),
  INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
