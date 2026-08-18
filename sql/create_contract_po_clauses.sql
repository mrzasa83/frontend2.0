-- =============================================
-- Contract module — PO ⇄ Clause relations
--
-- A "PO" in the Contract module is the (po_number + customer) pair, derived
-- from the existing po_cert_files catalog (customer_part = PO#, po_folder =
-- customer). Versions/files live in po_cert_files already; these tables add the
-- clause relationships and the auto-scan audit.
--
-- contract_po_clauses
--   Relates a PO (po_number + customer) to a clause in contract_clauses.
--   how_added: 'auto' (OCR scan) or a username (manual selection).
--
-- contract_po_scans
--   One row per Auto Scan run: which PO/version file was scanned, when, by whom,
--   how many clauses matched. Advisory — the user accepts/rejects results.
-- =============================================

CREATE TABLE IF NOT EXISTS contract_po_clauses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  po_number     VARCHAR(190) NOT NULL,            -- customer_part from po_cert_files
  customer      VARCHAR(190) NOT NULL,            -- po_folder from po_cert_files
  clause_id     INT NOT NULL,                     -- FK -> contract_clauses.id
  standard      VARCHAR(40)  NOT NULL DEFAULT '', -- denormalized for display/sort
  clause_number VARCHAR(80)  NOT NULL DEFAULT '',
  how_added     VARCHAR(60)  NOT NULL,            -- 'auto' or the username who added it
  source_file   VARCHAR(400) NOT NULL DEFAULT '', -- which version file it was found in (auto)
  confidence    VARCHAR(20)  NOT NULL DEFAULT '', -- 'catalog' | 'pattern' (auto scan basis)
  created_by    VARCHAR(50)  NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_po_clause (po_number, customer, clause_id),
  INDEX idx_po (po_number, customer),
  INDEX idx_clause (clause_id),
  CONSTRAINT fk_pc_clause FOREIGN KEY (clause_id) REFERENCES contract_clauses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contract_po_scans (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  po_number     VARCHAR(190) NOT NULL,
  customer      VARCHAR(190) NOT NULL,
  version_label VARCHAR(60)  NOT NULL DEFAULT '', -- which version was scanned
  file_name     VARCHAR(400) NOT NULL DEFAULT '',
  file_path     VARCHAR(700) NOT NULL DEFAULT '',
  pages         INT DEFAULT NULL,
  ocr_pages     INT DEFAULT NULL,                 -- how many pages needed OCR
  matches_found INT DEFAULT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT '', -- ok | error
  message       VARCHAR(500) NOT NULL DEFAULT '',
  scanned_by    VARCHAR(50)  NOT NULL,
  scanned_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_po (po_number, customer),
  INDEX idx_when (scanned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
