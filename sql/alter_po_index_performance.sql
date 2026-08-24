-- Indexes supporting the customer PO list query.
--
-- The list groups by file_path and joins two derived tables that group by
-- (po_number, customer) and (po_number, customer, rev). Without a composite
-- index each of those is a full scan, which is slow enough to hit the query
-- inactivity timeout on a large archive.
--
-- Safe to re-run: MySQL errors with 1061 (duplicate key name) if an index is
-- already present, which can be ignored.

ALTER TABLE customer_po_files
  ADD INDEX idx_po_customer (po_number, customer, rev, version, rev_rank);

ALTER TABLE customer_po_files
  ADD INDEX idx_file_path (file_path);

ALTER TABLE material_cert_pos
  ADD INDEX idx_part_po (apc_part_norm, po_number, lot);
