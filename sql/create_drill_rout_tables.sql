-- =============================================
-- Drill/Rout Saved Searches & PostOp Comments
-- Run on MySQL primary database
-- =============================================

-- Saved search definitions for drill/rout MCN queries
CREATE TABLE IF NOT EXISTS drill_rout_searches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  conditions JSON NOT NULL,
  -- conditions format: [{"field":"change","op":"contains","value":"feed","logic":"AND"},...]
  -- field: "change" | "chngeffect"
  -- op: "contains" | "equals" | "startsWith"
  -- logic: "AND" | "OR" (how this condition joins to the next)
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed the original "Rout - Speed/Feed Change" as a saved search
INSERT INTO drill_rout_searches (name, description, conditions, created_by) VALUES
(
  'Rout - Speed/Feed Change',
  'MCN records related to rout program speed and feed changes',
  '[{"field":"change","op":"contains","value":"feed","logic":"AND"},{"field":"change","op":"contains","value":"rout","logic":"OR"},{"field":"change","op":"contains","value":"rout","logic":"AND"},{"field":"change","op":"contains","value":"feed","logic":"OR"},{"field":"chngeffect","op":"contains","value":"Rout Prog","logic":"OR"}]',
  'system'
);

-- PostOp comments on individual MCN records
CREATE TABLE IF NOT EXISTS mcn_postop_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mcn_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mcn_id (mcn_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
