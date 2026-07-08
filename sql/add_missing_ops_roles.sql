-- =============================================
-- Add the two missing roles: OpsRo, OpsCreate
-- Safe + idempotent. Uses explicit next id (MAX(id)+1) since roles.id is not
-- auto-increment. Does NOT touch the existing id=0 (Program) row, which is a
-- valid row referenced by user_roles.
-- =============================================

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'OpsRo'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'OpsRo');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'OpsCreate'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'OpsCreate');

-- Verify
SELECT id, name FROM roles ORDER BY id;
