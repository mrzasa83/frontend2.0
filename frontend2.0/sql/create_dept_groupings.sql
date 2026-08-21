-- =============================================
-- Department Groupings for Scrap Run Charts
-- Run this on your MySQL primary database
-- =============================================

-- The groupings table maps dept code prefixes to discipline names.
-- The prefix is the first letter of the DEPT CODE (before the first dash).
-- Admin users can edit these groupings in the UI.

CREATE TABLE IF NOT EXISTS dept_groupings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prefix CHAR(1) NOT NULL,
  discipline VARCHAR(50) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_prefix (prefix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default groupings based on observed dept code prefixes
INSERT INTO dept_groupings (prefix, discipline, description, sort_order) VALUES
  ('A', 'Plating',       'HAL, Hot Oil Reflow',                        1),
  ('B', 'Board Prep',    'Clean, Deburr',                              2),
  ('C', 'Composite',     'Coat, Vacuum Laminate, Scrub',               3),
  ('D', 'Drill',         'Drill, Rout, Laser, Schmoll, Hitachi',       4),
  ('E', 'Expose',        'LDI Expose, Touch Up',                       5),
  ('F', 'Develop',       'Composite Develop',                          6),
  ('G', 'Prep',          'Die Cut, Insulation Prep',                   7),
  ('H', 'Finishing',     'Trim, Punch, Package, Label, Heat Bond',     8),
  ('I', 'Image',         'Inner Layer, AOI, DES, Hakuto, LDI',         9),
  ('J', 'Assembly',      'Pick & Place, Solder, SMT, Reflow, Potting', 10),
  ('K', 'Kit',           'Composite Kit, Assembly Kit',                 11),
  ('L', 'Lamination',    'Build, Press, Coverlay, Rout',               12),
  ('M', 'Plasma',        'Plasma Bake',                                13),
  ('N', 'Optimize',      'Optimize Steps (various)',                    14),
  ('O', 'Outside',       'Outside Services',                           15),
  ('P', 'Plating/Dep',   'Deposition, Etch, Gold Plate, Solder Plate', 16),
  ('Q', 'Quality',       'QC, AOI, Final Inspection, Cross Section',   17),
  ('R', 'Route',         'Final Rout, Schmoll Rout',                   18),
  ('S', 'Solder Mask',   'LPI, Screen, Via Fill, Planarization',       19),
  ('T', 'Test',          'Electrical Test, Fixture, Probe, Impedance', 20),
  ('V', 'Mesa',          'Mesa Stamping',                              21),
  ('X', 'Cross Section', 'Final, CU Plate, Solder, Plasma',           22),
  ('Z', 'AOI',           'Vision AOI',                                 23)
ON DUPLICATE KEY UPDATE
  discipline = VALUES(discipline),
  description = VALUES(description),
  sort_order = VALUES(sort_order);
