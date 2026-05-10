-- =============================================
-- Work Center ↔ Paradigm Department Mapping
-- Maps ESCF work centers to Paradigm departments
-- =============================================

CREATE TABLE IF NOT EXISTS wc_dept_mapping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  escf_department VARCHAR(100) NOT NULL,
  paradigm_dept_code VARCHAR(20) NOT NULL,
  paradigm_dept_name VARCHAR(100) DEFAULT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mapping (escf_department, paradigm_dept_code),
  INDEX idx_escf_dept (escf_department),
  INDEX idx_paradigm_dept (paradigm_dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
