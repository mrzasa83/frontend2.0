-- =============================================
-- ESCF Attachments Metadata
-- Local metadata for ESCF attachments
-- Files synced to /mnt/jdrive/APC EngJobs/00 DocControl/escf
-- =============================================

CREATE TABLE IF NOT EXISTS escf_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  escf_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,

  created_by VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_escf_file (escf_id, filename),
  INDEX idx_escf_id (escf_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
