-- =============================================
-- Material Cert folder catalog
-- Maps a Purchased Part (folder name on the L drive) to its full path(s).
-- Built/refreshed by the indexer route which walks /mnt/ldrive and records
-- every directory that directly contains at least one PDF.
--
-- NOTE: folder_path can be long (deep L drive), which exceeds the 767-byte
-- index limit under utf8mb4. We index a SHA1 hash of the path instead.
-- =============================================

CREATE TABLE IF NOT EXISTS material_cert_folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  part_folder VARCHAR(190) NOT NULL,        -- directory basename (the purchased part)
  folder_path VARCHAR(700) NOT NULL,        -- full path under /mnt/ldrive (not indexed)
  path_hash CHAR(40) NOT NULL,              -- SHA1(folder_path) for uniqueness
  file_count INT DEFAULT 0,
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_path_hash (path_hash),
  INDEX idx_part_folder (part_folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
