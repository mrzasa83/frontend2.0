import { queryPrimary } from '@/lib/db/mysql-primary'

/**
 * Freshness control for the file-system indexes.
 *
 * Both PO archives are big enough that walking them on every page load isn't an
 * option, and neither changes minute to minute. So each index records when it
 * last completed, and a read checks that timestamp: if the index is older than
 * the refresh window, a rebuild is started IN THE BACKGROUND and the caller
 * still gets an immediate answer from whatever is already indexed.
 *
 * The running flag keeps two concurrent readers from launching the same walk
 * twice, and a stale-running guard means a crashed run can't wedge the index
 * permanently.
 */

export const REFRESH_WINDOW_MS = 60 * 60 * 1000        // one hour
const STALE_RUNNING_MS = 30 * 60 * 1000                // a run older than this is presumed dead

export type IndexState = {
  index_name: string
  last_started: string | null
  last_finished: string | null
  running: number
  last_count: number
  last_status: string
  last_message: string
}

export async function getIndexState(name: string): Promise<IndexState | null> {
  try {
    const rows = await queryPrimary<any[]>(
      `SELECT index_name, last_started, last_finished, running, last_count, last_status, last_message
       FROM index_state WHERE index_name = ? LIMIT 1`, [name]
    )
    return rows?.[0] || null
  } catch {
    return null   // table not created yet — treat as "no state"
  }
}

/** Is the index older than the window (or never built)? */
export function isStale(state: IndexState | null, windowMs = REFRESH_WINDOW_MS): boolean {
  if (!state || !state.last_finished) return true
  const finished = new Date(state.last_finished).getTime()
  if (!isFinite(finished)) return true
  return Date.now() - finished > windowMs
}

/**
 * Claim the right to run. Returns false when another run already holds it,
 * unless that run looks abandoned.
 */
export async function claimRun(name: string): Promise<boolean> {
  try {
    const state = await getIndexState(name)
    if (state?.running) {
      const started = state.last_started ? new Date(state.last_started).getTime() : 0
      const abandoned = !started || (Date.now() - started > STALE_RUNNING_MS)
      if (!abandoned) return false
    }
    await queryPrimary(
      `INSERT INTO index_state (index_name, last_started, running, last_status)
       VALUES (?, NOW(), 1, 'running')
       ON DUPLICATE KEY UPDATE last_started = NOW(), running = 1, last_status = 'running'`,
      [name]
    )
    return true
  } catch {
    return false
  }
}

export async function finishRun(
  name: string, count: number, status: 'ok' | 'partial' | 'error', message = '',
): Promise<void> {
  try {
    await queryPrimary(
      `INSERT INTO index_state (index_name, last_finished, running, last_count, last_status, last_message)
       VALUES (?, NOW(), 0, ?, ?, ?)
       ON DUPLICATE KEY UPDATE last_finished = NOW(), running = 0,
         last_count = VALUES(last_count), last_status = VALUES(last_status),
         last_message = VALUES(last_message)`,
      [name, count, status, String(message).slice(0, 1000)]
    )
  } catch { /* freshness tracking is best-effort */ }
}

/**
 * Kick a rebuild off in the background when the index has gone stale.
 *
 * Deliberately fire-and-forget: the caller's response must not wait on a
 * filesystem walk. Errors are swallowed into the index_state row rather than
 * surfacing as a failed page load — a stale list is much better than no list.
 */
export function refreshIfStale(
  name: string,
  rebuild: () => Promise<{ count: number; status: 'ok' | 'partial'; message?: string }>,
  windowMs = REFRESH_WINDOW_MS,
): void {
  void (async () => {
    try {
      const state = await getIndexState(name)
      if (!isStale(state, windowMs)) return
      if (!(await claimRun(name))) return
      try {
        const r = await rebuild()
        await finishRun(name, r.count, r.status, r.message || '')
      } catch (e) {
        await finishRun(name, 0, 'error', e instanceof Error ? e.message : String(e))
      }
    } catch { /* never let background refresh break the request */ }
  })()
}
