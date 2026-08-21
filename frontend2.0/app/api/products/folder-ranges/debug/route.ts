import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMySQLPrimaryPool } from '@/lib/db/mysql-primary'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Debug endpoint to check folder ranges and file lookup
 * GET /api/products/folder-ranges/debug?partNumber=12641&fileType=finalInspection
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const partNumber = searchParams.get('partNumber') || ''
    const fileType = searchParams.get('fileType') || 'finalInspection'
    
    const pool = getMySQLPrimaryPool()
    const debug: any = {
      partNumber,
      fileType,
      numericPart: null,
      rangesInDb: [],
      matchingRange: null,
      folderExists: false,
      folderContents: [],
      partFolderFound: null
    }

    // Extract numeric part
    const match = partNumber.match(/(\d+)/)
    if (match) {
      debug.numericPart = parseInt(match[1], 10)
    }

    // Get all ranges for this fileType
    const [allRanges]: any = await pool.query(
      `SELECT site, range_start, range_end, folder_name, base_path 
       FROM folder_ranges 
       WHERE file_type = ? 
       ORDER BY site, range_start`,
      [fileType]
    )
    debug.rangesInDb = allRanges

    // Find matching range for the part number
    if (debug.numericPart) {
      const [matchingRanges]: any = await pool.query(
        `SELECT site, range_start, range_end, folder_name, base_path 
         FROM folder_ranges 
         WHERE file_type = ? AND range_start <= ? AND range_end >= ?`,
        [fileType, debug.numericPart, debug.numericPart]
      )
      debug.matchingRange = matchingRanges

      // Check if folder exists and list contents
      for (const range of matchingRanges) {
        const rangeCheck: any = {
          site: range.site,
          basePath: range.base_path,
          exists: false,
          contents: [],
          partFolderFound: null
        }

        if (fs.existsSync(range.base_path)) {
          rangeCheck.exists = true
          try {
            const entries = fs.readdirSync(range.base_path, { withFileTypes: true })
            rangeCheck.contents = entries.slice(0, 20).map(e => ({
              name: e.name,
              isDirectory: e.isDirectory()
            }))

            // Look for part folder
            for (const entry of entries) {
              if (entry.isDirectory() && 
                  (entry.name.includes(partNumber) || 
                   entry.name.toUpperCase().includes(partNumber.toUpperCase()))) {
                rangeCheck.partFolderFound = entry.name
                
                // List files in part folder
                const partPath = path.join(range.base_path, entry.name)
                const partFiles = fs.readdirSync(partPath)
                rangeCheck.partFolderContents = partFiles.slice(0, 10)
                break
              }
            }
          } catch (err) {
            rangeCheck.error = String(err)
          }
        }

        debug.folderChecks = debug.folderChecks || []
        debug.folderChecks.push(rangeCheck)
      }
    }

    return NextResponse.json(debug)
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
