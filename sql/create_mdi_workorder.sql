-- =============================================
-- Saved MDI work-order backlog. Stores just the work-order numbers (the list
-- is re-fetched/re-resolved on restore). Selectable rows; a filter column can
-- be added later without touching existing rows.
-- =============================================

CREATE TABLE IF NOT EXISTS mdi_workorder (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  work_order  VARCHAR(64)  NOT NULL,
  created_by  VARCHAR(128) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_work_order (work_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
