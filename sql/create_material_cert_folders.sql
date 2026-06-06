-- =============================================
-- Material Cert folder catalog
-- Maps a Purchased Part (folder name on the L drive) to its full path(s).
-- Built/refreshed by the indexer route which walks /mnt/ldrive and records
-- every directory that directly contains at least one PDF.
-- =============================================

CREATE TABLE IF NOT EXISTS material_cert_folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  part_folder VARCHAR(190) NOT NULL,        -- directory basename (the purchased part)
  folder_path VARCHAR(700) NOT NULL,        -- full path under /mnt/ldrive
  file_count INT DEFAULT 0,
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_folder_path (folder_path),
  INDEX idx_part_folder (part_folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
