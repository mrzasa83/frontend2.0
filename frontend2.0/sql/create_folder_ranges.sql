-- =============================================
-- Folder Ranges Table for Released Files
-- Stores the range folders available at each site
-- =============================================

CREATE TABLE IF NOT EXISTS folder_ranges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site VARCHAR(50) NOT NULL COMMENT 'Site name: Nashua, Nogales, Mesa',
  file_type VARCHAR(50) NOT NULL COMMENT 'File type: finalInspection, buildDrawings, packShip',
  range_start INT NOT NULL COMMENT 'Start of range (e.g., 11700)',
  range_end INT NOT NULL COMMENT 'End of range (e.g., 11799)',
  folder_name VARCHAR(255) NOT NULL COMMENT 'Actual folder name (e.g., 11700-11799)',
  base_path VARCHAR(500) NOT NULL COMMENT 'Full base path to the folder',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY idx_site_type_range (site, file_type, range_start, range_end),
  INDEX idx_site_type (site, file_type),
  INDEX idx_range (range_start, range_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Example data structure (run the scan API to populate)
-- =============================================

-- INSERT INTO folder_ranges (site, file_type, range_start, range_end, folder_name, base_path) VALUES
-- ('Nashua', 'finalInspection', 11700, 11799, '11700-11799', '/mnt/sdrive/FrontEndQCFolders/Nashua/11700-11799'),
-- ('Nashua', 'finalInspection', 11800, 11899, '11800-11899', '/mnt/sdrive/FrontEndQCFolders/Nashua/11800-11899'),
-- ('Nogales', 'finalInspection', 12000, 12099, '12000-12099', '/mnt/sdrive/FrontEndQCFolders/Nogales/12000-12099');

-- =============================================
-- View ranges by site
-- =============================================

-- SELECT site, file_type, COUNT(*) as range_count, 
--        MIN(range_start) as min_range, MAX(range_end) as max_range
-- FROM folder_ranges
-- GROUP BY site, file_type;
