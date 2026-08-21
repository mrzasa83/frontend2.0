-- =============================================
-- Inspection cert file selections
-- Persists the reviewer-chosen PDF for a given cert row (part + PO + batch)
-- on a specific inspection, so the choice is locked in at review/signoff.
-- =============================================

CREATE TABLE IF NOT EXISTS inspection_cert_selections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id INT NOT NULL,
  purchased_part VARCHAR(100) NOT NULL,
  po_number VARCHAR(50) NOT NULL,
  batch_serial VARCHAR(100) NOT NULL,
  file_path VARCHAR(700) NOT NULL,
  selected_by VARCHAR(50) NOT NULL,
  selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cert (inspection_id, purchased_part, po_number, batch_serial),
  INDEX idx_inspection (inspection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
