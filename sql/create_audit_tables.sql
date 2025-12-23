-- =============================================
-- Audit Definition and Records Tables
-- Run this script on your MySQL primary database
-- =============================================

-- Create audit definition table
CREATE TABLE IF NOT EXISTS audit_def (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active TINYINT(1) DEFAULT 1,
  
  -- JSON string storing field definitions
  -- Format: [{"id": "field1", "label": "Field 1", "type": "radio|checkbox|text|number", "options": ["opt1", "opt2"], "required": true}]
  fields_json TEXT NOT NULL,
  
  -- JSON string storing authorized user IDs
  -- Format: [1, 2, 3, 5]
  authorized_users_json TEXT NOT NULL,
  
  INDEX idx_audit_def_active (active),
  INDEX idx_audit_def_created_by (created_by)
);

-- Create audit records table
CREATE TABLE IF NOT EXISTS audit_record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  audit_def_id INT NOT NULL,
  recorded_by INT NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- JSON string storing the actual record values
  -- Format: {"field1": "value1", "field2": ["opt1", "opt2"], ...}
  values_json TEXT NOT NULL,
  
  -- Optional notes
  notes TEXT,
  
  INDEX idx_audit_record_def (audit_def_id),
  INDEX idx_audit_record_user (recorded_by),
  INDEX idx_audit_record_date (recorded_at),
  
  FOREIGN KEY (audit_def_id) REFERENCES audit_def(id) ON DELETE CASCADE
);

-- Sample data (optional - comment out if not needed)
-- INSERT INTO audit_def (name, description, created_by, fields_json, authorized_users_json)
-- VALUES (
--   'Daily Quality Check',
--   'Daily inspection checklist for production line',
--   1,
--   '[{"id":"pass_fail","label":"Pass/Fail","type":"radio","options":["Pass","Fail"],"required":true},{"id":"issues","label":"Issues Found","type":"checkbox","options":["Surface defects","Dimensional","Assembly","Packaging"],"required":false},{"id":"notes","label":"Notes","type":"text","required":false}]',
--   '[1,2,3]'
-- );
