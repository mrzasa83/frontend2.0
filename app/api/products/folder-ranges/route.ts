import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMySQLPrimaryPool } from '@/lib/db/mysql-primary'
import * as fs from 'fs'
import * as path from 'path'

// Base paths for each site and file type
const SITE_PATHS: Record<string, Record<string, string>> = {
  finalInspection: {
    Nashua: '/mnt/sdrive/FrontEndQCFolders/Nashua',
    Nogales: '/mnt/sdrive/FrontEndQCFolders/Nogales',
    Mesa: '/mnt/sdrive/FrontEndQCFolders/Mesa'
  },
  buildDrawings: {
    Default: '/mnt/sdrive/AttDocs/MfgParts'
  },
  packShip: {
    Default: '/mnt/tdrive/Packaging and Shipping/$Pack & Ship by Part'
  }
}

type RangeInfo = {
  folderName: string
  rangeStart: number
  rangeEnd: number
  basePath: string
}

/**
 * Try to extract range from folder name using multiple patterns
 * Handles:
 * - "11700-11799"
 * - "12700_DWG-12799_DWG"
 * - "80000 - 81000" (with spaces)
 * - "12700_DWG - 12799_DWG" (with spaces and suffix)
 */
function extractRange(folderName: string): { start: number; end: number } | null {
  // Pattern: captures first number and second number, ignoring _DWG suffix and spaces around dash
  // Examples: "12700_DWG-12799_DWG", "80000 - 81000", "11700-11799"
  const pattern = /^(\d+)(?:_DWG)?\s*-\s*(\d+)(?:_DWG)?$/i
  
  const match = folderName.match(pattern)
  if (match) {
    return {
      start: parseInt(match[1], 10),
      end: parseInt(match[2], 10)
    }
  }
  return null
}

/**
 * Scan a directory for range folders
 */
function scanForRanges(basePath: string): RangeInfo[] {
  const ranges: RangeInfo[] = []
  
  try {
    if (!fs.existsSync(basePath)) {
      console.log(`Path does not exist: ${basePath}`)
      return ranges
    }

    const entries = fs.readdirSync(basePath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      
      const range = extractRange(entry.name)
      if (range) {
        ranges.push({
          folderName: entry.name,
          rangeStart: range.start,
          rangeEnd: range.end,
          basePath: path.join(basePath, entry.name)
        })
      }
    }
    
    console.log(`Found ${ranges.length} range folders in ${basePath}`)
  } catch (err) {
    console.error(`Error scanning ${basePath}:`, err)
  }
  
  return ranges
}

/**
 * POST: Scan directories and update database with folder ranges
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const roles = session.user.roles || []
  if (!roles.includes('admin') && !roles.includes('Admin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { fileType } = body

    const pool = getMySQLPrimaryPool()
    const results: Record<string, { scanned: number, inserted: number, errors: string[], samples: string[] }> = {}

    // Determine which file types to scan
    const typesToScan = fileType ? [fileType] : Object.keys(SITE_PATHS)

    for (const type of typesToScan) {
      const sites = SITE_PATHS[type]
      if (!sites) continue

      for (const [site, basePath] of Object.entries(sites)) {
        const key = `${type}/${site}`
        results[key] = { scanned: 0, inserted: 0, errors: [], samples: [] }

        // Check if base path exists
        if (!fs.existsSync(basePath)) {
          results[key].errors.push(`Base path not accessible: ${basePath}`)
          continue
        }

        // Scan for range folders
        const ranges = scanForRanges(basePath)
        results[key].scanned = ranges.length

        // Store some sample folder names for debugging
        results[key].samples = ranges.slice(0, 5).map(r => `${r.folderName} (${r.rangeStart}-${r.rangeEnd})`)

        if (ranges.length === 0) {
          results[key].errors.push(`No range folders found in ${basePath}`)
          continue
        }

        // Delete existing ranges for this site/type
        await pool.query(
          'DELETE FROM folder_ranges WHERE site = ? AND file_type = ?',
          [site, type]
        )

        // Insert new ranges
        for (const range of ranges) {
          try {
            await pool.query(
              `INSERT INTO folder_ranges (site, file_type, range_start, range_end, folder_name, base_path)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [site, type, range.rangeStart, range.rangeEnd, range.folderName, range.basePath]
            )
            results[key].inserted++
          } catch (err) {
            results[key].errors.push(`Failed to insert ${range.folderName}: ${err}`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Folder ranges cataloged',
      results
    })
  } catch (error) {
    console.error('Catalog Ranges Error:', error)
    return NextResponse.json(
      { error: 'Failed to catalog ranges' },
      { status: 500 }
    )
  }
}

/**
 * GET: Retrieve cataloged ranges from database
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const fileType = searchParams.get('fileType')
    const site = searchParams.get('site')

    const pool = getMySQLPrimaryPool()
    
    let query = 'SELECT * FROM folder_ranges WHERE 1=1'
    const params: any[] = []

    if (fileType) {
      query += ' AND file_type = ?'
      params.push(fileType)
    }
    if (site) {
      query += ' AND site = ?'
      params.push(site)
    }

    query += ' ORDER BY site, file_type, range_start'

    const [rows] = await pool.query(query, params)

    return NextResponse.json({
      success: true,
      ranges: rows
    })
  } catch (error) {
    console.error('Get Ranges Error:', error)
    return NextResponse.json(
      { error: 'Failed to get ranges' },
      { status: 500 }
    )
  }
}
