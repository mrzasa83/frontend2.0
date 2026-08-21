-- =============================================
-- Reworks (Operation module)
-- Digital replacement for the hand-written Rework Form (F01-2A-990-09).
-- Header data sourced from Paradigm (work order / customer part); discrepancy
-- and rework steps stored here. Traceability table deferred to a later rev.
-- =============================================

CREATE TABLE IF NOT EXISTS reworks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rework_number VARCHAR(20) NOT NULL UNIQUE,     -- RW-YYYY-NNNN
  customer_name VARCHAR(120) DEFAULT NULL,
  customer_part VARCHAR(100) DEFAULT NULL,        -- APC Part # (DATA0050)
  work_order VARCHAR(100) DEFAULT NULL,
  pcb_number VARCHAR(100) DEFAULT NULL,           -- inventory part #
  inspection_report VARCHAR(60) DEFAULT NULL,     -- free-entry field
  authorized_by VARCHAR(120) DEFAULT NULL,
  rework_date DATE DEFAULT NULL,
  discrepancy TEXT DEFAULT NULL,
  status ENUM('Open','Closed','Canceled') NOT NULL DEFAULT 'Open',
  site VARCHAR(40) DEFAULT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_work_order (work_order),
  INDEX idx_customer_part (customer_part)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ordered rework steps. step_code/step_name come from the Paradigm department
-- picker (DATA0034) or free text; notes are free-text parameters/instructions.
CREATE TABLE IF NOT EXISTS rework_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rework_id INT NOT NULL,
  step_order INT NOT NULL DEFAULT 0,
  step_code VARCHAR(40) DEFAULT NULL,
  step_name VARCHAR(200) NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rework (rework_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
