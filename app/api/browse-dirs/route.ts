import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Drive letter to Linux mount mapping
const DRIVE_MAP: Record<string, string> = {
  'T:': '/mnt/tdrive',
  'J:': '/mnt/jdrive',
  'S:': '/mnt/sdrive',
}

// Reverse map for display
const MOUNT_TO_DRIVE: Record<string, string> = Object.fromEntries(
  Object.entries(DRIVE_MAP).map(([k, v]) => [v, k])
)

function linuxToWindows(linuxPath: string): string {
  for (const [mount, drive] of Object.entries(MOUNT_TO_DRIVE)) {
    if (linuxPath === mount || linuxPath.startsWith(mount + '/')) {
      return linuxPath.replace(mount, drive).replace(/\//g, '\\')
    }
  }
  return linuxPath
}

function windowsToLinux(windowsPath: string): string {
  for (const [drive, mount] of Object.entries(DRIVE_MAP)) {
    const driveSlash = drive + '\\'
    if (windowsPath === drive || windowsPath.startsWith(driveSlash)) {
      return windowsPath.replace(drive, mount).replace(/\\/g, '/')
    }
  }
  return windowsPath
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedPath = searchParams.get('path') || ''

  try {
    // If no path, return the drive roots
    if (!requestedPath) {
      const drives = []
      for (const [drive, mount] of Object.entries(DRIVE_MAP)) {
        try {
          await fs.access(mount)
          drives.push({
            name: drive + '\\',
            path: drive,
            linuxPath: mount,
            type: 'drive',
          })
        } catch {
          // Drive not mounted, skip
        }
      }
      return NextResponse.json({
        success: true,
        currentPath: '',
        windowsPath: '',
        parentPath: null,
        items: drives,
      })
    }

    // Translate to Linux path
    const linuxPath = windowsToLinux(requestedPath)

    // Security: only allow browsing under mapped drives
    const isAllowed = Object.values(DRIVE_MAP).some(
      mount => linuxPath === mount || linuxPath.startsWith(mount + '/')
    )
    if (!isAllowed) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // List directories only (no files)
    const entries = await fs.readdir(linuxPath, { withFileTypes: true })
    const dirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => ({
        name: e.name,
        path: linuxToWindows(path.join(linuxPath, e.name)),
        linuxPath: path.join(linuxPath, e.name),
        type: 'folder' as const,
      }))

    // Calculate parent
    const parentLinux = path.dirname(linuxPath)
    const isAtDriveRoot = Object.values(DRIVE_MAP).includes(linuxPath)
    const parentPath = isAtDriveRoot ? '' : linuxToWindows(parentLinux)

    return NextResponse.json({
      success: true,
      currentPath: linuxPath,
      windowsPath: linuxToWindows(linuxPath),
      parentPath,
      items: dirs,
    })
  } catch (error) {
    console.error('Browse error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cannot browse directory' },
      { status: 500 }
    )
  }
}
