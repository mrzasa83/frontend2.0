-- =============================================
-- Ensure all roles from the access matrix exist
-- Run on your MySQL primary database. Idempotent (skips roles already present).
--
-- NOTE: roles.id is NOT auto-increment, so each insert computes the next id
-- (COALESCE(MAX(id),0)+1), the same way the app's role API does. The derived
-- tables (… ) AS m avoid MySQL's "can't specify target table" restriction.
-- =============================================

-- 1. Repair any stray id=0 row left by an earlier failed run.
UPDATE roles
SET id = (SELECT n FROM (SELECT COALESCE(MAX(id),0)+1 AS n FROM roles) AS t)
WHERE id = 0;

-- 2. Insert missing roles, each with an explicit next id.
INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'Admin'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Admin');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'CADadmin'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CADadmin');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'CADContrib'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CADContrib');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'CADro'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CADro');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'NPIeng'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'NPIeng');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'OpsRo'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'OpsRo');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'OpsCreate'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'OpsCreate');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'ProcessEng'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ProcessEng');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'ProductEng'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ProductEng');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'Program'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Program');

INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'roUser'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'roUser');

-- Legacy roles (Operations, Production Control, Quality Control, NPIEng) are left
-- in place for backward compatibility and still work via aliases in access.ts.

-- Verify:
SELECT id, name FROM roles ORDER BY id;
