-- =============================================
-- Gold Standard — a captured, editable copy of everything that goes into a
-- batch card, kept so other parts can be compared against it.
--
-- WHY THE DATA IS NORMALISED AND NOT A JSON BLOB
--   The obvious shortcut is one LONGTEXT per gold standard holding the
--   CardData[] that lib/products/batchCardData.ts already builds. It is
--   rejected for two reasons that are the whole point of the feature:
--
--     * EDITABLE. A gold standard is our position on how the part SHOULD be
--       built, which will diverge from what Paradigm currently says. Editing
--       one route parameter inside a JSON document means rewriting the
--       document, and concurrent edits silently lose each other.
--     * COMPARABLE. The comparison is row-level — this BOM line differs, that
--       route step is missing. Diffing two JSON blobs in SQL is not possible;
--       diffing rows is a join.
--
--   MySQL 5.6.35 has no JSON type anyway (that lands in 5.7.8), so the blob
--   would be LONGTEXT with no indexing, no constraints and no way to ask
--   "which gold standards use route code X".
--
-- WHY THE CAPTURE IS A SNAPSHOT, NOT A LIVE QUERY
--   Paradigm changes. If the gold standard were a view over DATA0050, then
--   "the standard" would drift every time someone edited the ERP, and a
--   comparison would be against a moving target — which is the opposite of a
--   standard. captured_at records exactly when the copy was taken.
--
-- MySQL 5.6 NOTES (the constraints that shaped this file)
--   * utf8mb4 is 4 bytes per character and the per-COLUMN index limit is 767
--     bytes, so any indexed VARCHAR is capped at 191.
--   * No CHECK constraints (parsed and ignored until 8.0.16), so value
--     domains are documented here and enforced in the application.
--   * No JSON, no CTEs, no window functions.
--
-- ORDER MATTERS: run this after npi_technologies exists.
-- =============================================


-- ---------------------------------------------------------------
-- The gold standard itself: one per customer part we have blessed.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gold_standards (
  id                   INT AUTO_INCREMENT PRIMARY KEY,

  -- The NPI technology this standard belongs to. Real FK: technology is how
  -- these are managed, so a standard pointing at a technology that no longer
  -- exists is a bug we want the database to refuse.
  technology_id        INT          NULL,

  -- Identity. apc_part is the manufactured part; customer_part is what the
  -- customer calls it and is the key buildCardSet() is driven by.
  apc_part_number      VARCHAR(191) NOT NULL DEFAULT '',
  customer_part_number VARCHAR(191) NOT NULL DEFAULT '',
  program              VARCHAR(191) NOT NULL DEFAULT '',
  customer_code        VARCHAR(60)  NOT NULL DEFAULT '',
  customer_name        VARCHAR(191) NOT NULL DEFAULT '',
  revision             VARCHAR(30)  NOT NULL DEFAULT '',

  -- 'draft' while being built, 'active' once blessed, 'retired' when
  -- superseded. Retired standards are kept: a comparison run last quarter
  -- has to stay reproducible.
  status               VARCHAR(20)  NOT NULL DEFAULT 'draft',

  title                VARCHAR(255) NOT NULL DEFAULT '',
  notes                TEXT         NULL,

  -- When the Paradigm copy was taken, and by whom. Separate from created_at:
  -- a standard can be re-captured without being recreated.
  captured_at          DATETIME     NULL,
  captured_by          VARCHAR(100) NOT NULL DEFAULT '',
  -- How many card levels the capture produced, so the list can show depth
  -- without counting rows on every page load.
  card_count           INT          NOT NULL DEFAULT 0,

  created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  created_by           VARCHAR(100) NOT NULL DEFAULT '',
  updated_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by           VARCHAR(100) NOT NULL DEFAULT '',

  -- One standard per customer part. A second blessing of the same part is an
  -- edit or a re-capture, not a new row, or "the" standard becomes ambiguous
  -- exactly when someone is relying on it.
  UNIQUE KEY uq_customer_part (customer_part_number),
  INDEX idx_tech (technology_id),
  INDEX idx_apc (apc_part_number),
  INDEX idx_program (program),
  INDEX idx_status (status),

  CONSTRAINT fk_gs_technology FOREIGN KEY (technology_id)
    REFERENCES npi_technologies (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------
-- One row per batch card in the top-down sequence — the CardData the
-- generator builds, level 0 being the customer part.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gold_standard_cards (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  gold_standard_id   INT          NOT NULL,

  level              INT          NOT NULL DEFAULT 0,
  -- 'customer' (the top card) or 'manufactured' (everything below).
  kind               VARCHAR(20)  NOT NULL DEFAULT 'manufactured',
  -- The Paradigm RKEY this level was read from. Kept so a re-capture can say
  -- what moved, and so an edit can be traced back to its origin.
  source_rkey        INT          NOT NULL DEFAULT 0,

  part_number        VARCHAR(191) NOT NULL DEFAULT '',
  description        VARCHAR(500) NOT NULL DEFAULT '',
  revision           VARCHAR(30)  NOT NULL DEFAULT '',
  catalog_number     VARCHAR(100) NOT NULL DEFAULT '',

  customer_code      VARCHAR(60)  NOT NULL DEFAULT '',
  customer_name      VARCHAR(191) NOT NULL DEFAULT '',

  bom_number         VARCHAR(191) NOT NULL DEFAULT '',
  bom_description    VARCHAR(500) NOT NULL DEFAULT '',
  route_code         VARCHAR(100) NOT NULL DEFAULT '',
  route_name         VARCHAR(255) NOT NULL DEFAULT '',
  product_code       VARCHAR(100) NOT NULL DEFAULT '',
  product_name       VARCHAR(255) NOT NULL DEFAULT '',

  sales_part_number  VARCHAR(191) NOT NULL DEFAULT '',
  sales_part_desc    VARCHAR(500) NOT NULL DEFAULT '',
  sales_part_rev     VARCHAR(30)  NOT NULL DEFAULT '',

  modified_by        VARCHAR(191) NOT NULL DEFAULT '',
  modified_date      VARCHAR(50)  NOT NULL DEFAULT '',
  entered_by         VARCHAR(191) NOT NULL DEFAULT '',
  entered_date       VARCHAR(50)  NOT NULL DEFAULT '',

  -- Position within the level, in the order buildCardSet produced them, so
  -- the card sequence is reproducible rather than insertion-order luck.
  seq                INT          NOT NULL DEFAULT 0,
  -- The card whose BOM this one hangs off. Null at level 0. Kept because the
  -- set is a TREE, not a flat list of levels: three inner layers at level 1
  -- belong to different parents once the board has sub-assemblies, and the
  -- comparison has to line them up by position in that tree.
  parent_card_id     INT          NULL,

  -- Set when a human has changed this card away from what was captured, so
  -- the UI can mark it and a re-capture knows not to clobber it silently.
  is_edited          TINYINT(1)   NOT NULL DEFAULT 0,

  created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- NOT unique on (gold_standard_id, level). A level holds as many cards as
  -- the parent BOM has manufactured lines — seven inner layers, adhesives and
  -- coverlays at level 1 is ordinary. An earlier version made this unique and
  -- the capture aborted on the second card of a level, leaving a one-card
  -- level and a card_count of zero.
  UNIQUE KEY uq_gs_level_part (gold_standard_id, level, part_number),
  INDEX idx_gs_level (gold_standard_id, level, seq),
  INDEX idx_parent (parent_card_id),
  INDEX idx_part (part_number),

  CONSTRAINT fk_gsc_standard FOREIGN KEY (gold_standard_id)
    REFERENCES gold_standards (id) ON DELETE CASCADE,
  -- Self-referential, so deleting a parent takes its subtree with it.
  CONSTRAINT fk_gsc_parent FOREIGN KEY (parent_card_id)
    REFERENCES gold_standard_cards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------
-- BOM lines, one row per card line.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gold_standard_bom (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  card_id          INT          NOT NULL,
  seq              INT          NOT NULL DEFAULT 0,

  part_number      VARCHAR(191) NOT NULL DEFAULT '',
  description      VARCHAR(500) NOT NULL DEFAULT '',
  unit             VARCHAR(50)  NOT NULL DEFAULT '',
  -- Kept as text, exactly as the card prints them. These are display values
  -- with their own formatting ('2 / panel'), and rounding them into a DECIMAL
  -- would make the gold standard differ from the card it came from.
  required_per     VARCHAR(100) NOT NULL DEFAULT '',
  qty_required     VARCHAR(100) NOT NULL DEFAULT '',
  is_manufactured  TINYINT(1)   NOT NULL DEFAULT 0,

  INDEX idx_card (card_id),
  INDEX idx_part (part_number),

  CONSTRAINT fk_gsb_card FOREIGN KEY (card_id)
    REFERENCES gold_standard_cards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------
-- Route steps, and their instructions and parameters.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gold_standard_route (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  card_id           INT          NOT NULL,
  step              INT          NOT NULL DEFAULT 0,

  dept              VARCHAR(191) NOT NULL DEFAULT '',
  dept_code         VARCHAR(60)  NOT NULL DEFAULT '',
  instruction_codes VARCHAR(255) NOT NULL DEFAULT '',

  INDEX idx_card (card_id),
  INDEX idx_dept (dept_code),

  CONSTRAINT fk_gsr_card FOREIGN KEY (card_id)
    REFERENCES gold_standard_cards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Instruction lines, kept ordered. A separate table rather than five columns
-- because the card's five instruction slots are a Paradigm storage detail
-- (DEF_ROUT_INST_1..5_PTR), not a limit worth inheriting.
CREATE TABLE IF NOT EXISTS gold_standard_route_instructions (
  id        INT  AUTO_INCREMENT PRIMARY KEY,
  route_id  INT  NOT NULL,
  seq       INT  NOT NULL DEFAULT 0,
  text      TEXT NULL,

  INDEX idx_route (route_id),

  CONSTRAINT fk_gsri_route FOREIGN KEY (route_id)
    REFERENCES gold_standard_route (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Route parameters. name is indexed because "show me every standard whose
-- lamination pressure differs" is the question this feature exists to answer.
CREATE TABLE IF NOT EXISTS gold_standard_route_params (
  id        INT          AUTO_INCREMENT PRIMARY KEY,
  route_id  INT          NOT NULL,
  seq       INT          NOT NULL DEFAULT 0,
  name      VARCHAR(191) NOT NULL DEFAULT '',
  value     VARCHAR(500) NOT NULL DEFAULT '',

  INDEX idx_route (route_id),
  INDEX idx_name (name),

  CONSTRAINT fk_gsrp_route FOREIGN KEY (route_id)
    REFERENCES gold_standard_route (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------
-- The flat per-card lists: notes, comments, parameters, specs, units.
--
-- One table rather than five near-identical ones. They share a shape
-- (ordered name/value pairs against a card) and every consumer — the card
-- renderer, the editor, the diff — treats them the same way. Five tables
-- would mean five of every query for no gain in meaning.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gold_standard_attributes (
  id        INT          AUTO_INCREMENT PRIMARY KEY,
  card_id   INT          NOT NULL,
  -- 'note' | 'comment' | 'parameter' | 'spec' | 'unit'
  kind      VARCHAR(20)  NOT NULL DEFAULT 'parameter',
  seq       INT          NOT NULL DEFAULT 0,
  -- Notes and comments carry no name; they use value alone. Units use all
  -- three: name = code, value = value, extra = description.
  name      VARCHAR(191) NOT NULL DEFAULT '',
  value     TEXT         NULL,
  extra     VARCHAR(500) NOT NULL DEFAULT '',

  INDEX idx_card_kind (card_id, kind),
  INDEX idx_name (name),

  CONSTRAINT fk_gsa_card FOREIGN KEY (card_id)
    REFERENCES gold_standard_cards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------
-- Like parts: the parts a user has explicitly attached for comparison.
--
-- Deliberately NOT derived from technology or program. An attached part is a
-- claim that someone believes these should match; an auto-derived list would
-- be a guess, and a part showing up as "like" without anyone saying so makes
-- a later comparison look reviewed when it was not.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gold_standard_like_parts (
  id                   INT          AUTO_INCREMENT PRIMARY KEY,
  gold_standard_id     INT          NOT NULL,

  apc_part_number      VARCHAR(191) NOT NULL DEFAULT '',
  customer_part_number VARCHAR(191) NOT NULL DEFAULT '',
  program              VARCHAR(191) NOT NULL DEFAULT '',
  customer_name        VARCHAR(191) NOT NULL DEFAULT '',
  description          VARCHAR(500) NOT NULL DEFAULT '',

  -- Set by the most recent comparison, so the list can show what is known to
  -- differ without re-running every diff to draw the page.
  last_compared_at     DATETIME     NULL,
  last_compared_by     VARCHAR(100) NOT NULL DEFAULT '',
  diff_count           INT          NULL,

  notes                TEXT         NULL,
  added_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  added_by             VARCHAR(100) NOT NULL DEFAULT '',

  UNIQUE KEY uq_gs_part (gold_standard_id, customer_part_number),
  INDEX idx_gs (gold_standard_id),
  INDEX idx_apc (apc_part_number),
  INDEX idx_program (program),

  CONSTRAINT fk_gslp_standard FOREIGN KEY (gold_standard_id)
    REFERENCES gold_standards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ---------------------------------------------------------------
-- Edit history. These rows are the reference other parts get measured
-- against, so a change to one needs to be answerable later.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gold_standard_history (
  id               INT          AUTO_INCREMENT PRIMARY KEY,
  gold_standard_id INT          NOT NULL,
  -- 'created' | 'captured' | 'edited' | 'status' | 'like-part-added'
  -- | 'like-part-removed' | 'compared'
  action           VARCHAR(40)  NOT NULL DEFAULT 'edited',
  -- Which table and row the change touched, as free text, so history does not
  -- need a foreign key into tables whose rows it is recording the deletion of.
  target           VARCHAR(100) NOT NULL DEFAULT '',
  target_id        INT          NULL,
  field            VARCHAR(191) NOT NULL DEFAULT '',
  old_value        TEXT         NULL,
  new_value        TEXT         NULL,
  detail           TEXT         NULL,

  changed_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  changed_by       VARCHAR(100) NOT NULL DEFAULT '',

  INDEX idx_gs (gold_standard_id),
  INDEX idx_changed (changed_at),

  CONSTRAINT fk_gsh_standard FOREIGN KEY (gold_standard_id)
    REFERENCES gold_standards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
