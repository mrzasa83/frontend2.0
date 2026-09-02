-- =============================================
-- COAT washdown log. One row per COAT washdown event an operator records.
-- Operator-entered: lot size, lam roll speed, film type, washdown defect code
-- (the "D" REJ_CODE from Paradigm DATA0039), layers washed down, comments.
-- System-logged: operator badge/user id, part number, work order, timestamp.
-- =============================================

CREATE TABLE IF NOT EXISTS mdi_coat_log (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  work_order            VARCHAR(64)  NOT NULL,
  part_number           VARCHAR(128) NULL,
  badge                 VARCHAR(32)  NULL,          -- operator badge entered
  user_id               VARCHAR(128) NULL,          -- logged-in app user
  lot_size              INT          NULL,          -- #PNL, 150..300
  lam_roll_speed        DECIMAL(8,2) NULL,          -- cm/min
  film_type             VARCHAR(64)  NULL,          -- from the MDI film list
  washdown_defect_code  VARCHAR(32)  NULL,          -- DATA0039.REJ_CODE ("D" number)
  washdown_defect_desc  VARCHAR(255) NULL,          -- snapshot of description for display
  layers_washed_down    INT          NULL,
  comments              VARCHAR(500) NULL,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_work_order (work_order),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
