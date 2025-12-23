-- =============================================
-- Convert Windows Paths to Linux Format
-- Run this on your MySQL primary database
-- Table: items
-- =============================================

-- In MySQL LIKE clauses, backslash is an escape character.
-- To match a literal backslash, you need to use FOUR backslashes: \\\\
-- Or use LOCATE() / INSTR() which don't have this issue

-- =============================================
-- First, let's see what we're dealing with
-- =============================================

SELECT 
  id, 
  apcPN,
  fullPath,
  CASE 
    WHEN fullPath LIKE 'J:%' THEN 'Windows J: format'
    WHEN LOCATE('\\', fullPath) > 0 THEN 'Has backslashes'
    WHEN fullPath LIKE '/mnt/jdrive%' THEN 'Linux format (good)'
    ELSE 'Other/Unknown'
  END as path_format
FROM items
WHERE fullPath IS NOT NULL AND fullPath != ''
ORDER BY path_format, apcPN;

-- =============================================
-- Count by format type
-- =============================================

SELECT 
  CASE 
    WHEN fullPath LIKE 'J:%' THEN 'Windows J: format'
    WHEN LOCATE('\\', fullPath) > 0 THEN 'Has backslashes'
    WHEN fullPath LIKE '/mnt/jdrive%' THEN 'Linux format'
    ELSE 'Other/Unknown'
  END as path_format,
  COUNT(*) as count
FROM items
WHERE fullPath IS NOT NULL AND fullPath != ''
GROUP BY path_format;

-- =============================================
-- Find rows with backslashes (using LOCATE - easier than escaping)
-- =============================================

SELECT id, apcPN, fullPath 
FROM items 
WHERE LOCATE('\\', fullPath) > 0
LIMIT 20;

-- =============================================
-- Find rows starting with J:
-- =============================================

SELECT id, apcPN, fullPath 
FROM items 
WHERE fullPath LIKE 'J:%'
LIMIT 20;

-- =============================================
-- PREVIEW the conversion (don't run UPDATE yet)
-- =============================================

SELECT 
  id,
  apcPN,
  fullPath as original_path,
  -- Convert J:\ to /mnt/jdrive/ and backslashes to forward slashes
  REPLACE(
    REPLACE(
      REPLACE(fullPath, 'J:\\', '/mnt/jdrive/'),
      'J:/', '/mnt/jdrive/'
    ),
    '\\', '/'
  ) as converted_path
FROM items
WHERE fullPath IS NOT NULL 
  AND fullPath != ''
  AND (fullPath LIKE 'J:%' OR LOCATE('\\', fullPath) > 0)
LIMIT 50;

-- =============================================
-- ACTUAL UPDATE - Run this to convert paths
-- =============================================
-- CAUTION: Make a backup before running!

-- Step 1: Convert J:\ prefix to /mnt/jdrive/
-- Note: In REPLACE(), single backslash works fine
UPDATE items 
SET fullPath = REPLACE(fullPath, 'J:\\', '/mnt/jdrive/')
WHERE fullPath LIKE 'J:%';

-- Step 2: Convert J:/ prefix (in case some use forward slash)
UPDATE items 
SET fullPath = REPLACE(fullPath, 'J:/', '/mnt/jdrive/')
WHERE fullPath LIKE 'J:/%';

-- Step 3: Convert remaining backslashes to forward slashes
UPDATE items 
SET fullPath = REPLACE(fullPath, '\\', '/')
WHERE LOCATE('\\', fullPath) > 0;

-- =============================================
-- Verify the conversion
-- =============================================

SELECT 
  CASE 
    WHEN fullPath LIKE 'J:%' THEN 'Windows J: format (needs fix)'
    WHEN LOCATE('\\', fullPath) > 0 THEN 'Has backslashes (needs fix)'
    WHEN fullPath LIKE '/mnt/jdrive%' THEN 'Linux format (correct)'
    ELSE 'Other/Unknown'
  END as path_format,
  COUNT(*) as count
FROM items
WHERE fullPath IS NOT NULL AND fullPath != ''
GROUP BY path_format;

-- =============================================
-- Optional: Create triggers to auto-convert on INSERT/UPDATE
-- =============================================

-- DROP TRIGGER IF EXISTS convert_item_path_on_insert;
-- DROP TRIGGER IF EXISTS convert_item_path_on_update;

DELIMITER //

CREATE TRIGGER convert_item_path_on_insert
BEFORE INSERT ON items
FOR EACH ROW
BEGIN
  IF NEW.fullPath IS NOT NULL THEN
    SET NEW.fullPath = REPLACE(
      REPLACE(
        REPLACE(NEW.fullPath, 'J:\\', '/mnt/jdrive/'),
        'J:/', '/mnt/jdrive/'
      ),
      '\\', '/'
    );
  END IF;
END//

CREATE TRIGGER convert_item_path_on_update
BEFORE UPDATE ON items
FOR EACH ROW
BEGIN
  IF NEW.fullPath IS NOT NULL THEN
    SET NEW.fullPath = REPLACE(
      REPLACE(
        REPLACE(NEW.fullPath, 'J:\\', '/mnt/jdrive/'),
        'J:/', '/mnt/jdrive/'
      ),
      '\\', '/'
    );
  END IF;
END//

DELIMITER ;
