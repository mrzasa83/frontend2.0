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

-- file_path(191), not the whole column. file_path is VARCHAR(700); in utf8mb4
-- that is 2800 bytes against a 767-byte per-column index cap on 5.6, so the
-- unprefixed form fails with error 1071 ("key too long"). Note the header
-- above says to ignore errors on re-run — 1071 looks like that same expected
-- noise, so this index can appear to exist while silently never having been
-- created, leaving the PO list query on the full scan it was meant to fix.
-- Check with: SHOW INDEX FROM customer_po_files WHERE Key_name='idx_file_path';
-- A 191-character prefix is highly selective for paths. If it isn't enough,
-- the table already carries path_hash CHAR(40) = sha1(file_path), which
-- indexes in full at 160 bytes.
ALTER TABLE customer_po_files
  ADD INDEX idx_file_path (file_path(191));

ALTER TABLE material_cert_pos
  ADD INDEX idx_part_po (apc_part_norm, po_number, lot);
