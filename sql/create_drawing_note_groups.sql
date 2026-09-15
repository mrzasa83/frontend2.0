-- =============================================
-- Drawing Notes — QA grouping
--
-- Identical wording is already handled automatically: the dedup hash is taken
-- over the note TEXT with the number stripped, so note 9 on one drawing and
-- note 12 on another carrying the same sentence resolve to the same row on
-- scan. Nothing here duplicates that.
--
-- This is for the case a hash cannot decide — notes that say the same thing in
-- different words, or that a QA reviewer considers equivalent for measurement
-- purposes:
--
--     "WORKMANSHIP IAW IPC-610."
--     "WORKMANSHIP SHALL BE IN ACCORDANCE WITH IPC-A-610 CLASS 3."
--
-- Those are different text, different hashes, and legitimately separate notes
-- — a customer may hold you to the exact wording. So they are never merged.
-- They are GROUPED, which keeps both records intact while recording that a
-- person judged them equivalent.
-- =============================================

CREATE TABLE IF NOT EXISTS drawing_note_groups (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(300) NOT NULL,
  description TEXT         NULL,
  -- 'same'    the notes mean exactly the same requirement
  -- 'similar' related, worth reading together, not interchangeable
  -- Kept as free text rather than an ENUM so QA can add kinds without a
  -- migration; the UI offers the two above.
  kind        VARCHAR(20)  NOT NULL DEFAULT 'same',
  created_by  VARCHAR(50)  NOT NULL DEFAULT '',
  created_at  TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_kind (kind),
  INDEX idx_name (name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Membership. A note may sit in several groups: it can be the same as one note
-- and merely similar to another, and forcing a single group would make the
-- reviewer choose between two true statements.
CREATE TABLE IF NOT EXISTS drawing_note_group_members (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  group_id  INT          NOT NULL,
  note_id   INT          NOT NULL,
  -- The note whose wording the group is keyed on, when one is agreed. Null
  -- until QA nominates one.
  is_primary TINYINT(1)  NOT NULL DEFAULT 0,
  note       VARCHAR(500) NOT NULL DEFAULT '',
  added_by  VARCHAR(50)  NOT NULL DEFAULT '',
  added_at  TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_group_note (group_id, note_id),
  INDEX idx_note (note_id),
  CONSTRAINT fk_dngm_group FOREIGN KEY (group_id)
    REFERENCES drawing_note_groups(id) ON DELETE CASCADE,
  -- CASCADE, not RESTRICT: deleting a note should quietly drop it from its
  -- groups rather than blocking the delete. The group itself survives.
  CONSTRAINT fk_dngm_note FOREIGN KEY (note_id)
    REFERENCES drawing_notes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
