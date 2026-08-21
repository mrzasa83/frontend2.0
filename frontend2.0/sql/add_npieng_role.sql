-- =============================================
-- Add NPIEng Role
-- Run this on your MySQL primary database
-- =============================================

INSERT INTO roles (name) 
SELECT 'NPIEng' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'NPIEng');
