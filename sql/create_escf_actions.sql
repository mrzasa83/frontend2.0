-- =============================================
-- ESCF Review Actions & Comments
-- =============================================

CREATE TABLE IF NOT EXISTS escf_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  escf_id INT NOT NULL,
  action_text TEXT NOT NULL,
  owner VARCHAR(100) DEFAULT NULL,
  assigned_to VARCHAR(100) DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  status ENUM('Open','Complete','Canceled') DEFAULT 'Open',
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_escf_id (escf_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS escf_action_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_id INT NOT NULL,
  escf_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action_id (action_id),
  INDEX idx_escf_id (escf_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
