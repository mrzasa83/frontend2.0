import fs from 'fs/promises'
import path from 'path'
import os from 'os'

// Network share path
const NETWORK_SHARE_PATH = '/mnt/tdrive/FrontEndShared/Projects/P100026 - MDI Output'
// Fallback local path
const LOCAL_FALLBACK_PATH = path.join(os.homedir(), 'mdi-output')

/**
 * Ensure directory exists, create if it doesn't
 */
async function ensureDirectory(dirPath: string): Promise<boolean> {
  try {
    await fs.access(dirPath)
    return true
  } catch {
    try {
      await fs.mkdir(dirPath, { recursive: true })
      return true
    } catch (error) {
      console.error('Failed to create directory:', error)
      return false
    }
  }
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(filename: string): string {
  // Remove or replace invalid filename characters
  return filename
    .replace(/[\/\\:*?"<>|]/g, '_') // Replace invalid chars with underscore
    .replace(/\s+/g, '_')            // Replace spaces with underscore
    .trim()
}

/**
 * Write route data to a text file on the network share
 */
export async function writeRouteFile(
  invPartNumber: string,
  routeData: any
): Promise<{ success: boolean; filename?: string; path?: string; error?: string; usedFallback?: boolean }> {
  try {
    // Sanitize the filename
    const sanitizedName = sanitizeFilename(invPartNumber)
    const filename = `${sanitizedName}.txt`
    
    // Format the route data as text
    let content = ''
    content += '='.repeat(80) + '\n'
    content += `Route Information for: ${invPartNumber}\n`
    content += `Generated: ${new Date().toISOString()}\n`
    content += '='.repeat(80) + '\n\n'

    // Add extracted code info
    content += `Extracted Code: ${routeData.extractedCode}\n`
    content += `Customer Part Number: ${routeData.customerPartNumber}\n`
    content += `Customer Part Match: ${routeData.customerPartMatches ? 'YES' : 'NO'}\n\n`

    // Add Route Query 1 Results
    if (routeData.routeQuery1Results && routeData.routeQuery1Results.length > 0) {
      content += '-'.repeat(80) + '\n'
      content += 'CUSTOMER PART ROUTE (Query 1)\n'
      content += '-'.repeat(80) + '\n'
      
      routeData.routeQuery1Results.forEach((step: any, idx: number) => {
        content += `\nStep ${step.STEP_NUMBER || idx + 1}:\n`
        content += `  Dept Code: ${step.DEPT_CODE || 'N/A'}\n`
        content += `  Dept Name: ${step.DEPT_NAME || 'N/A'}\n`
        if (step.ParameterList) {
          content += `  Parameters:\n`
          step.ParameterList.split('; ').forEach((param: string) => {
            content += `    ${param}\n`
          })
        }
      })
      content += '\n'
    } else {
      content += 'Customer Part Route: No data or skipped\n\n'
    }

    // Add Route Query 2 Results
    if (routeData.routeQuery2Results && routeData.routeQuery2Results.length > 0) {
      content += '-'.repeat(80) + '\n'
      content += 'INVENTORY PART ROUTE (Query 2)\n'
      content += '-'.repeat(80) + '\n'
      
      routeData.routeQuery2Results.forEach((step: any, idx: number) => {
        content += `\nStep ${step.STEP_NUMBER || idx + 1}:\n`
        content += `  Dept Code: ${step.DEPT_CODE || 'N/A'}\n`
        content += `  Dept Name: ${step.DEPT_NAME || 'N/A'}\n`
        if (step.ParameterList) {
          content += `  Parameters:\n`
          step.ParameterList.split('; ').forEach((param: string) => {
            content += `    ${param}\n`
          })
        }
      })
      content += '\n'
    } else {
      content += 'Inventory Part Route: No data\n\n'
    }

    content += '='.repeat(80) + '\n'
    content += 'End of Route Information\n'
    content += '='.repeat(80) + '\n'

    // Try to write to network share first
    let filePath = path.join(NETWORK_SHARE_PATH, filename)
    let usedFallback = false
    
    try {
      // Check if network path is accessible
      await fs.access(NETWORK_SHARE_PATH)
      
      // Try to write the file with explicit permissions
      await fs.writeFile(filePath, content, { 
        encoding: 'utf8',
        mode: 0o666 // rw-rw-rw- permissions
      })
      
      // Try to chmod after creation if the mode option didn't work
      try {
        await fs.chmod(filePath, 0o666)
      } catch (chmodError) {
        console.warn('Could not chmod file:', chmodError)
        // Continue anyway - file was written
      }
      
      console.log(`Route file written successfully to network share: ${filename}`)
      return { success: true, filename, path: filePath, usedFallback: false }
      
    } catch (networkError) {
      console.warn('Failed to write to network share:', networkError)
      console.log('Attempting to write to local fallback directory...')
      
      // Fallback to local directory
      await ensureDirectory(LOCAL_FALLBACK_PATH)
      filePath = path.join(LOCAL_FALLBACK_PATH, filename)
      usedFallback = true
      
      await fs.writeFile(filePath, content, 'utf8')
      console.log(`Route file written to local fallback: ${filePath}`)
      
      return { 
        success: true, 
        filename, 
        path: filePath,
        usedFallback: true,
        error: `Network share not writable, saved locally to: ${filePath}`
      }
    }

  } catch (error) {
    console.error('Error writing route file:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error writing file'
    }
  }
}

/**
 * Check if network share is accessible and writable
 */
export async function checkNetworkShareAccess(): Promise<{ 
  accessible: boolean
  writable: boolean
  path: string
  error?: string 
}> {
  try {
    // Check if directory exists
    await fs.access(NETWORK_SHARE_PATH)
    
    // Try to create a test file
    const testFile = path.join(NETWORK_SHARE_PATH, `.test_${Date.now()}.tmp`)
    try {
      await fs.writeFile(testFile, 'test', { mode: 0o666 })
      await fs.unlink(testFile)
      
      return {
        accessible: true,
        writable: true,
        path: NETWORK_SHARE_PATH
      }
    } catch (writeError) {
      return {
        accessible: true,
        writable: false,
        path: NETWORK_SHARE_PATH,
        error: 'Directory accessible but not writable'
      }
    }
  } catch (accessError) {
    return {
      accessible: false,
      writable: false,
      path: NETWORK_SHARE_PATH,
      error: accessError instanceof Error ? accessError.message : 'Unknown error'
    }
  }
}
