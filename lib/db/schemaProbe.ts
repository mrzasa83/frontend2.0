import { queryPrimary } from '@/lib/db/mysql-primary'

/**
 * Does a column exist yet?
 *
 * Code and schema migrations don't land at the same instant: the app is
 * deployed, the ALTER is run by hand, and either can come first. Selecting a
 * column that doesn't exist yet fails the whole query with ER_BAD_FIELD_ERROR
 * and takes the page down, which is a bad trade for a feature the user hasn't
 * started using.
 *
 * Checking lets those queries degrade to the old shape until the migration is
 * applied. The answer is cached — schema doesn't change between requests, and
 * this shouldn't add a round trip to every query.
 */

const cache = new Map<string, boolean>()

export async function hasColumn(table: string, column: string): Promise<boolean> {
  const key = `${table}.${column}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  try {
    const rows = await queryPrimary<any[]>(
      `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [table, column]
    )
    const exists = Number(rows?.[0]?.n) > 0
    cache.set(key, exists)
    return exists
  } catch {
    // If we can't tell, assume it's absent — the fallback path always works.
    return false
  }
}

/** Forget cached answers, for use straight after running a migration. */
export function clearColumnCache(): void {
  cache.clear()
}
