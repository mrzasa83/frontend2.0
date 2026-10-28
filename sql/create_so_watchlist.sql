-- =============================================
-- Contract module — Sales Order watchlist
--
-- One row per (user, customer part) that a person has ticked on the Sales
-- Orders table. The list is personal: it decides what their "My parts" view
-- shows when they come back, and nothing else reads it.
--
-- Keyed on the customer part number as text rather than a Paradigm RKEY on
-- purpose. The pointer can be re-cut when a part is superseded, and a watch
-- should survive that — the person is following a part number, not a row.
--
-- MySQL 5.6: no JSON, and a utf8mb4 index is capped at 767 bytes, so the
-- unique key prefixes the part number at 64 characters (far longer than the
-- 20-character Paradigm field).
-- =============================================

CREATE TABLE IF NOT EXISTS so_watchlist (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  customer_part VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_so_watch_user_part (user_id, customer_part(64)),
  KEY idx_so_watch_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
