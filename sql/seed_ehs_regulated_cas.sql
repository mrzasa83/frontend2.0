-- =============================================
-- EHS — regulated substance seed
--
-- ⚠ READ BEFORE RELYING ON THIS ⚠
--
-- What is here:
--   RoHS    the 10 Annex II restricted substances, with their weight limits.
--           This list is short and effectively static, so it is seeded in full.
--           Verify the entries against the current consolidated text of
--           Directive 2011/65/EU before the first real assessment — exemptions
--           and delegated amendments do move.
--
--   REACH   a STARTER SUBSET only — the SVHC entries that overlap RoHS.
--   Prop65  a STARTER SUBSET only — the entries that overlap RoHS.
--
-- The full REACH SVHC candidate list runs to roughly 250 entries and the
-- California Prop 65 list to well over 900. Neither is reproduced here: they
-- are revised on their own schedule (SVHC roughly twice a year, Prop 65 more
-- often) and a stale hand-copied list is worse than no list, because it screens
-- clean and looks authoritative doing it.
--
-- Load those from source and set list_version when you do:
--   REACH   ECHA candidate list  https://echa.europa.eu/candidate-list-table
--   Prop65  OEHHA chemical list  https://oehha.ca.gov/proposition-65/proposition-65-list
--
-- Same egress caveat as USML: if the container cannot reach those hosts, pull
-- the lists on a workstation and load the CSV from there. The screen degrades
-- honestly in the meantime — an empty list yields "Review", never a pass.
--
-- Prop 65 rows carry threshold_pct = NULL by design. Prop 65 turns on exposure
-- rather than concentration, so there is no percentage that settles it and
-- every hit routes to a person.
-- =============================================

-- ---------------------------------------------
-- RoHS — Directive 2011/65/EU Annex II
-- Cadmium is restricted at 0.01%; the other nine at 0.1% by weight in
-- homogeneous material.
-- ---------------------------------------------
INSERT INTO ehs_regulated_cas
  (cas_number, regulation, substance_name, threshold_pct, notes, list_version)
VALUES
  ('7439-92-1',  'RoHS', 'Lead',                                    0.1000, 'Annex II. Exemptions exist, incl. high-melting-point solders.', '2011/65/EU'),
  ('7439-97-6',  'RoHS', 'Mercury',                                 0.1000, 'Annex II.', '2011/65/EU'),
  ('7440-43-9',  'RoHS', 'Cadmium',                                 0.0100, 'Annex II. Lower limit than the others.', '2011/65/EU'),
  -- Hexavalent chromium is a class, not one registry number. The commonly
  -- disclosed Cr(VI) compounds are listed individually so an ingredient row
  -- can actually match one.
  ('18540-29-9', 'RoHS', 'Chromium VI',                             0.1000, 'Annex II — hexavalent chromium.', '2011/65/EU'),
  ('1333-82-0',  'RoHS', 'Chromium trioxide',                       0.1000, 'Annex II — Cr(VI) compound.', '2011/65/EU'),
  ('7778-50-9',  'RoHS', 'Potassium dichromate',                    0.1000, 'Annex II — Cr(VI) compound.', '2011/65/EU'),
  ('10588-01-9', 'RoHS', 'Sodium dichromate',                       0.1000, 'Annex II — Cr(VI) compound.', '2011/65/EU'),
  ('7775-11-3',  'RoHS', 'Sodium chromate',                         0.1000, 'Annex II — Cr(VI) compound.', '2011/65/EU'),
  -- PBB and PBDE are likewise classes; the congeners that turn up on SDSs.
  ('59536-65-1', 'RoHS', 'Polybrominated biphenyls (PBB)',          0.1000, 'Annex II — class entry.', '2011/65/EU'),
  ('32534-81-9', 'RoHS', 'Pentabromodiphenyl ether (pentaBDE)',     0.1000, 'Annex II — PBDE congener.', '2011/65/EU'),
  ('32536-52-0', 'RoHS', 'Octabromodiphenyl ether (octaBDE)',       0.1000, 'Annex II — PBDE congener.', '2011/65/EU'),
  ('1163-19-5',  'RoHS', 'Decabromodiphenyl ether (decaBDE)',       0.1000, 'Annex II — PBDE congener.', '2011/65/EU'),
  -- The four phthalates added by Delegated Directive (EU) 2015/863.
  ('117-81-7',   'RoHS', 'Bis(2-ethylhexyl) phthalate (DEHP)',      0.1000, 'Added by (EU) 2015/863.', '2015/863'),
  ('85-68-7',    'RoHS', 'Benzyl butyl phthalate (BBP)',            0.1000, 'Added by (EU) 2015/863.', '2015/863'),
  ('84-74-2',    'RoHS', 'Dibutyl phthalate (DBP)',                 0.1000, 'Added by (EU) 2015/863.', '2015/863'),
  ('84-69-5',    'RoHS', 'Diisobutyl phthalate (DIBP)',             0.1000, 'Added by (EU) 2015/863.', '2015/863')
ON DUPLICATE KEY UPDATE
  substance_name = VALUES(substance_name),
  threshold_pct  = VALUES(threshold_pct),
  notes          = VALUES(notes),
  list_version   = VALUES(list_version);

-- ---------------------------------------------
-- REACH SVHC — STARTER SUBSET, NOT THE CANDIDATE LIST.
-- SVHC applies at 0.1% w/w. Replace wholesale from ECHA.
-- ---------------------------------------------
INSERT INTO ehs_regulated_cas
  (cas_number, regulation, substance_name, threshold_pct, notes, list_version)
VALUES
  ('7439-92-1', 'REACH', 'Lead',                               0.1000, 'STARTER SUBSET — load the full ECHA candidate list.', 'partial'),
  ('7440-43-9', 'REACH', 'Cadmium',                            0.1000, 'STARTER SUBSET — load the full ECHA candidate list.', 'partial'),
  ('117-81-7',  'REACH', 'Bis(2-ethylhexyl) phthalate (DEHP)', 0.1000, 'STARTER SUBSET — load the full ECHA candidate list.', 'partial'),
  ('85-68-7',   'REACH', 'Benzyl butyl phthalate (BBP)',       0.1000, 'STARTER SUBSET — load the full ECHA candidate list.', 'partial'),
  ('84-74-2',   'REACH', 'Dibutyl phthalate (DBP)',            0.1000, 'STARTER SUBSET — load the full ECHA candidate list.', 'partial'),
  ('84-69-5',   'REACH', 'Diisobutyl phthalate (DIBP)',        0.1000, 'STARTER SUBSET — load the full ECHA candidate list.', 'partial')
ON DUPLICATE KEY UPDATE
  substance_name = VALUES(substance_name),
  threshold_pct  = VALUES(threshold_pct),
  notes          = VALUES(notes);

-- ---------------------------------------------
-- Prop 65 — STARTER SUBSET, NOT THE OEHHA LIST.
-- threshold_pct stays NULL: exposure-based, so every hit needs a person.
-- ---------------------------------------------
INSERT INTO ehs_regulated_cas
  (cas_number, regulation, substance_name, threshold_pct, notes, list_version)
VALUES
  ('7439-92-1', 'Prop65', 'Lead',                               NULL, 'STARTER SUBSET — load the full OEHHA list.', 'partial'),
  ('7440-43-9', 'Prop65', 'Cadmium',                            NULL, 'STARTER SUBSET — load the full OEHHA list.', 'partial'),
  ('117-81-7',  'Prop65', 'Bis(2-ethylhexyl) phthalate (DEHP)', NULL, 'STARTER SUBSET — load the full OEHHA list.', 'partial'),
  ('85-68-7',   'Prop65', 'Benzyl butyl phthalate (BBP)',       NULL, 'STARTER SUBSET — load the full OEHHA list.', 'partial'),
  ('84-74-2',   'Prop65', 'Dibutyl phthalate (DBP)',            NULL, 'STARTER SUBSET — load the full OEHHA list.', 'partial')
ON DUPLICATE KEY UPDATE
  substance_name = VALUES(substance_name),
  notes          = VALUES(notes);
