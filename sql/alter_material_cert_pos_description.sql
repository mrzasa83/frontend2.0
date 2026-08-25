/* ============================================================================
   Supplier cert index — add the Paradigm part description.

   The folder under each material type is the APC part number
   (DATA0017.INV_PART_NUMBER), e.g.
       .../Paradigm C of Cs/Laminate/LBA0590H2H2418/PUR0073727 - LOT 14449567.pdf
   so the part's description can be pulled from Paradigm and stored alongside
   the cert, which makes the listing readable without a second lookup.

   part_found also records whether the folder actually matched a Paradigm part —
   a folder that matches nothing is usually a typo or an obsolete number, and
   it's useful to be able to list those.

   Idempotent: checks information_schema first, so re-running is safe and the
   script won't abort partway.
   ============================================================================ */

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE table_schema = DATABASE()
             AND table_name = 'material_cert_pos'
             AND column_name = 'part_description');
SET @s := IF(@c = 0,
  'ALTER TABLE material_cert_pos ADD COLUMN part_description VARCHAR(300) NOT NULL DEFAULT '''' AFTER apc_part_norm',
  'SELECT ''part_description already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE table_schema = DATABASE()
             AND table_name = 'material_cert_pos'
             AND column_name = 'part_found');
SET @s := IF(@c = 0,
  'ALTER TABLE material_cert_pos ADD COLUMN part_found TINYINT(1) NOT NULL DEFAULT 0 AFTER part_description',
  'SELECT ''part_found already present'' AS note');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

/* Verify */
SELECT 'part_description' AS item, IF(COUNT(*) > 0, 'OK', 'MISSING') AS status
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE() AND table_name = 'material_cert_pos'
  AND column_name = 'part_description'
UNION ALL
SELECT 'part_found', IF(COUNT(*) > 0, 'OK', 'MISSING')
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE() AND table_name = 'material_cert_pos'
  AND column_name = 'part_found';
