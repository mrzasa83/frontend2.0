import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMySQLPrimaryPool } from '@/lib/db/mysql-primary'
import { getMSSQLPool } from '@/lib/db/mssql'
import * as fs from 'fs'
import * as path from 'path'

type FileInfo = {
  name: string
  path: string
  size: number
  modified: string
  extension: string
  isDirectory: boolean
  serveUrl: string
  source?: string  // 'network' or 'paradigm'
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
 * Find the range folder for a given part number
 */
async function findRangeFolder(
  pool: any,
  partNum: number,
  fileType: string,
  site: string
): Promise<{ basePath: string; folderName: string } | null> {
  try {
    const [rows]: any = await pool.query(
      `SELECT base_path, folder_name FROM folder_ranges 
       WHERE file_type = ? AND site = ? AND range_start <= ? AND range_end >= ?
       LIMIT 1`,
      [fileType, site, partNum, partNum]
    )
    
    if (rows.length > 0) {
      return {
        basePath: rows[0].base_path,
        folderName: rows[0].folder_name
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
    if (!fs.existsSync(rangeBasePath)) {
      return null
    }

    const entries = fs.readdirSync(rangeBasePath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      
      // Check if folder name contains the part number
      if (entry.name.includes(partNumber) || 
          entry.name.toUpperCase().includes(partNumber.toUpperCase())) {
        return path.join(rangeBasePath, entry.name)
      }
    }
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
    const pool = await getMSSQLPool('PARADIGM')
    
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
          COALESCE(CUST.CUSTOMER_PART_NUMBER, INV.INV_PART_NUMBER) AS MATCHED_PART_NUMBER,
          D433.DOCUMENT_PATH
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
        const docPath = row.DOCUMENT_PATH
        const fileName = path.basename(docPath)
        const ext = path.extname(fileName).toLowerCase().slice(1)
        
        // Convert Windows path to Linux path for serving
        let linuxPath = docPath
        if (docPath.match(/^[A-Za-z]:\\/)) {
          // Convert Windows path like "S:\path\to\file" to Linux "/mnt/sdrive/path/to/file"
          const driveLetter = docPath[0].toLowerCase()
          const restOfPath = docPath.substring(3).replace(/\\/g, '/')
          linuxPath = `/mnt/${driveLetter}drive/${restOfPath}`
        }
        
        files.push({
          name: fileName,
          path: linuxPath,
          size: 0, // We don't have size info from DB
          modified: '', // We don't have modified info from DB
          extension: ext,
          isDirectory: false,
          serveUrl: `/api/files/serve?path=${encodeURIComponent(linuxPath)}`,
          source: 'paradigm'
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
          // Find the range folder for this part number
          const rangeInfo = await findRangeFolder(pool, numericPart, 'finalInspection', site)
          
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
