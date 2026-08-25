/* ============================================================================
   Customer PO index — idempotent schema migration.

   Run this whole file. It checks information_schema before each change, so
   re-running is safe and nothing aborts partway. Use this instead of
   alter_po_index_performance.sql and alter_customer_po_latest_flags.sql, which
   fail on 1060/1061 when a column or index is already present — and because
   most SQL clients stop the script at the first error, everything after that
   point silently never ran.

   Verify with the query at the bottom.
   ============================================================================ */


/* ---- customer_po_files.is_latest_rev -------------------------------------- */
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE table_schema = DATABASE()
             AND table_name = 'customer_po_files'
             AND column_name = 'is_latest_rev');
SET @s := IF(@c = 0,
  'ALTER TABLE customer_po_files ADD COLUMN is_latest_rev TINYINT(1) NOT NULL DEFAULT 1 AFTER version',
  'SELECT ''is_latest_rev already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;


/* ---- customer_po_files.is_latest_version ---------------------------------- */
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE table_schema = DATABASE()
             AND table_name = 'customer_po_files'
             AND column_name = 'is_latest_version');
SET @s := IF(@c = 0,
  'ALTER TABLE customer_po_files ADD COLUMN is_latest_version TINYINT(1) NOT NULL DEFAULT 1 AFTER is_latest_rev',
  'SELECT ''is_latest_version already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;


/* ---- index: idx_latest (drives the Latest Rev / Latest Version filters) ---- */
SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE table_schema = DATABASE()
             AND table_name = 'customer_po_files'
             AND index_name = 'idx_latest');
SET @s := IF(@c = 0,
  'ALTER TABLE customer_po_files ADD INDEX idx_latest (is_latest_rev, is_latest_version, po_number)',
  'SELECT ''idx_latest already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;


/* ---- index: idx_po_customer ----------------------------------------------- */
SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE table_schema = DATABASE()
             AND table_name = 'customer_po_files'
             AND index_name = 'idx_po_customer');
SET @s := IF(@c = 0,
  'ALTER TABLE customer_po_files ADD INDEX idx_po_customer (po_number, customer, rev, version, rev_rank)',
  'SELECT ''idx_po_customer already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;


/* ---- index: idx_file_path (the list groups on file_path) ------------------- */
SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE table_schema = DATABASE()
             AND table_name = 'customer_po_files'
             AND index_name = 'idx_file_path');
SET @s := IF(@c = 0,
  'ALTER TABLE customer_po_files ADD INDEX idx_file_path (file_path)',
  'SELECT ''idx_file_path already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;


/* ---- index: material_cert_pos.idx_part_po (supplier cert matching) --------- */
SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE table_schema = DATABASE()
             AND table_name = 'material_cert_pos'
             AND index_name = 'idx_part_po');
SET @s := IF(@c = 0,
  'ALTER TABLE material_cert_pos ADD INDEX idx_part_po (apc_part_norm, po_number, lot)',
  'SELECT ''idx_part_po already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;


/* ============================================================================
   VERIFY — every row below should say OK.
   ============================================================================ */
SELECT 'column is_latest_rev' AS item,
       IF(COUNT(*) > 0, 'OK', 'MISSING') AS status
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE() AND table_name = 'customer_po_files'
  AND column_name = 'is_latest_rev'
UNION ALL
SELECT 'column is_latest_version',
       IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE() AND table_name = 'customer_po_files'
  AND column_name = 'is_latest_version'
UNION ALL
SELECT 'index idx_latest', IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.STATISTICS
WHERE table_schema = DATABASE() AND table_name = 'customer_po_files'
  AND index_name = 'idx_latest'
UNION ALL
SELECT 'index idx_po_customer', IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.STATISTICS
WHERE table_schema = DATABASE() AND table_name = 'customer_po_files'
  AND index_name = 'idx_po_customer'
UNION ALL
SELECT 'index idx_file_path', IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.STATISTICS
WHERE table_schema = DATABASE() AND table_name = 'customer_po_files'
  AND index_name = 'idx_file_path'
UNION ALL
SELECT 'index idx_part_po', IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.STATISTICS
WHERE table_schema = DATABASE() AND table_name = 'material_cert_pos'
  AND index_name = 'idx_part_po'
UNION ALL
SELECT 'table customer_po_overrides', IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.TABLES
WHERE table_schema = DATABASE() AND table_name = 'customer_po_overrides'
UNION ALL
SELECT 'table index_state', IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.TABLES
WHERE table_schema = DATABASE() AND table_name = 'index_state';


/* Row counts, so you can see whether the index has actually been built. */
SELECT
  (SELECT COUNT(*) FROM customer_po_files)     AS customer_po_rows,
  (SELECT COUNT(DISTINCT po_number) FROM customer_po_files) AS distinct_pos,
  (SELECT COUNT(*) FROM customer_po_skipped)   AS skipped_files,
  (SELECT COUNT(*) FROM material_cert_pos)     AS supplier_cert_rows;
