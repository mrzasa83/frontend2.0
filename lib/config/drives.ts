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
export const LDRIVE = () => process.env.LDRIVE_ROOT || process.env.DRIVE_MOUNT_L || '/mnt/ldrive'

// UNC mapping  (\\APCFS04\SHARED2  →  S: mount)
export const UNC_SERVER = () => process.env.UNC_SERVER_NAME || 'APCFS04'
export const UNC_SHARE  = () => process.env.UNC_SHARE_NAME  || 'SHARED2'

/**
 * Additional UNC roots, for shares other than the primary one above.
 * Paradigm stores absolute Windows paths, and not every one of them lives on
 * \\APCFS04\SHARED2 — anything unmapped can't be resolved to a mount point and
 * ends up rejected by the file-serve whitelist.
 *
 * Format: semicolon-separated  \\SERVER\SHARE=/mount/point
 *   UNC_EXTRA_SHARES=\\APCFS04\SHARED=/mnt/sdrive;\\APCFS05\ENG=/mnt/jdrive
 */
const DEFAULT_EXTRA_SHARES = [
  // DFS alias for the same S: tree. Paradigm stores both forms:
  //   \\APCFS04\shared2\ItarAttDocs\...        (direct)
  //   \\apc.local\APC\APCBT\S\ItarAttDocs\...  (DFS namespace)
  { prefix: '\\\\apc.local\\APC\\APCBT\\S', mount: SDRIVE() },
]

export const UNC_EXTRA_SHARES = (): { prefix: string; mount: string }[] => [
  ...DEFAULT_EXTRA_SHARES.map(e => ({ prefix: e.prefix, mount: SDRIVE() })),
  ...(process.env.UNC_EXTRA_SHARES || '')
    .split(';')
    .map(pair => pair.trim())
    .filter(Boolean)
    .map(pair => {
      const idx = pair.lastIndexOf('=')
      if (idx < 0) return null
      const prefix = pair.slice(0, idx).trim()
      const mount = pair.slice(idx + 1).trim()
      return prefix && mount ? { prefix, mount } : null
    })
    .filter((v): v is { prefix: string; mount: string } => v !== null),
]

// ---------------------------------------------------------------------------
// Derived paths used by multiple features
// ---------------------------------------------------------------------------
export const ENGJOBS_PATH     = () => `${JDRIVE()}/APC EngJobs`
export const QC_FOLDERS_PATH  = (site: string) => `${SDRIVE()}/FrontEndQCFolders/${site}`
export const ATTDOCS_PATH     = () => `${SDRIVE()}/AttDocs/MfgParts`
// Export-controlled attachment tree. Separate from AttDocs on purpose — see the
// note on the file-serve whitelist below.
export const ITAR_ATTDOCS_PATH = () => `${SDRIVE()}/ItarAttDocs`
export const PACKSHIP_PATH    = () => `${TDRIVE()}/Packaging and Shipping/$Pack & Ship by Part`

/**
 * Certificate-of-conformance roots, one per site, on the L: drive.
 * Under each root the tree is:
 *     <root>/<Material Type>/<APC Part Number>/<PUR number> - LOT <lot>.pdf
 * e.g. L:\\NashuaScanDocStorage\\C_of_Cs_by_Part_Number\\Paradigm C of Cs\\
 *          Copper\\AL0100CU1OZ2532\\PUR0133783 - LOT 2507410115.pdf
 */
export const COC_ROOTS = (): { site: string; path: string }[] => [
  { site: 'Nashua', path: `${LDRIVE()}/NashuaScanDocStorage/C_of_Cs_by_Part_Number/Paradigm C of Cs` },
  { site: 'Mesa',   path: `${LDRIVE()}/MesaScanDocStorage/C_of_Cs_by_Part_Number/Paradigm C of Cs` },
  { site: 'Mexico', path: `${LDRIVE()}/MexicoDocStorage/C_of_Cs_by_Part_Number/Paradigm C of Cs` },
]

// EHS material-compliance evidence archive:
//   S:\FrontEndQCFolders\MtrlComp\{familyName}-{date}.pdf
// Sits under FrontEndQCFolders, which is already whitelisted for file-serve.
export const MTRL_COMP_PATH   = () => `${SDRIVE()}/FrontEndQCFolders/MtrlComp`

// Purchase-order certificate root. Single source of truth — lib/certs/poParser
// re-exports this as PO_ROOT, and it is whitelisted for the file-serve API below
// so PO certs can be previewed/downloaded the same way as other documents.
export const PO_CERT_PATH     = () =>
  process.env.PO_CERT_ROOT || `${SDRIVE()}/Quality/QCDept/PO`

// ---------------------------------------------------------------------------
// Allowed base paths for the file-serve API (security whitelist)
// ---------------------------------------------------------------------------
export const FILE_SERVE_ALLOWED_BASES = () => [
  `${SDRIVE()}/FrontEndQCFolders`,
  `${SDRIVE()}/AttDocs`,
  // ITAR-controlled attachments. Paradigm points at these from DATA0433 exactly
  // as it does ordinary attachments, so they have to be readable for the
  // Attachments tabs to work at all. NOTE: the file-serve API only checks that a
  // caller is signed in — it does not gate on role or export-control status.
  ITAR_ATTDOCS_PATH(),
  PO_CERT_PATH(),
  // Certificate-of-conformance archives (one per site). Whitelisted so the
  // shared preview modal — which always goes through /api/files/serve — can
  // open them; only these roots are exposed, not the whole L drive.
  ...COC_ROOTS().map(r => r.path),
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

  // Trim whitespace — Paradigm ERP pads fields with trailing spaces
  const trimmed = windowsPath.trim()
  if (!trimmed) return windowsPath

  // Normalize: forward slashes to backslashes
  const normalized = trimmed.replace(/\//g, '\\')

  // UNC path  \\APCFS04\SHARED2\rest  →  /mnt/sdrive/rest  (case-insensitive match)
  const uncPrefix = `\\\\${UNC_SERVER()}\\${UNC_SHARE()}`
  if (normalized.toLowerCase().startsWith(uncPrefix.toLowerCase())) {
    const rest = normalized.substring(uncPrefix.length).replace(/\\/g, '/')
    return `${SDRIVE()}${rest}`
  }

  // Any additional UNC roots configured via UNC_EXTRA_SHARES
  for (const extra of UNC_EXTRA_SHARES()) {
    const p = extra.prefix.replace(/\//g, '\\')
    if (normalized.toLowerCase().startsWith(p.toLowerCase())) {
      const rest = normalized.substring(p.length).replace(/\\/g, '/')
      return `${extra.mount}${rest.startsWith('/') ? '' : '/'}${rest}`
    }
  }

  // Drive letter  X:\rest  →  /mnt/xdrive/rest
  if (/^[A-Za-z]:\\/.test(normalized)) {
    const letter = normalized[0].toLowerCase()
    const rest = normalized.substring(3).replace(/\\/g, '/')
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
