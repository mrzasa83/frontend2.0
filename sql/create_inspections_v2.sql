-- =============================================
-- FAI enhancements: due date, net inspect #, report type/destination, source.
-- Safe to run on an existing inspections table.
-- =============================================

ALTER TABLE inspections ADD COLUMN due_date DATE DEFAULT NULL AFTER start_date;
ALTER TABLE inspections ADD COLUMN net_inspect_number VARCHAR(60) DEFAULT NULL AFTER due_date;
ALTER TABLE inspections ADD COLUMN report_type VARCHAR(20) DEFAULT NULL AFTER net_inspect_number;          -- Internal | Customer
ALTER TABLE inspections ADD COLUMN report_destination VARCHAR(20) DEFAULT NULL AFTER report_type;          -- Net Inspect | SSR | Other
ALTER TABLE inspections ADD COLUMN report_destination_other VARCHAR(120) DEFAULT NULL AFTER report_destination;
ALTER TABLE inspections ADD COLUMN source_flag TINYINT(1) NOT NULL DEFAULT 0 AFTER report_destination_other; -- Source y/n

CREATE INDEX idx_due_date ON inspections (due_date);

-- FAI Admin role: can delete First Article Inspections (confirmed with own
-- login password). Idempotent, explicit id (roles.id is not auto-increment).
INSERT INTO roles (id, name)
SELECT (SELECT COALESCE(MAX(id),0)+1 FROM (SELECT id FROM roles) AS m), 'FAIadmin'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'FAIadmin');

SELECT id, name FROM roles ORDER BY id;
