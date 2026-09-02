-- =============================================
-- MDI trained users. One row per trained operator (employee_id unique), plus
-- who trained them. Employees come from Paradigm DATA0005 (Nashua, active);
-- we store only the IDs + a formatted-name snapshot for display. Acquire is
-- blocked unless the entered badge/employee id is present here.
-- =============================================

CREATE TABLE IF NOT EXISTS mdi_trained_user (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   VARCHAR(32)  NOT NULL,
  employee_name VARCHAR(128) NULL,          -- display snapshot (formatted)
  trainer_id    VARCHAR(32)  NULL,          -- who trained them (an employee_id)
  trainer_name  VARCHAR(128) NULL,          -- display snapshot
  created_by    VARCHAR(128) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
