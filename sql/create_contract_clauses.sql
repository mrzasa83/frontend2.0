-- =============================================
-- Contract module — Clauses
--
-- contract_clauses
--   The standardized FAR/DFAR/agency clause catalog, seeded from
--   "FAR_DFAR_Clause_Review_2024.xlsx". One canonical row per
--   (standard, clause_number). Merged across the workbook's sheets
--   (FAR & DFAR Review, NAVSEA, NAVAIR, NAVAIR 2, NON STANDARD, NGC).
--
--   classification = the review-log compliance disposition (Y / N / N/A /
--   blank / other). Editable by Admin only (enforced in the PUT API).
--   Every classification change is journaled in contract_clause_history.
--
-- contract_clause_history
--   Audit trail of classification edits (who/when/old→new).
-- =============================================

CREATE TABLE IF NOT EXISTS contract_clauses (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  standard       VARCHAR(40)  NOT NULL,            -- FAR, DFAR, NAVSEA, NAVAIR, NMCARS, CFR, NON-STANDARD, NGC, …
  clause_number  VARCHAR(80)  NOT NULL,            -- e.g. 52.204-21, 252.204-7012, C-204-H002
  title          VARCHAR(500) NOT NULL DEFAULT '',
  clause_text    MEDIUMTEXT   NULL,                -- full text where the workbook carried it (182 clauses)
  effective_date VARCHAR(40)  NOT NULL DEFAULT '', -- kept as text; source values are inconsistent
  classification VARCHAR(40)  NOT NULL DEFAULT '', -- Y / N / N/A / blank / other (admin-editable)
  reviewer       VARCHAR(120) NOT NULL DEFAULT '',
  date_reviewed  VARCHAR(40)  NOT NULL DEFAULT '',
  comments       TEXT         NULL,
  sources        VARCHAR(200) NOT NULL DEFAULT '', -- which workbook sheet(s) this row came from
  updated_by     VARCHAR(50)  NULL,                -- last admin to edit classification
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_clause (standard, clause_number),
  INDEX idx_standard (standard),
  INDEX idx_number (clause_number),
  INDEX idx_classification (classification),
  FULLTEXT KEY ft_clause (title, clause_text, comments)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contract_clause_history (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  clause_id      INT NOT NULL,
  old_value      VARCHAR(40) NOT NULL DEFAULT '',
  new_value      VARCHAR(40) NOT NULL DEFAULT '',
  changed_by     VARCHAR(50) NOT NULL,
  changed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_clause (clause_id),
  CONSTRAINT fk_clause_hist FOREIGN KEY (clause_id) REFERENCES contract_clauses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
