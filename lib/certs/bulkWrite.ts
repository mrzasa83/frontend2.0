import { queryPrimary } from '@/lib/db/mysql-primary'

/**
 * Batched multi-row upsert.
 *
 * The index sweeps write tens of thousands of rows. Doing that one awaited
 * INSERT at a time is thousands of round trips, which holds the connection pool
 * long enough that ordinary page queries time out with PROTOCOL_SEQUENCE_TIMEOUT.
 * Batching cuts the round trips by two or three orders of magnitude, and the
 * pause between batches hands the pool back so reads stay responsive while a
 * background refresh is running.
 */

export const BATCH_SIZE = 200
const PAUSE_EVERY = 5          // batches
const PAUSE_MS = 25            // let other queries through

export async function bulkUpsert(
  table: string,
  columns: string[],
  rows: any[][],
  updateColumns: string[],
  batchSize = BATCH_SIZE,
): Promise<number> {
  if (!rows.length) return 0
  const colSql = columns.map(c => `\`${c}\``).join(', ')
  const updateSql = updateColumns.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ')
  const rowPlaceholder = `(${columns.map(() => '?').join(',')})`

  let written = 0
  let batchIndex = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const sql =
      `INSERT INTO ${table} (${colSql}) VALUES ${batch.map(() => rowPlaceholder).join(',')}` +
      (updateSql ? ` ON DUPLICATE KEY UPDATE ${updateSql}` : '')
    const params: any[] = []
    for (const r of batch) params.push(...r)
    try {
      await queryPrimary(sql, params)
      written += batch.length
    } catch (e) {
      // One bad batch shouldn't abandon the whole sweep — fall back to
      // per-row so the rest still lands, and skip only what's genuinely broken.
      for (const r of batch) {
        try {
          await queryPrimary(
            `INSERT INTO ${table} (${colSql}) VALUES ${rowPlaceholder}` +
            (updateSql ? ` ON DUPLICATE KEY UPDATE ${updateSql}` : ''), r
          )
          written++
        } catch { /* skip this row */ }
      }
    }
    if (++batchIndex % PAUSE_EVERY === 0) {
      await new Promise(res => setTimeout(res, PAUSE_MS))
    }
  }
  return written
}

/** Delete by id in batches, with the same courtesy pauses. */
export async function bulkDeleteIds(table: string, ids: number[], batchSize = 500): Promise<number> {
  let removed = 0
  let batchIndex = 0
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    try {
      await queryPrimary(
        `DELETE FROM ${table} WHERE id IN (${batch.map(() => '?').join(',')})`, batch
      )
      removed += batch.length
    } catch { /* skip this batch */ }
    if (++batchIndex % PAUSE_EVERY === 0) {
      await new Promise(res => setTimeout(res, PAUSE_MS))
    }
  }
  return removed
}
