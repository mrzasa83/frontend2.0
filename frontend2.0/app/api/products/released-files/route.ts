import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMySQLPrimaryPool } from '@/lib/db/mysql-primary'
import { getMSSQLPool } from '@/lib/db/mssql'
import * as fs from 'fs'
import * as path from 'path'
import { windowsToLinuxPath, QC_FOLDERS_PATH } from '@/lib/config/drives'

type FileInfo = {
  name: string
  path: string
  size: number
  modified: string
  extension: string
  isDirectory: boolean
  serveUrl: string
  source?: string  // 'network' or 'paradigm'
  matchedPartNumber?: string  // For Paradigm attachments - the part level where doc was found
}

type LocationFiles = {
  location: string
  basePath: string
  files: FileInfo[]
  error?: string
  hasFiles: boolean
}

type BuildDrawingsResult = {
  networkFiles: FileInfo[]
  paradigmAttachments: FileInfo[]
  basePath: string
  error?: string
}

/**
 * Extract numeric part from APC part number
 * e.g., "12766" -> 12766, "APC-12766-A" -> 12766
 */
function extractPartNumber(apcPN: string): number | null {
  // Try to find a 5-digit number in the part number
  const match = apcPN.match(/(\d{5,})/)
  if (match) {
    return parseInt(match[1], 10)
  }
  // Try any number
  const anyMatch = apcPN.match(/(\d+)/)
  if (anyMatch) {
    return parseInt(anyMatch[1], 10)
  }
  return null
}

/**
 * Find a child entry of `parent` whose name matches `name` case-insensitively.
 * Returns the full path or null. Tolerates the S-drive casing differences.
 */
function ciFindChild(parent: string, name: string, mustBeDir = true): string | null {
  try {
    if (!fs.existsSync(parent)) return null
    const target = name.toLowerCase()
    const entries = fs.readdirSync(parent, { withFileTypes: true })
    // Exact (case-insensitive) match first
    for (const e of entries) {
      if (mustBeDir && !e.isDirectory()) continue
      if (e.name.toLowerCase() === target) return path.join(parent, e.name)
    }
    return null
  } catch { return null }
}

/**
 * Resolve the FrontEndQC part folder directly from the part number, without
 * relying on the folder_ranges table.
 *   {root}/{site}/{rangeStart}-{rangeEnd}/{partFolder}
 * e.g. /mnt/sdrive/FrontEndQCFolders/Nashua/76400-76499/76477
 * Range is computed as floor(part/100)*100 .. +99. Part folder match is fuzzy
 * (a directory whose name contains the part number).
 */
function resolveQCPartFolder(site: string, partNumber: string, numericPart: number):
  { partFolder: string | null; rangePath: string | null } {
  const siteDir = QC_FOLDERS_PATH(site)
  if (!fs.existsSync(siteDir)) return { partFolder: null, rangePath: null }

  const start = Math.floor(numericPart / 100) * 100
  const end = start + 99
  const rangeName = `${start}-${end}`
  let rangePath = ciFindChild(siteDir, rangeName)
  // Fallback: scan range folders and pick one whose start-end span contains the part
  if (!rangePath) {
    try {
      for (const e of fs.readdirSync(siteDir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue
        const m = e.name.match(/^(\d+)\s*-\s*(\d+)$/)
        if (m && numericPart >= parseInt(m[1]) && numericPart <= parseInt(m[2])) {
          rangePath = path.join(siteDir, e.name); break
        }
      }
    } catch { /* ignore */ }
  }
  if (!rangePath) return { partFolder: null, rangePath: null }

  // Fuzzy part folder: contains the part number (exact match preferred)
  let partFolder: string | null = null
  try {
    const dirs = fs.readdirSync(rangePath, { withFileTypes: true }).filter(e => e.isDirectory())
    const exact = dirs.find(e => e.name === partNumber || e.name === String(numericPart))
    const fuzzy = dirs.find(e => e.name.includes(String(numericPart)) || e.name.toUpperCase().includes(partNumber.toUpperCase()))
    const hit = exact || fuzzy
    if (hit) partFolder = path.join(rangePath, hit.name)
  } catch { /* ignore */ }

  return { partFolder, rangePath }
}

/**
 * Find the range folder for a given part number
 */
async function findRangeFolder(
  pool: any,
  partNum: number,
  fileType: string,
  site: string
): Promise<{ basePath: string; folderName: string } | null> {
  try {
    console.log(`findRangeFolder: Looking for partNum=${partNum}, fileType=${fileType}, site=${site}`)
    
    const [rows]: any = await pool.query(
      `SELECT base_path, folder_name FROM folder_ranges 
       WHERE file_type = ? AND site = ? AND range_start <= ? AND range_end >= ?
       LIMIT 1`,
      [fileType, site, partNum, partNum]
    )
    
    console.log(`findRangeFolder: Query result:`, JSON.stringify(rows))
    console.log(`findRangeFolder: rows type: ${typeof rows}, isArray: ${Array.isArray(rows)}, length: ${rows?.length}`)
    
    if (rows && rows.length > 0) {
      const row = rows[0]
      console.log(`findRangeFolder: First row:`, JSON.stringify(row))
      console.log(`findRangeFolder: Row keys:`, Object.keys(row))
      return {
        basePath: row.base_path,
        folderName: row.folder_name
      }
    }
  } catch (err) {
    console.error('Error finding range folder:', err)
  }
  return null
}

/**
 * List files in a directory (non-recursive, fast)
 */
function listFiles(dirPath: string): FileInfo[] {
  const files: FileInfo[] = []
  
  try {
    if (!fs.existsSync(dirPath)) {
      return files
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) continue
      
      const fullPath = path.join(dirPath, entry.name)
      try {
        const stats = fs.statSync(fullPath)
        const ext = path.extname(entry.name).toLowerCase().slice(1)
        
        files.push({
          name: entry.name,
          path: fullPath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          extension: ext,
          isDirectory: false,
          serveUrl: `/api/files/serve?path=${encodeURIComponent(fullPath)}`
        })
      } catch (err) {
        // Skip files we can't stat
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read
  }
  
  return files
}

/**
 * Search for part number folder within a range folder
 */
function searchForPartFolder(rangeBasePath: string, partNumber: string): string | null {
  try {
    console.log(`searchForPartFolder: Looking in ${rangeBasePath} for ${partNumber}`)
    
    if (!fs.existsSync(rangeBasePath)) {
      console.log(`searchForPartFolder: Path does not exist: ${rangeBasePath}`)
      return null
    }

    const entries = fs.readdirSync(rangeBasePath, { withFileTypes: true })
    console.log(`searchForPartFolder: Found ${entries.length} entries`)
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      
      // Check if folder name contains the part number
      if (entry.name.includes(partNumber) || 
          entry.name.toUpperCase().includes(partNumber.toUpperCase())) {
        console.log(`searchForPartFolder: Found matching folder: ${entry.name}`)
        return path.join(rangeBasePath, entry.name)
      }
    }
    
    console.log(`searchForPartFolder: No matching folder found for ${partNumber}`)
  } catch (err) {
    console.error('Error searching for part folder:', err)
  }
  
  return null
}

/**
 * List files in a directory that start with a specific prefix
 * e.g., list all files starting with "76305_"
 */
function listFilesByPrefix(dirPath: string, prefix: string): FileInfo[] {
  const files: FileInfo[] = []
  
  try {
    if (!fs.existsSync(dirPath)) {
      return files
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const prefixUpper = prefix.toUpperCase()
    
    for (const entry of entries) {
      if (entry.isDirectory()) continue
      
      // Check if filename starts with the prefix (case-insensitive)
      if (entry.name.toUpperCase().startsWith(prefixUpper) ||
          entry.name.toUpperCase().startsWith(prefixUpper + '_')) {
        const fullPath = path.join(dirPath, entry.name)
        try {
          const stats = fs.statSync(fullPath)
          const ext = path.extname(entry.name).toLowerCase().slice(1)
          
          files.push({
            name: entry.name,
            path: fullPath,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            extension: ext,
            isDirectory: false,
            serveUrl: `/api/files/serve?path=${encodeURIComponent(fullPath)}`,
            source: 'network'
          })
        } catch (err) {
          // Skip files we can't stat
        }
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read
  }
  
  return files
}

/**
 * Query Paradigm (MSSQL) for document attachments
 * Searches DATA0433 for DOCUMENT_PATH based on job number
 * Uses CTEs to join DATA0050 (customer parts) and DATA0017 (inventory parts)
 */
async function queryParadigmAttachments(partNumber: string): Promise<FileInfo[]> {
  const files: FileInfo[] = []
  
  try {
    const pool = await getMSSQLPool('1')
    
    // Use CTEs to properly join to DATA0050 and DATA0017
    const query = `
      WITH CUST AS (
          SELECT 
              RKEY,
              CUSTOMER_PART_NUMBER
          FROM DATA0050
          WHERE CUSTOMER_PART_NUMBER LIKE @partNumber + '%'
      ),
      INV AS (
          SELECT 
              RKEY,
              INV_PART_NUMBER
          FROM DATA0017
          WHERE INV_PART_NUMBER LIKE '%' + @partNumber + '%'
      )
      SELECT 
          LTRIM(RTRIM(COALESCE(CUST.CUSTOMER_PART_NUMBER, INV.INV_PART_NUMBER))) AS MATCHED_PART_NUMBER,
          LTRIM(RTRIM(D433.DOCUMENT_PATH)) AS DOCUMENT_PATH
      FROM DATA0433 D433
      LEFT JOIN CUST ON D433.SOURCE_PTR = CUST.RKEY AND D433.SOURCE_TYPE = 50
      LEFT JOIN INV  ON D433.SOURCE_PTR = INV.RKEY  AND D433.SOURCE_TYPE = 17
      WHERE 
          (CUST.RKEY IS NOT NULL OR INV.RKEY IS NOT NULL)
      ORDER BY 
          DOCUMENT_PATH
    `
    
    const request = pool.request()
    request.input('partNumber', partNumber)
    
    const result = await request.query(query)
    
    for (const row of result.recordset) {
      if (row.DOCUMENT_PATH) {
        const docPath = row.DOCUMENT_PATH.trim()  // Also trim in JS just in case
        const fileName = path.basename(docPath)
        const ext = path.extname(fileName).toLowerCase().slice(1)
        
        // Convert Windows path to Linux path for serving
        let linuxPath = windowsToLinuxPath(docPath)
        
        files.push({
          name: fileName,
          path: linuxPath,
          size: 0, // We don't have size info from DB
          modified: '', // We don't have modified info from DB
          extension: ext,
          isDirectory: false,
          serveUrl: `/api/files/serve?path=${encodeURIComponent(linuxPath)}`,
          source: 'paradigm',
          matchedPartNumber: row.MATCHED_PART_NUMBER || ''
        })
      }
    }
  } catch (err) {
    console.error('Error querying Paradigm attachments:', err)
  }
  
  return files
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { partNumber, fileType } = body

    if (!partNumber) {
      return NextResponse.json({ error: 'Part number is required' }, { status: 400 })
    }

    const pool = getMySQLPrimaryPool()
    const results: LocationFiles[] = []

    // Extract numeric part from the part number
    const numericPart = extractPartNumber(partNumber)

    if (fileType === 'finalInspection') {
      const sites = ['Nashua', 'Nogales', 'Mesa']
      
      for (const site of sites) {
        let locationResult: LocationFiles = {
          location: site,
          basePath: '',
          files: [],
          hasFiles: false
        }

        if (numericPart) {
          // 1. Direct path resolution from the part number (no DB dependency)
          const direct = resolveQCPartFolder(site, partNumber, numericPart)
          if (direct.partFolder) {
            locationResult.basePath = direct.partFolder
            locationResult.files = listFiles(direct.partFolder)
            locationResult.hasFiles = locationResult.files.length > 0
          } else {
            // 2. Fallback to the folder_ranges table lookup
            const rangeInfo = await findRangeFolder(pool, numericPart, 'finalInspection', site)
            if (rangeInfo) {
              const partFolderPath = searchForPartFolder(rangeInfo.basePath, partNumber)
              if (partFolderPath) {
                locationResult.basePath = partFolderPath
                locationResult.files = listFiles(partFolderPath)
                locationResult.hasFiles = locationResult.files.length > 0
              } else {
                locationResult.basePath = rangeInfo.basePath
                locationResult.error = `Part folder not found in range ${rangeInfo.folderName}`
              }
            } else if (direct.rangePath) {
              locationResult.basePath = direct.rangePath
              locationResult.error = `Part folder ${partNumber} not found in ${path.basename(direct.rangePath)}`
            } else {
              locationResult.error = `No range folder found for part ${numericPart} at ${site}`
            }
          }
        } else {
          locationResult.error = `Could not extract numeric part from ${partNumber}`
        }

        results.push(locationResult)
      }
    } else if (fileType === 'buildDrawings') {
      // For build drawings:
      // 1. Find the range folder
      // 2. Look for a subfolder matching the part number
      // 3. If no subfolder, list files starting with the part number
      // 4. Also query Paradigm for attachments
      
      let networkFiles: FileInfo[] = []
      let paradigmAttachments: FileInfo[] = []
      let basePath = ''
      let error: string | undefined

      if (numericPart) {
        // Find the range folder for this part number
        const rangeInfo = await findRangeFolder(pool, numericPart, 'buildDrawings', 'Default')
        
        if (rangeInfo) {
          basePath = rangeInfo.basePath
          
          // First, try to find a subfolder matching the part number
          const partFolderPath = searchForPartFolder(rangeInfo.basePath, partNumber)
          
          if (partFolderPath) {
            // Found a folder - list all files in it
            basePath = partFolderPath
            networkFiles = listFiles(partFolderPath)
            // Mark source as network
            networkFiles.forEach(f => f.source = 'network')
          } else {
            // No folder found - list files that start with the part number
            networkFiles = listFilesByPrefix(rangeInfo.basePath, partNumber)
          }
        } else {
          error = `No range folder found for part ${numericPart}`
        }
      } else {
        error = `Could not extract numeric part from ${partNumber}`
      }

      // Query Paradigm for document attachments
      try {
        paradigmAttachments = await queryParadigmAttachments(partNumber)
      } catch (err) {
        console.error('Error fetching Paradigm attachments:', err)
      }

      // Return separate arrays for network and paradigm files
      return NextResponse.json({
        success: true,
        partNumber,
        numericPart,
        fileType,
        buildDrawings: {
          networkFiles,
          paradigmAttachments,
          basePath,
          error,
          hasNetworkFiles: networkFiles.length > 0,
          hasParadigmFiles: paradigmAttachments.length > 0
        }
      })
    } else if (fileType === 'packShip') {
      // For Pack & Ship, use range folder lookup like buildDrawings
      let locationResult: LocationFiles = {
        location: 'Pack & Ship',
        basePath: '',
        files: [],
        hasFiles: false
      }

      if (numericPart) {
        // Find the range folder for this part number
        const rangeInfo = await findRangeFolder(pool, numericPart, 'packShip', 'Default')
        
        if (rangeInfo) {
          // Search for the specific part folder within the range
          const partFolderPath = searchForPartFolder(rangeInfo.basePath, partNumber)
          
          if (partFolderPath) {
            locationResult.basePath = partFolderPath
            locationResult.files = listFiles(partFolderPath)
            locationResult.hasFiles = locationResult.files.length > 0
          } else {
            locationResult.basePath = rangeInfo.basePath
            locationResult.error = `Part folder not found in range ${rangeInfo.folderName}`
          }
        } else {
          locationResult.error = `No range folder found for part ${numericPart}`
        }
      } else {
        locationResult.error = `Could not extract numeric part from ${partNumber}`
      }

      results.push(locationResult)
    }

    return NextResponse.json({
      success: true,
      partNumber,
      numericPart,
      fileType,
      results
    })
  } catch (error) {
    console.error('Released Files Error:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}
