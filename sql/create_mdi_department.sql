-- =============================================
-- MDI departments of interest — one row per department. Work orders whose
-- current step (DATA9469) is in one of these departments are pulled into the
-- MDI XML work-order list. Replaces the single JSON blob previously stored in
-- config_mdi under key 'mdi_dept_list'.
-- =============================================

CREATE TABLE IF NOT EXISTS mdi_department (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  dept_code   VARCHAR(64)  NOT NULL,
  dept_name   VARCHAR(128) NULL,
  created_by  VARCHAR(128) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dept_code (dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One-time migration of any existing JSON list from config_mdi. Safe to run
-- repeatedly (INSERT IGNORE de-dupes on dept_code). This only handles the
-- common case of a simple comma/JSON-array of codes; if empty, no-op.
-- (Kept commented — run manually if you want to carry the old list over, or
--  just re-select the departments in Admin Config, which writes here now.)
-- Example manual carry-over given a known list:
--   INSERT IGNORE INTO mdi_department (dept_code) VALUES ('E-LDIS-D'),('E-LDIT-D'), ... ;
