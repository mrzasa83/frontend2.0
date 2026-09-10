-- =============================================
-- EHS — HSI SDS integration
--
-- HSI (Encompass) holds the Safety Data Sheets. Each SDS is a "material" with
-- an HSI material number (M-185, M-188, …) and, on its Properties tab, an
-- ingredient table giving each constituent's CAS number and a percentage
-- RANGE (e.g. Tin 59-64%, Lead 36-41%).
--
-- The catalogue is MIRRORED here rather than called live:
--   * one query can search and sort across Paradigm parts + HSI materials
--   * Material Mgt still renders when the HSI endpoint is slow or unreachable
--   * an "unmatched" worklist is a query rather than 300 API calls
-- Only the attachment/PDF fetch stays live.
--
-- LINKING is explicit, never derived from description or manufacturer text —
-- a computed match silently re-points itself the day HSI revises a record.
-- A family or a part may carry ZERO, ONE, or SEVERAL material numbers:
-- zero = no SDS on file yet; one = the ordinary case; several = a two-part
-- system such as an epoxy resin + catalyst, where both sheets have to be
-- screened for the family to be honestly assessed.
--
-- Which grain applies is already recorded in ehs_part_families.inherit_compliance:
--   inherit_compliance = 1  single-material family (PPG, FR406) -> link the FAMILY
--   inherit_compliance = 0  heterogeneous bucket  (HDW, CHASSY) -> link each PART
-- Both tables exist; the flag decides which one is consulted.
-- =============================================

-- ---------------------------------------------
-- Mirror of the HSI material catalogue.
-- Natural key is the HSI material number (M-185). hsi_material_id holds
-- whatever internal identifier the API returns, when it returns one —
-- the number is what humans quote, the id is what the API wants back.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ehs_sds_materials (
  hsi_material_number VARCHAR(40)  NOT NULL,
  hsi_material_id     VARCHAR(80)  NULL,
  product_name        VARCHAR(400) NOT NULL DEFAULT '',
  material_description VARCHAR(400) NOT NULL DEFAULT '',
  manufacturer        VARCHAR(200) NOT NULL DEFAULT '',
  product_numbers     VARCHAR(400) NOT NULL DEFAULT '',  -- manufacturer's own number(s), e.g. 1188045
  principal_cas       VARCHAR(40)  NOT NULL DEFAULT '',
  synonyms            VARCHAR(600) NOT NULL DEFAULT '',
  revision_date       DATE         NULL,
  -- HSI's own Active/Archived flag. Sync NEVER deletes: an archived sheet is
  -- still the evidence behind a past assessment.
  is_archived         TINYINT(1)   NOT NULL DEFAULT 0,
  -- Set when the ingredient table came back empty. An SDS with no disclosed
  -- ingredients is not a clean SDS, and the screen must not treat it as one.
  ingredients_known   TINYINT(1)   NOT NULL DEFAULT 0,
  raw_json            JSON         NULL,   -- full API payload, for fields not yet mapped
  synced_at           TIMESTAMP    NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (hsi_material_number),
  INDEX idx_archived (is_archived),
  INDEX idx_manufacturer (manufacturer),
  INDEX idx_product_numbers (product_numbers)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- Ingredient rows off the Properties tab.
--
-- Percentages arrive as a RANGE. pct_max is what every threshold test uses —
-- the conservative read. pct_stated keeps the original string ("59 - 64%")
-- because it is what the SDS actually says and what an auditor will want to
-- see next to any conclusion drawn from it.
--
-- trade_secret marks a withheld constituent. Its presence means the ingredient
-- list is INCOMPLETE, which is the whole reason the screen can never conclude
-- "Compliant" from an absence of hits.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ehs_sds_ingredients (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  hsi_material_number VARCHAR(40)  NOT NULL,
  chemical_name       VARCHAR(300) NOT NULL DEFAULT '',
  cas_number          VARCHAR(40)  NOT NULL DEFAULT '',   -- normalised NNNNNNN-NN-N
  cas_raw             VARCHAR(40)  NOT NULL DEFAULT '',   -- exactly as HSI returned it
  pct_stated          VARCHAR(60)  NOT NULL DEFAULT '',   -- "59 - 64%"
  pct_min             DECIMAL(7,4) NULL,
  pct_max             DECIMAL(7,4) NULL,
  trade_secret        TINYINT(1)   NOT NULL DEFAULT 0,
  seq                 INT          NOT NULL DEFAULT 0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_material (hsi_material_number),
  INDEX idx_cas (cas_number),
  CONSTRAINT fk_ing_material FOREIGN KEY (hsi_material_number)
    REFERENCES ehs_sds_materials(hsi_material_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- Family -> material. Zero, one, or several rows per family.
-- `role` labels the component of a multi-sheet product ('Part A' / 'Resin' /
-- 'Catalyst'); leave it empty for the ordinary single-sheet case.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ehs_family_sds (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  family_id           INT          NOT NULL,
  hsi_material_number VARCHAR(40)  NOT NULL,
  role                VARCHAR(60)  NOT NULL DEFAULT '',
  -- How this link came to exist: manual | product_number | description | import.
  -- Worth keeping: it says which links a human actually eyeballed.
  match_method        VARCHAR(30)  NOT NULL DEFAULT 'manual',
  seq                 INT          NOT NULL DEFAULT 0,
  linked_by           VARCHAR(50)  NOT NULL DEFAULT '',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_family_material (family_id, hsi_material_number),
  INDEX idx_family (family_id),
  INDEX idx_material (hsi_material_number),
  CONSTRAINT fk_fsds_family FOREIGN KEY (family_id)
    REFERENCES ehs_part_families(id) ON DELETE CASCADE,
  -- RESTRICT, not CASCADE: a sync must never be able to quietly drop a link.
  CONSTRAINT fk_fsds_material FOREIGN KEY (hsi_material_number)
    REFERENCES ehs_sds_materials(hsi_material_number) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- Part -> material, for parts in inherit_compliance = 0 families.
-- Keyed on the trimmed INV_PART_NUMBER, matching ehs_part_compliance: Paradigm
-- RKEYs are not stable across environments.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ehs_part_sds (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  part_number         VARCHAR(120) NOT NULL,
  hsi_material_number VARCHAR(40)  NOT NULL,
  role                VARCHAR(60)  NOT NULL DEFAULT '',
  match_method        VARCHAR(30)  NOT NULL DEFAULT 'manual',
  seq                 INT          NOT NULL DEFAULT 0,
  linked_by           VARCHAR(50)  NOT NULL DEFAULT '',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_part_material (part_number, hsi_material_number),
  INDEX idx_part (part_number),
  INDEX idx_material (hsi_material_number),
  CONSTRAINT fk_psds_material FOREIGN KEY (hsi_material_number)
    REFERENCES ehs_sds_materials(hsi_material_number) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- The regulated-substance list the screen tests against.
--
-- Three public sources, kept in one shape:
--   RoHS    EU Directive 2011/65/EU Annex II — 10 substances, effectively static
--   REACH   ECHA SVHC Candidate List — revised roughly twice a year
--   Prop 65 California OEHHA list — revised more often
--
-- list_version is not decoration. "Assessed against the June 2026 candidate
-- list" is exactly what an auditor asks, and without it a re-screen months
-- later silently changes the meaning of an old result.
--
-- threshold_pct is the concentration at or above which the substance is
-- restricted, by weight. Prop 65 has no single such threshold (it turns on
-- exposure, not concentration), so those rows carry NULL and always resolve to
-- review-by-a-human rather than an automatic verdict.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ehs_regulated_cas (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  cas_number     VARCHAR(40)  NOT NULL,          -- normalised NNNNNNN-NN-N
  regulation     VARCHAR(20)  NOT NULL,          -- RoHS | REACH | Prop65
  substance_name VARCHAR(300) NOT NULL DEFAULT '',
  threshold_pct  DECIMAL(7,4) NULL,              -- NULL = no concentration trigger
  notes          VARCHAR(500) NOT NULL DEFAULT '',
  list_version   VARCHAR(40)  NOT NULL DEFAULT '',
  active         TINYINT(1)   NOT NULL DEFAULT 1,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cas_reg (cas_number, regulation),
  INDEX idx_cas (cas_number),
  INDEX idx_reg (regulation, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- Screen output.
--
-- Deliberately NOT written into ehs_part_families.reach_status /
-- rohs_status / prop65_status. The screen produces:
--
--   Non-Compliant   a listed substance is present above its threshold —
--                   a checkable fact, safe to assert
--   Review          a hit near a threshold, a withheld (trade secret)
--                   ingredient, a missing ingredient table, or a Prop 65 hit
--   Unknown         nothing to go on
--
-- It NEVER produces "Compliant". SDS ingredient tables disclose only down to a
-- threshold (typically 1%, or 0.1% for carcinogens) and may withhold
-- constituents as trade secret, so a clean list means "nothing listed was
-- disclosed", not "nothing listed is present". REACH SVHC sits at 0.1% w/w,
-- right on that disclosure boundary. Promoting a screen result to a real
-- classification stays a human signoff with evidence filed.
--
-- Nor does it produce "Exempt": RoHS carries genuine exemptions (high-melting
-- -point solders among them) and defence hardware is frequently out of scope
-- entirely. That is a judgement, and it is already a value a human can pick.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ehs_sds_screen_results (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  scope               VARCHAR(10)  NOT NULL,           -- family | part
  family_id           INT          NULL,
  part_number         VARCHAR(120) NULL,
  regulation          VARCHAR(20)  NOT NULL,           -- RoHS | REACH | Prop65
  verdict             VARCHAR(20)  NOT NULL,           -- Non-Compliant | Review | Unknown
  reason              VARCHAR(600) NOT NULL DEFAULT '',
  -- The evidence: which sheet, which ingredient, what it measured.
  hsi_material_number VARCHAR(40)  NULL,
  cas_number          VARCHAR(40)  NULL,
  pct_max             DECIMAL(7,4) NULL,
  threshold_pct       DECIMAL(7,4) NULL,
  list_version        VARCHAR(40)  NOT NULL DEFAULT '',
  screened_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_family (family_id),
  INDEX idx_part (part_number),
  INDEX idx_verdict (verdict)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
