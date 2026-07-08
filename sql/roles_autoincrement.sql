-- =============================================
-- OPTIONAL: make roles.id AUTO_INCREMENT
-- user_roles.roleId -> roles.id is a RESTRICT foreign key (the app guards
-- deletion in code), so we re-add it with NO cascade to preserve behavior.
--
-- Recommended: run `SHOW CREATE TABLE user_roles;` once and confirm the FK
-- clause matches before/after.
-- =============================================

-- 1. Drop the FK that points at roles.id
ALTER TABLE user_roles DROP FOREIGN KEY user_roles_ibfk_1;

-- 2. Make the column auto-increment
ALTER TABLE roles MODIFY id INT NOT NULL AUTO_INCREMENT;

-- 3. Re-add the FK exactly as it was (RESTRICT / no ON DELETE clause)
ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_ibfk_1
  FOREIGN KEY (roleId) REFERENCES roles (id);

-- Verify
SHOW CREATE TABLE user_roles;
SELECT id, name FROM roles ORDER BY id;
