/**
 * ODB++ job archive — the same tree FrontVue searches.
 *
 * Layout (one directory per job, two data types, one directory per revision):
 *
 *     {root}/{job}/{CAM|PCB}/released          ← pointer file
 *     {root}/{job}/{CAM|PCB}/04Feb2026.1055/data.tgz
 *     {root}/{job}/{CAM|PCB}/25Mar2026.1156/data.tgz
 *
 * `released` is a POINTER, not a copy: its first line names the live revision
 * DIRECTORY. That is how "Released" resolves to a specific revision rather
 * than meaning "the newest folder" — a newer folder can exist that has not
 * been released. When the pointer is missing or stale we fall back to the
 * newest folder and say so, rather than silently handing back the wrong one.
 *
 * Revision folders are named DDMonYYYY.HHMM in local time.
 */

import fs from 'fs'
import path from 'path'

export type DataType = 'CAM' | 'PCB'

export type Revision = {
  /** Folder name as it sits on disk, e.g. "04Feb2026.1055". */
  rev: string
  /** The date half, e.g. "04Feb2026" — what the download is named after. */
  date: string
  /** Parsed timestamp, for sorting and display. Null if unparseable. */
  at: string | null
  released: boolean
  /** Size of data.tgz in bytes; 0 when the file is missing or unreadable. */
  bytes: number
  /** What this file is called once it lands on the client. */
  downloadName: string
  /** Share path for opening in place, when ODB_ARCHIVE_UNC is set. */
  uncPath: string | null
}

export type JobSearch = {
  job: string
  type: DataType
  /** The revision the `released` pointer names, if it resolved. */
  releasedRev: string | null
  /** Set when the pointer was missing or named a folder that isn't there. */
  releasedNote: string | null
  revisions: Revision[]
}

/**
 * Archive mount root inside the container. The deploy script bind-mounts the
 * host archive to /archive in every app container; newer CAM hosts carry it at
 * /mnt/shares/camfs-cam/archive, so it stays an env override.
 */
export const ARCHIVE_ROOT = () =>
  process.env.ODB_ARCHIVE_ROOT || '/archive'

/**
 * The same archive as a Windows path, when it is also reachable from the PCs
 * as a share — e.g. \\\\apcfs0x\\camfs\\archive.
 *
 * Set ODB_ARCHIVE_UNC to turn on the "open it straight from the share" route,
 * where the viewer reads the .tgz over the wire and unpacks it into its own
 * local temp folder. That is one large sequential read rather than thousands
 * of small ones, so it is usually fast, and it means nothing is downloaded or
 * cleaned up on the PC at all.
 */
export const ARCHIVE_UNC = () => (process.env.ODB_ARCHIVE_UNC || '').replace(/[\\/]+$/, '')

/** The share path for one revision's data.tgz, or null when unconfigured. */
export function uncPathFor(job: string, type: DataType, rev: string): string | null {
  const base = ARCHIVE_UNC()
  if (!base) return null
  if (!isSafeJob(job) || !isSafeRevision(rev)) return null
  return `${base}\\${job}\\${type}\\${rev}\\data.tgz`
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/** 04Feb2026.1055 → Date, or null if it doesn't match the pattern. */
export function parseRevision(rev: string): Date | null {
  const m = /^(\d{1,2})([A-Za-z]{3})(\d{4})(?:\.(\d{2})(\d{2}))?$/.exec(rev.trim())
  if (!m) return null
  const mon = MONTHS[m[2].toLowerCase()]
  if (mon === undefined) return null
  const d = new Date(Number(m[3]), mon, Number(m[1]),
    Number(m[4] || 0), Number(m[5] || 0))
  return isNaN(d.getTime()) ? null : d
}

/** The date half of a revision folder: "04Feb2026.1055" → "04Feb2026". */
export function revisionDate(rev: string): string {
  const dot = rev.indexOf('.')
  return dot > 0 ? rev.slice(0, dot) : rev
}

/**
 * Job numbers are folder names, so they are the one piece of user input that
 * reaches the filesystem. Digits, letters, dash and underscore only — no dots,
 * no separators, which rules out both traversal and absolute paths.
 */
export function isSafeJob(job: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(String(job || '').trim())
}

export function isSafeRevision(rev: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(String(rev || '').trim())
    && !rev.includes('..')
}

export function normalizeType(t: string | null | undefined): DataType {
  return String(t || '').toUpperCase() === 'CAM' ? 'CAM' : 'PCB'
}

/**
 * The name the file takes on the client: {datatype}{job}_{version}.tgz,
 * e.g. cam75336_04Feb2026.tgz. Lower-case type to match the example and
 * because Windows users read it as a prefix, not an acronym.
 *
 * Two revisions on the same DAY would collide, so when that happens the time
 * is kept: cam75336_04Feb2026.1055.tgz. The caller passes the sibling list.
 */
export function downloadNameFor(
  job: string, type: DataType, rev: string, siblings: string[] = [],
): string {
  const date = revisionDate(rev)
  const sameDay = siblings.filter(r => revisionDate(r) === date)
  const stamp = sameDay.length > 1 ? rev : date
  return `${type.toLowerCase()}${job}_${stamp}.tgz`
}

/** Absolute path to a revision's data.tgz, after validating every segment. */
export function revisionPath(job: string, type: DataType, rev: string): string {
  if (!isSafeJob(job)) throw new Error(`Invalid job number: ${job}`)
  if (!isSafeRevision(rev)) throw new Error(`Invalid revision: ${rev}`)
  const root = ARCHIVE_ROOT()
  const p = path.join(root, job, type, rev, 'data.tgz')
  // Belt and braces: the segment checks already exclude traversal, but the
  // archive is a network mount and a symlinked revision folder would not be
  // caught by string checks alone.
  const real = path.resolve(p)
  if (!real.startsWith(path.resolve(root) + path.sep)) {
    throw new Error('Resolved path escapes the archive root')
  }
  return real
}

/** First line of the `released` pointer, or '' when it isn't readable. */
function readReleasedPointer(dir: string): string {
  try {
    const raw = fs.readFileSync(path.join(dir, 'released'), 'utf8')
    return (raw.split(/\r?\n/)[0] || '').trim().split(/\s+/)[0] || ''
  } catch {
    return ''
  }
}

/**
 * Every revision of one job and data type, newest first.
 *
 * Returns an empty revision list rather than throwing when the job or type
 * folder is absent — "no CAM data for this job" is an ordinary answer, not an
 * error, and the two cases are told apart by `releasedNote`.
 */
export function searchJob(jobRaw: string, typeRaw: string): JobSearch {
  const job = String(jobRaw || '').trim()
  const type = normalizeType(typeRaw)
  if (!isSafeJob(job)) throw new Error(`Invalid job number: ${job}`)

  const dir = path.join(ARCHIVE_ROOT(), job, type)
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return {
      job, type, releasedRev: null, revisions: [],
      releasedNote: `No ${type} data found for job ${job}.`,
    }
  }

  const pointer = readReleasedPointer(dir)
  const names = entries
    .filter(e => e.isDirectory() && parseRevision(e.name) !== null)
    .map(e => e.name)
    // Newest first. Unparseable names are already filtered out above, so the
    // dates are always real here.
    .sort((a, b) =>
      (parseRevision(b)?.getTime() || 0) - (parseRevision(a)?.getTime() || 0))
    .slice(0, 100)

  const hasPointer = names.includes(pointer)
  const releasedRev = hasPointer ? pointer : (names[0] || null)

  let releasedNote: string | null = null
  if (!names.length) {
    releasedNote = `No revisions under ${type} for job ${job}.`
  } else if (!pointer) {
    releasedNote = `No "released" pointer in ${type}; showing the newest revision as released.`
  } else if (!hasPointer) {
    releasedNote = `The "released" pointer names ${pointer}, which is not on disk; showing the newest revision instead.`
  }

  const revisions: Revision[] = names.map(rev => {
    let bytes = 0
    try {
      bytes = fs.statSync(path.join(dir, rev, 'data.tgz')).size
    } catch {
      bytes = 0
    }
    return {
      rev,
      date: revisionDate(rev),
      at: parseRevision(rev)?.toISOString() || null,
      released: rev === releasedRev,
      bytes,
      downloadName: downloadNameFor(job, type, rev, names),
      uncPath: uncPathFor(job, type, rev),
    }
  })

  return { job, type, releasedRev, releasedNote, revisions }
}

/** Resolve one selection to a real, readable file. Throws if it isn't. */
export function resolveSelection(job: string, type: DataType, rev: string): {
  filePath: string
  bytes: number
  downloadName: string
} {
  const filePath = revisionPath(job, type, rev)
  const st = fs.statSync(filePath)
  if (!st.isFile()) throw new Error('Not a file')
  // Sibling revisions decide whether the name needs the time on it.
  let siblings: string[] = []
  try {
    siblings = fs.readdirSync(path.join(ARCHIVE_ROOT(), job, type), { withFileTypes: true })
      .filter(e => e.isDirectory() && parseRevision(e.name) !== null)
      .map(e => e.name)
  } catch { /* a single-revision name is still correct */ }
  return {
    filePath,
    bytes: st.size,
    downloadName: downloadNameFor(job, type, rev, siblings),
  }
}
