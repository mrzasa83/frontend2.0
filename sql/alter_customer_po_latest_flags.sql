-- Precomputed "latest" flags for the customer PO index.
--
-- The list query used to work out the newest revision and version on every page
-- load, using derived tables that scanned the whole table twice. On a real
-- archive that exceeded the 15s query timeout — especially while an index sweep
-- was writing — and surfaced as PROTOCOL_SEQUENCE_TIMEOUT.
--
-- These flags are computed once per index run instead, so the read is a plain
-- indexed WHERE.
--
-- Safe to re-run: error 1060 (duplicate column) / 1061 (duplicate key) just mean
-- it is already applied.

ALTER TABLE customer_po_files
  ADD COLUMN is_latest_rev TINYINT(1) NOT NULL DEFAULT 1 AFTER version;

ALTER TABLE customer_po_files
  ADD COLUMN is_latest_version TINYINT(1) NOT NULL DEFAULT 1 AFTER is_latest_rev;

ALTER TABLE customer_po_files
  ADD INDEX idx_latest (is_latest_rev, is_latest_version, po_number);
