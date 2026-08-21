-- Migration: Add Control Center name and engineer roles to users table
-- Run this against your primary MySQL database
-- Compatible with older MySQL versions (pre-5.7.8)

-- Add cc_name column to store the Control Center username
-- Add engineer_roles as VARCHAR to store JSON string (for MySQL < 5.7.8 compatibility)
ALTER TABLE users 
ADD COLUMN cc_name VARCHAR(100) NULL,
ADD COLUMN engineer_roles VARCHAR(255) NULL;

-- Example engineer_roles values (stored as JSON strings):
-- NULL = no engineer roles
-- '["CAM"]' = CAM engineer only
-- '["PCB", "ASM"]' = PCB and ASM engineer
-- '["CAM", "PCB", "ASM"]' = all roles

-- Create index for faster lookups
CREATE INDEX idx_users_cc_name ON users(cc_name);

-- Verify the changes
DESCRIBE users;
