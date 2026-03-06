/**
 * Centralized drive mount configuration.
 *
 * All network-drive paths that the app accesses on disk (server-side)
 * or displays to the user (client-side) are defined here so they can
 * be overridden by environment variables.
 *
 * Environment variables (all optional, sensible defaults provided):
 *   DRIVE_MOUNT_J   – mount point for the J: drive    (default /mnt/jdrive)
 *   DRIVE_MOUNT_S   – mount point for the S: drive    (default /mnt/sdrive)
 *   DRIVE_MOUNT_T   – mount point for the T: drive    (default /mnt/tdrive)
 *   UNC_SERVER_NAME – Windows UNC server hostname      (default APCFS04)
 *   UNC_SHARE_NAME  – UNC share mapped to S: drive     (default SHARED2)
 */

// ---------------------------------------------------------------------------
// Server-side mount roots (read from env at runtime)
// ---------------------------------------------------------------------------
export const JDRIVE = () => process.env.DRIVE_MOUNT_J || '/mnt/jdrive'
export const SDRIVE = () => process.env.DRIVE_MOUNT_S || '/mnt/sdrive'
export const TDRIVE = () => process.env.DRIVE_MOUNT_T || '/mnt/tdrive'

// UNC mapping  (\\APCFS04\SHARED2  →  S: mount)
export const UNC_SERVER = () => process.env.UNC_SERVER_NAME || 'APCFS04'
export const UNC_SHARE  = () => process.env.UNC_SHARE_NAME  || 'SHARED2'

// ---------------------------------------------------------------------------
// Derived paths used by multiple features
// ---------------------------------------------------------------------------
export const ENGJOBS_PATH     = () => `${JDRIVE()}/APC EngJobs`
export const QC_FOLDERS_PATH  = (site: string) => `${SDRIVE()}/FrontEndQCFolders/${site}`
export const ATTDOCS_PATH     = () => `${SDRIVE()}/AttDocs/MfgParts`
export const PACKSHIP_PATH    = () => `${TDRIVE()}/Packaging and Shipping/$Pack & Ship by Part`

// ---------------------------------------------------------------------------
// Allowed base paths for the file-serve API (security whitelist)
// ---------------------------------------------------------------------------
export const FILE_SERVE_ALLOWED_BASES = () => [
  `${SDRIVE()}/FrontEndQCFolders`,
  `${SDRIVE()}/AttDocs`,
  `${TDRIVE()}/Packaging and Shipping`,
  JDRIVE(),
]

// ---------------------------------------------------------------------------
// Site path map used by folder-ranges scanner
// ---------------------------------------------------------------------------
export const SITE_PATHS = () => ({
  finalInspection: {
    Nashua:  QC_FOLDERS_PATH('Nashua'),
    Nogales: QC_FOLDERS_PATH('Nogales'),
    Mesa:    QC_FOLDERS_PATH('Mesa'),
  },
  buildDrawings: {
    Default: ATTDOCS_PATH(),
  },
  packShip: {
    Default: PACKSHIP_PATH(),
  },
})

// ---------------------------------------------------------------------------
// Convert a Windows path (UNC or drive-letter) to a Linux mount path.
// Used when the database stores Windows-style paths (e.g. from Paradigm).
// ---------------------------------------------------------------------------
export function windowsToLinuxPath(windowsPath: string): string {
  if (!windowsPath) return windowsPath

  // UNC path  \\APCFS04\SHARED2\rest  →  /mnt/sdrive/rest
  const uncPrefix = `\\\\${UNC_SERVER()}\\${UNC_SHARE()}`
  if (windowsPath.startsWith(uncPrefix)) {
    const rest = windowsPath.substring(uncPrefix.length).replace(/\\/g, '/')
    return `${SDRIVE()}${rest}`
  }

  // Drive letter  X:\rest  →  /mnt/xdrive/rest
  if (/^[A-Za-z]:\\/.test(windowsPath)) {
    const letter = windowsPath[0].toLowerCase()
    const rest = windowsPath.substring(3).replace(/\\/g, '/')
    // Map known drive letters to their mount points
    const driveMap: Record<string, () => string> = {
      j: JDRIVE,
      s: SDRIVE,
      t: TDRIVE,
    }
    const mountFn = driveMap[letter]
    const mount = mountFn ? mountFn() : `/mnt/${letter}drive`
    return `${mount}/${rest}`
  }

  return windowsPath
}

// ---------------------------------------------------------------------------
// Convert a Linux mount path to Windows display path.
// Used on the client side (safe to call from 'use client' components too,
// since NEXT_PUBLIC_ vars would be needed if the mounts ever diverge
// from defaults on the client — but display is cosmetic only).
// ---------------------------------------------------------------------------
export function linuxToWindowsDisplay(linuxPath: string): string {
  if (!linuxPath) return ''
  return linuxPath
    .replace(/^\/mnt\/sdrive\/?/i, 'S:\\')
    .replace(/^\/mnt\/jdrive\/?/i, 'J:\\')
    .replace(/^\/mnt\/tdrive\/?/i, 'T:\\')
    .replace(/\//g, '\\')
}

export function linuxToWindowsUrl(linuxPath: string): string {
  if (!linuxPath) return ''
  let winPath = linuxPath
    .replace(/^\/mnt\/jdrive\/?/i, 'J:/')
    .replace(/^\/mnt\/sdrive\/?/i, 'S:/')
    .replace(/^\/mnt\/tdrive\/?/i, 'T:/')
  winPath = winPath.replace(/\\/g, '/')
  return `file:///${winPath}`
}
