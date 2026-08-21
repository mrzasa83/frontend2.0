-- =============================================
-- Inspection Reviews + Signoffs
-- Mirrors the ESCF Standards pattern: actions with notes, plus per-stage
-- password sign-offs that drive the Signoff timeline.
-- =============================================

-- Review actions (an item raised during the inspection review)
CREATE TABLE IF NOT EXISTS inspection_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id INT NOT NULL,
  action_text TEXT NOT NULL,
  assigned_to VARCHAR(100) DEFAULT NULL,
  status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inspection (inspection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notes/comments on an action (threaded under the action)
CREATE TABLE IF NOT EXISTS inspection_action_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_id INT NOT NULL,
  note_text TEXT NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Per-stage sign-offs (password-verified). One row per phase approved.
CREATE TABLE IF NOT EXISTS inspection_signoffs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id INT NOT NULL,
  phase VARCHAR(40) NOT NULL,        -- the phase being signed off
  approved_by VARCHAR(50) NOT NULL,
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note TEXT DEFAULT NULL,
  UNIQUE KEY uq_phase (inspection_id, phase),
  INDEX idx_inspection (inspection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
