-- =============================================
-- COAT departments of interest — one row per department. Work orders whose
-- current step (DATA9469) is in one of these departments are offered in the
-- COAT "many" work-order picker when "COAT steps only" is on. Mirrors
-- mdi_department (which now backs EXPOSE departments of interest).
-- =============================================

CREATE TABLE IF NOT EXISTS coat_department (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  dept_code   VARCHAR(64)  NOT NULL,
  dept_name   VARCHAR(128) NULL,
  created_by  VARCHAR(128) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coat_dept_code (dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
