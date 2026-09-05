import { promises as fs } from 'fs'
import path from 'path'
import { ENGJOBS_PATH } from '@/lib/config/drives'

/**
 * Where batch cards live, and what's in there.
 *
 * Job folders sit under APC EngJobs in range folders:
 *     APC EngJobs/12805-12810/12807 NORTHROP 433K009G01 -/
 * and the batch cards belong in a documents subfolder that differs by part
 * type — the same split the engineering folders already use:
 *
 *     Assembly / CCA        3. MFG Dwgs & Tools
 *     Connector             MFG Dwgs
 *     Piece Part            MFG Dwgs
 *     PCB                   3. MFG Documents (Impedance, ERF, Stackup)
 *
 * Generated cards go in a `_fe2` folder inside that, which keeps them apart
 * from the hand-maintained drawings — nothing this app writes can be confused
 * for something an engineer put there.
 *
 * Old cards aren't deleted on regeneration: they're renamed with a datestamp
 * into `_fe2/archive`, so the current set is obvious while the history stays
 * recoverable.
 */

export const FE2_FOLDER = '_fe2'
export const ARCHIVE_FOLDER = 'archive'

/** item_type_id: 1=PIE, 2=CON, 3=T_V, 4=CCA, 5=PCB */
export function docFolderForItemType(itemTypeId: number): string {
  switch (itemTypeId) {
    case 5: return '3. MFG Documents (Impedance, ERF, Stackup)'  // PCB
    case 4: return '3. MFG Dwgs & Tools'                          // CCA / assembly
    case 3: return '3. MFG Dwgs & Tools'                          // Test vehicle
    case 2: return 'MFG Dwgs'                                     // Connector
    default: return 'MFG Dwgs'                                    // Piece part
  }
}

/** Same rule as the part scanner, so folder choice matches part numbering. */
export function itemTypeFromPartNumber(partNumber: string): number {
  switch (String(partNumber ?? '').trim().charAt(0)) {
    case '0': return 3
    case '1': return 4
    case '3': return 2
    case '7': return 5
    case '9': return 1
    default: return 1
  }
}

const isRangeFolder = (n: string) => /^\d{5}-\d{5}$/.test(n)

/**
 * Find the job folder for a part. Folders are named "<apcPN> <customer> …",
 * and the range folder that contains it isn't derivable from the number alone
 * (ranges aren't uniformly sized), so the range folders are scanned.
 */
export async function findJobFolder(apcPart: string): Promise<string | null> {
  const part = String(apcPart ?? '').trim()
  if (!part) return null
  let ranges: string[] = []
  try {
    const entries = await fs.readdir(ENGJOBS_PATH(), { withFileTypes: true })
    ranges = entries.filter(e => e.isDirectory() && isRangeFolder(e.name)).map(e => e.name)
  } catch {
    return null
  }

  // Narrow to the range whose bounds contain the part, when it parses as a
  // number — avoids reading every range directory.
  const n = parseInt(part, 10)
  const ordered = isFinite(n)
    ? ranges.filter(r => {
        const [lo, hi] = r.split('-').map(v => parseInt(v, 10))
        return isFinite(lo) && isFinite(hi) && n >= lo && n <= hi
      }).concat(ranges)
    : ranges

  const seen = new Set<string>()
  for (const range of ordered) {
    if (seen.has(range)) continue
    seen.add(range)
    const rangePath = path.join(ENGJOBS_PATH(), range)
    try {
      const entries = await fs.readdir(rangePath, { withFileTypes: true })
      const hit = entries.find(e =>
        e.isDirectory() && new RegExp(`^${part}(\\s|$)`).test(e.name))
      if (hit) return path.join(rangePath, hit.name)
    } catch { /* unreadable range — keep looking */ }
  }
  return null
}

export type BatchCardFile = {
  name: string
  path: string
  size: number
  modified: string
  archived: boolean
  /** The INV_PART_NUMBER / part the card is for, taken from the file name. */
  part: string
  /** Datestamp appended when the file was archived, if any. */
  stamp: string
}

const ARCHIVE_STAMP_RE = /__(\d{8}-\d{6})(?=\.pdf$)/i

async function listPdfs(dir: string, archived: boolean): Promise<BatchCardFile[]> {
  let entries: any[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const out: BatchCardFile[] = []
  for (const e of entries) {
    if (!e.isFile() || !e.name.toLowerCase().endsWith('.pdf')) continue
    const full = path.join(dir, e.name)
    let size = 0, modified = ''
    try {
      const st = await fs.stat(full)
      size = st.size
      modified = st.mtime.toISOString()
    } catch { /* keep the entry regardless */ }
    const stamp = e.name.match(ARCHIVE_STAMP_RE)?.[1] || ''
    out.push({
      name: e.name,
      path: full,
      size,
      modified,
      archived,
      part: e.name.replace(ARCHIVE_STAMP_RE, '').replace(/\.pdf$/i, '').trim(),
      stamp,
    })
  }
  return out
}

export type BatchCardLocation = {
  apcPart: string
  jobFolder: string | null
  docFolder: string | null
  fe2Folder: string | null
  archiveFolder: string | null
  itemTypeId: number
  exists: boolean
  created: string[]     // folders created on this call
  writeError: string    // why creation failed, when it did
}

/**
 * Resolve (and optionally create) the folders for a part.
 * Folders are only created when asked — a read shouldn't leave directories
 * behind on the J drive as a side effect.
 */
export async function resolveBatchCardFolders(
  apcPart: string, create = false,
): Promise<BatchCardLocation> {
  const itemTypeId = itemTypeFromPartNumber(apcPart)
  const jobFolder = await findJobFolder(apcPart)
  const loc: BatchCardLocation = {
    apcPart, jobFolder, docFolder: null, fe2Folder: null, archiveFolder: null,
    itemTypeId, exists: false, created: [], writeError: '',
  }
  if (!jobFolder) return loc

  const docFolder = path.join(jobFolder, docFolderForItemType(itemTypeId))
  const fe2Folder = path.join(docFolder, FE2_FOLDER)
  const archiveFolder = path.join(fe2Folder, ARCHIVE_FOLDER)
  loc.docFolder = docFolder
  loc.fe2Folder = fe2Folder
  loc.archiveFolder = archiveFolder

  const ensure = async (dir: string) => {
    try {
      await fs.access(dir)
      return true
    } catch {
      if (!create) return false
      try {
        await fs.mkdir(dir, { recursive: true })
        loc.created.push(dir)
        return true
      } catch (e: any) {
        // Most likely the drive is mounted read-only. Record it: silently
        // returning false made a failed create look like "already present".
        loc.writeError = e?.code === 'EROFS' || e?.code === 'EACCES' || e?.code === 'EPERM'
          ? `Cannot write to the J drive (${e.code}). It is mounted read-only in the container — the mount needs to be read/write before batch cards can be created.`
          : `Could not create ${dir}: ${e?.message || String(e)}`
        return false
      }
    }
  }

  // The documents folder may legitimately be missing on older jobs — the brief
  // is to create it in the old format rather than fail.
  await ensure(docFolder)
  loc.exists = await ensure(fe2Folder)
  return loc
}

/** Current and archived cards for a part. */
export async function listBatchCards(apcPart: string): Promise<{
  location: BatchCardLocation
  current: BatchCardFile[]
  archived: BatchCardFile[]
}> {
  const location = await resolveBatchCardFolders(apcPart, false)
  if (!location.fe2Folder) return { location, current: [], archived: [] }
  const [current, archived] = await Promise.all([
    listPdfs(location.fe2Folder, false),
    listPdfs(location.archiveFolder!, true),
  ])
  const byPartThenName = (a: BatchCardFile, b: BatchCardFile) =>
    a.part.localeCompare(b.part) || b.modified.localeCompare(a.modified)
  return {
    location,
    current: current.sort(byPartThenName),
    archived: archived.sort((a, b) => b.modified.localeCompare(a.modified)),
  }
}

/** Datestamp used when archiving: 20260905-141530 */
export function archiveStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-` +
         `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}
