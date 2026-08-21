-- =============================================
-- Inspections (First Article, X-Section, AOI)
-- =============================================

CREATE TABLE IF NOT EXISTS inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_number VARCHAR(30) NOT NULL,
  inspection_type ENUM('First Article','X-Section','AOI') NOT NULL DEFAULT 'First Article',
  product_type ENUM('PCB','ASM') NOT NULL DEFAULT 'PCB',
  part_number VARCHAR(100) DEFAULT NULL,
  pcb_number VARCHAR(100) DEFAULT NULL,
  work_order VARCHAR(50) DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  owner VARCHAR(100) DEFAULT NULL,
  phase ENUM('Setup','Measurement','Verify','Submitted','Rework','Completed','Canceled') NOT NULL DEFAULT 'Setup',
  site VARCHAR(50) DEFAULT NULL,
  dependency_id INT DEFAULT NULL,           -- e.g. ASM depends on a PCB inspection
  notes TEXT DEFAULT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inspection_number (inspection_number),
  INDEX idx_type (inspection_type),
  INDEX idx_phase (phase),
  INDEX idx_part (part_number),
  INDEX idx_wo (work_order),
  INDEX idx_dependency (dependency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Roles to add (via Role Management or directly):
-- INSERT IGNORE INTO Roles (name) VALUES ('Production Control'), ('Operations'), ('Quality Control');

-- Inspection change history
CREATE TABLE IF NOT EXISTS inspection_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id INT NOT NULL,
  field_name VARCHAR(60) NOT NULL,
  old_value TEXT DEFAULT NULL,
  new_value TEXT DEFAULT NULL,
  changed_by VARCHAR(50) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inspection_id (inspection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- If inspections table already exists:
-- ALTER TABLE inspections ADD COLUMN pcb_number VARCHAR(100) DEFAULT NULL AFTER part_number;
