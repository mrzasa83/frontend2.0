-- =============================================
-- Add Released File Paths to Items Table
-- Run this on your MySQL primary database
-- =============================================

-- Option 1: Add individual columns for each path type
ALTER TABLE items 
ADD COLUMN fiPath VARCHAR(500) NULL COMMENT 'Final Inspection folder path',
ADD COLUMN bdPath VARCHAR(500) NULL COMMENT 'Build Drawings folder path',
ADD COLUMN psPath VARCHAR(500) NULL COMMENT 'Pack & Ship folder path';

-- Create indexes for faster lookups
CREATE INDEX idx_items_fiPath ON items(fiPath(255));
CREATE INDEX idx_items_bdPath ON items(bdPath(255));
CREATE INDEX idx_items_psPath ON items(psPath(255));

-- =============================================
-- Optional: Bulk update paths from known patterns
-- Adjust these queries based on your actual folder structure
-- =============================================

-- Example: Set Final Inspection paths based on part number
-- UPDATE items 
-- SET fiPath = CONCAT('/mnt/sdrive/FrontEndQCFolders/Nashua/', apcPN)
-- WHERE fiPath IS NULL 
--   AND EXISTS (SELECT 1 FROM ... ); -- Add condition to verify folder exists

-- Example: Set Build Drawings paths
-- UPDATE items 
-- SET bdPath = CONCAT('/mnt/sdrive/AttDocs/MfgParts/', apcPN)
-- WHERE bdPath IS NULL;

-- =============================================
-- View current state
-- =============================================
SELECT 
  COUNT(*) as total_items,
  SUM(CASE WHEN fiPath IS NOT NULL THEN 1 ELSE 0 END) as has_fi_path,
  SUM(CASE WHEN bdPath IS NOT NULL THEN 1 ELSE 0 END) as has_bd_path,
  SUM(CASE WHEN psPath IS NOT NULL THEN 1 ELSE 0 END) as has_ps_path
FROM items;
