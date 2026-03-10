-- =============================================
-- Scrap Discipline Groupings + NPIEng Role
-- Run on MySQL primary database
-- =============================================

-- =============================================
-- 1. Add NPIEng role
-- =============================================
INSERT IGNORE INTO roles (name, description)
VALUES ('NPIEng', 'NPI Engineering');

-- =============================================
-- 2. Scrap Discipline tables
-- =============================================

CREATE TABLE IF NOT EXISTS scrap_disciplines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Maps Paradigm DEPT CODEs to disciplines.
-- pattern is matched with SQL LIKE, e.g. 'D-%' matches all drill dept codes.
CREATE TABLE IF NOT EXISTS scrap_discipline_depts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discipline_id INT NOT NULL,
  dept_code_pattern VARCHAR(50) NOT NULL,
  note VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (discipline_id) REFERENCES scrap_disciplines(id) ON DELETE CASCADE,
  UNIQUE KEY uq_pattern (discipline_id, dept_code_pattern)
);

-- =============================================
-- 3. Seed default groupings based on prefix analysis
-- =============================================

INSERT INTO scrap_disciplines (name, description, sort_order) VALUES
  ('Drill',       'Drilling & Routing (D-, R-)',                     1),
  ('Imaging',     'Expose, Develop, Touch-up (E-, F-)',              2),
  ('Inner Layer', 'Inner layer processing & AOI (I-)',               3),
  ('Lamination',  'Lamination build & press (L-)',                   4),
  ('Plating',     'Deposition, Etch, Plate, Strip (P-)',             5),
  ('Solder Mask', 'LPI, Screen, Via Fill (S-)',                      6),
  ('Quality',     'QC, Inspection, Collection (Q-)',                 7),
  ('Electrical',  'Probe, Fixture, Impedance test (T-)',             8),
  ('Assembly',    'Assembly, SMT, Solder, Potting (J-)',             9),
  ('Finishing',   'Die cut, trim, label, packaging (H-)',           10),
  ('Optimize',    'Optimize steps (N-)',                            11),
  ('Other',       'Remaining depts (A-, B-, C-, G-, K-, M-, O-, V-, X-, Z-)', 12);

-- Drill
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Drill'), 'D-%', 'All drill dept codes'),
  ((SELECT id FROM scrap_disciplines WHERE name='Drill'), 'R-%', 'All routing dept codes');

-- Imaging
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Imaging'), 'E-%', 'Expose / LDI'),
  ((SELECT id FROM scrap_disciplines WHERE name='Imaging'), 'F-%', 'Develop');

-- Inner Layer
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Inner Layer'), 'I-%', 'Inner layer processing');

-- Lamination
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Lamination'), 'L-%', 'Lamination'),
  ((SELECT id FROM scrap_disciplines WHERE name='Lamination'), 'M-%', 'Plasma bake');

-- Plating
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Plating'), 'P-%', 'Plating / Deposition / Etch');

-- Solder Mask
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Solder Mask'), 'S-%', 'Solder mask / LPI / Screen');

-- Quality
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Quality'), 'Q-%', 'QC / Inspection');

-- Electrical
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Electrical'), 'T-%', 'Electrical test');

-- Assembly
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Assembly'), 'J-%', 'Assembly processes'),
  ((SELECT id FROM scrap_disciplines WHERE name='Assembly'), 'K-%', 'Kit');

-- Finishing
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Finishing'), 'H-%', 'Finishing');

-- Optimize
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Optimize'), 'N-%', 'Optimize steps');

-- Other
INSERT INTO scrap_discipline_depts (discipline_id, dept_code_pattern, note) VALUES
  ((SELECT id FROM scrap_disciplines WHERE name='Other'), 'A-%', 'Hot air / reflow'),
  ((SELECT id FROM scrap_disciplines WHERE name='Other'), 'B-%', 'Clean / deburr'),
  ((SELECT id FROM scrap_disciplines WHERE name='Other'), 'C-%', 'Composite coat/scrub'),
  ((SELECT id FROM scrap_disciplines WHERE name='Other'), 'G-%', 'Prep'),
  ((SELECT id FROM scrap_disciplines WHERE name='Other'), 'O-%', 'Outside process'),
  ((SELECT id FROM scrap_disciplines WHERE name='Other'), 'V-%', 'Mesa stamping'),
  ((SELECT id FROM scrap_disciplines WHERE name='Other'), 'X-%', 'Cross section'),
  ((SELECT id FROM scrap_disciplines WHERE name='Other'), 'Z-%', 'AOI');

-- =============================================
-- Verify
-- =============================================
SELECT d.name, d.sort_order, GROUP_CONCAT(p.dept_code_pattern ORDER BY p.dept_code_pattern) AS patterns
FROM scrap_disciplines d
LEFT JOIN scrap_discipline_depts p ON p.discipline_id = d.id
GROUP BY d.id
ORDER BY d.sort_order;
