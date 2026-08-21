-- =============================================
-- Work Center ↔ Paradigm Department Mapping
-- Maps ESCF work centers to Paradigm departments
-- =============================================

CREATE TABLE IF NOT EXISTS wc_dept_mapping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  escf_department VARCHAR(100) NOT NULL,
  paradigm_rkey INT DEFAULT NULL,
  paradigm_dept_code VARCHAR(20) NOT NULL,
  paradigm_dept_name VARCHAR(100) DEFAULT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mapping (escf_department, paradigm_dept_code),
  INDEX idx_escf_dept (escf_department),
  INDEX idx_paradigm_dept (paradigm_dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- If table already exists, add the rkey column:
-- ALTER TABLE wc_dept_mapping ADD COLUMN paradigm_rkey INT DEFAULT NULL AFTER escf_department;
