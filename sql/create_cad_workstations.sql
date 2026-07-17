-- =============================================
-- CAD Workstations (Admin module)
-- List of Linux workstations to monitor for logged-in CAD users / processes.
-- SSH credentials are a single AD service account stored in env
-- (CAD_SSH_USER / CAD_SSH_PASSWORD), NOT per machine.
-- =============================================

CREATE TABLE IF NOT EXISTS cad_workstations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostname VARCHAR(120) NOT NULL UNIQUE,   -- e.g. nh3301rh (resolvable or FQDN/IP)
  label VARCHAR(120) DEFAULT NULL,          -- friendly name / location
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_by VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
