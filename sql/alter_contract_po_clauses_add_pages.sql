-- Adds the scan's page numbers to existing contract_po_clauses installations.
-- Safe to run once on a database where create_contract_po_clauses.sql has
-- already been applied. (MySQL has no "ADD COLUMN IF NOT EXISTS"; if the column
-- is already present this errors with 1060 Duplicate column name, which you can
-- ignore.)

ALTER TABLE contract_po_clauses
  ADD COLUMN found_pages VARCHAR(120) NOT NULL DEFAULT '' AFTER confidence;
