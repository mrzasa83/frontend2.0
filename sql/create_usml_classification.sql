-- =============================================
-- USML Classification Table
-- Source: 22 CFR Part 121
-- https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-121
-- =============================================

CREATE TABLE IF NOT EXISTS usml_classification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(10) NOT NULL,        -- Roman numeral, letter, or number (I, a, 1, i)
  parentId INT NOT NULL DEFAULT 0,      -- 0 = top-level category, else FK to parent id
  level INT NOT NULL DEFAULT 0,         -- 0=category, 1=letter, 2=number, 3=sub
  cDescription TEXT NOT NULL,           -- Full text description
  SME VARCHAR(3) DEFAULT NULL,          -- 'YES' if starred (*), NULL otherwise
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parentId (parentId),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Track when we last refreshed from eCFR
CREATE TABLE IF NOT EXISTS usml_metadata (
  id INT PRIMARY KEY DEFAULT 1,
  last_refreshed TIMESTAMP NULL,
  source_url VARCHAR(255) DEFAULT 'https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-121',
  record_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO usml_metadata (id, last_refreshed, record_count)
VALUES (1, NULL, 0)
ON DUPLICATE KEY UPDATE id = id;
