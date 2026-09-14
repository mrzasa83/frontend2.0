-- =============================================
-- Product ▸ Drawing Notes
--
-- A catalogue of the numbered notes that appear on customer product drawings
-- ("WORKMANSHIP IAW IPC-610.", "SOLDERING SHALL BE IAW J-STD-001."), captured
-- from released PDFs, versioned, and signed off.
--
-- Run on the MySQL primary (5.6.35): LONGTEXT rather than JSON, and every wide
-- indexed column carries a prefix length. See scripts/mysql56_audit.py.
--
-- SHAPE OF THE PROBLEM, because it drives the whole design:
--
-- A note is NOT owned by a drawing. The same workmanship note appears on
-- hundreds of parts across a customer, which is exactly why the master list
-- carries a "listing of APC Part Numbers" — one note, many parts. So a scan of
-- a drawing does not simply create notes; it has to decide whether each block
-- of text it found is a note already on file or a genuinely new one.
--
-- That decision is made on text_hash: a SHA-1 of the note text after
-- normalisation (case folded, runs of whitespace collapsed, OCR-prone
-- punctuation stripped). An exact normalised match links the existing note to
-- another part. Anything else is proposed as new and left Pending for a human.
-- Near-matches are deliberately NOT auto-merged — "trimmed to .050 max" and
-- "trimmed to .060 max" differ by one character and mean different things.
-- =============================================

-- ---------------------------------------------
-- Master note. Identity and nothing else that changes: the wording, the
-- measurement method and the status all live on versions.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS drawing_notes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  -- N + 10 digits, e.g. N0000000001. CHAR because it is fixed width.
  note_code       CHAR(11)     NOT NULL,
  customer        VARCHAR(190) NOT NULL DEFAULT '',
  -- Short human label, e.g. "Workmanship IPC-610". Carried on the master so
  -- the list can be sorted by it without joining to the active version.
  name            VARCHAR(300) NOT NULL DEFAULT '',
  -- SHA-1 of the normalised note text — the dedup key. Two drawings carrying
  -- the same note resolve to the same row through this.
  text_hash       CHAR(40)     NOT NULL,
  -- The version currently in force. NULL until a version is approved, which is
  -- the normal state for a freshly scanned note.
  active_version_id INT        NULL,
  created_by      VARCHAR(50)  NOT NULL DEFAULT '',
  created_at      TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_note_code (note_code),
  -- Scoped to customer: two customers can word the same requirement
  -- identically and still want them tracked apart.
  UNIQUE KEY uq_customer_text (customer, text_hash),
  INDEX idx_customer (customer),
  INDEX idx_name (name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- Version. Everything that can be revised and signed off.
--
-- status:
--   Pending   created, not yet approved. A scan lands here.
--   Active    approved and in force. At most one per note.
--   Inactive  superseded when a later version went Active.
--
-- "At most one Active per note" is enforced in the API rather than by a unique
-- index, because a partial index cannot be expressed here: the constraint is
-- one Active among many Inactive rows, and a UNIQUE(note_id, status) would
-- also forbid two Inactive versions.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS drawing_note_versions (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  note_id             INT          NOT NULL,
  version_no          INT          NOT NULL DEFAULT 1,
  status              VARCHAR(10)  NOT NULL DEFAULT 'Pending',
  name                VARCHAR(300) NOT NULL DEFAULT '',
  description         TEXT         NULL,
  -- The note as it reads on the drawing. Editable by the approver, since OCR
  -- and even the text layer mangle things.
  note_text           LONGTEXT     NULL,
  -- Measure tab. Two fields for now; the user expects this to grow, so new
  -- fields are added as columns here rather than being crammed into a blob.
  measure_description TEXT         NULL,
  measure_how_to      TEXT         NULL,
  created_by          VARCHAR(50)  NOT NULL DEFAULT '',
  created_at          TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  -- Set when BOTH required approvals are in (description + how to measure).
  approved_at         DATETIME     NULL,
  approved_by         VARCHAR(50)  NOT NULL DEFAULT '',
  -- Set when a later version went Active and displaced this one.
  inactivated_at      DATETIME     NULL,
  superseded_by       INT          NULL,
  UNIQUE KEY uq_note_version (note_id, version_no),
  INDEX idx_note (note_id),
  INDEX idx_status (status),
  CONSTRAINT fk_dnv_note FOREIGN KEY (note_id)
    REFERENCES drawing_notes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- Approvals. One row per aspect per version, so the Approvals tab can show
-- that the wording was signed off on one date and the measurement method on
-- another — which is the normal case, since they are often different people.
--
-- aspect: 'description' | 'how_to'
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS drawing_note_approvals (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  version_id  INT          NOT NULL,
  note_id     INT          NOT NULL,
  aspect      VARCHAR(20)  NOT NULL,
  approved_by VARCHAR(50)  NOT NULL,
  approved_at DATETIME     NOT NULL,
  comment     VARCHAR(500) NOT NULL DEFAULT '',
  -- One signature per aspect per version. Re-approving updates the row rather
  -- than stacking duplicates.
  UNIQUE KEY uq_version_aspect (version_id, aspect),
  INDEX idx_note (note_id),
  CONSTRAINT fk_dna_version FOREIGN KEY (version_id)
    REFERENCES drawing_note_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- Where a note was found. One row per (note, drawing file) sighting.
--
-- This is both the APC Parts tab and the audit trail: it holds the link back
-- to the PDF the text came from, the page and zone it sat in, and the cropped
-- image. A note seen on 200 drawings has 200 rows here.
--
-- Nothing is deleted when a note is re-scanned — a second sighting of the same
-- note on the same file updates in place via uq_sighting.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS drawing_note_sources (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  note_id           INT          NOT NULL,
  apc_part_number   VARCHAR(120) NOT NULL DEFAULT '',
  customer_part_number VARCHAR(190) NOT NULL DEFAULT '',
  customer          VARCHAR(190) NOT NULL DEFAULT '',
  -- The source PDF. Stored as the path the app resolves plus the display name,
  -- so the note can be opened back to its drawing.
  pdf_path          VARCHAR(700) NOT NULL DEFAULT '',
  pdf_name          VARCHAR(300) NOT NULL DEFAULT '',
  -- Location. zone_label is the drawing grid reference ("A8"); it is DERIVED
  -- from the bbox and a guess at the sheet's grid divisions, so the bbox is
  -- kept as the ground truth and the zone can be recomputed or corrected.
  page_no           INT          NOT NULL DEFAULT 1,
  zone_label        VARCHAR(10)  NOT NULL DEFAULT '',
  bbox_x0           DECIMAL(9,2) NULL,
  bbox_y0           DECIMAL(9,2) NULL,
  bbox_x1           DECIMAL(9,2) NULL,
  bbox_y1           DECIMAL(9,2) NULL,
  page_width        DECIMAL(9,2) NULL,
  page_height       DECIMAL(9,2) NULL,
  -- Title-block details, best effort.
  drawing_number    VARCHAR(120) NOT NULL DEFAULT '',
  drawing_rev       VARCHAR(20)  NOT NULL DEFAULT '',
  drawing_rev_date  DATE         NULL,
  sheet_label       VARCHAR(40)  NOT NULL DEFAULT '',
  -- 'text' (PDF text layer) | 'ocr' | 'manual'. Worth keeping: an OCR-sourced
  -- note deserves more scrutiny at approval than one lifted from a text layer.
  extraction_method VARCHAR(10)  NOT NULL DEFAULT 'text',
  -- Note number as printed on the drawing (the "8." in "8. SOLDERING...").
  note_number       VARCHAR(10)  NOT NULL DEFAULT '',
  -- Cropped PNG of the note as it appears on the sheet.
  image_path        VARCHAR(700) NOT NULL DEFAULT '',
  raw_text          LONGTEXT     NULL,
  scanned_by        VARCHAR(50)  NOT NULL DEFAULT '',
  scanned_at        TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  -- pdf_path is VARCHAR(700) = 2800 bytes in utf8mb4, far over the 767-byte
  -- per-column index cap on 5.6, so the uniqueness key uses a hash of it.
  pdf_path_hash     CHAR(40)     NOT NULL DEFAULT '',
  UNIQUE KEY uq_sighting (note_id, pdf_path_hash, page_no, note_number),
  INDEX idx_note (note_id),
  INDEX idx_apc_part (apc_part_number),
  INDEX idx_customer_part (customer_part_number(100)),
  INDEX idx_pdf_hash (pdf_path_hash),
  CONSTRAINT fk_dns_note FOREIGN KEY (note_id)
    REFERENCES drawing_notes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- Scan runs. One row per "Archive Drawing Notes" click, whatever the outcome.
--
-- Kept separate from the sightings so a scan that found nothing, needed OCR, or
-- failed outright is still on record — otherwise "we scanned that drawing and
-- got nothing" is indistinguishable from "nobody ever scanned it".
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS drawing_note_scans (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  apc_part_number VARCHAR(120) NOT NULL DEFAULT '',
  customer        VARCHAR(190) NOT NULL DEFAULT '',
  pdf_path        VARCHAR(700) NOT NULL DEFAULT '',
  pdf_path_hash   CHAR(40)     NOT NULL DEFAULT '',
  pdf_name        VARCHAR(300) NOT NULL DEFAULT '',
  pages           INT          NOT NULL DEFAULT 0,
  ocr_used        TINYINT(1)   NOT NULL DEFAULT 0,
  notes_found     INT          NOT NULL DEFAULT 0,
  notes_new       INT          NOT NULL DEFAULT 0,
  notes_linked    INT          NOT NULL DEFAULT 0,
  status          VARCHAR(20)  NOT NULL DEFAULT 'ok',   -- ok | needs_ocr | empty | error
  message         VARCHAR(600) NOT NULL DEFAULT '',
  scanned_by      VARCHAR(50)  NOT NULL DEFAULT '',
  scanned_at      TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_part (apc_part_number),
  INDEX idx_pdf_hash (pdf_path_hash),
  INDEX idx_scanned_at (scanned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- note_code allocation.
--
-- MySQL 5.6 has no sequences, and the obvious counter-row trick —
--   UPDATE seq SET next_val = LAST_INSERT_ID(next_val + 1);
--   SELECT LAST_INSERT_ID();
-- is WRONG behind a connection pool. LAST_INSERT_ID() is scoped to the
-- connection, and the app's two statements are separate pool checkouts, so the
-- SELECT can land on a different connection and return 0 or another request's
-- value. That silently produces note_id 0 and orphaned versions.
--
-- An AUTO_INCREMENT allocation table sidesteps it entirely: one INSERT returns
-- its own insertId in the same result, with no second round trip and no
-- connection affinity to get wrong. One row per note is a rounding error at
-- this volume, and the rows double as a record of when each code was handed
-- out.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS drawing_note_seq (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  allocated_by VARCHAR(50) NOT NULL DEFAULT '',
  allocated_at TIMESTAMP   NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;
