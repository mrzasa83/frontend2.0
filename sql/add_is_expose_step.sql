-- =============================================
-- Flag which Paradigm departments are LDI "expose" (acquire) steps.
-- Shared table with frontend2.0 (same MySQL DB). Route steps join
-- DATA0038.DEPT_PTR -> wc_dept_mapping.paradigm_rkey WHERE is_expose_step = 1.
-- =============================================

ALTER TABLE wc_dept_mapping
  ADD COLUMN is_expose_step TINYINT(1) NOT NULL DEFAULT 0 AFTER paradigm_dept_name;

-- Optional: index for the expose-only lookup used by the route resolver.
ALTER TABLE wc_dept_mapping
  ADD INDEX idx_is_expose_step (is_expose_step);

-- No seed: expose steps can't be inferred from the dept code (e.g. the LDI
-- expose step "I-LDIB-D" is an Image dept, not an "E-" Expose dept). An admin
-- sets is_expose_step per department in the frontImage Admin Config tab.
