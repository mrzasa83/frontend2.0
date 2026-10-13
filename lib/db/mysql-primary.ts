import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getMySQLPrimaryPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_MYSQL_PRIMARY_HOST,
      port: parseInt(process.env.DB_MYSQL_PRIMARY_PORT || '3306'),
      user: process.env.DB_MYSQL_PRIMARY_USER,
      password: process.env.DB_MYSQL_PRIMARY_PASSWORD,
      database: process.env.DB_MYSQL_PRIMARY_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 10000,
      // Recycle idle sockets before a firewall/NAT idle-reaper silently drops
      // them. A dropped-but-pooled socket is what surfaces as a fatal
      // `read ETIMEDOUT` on the *next* query that happens to reuse it.
      idleTimeout: 60000,   // close idle connections after 60s
      maxIdle: 10,
    })
  }
  return pool
}

// Per-query ceiling so a hung read fails fast with a clear message instead of
// blocking on the OS TCP read timeout (~110s, errno -110).
const QUERY_TIMEOUT_MS = parseInt(process.env.DB_MYSQL_PRIMARY_QUERY_TIMEOUT_MS || '15000', 10)

// Error codes that mean "the pooled connection was dead" rather than "your SQL
// or data is bad". These are safe to retry once on a fresh connection.
const RETRYABLE = new Set([
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
  'ECONNRESET',
  'EPIPE',
  'PROTOCOL_SEQUENCE_TIMEOUT',
])

function isRetryable(err: any): boolean {
  const code = err?.code || ''
  // `fatal` connection errors from mysql2 carry one of the codes above.
  return RETRYABLE.has(code) || (err?.fatal === true && /timeout|reset|lost|pipe/i.test(err?.message || ''))
}

/**
 * One-shot check that this process and MySQL agree about the clock.
 *
 * mysql2 is given no `timezone` option, so it builds JS Dates from MySQL's
 * wall-clock strings using THIS process's zone. If the two disagree, every
 * timestamp the app reads is silently off by the difference — four hours, in
 * the case this was written for, with nothing in the logs to say so.
 *
 * The real fix is the TZ environment variable on the container (see the
 * Dockerfile). This exists so that a deploy which forgets it says so loudly
 * instead of quietly serving wrong times. Logged once, never throws, and
 * never blocks a query: a clock warning is not worth failing a request over.
 */
let tzChecked = false
async function warnOnTimezoneSkew(pool: mysql.Pool): Promise<void> {
  if (tzChecked) return
  tzChecked = true
  try {
    const [rows]: any = await pool.query(
      'SELECT TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), NOW()) AS mysqlOffset, @@system_time_zone AS systemTZ')
    const mysqlOffset = Number(rows?.[0]?.mysqlOffset)
    const nodeOffset = -new Date().getTimezoneOffset()
    if (Number.isFinite(mysqlOffset) && mysqlOffset !== nodeOffset) {
      console.warn(
        `[mysql-primary] TIMEZONE MISMATCH: Node is ${nodeOffset / 60}h from UTC `
        + `(TZ=${process.env.TZ || 'unset'}, ${Intl.DateTimeFormat().resolvedOptions().timeZone}) `
        + `but MySQL is ${mysqlOffset / 60}h (@@system_time_zone=${rows?.[0]?.systemTZ}). `
        + `Every timestamp read through this pool is off by ${(nodeOffset - mysqlOffset) / 60}h. `
        + `Set TZ on the app container to match the database host.`)
    }
  } catch {
    // A failed probe tells us nothing; it must not affect the query that
    // triggered it.
  }
}

export async function queryPrimary<T = any>(
  sql: string,
  params?: any[],
  timeoutMs?: number,
): Promise<T> {
  const pool = getMySQLPrimaryPool()
  void warnOnTimezoneSkew(pool)

  // Note: the per-query `timeout` option applies to pool.query (text protocol),
  // not pool.execute (binary prepared protocol). Parameters are still bound and
  // escaped safely by mysql2, so injection safety is unchanged.
  const run = async (): Promise<T> => {
    const [rows] = await pool.query({ sql, values: params, timeout: timeoutMs ?? QUERY_TIMEOUT_MS } as any)
    return rows as T
  }

  try {
    return await run()
  } catch (err: any) {
    if (isRetryable(err)) {
      // The connection we drew from the pool was stale/half-open. mysql2 has
      // already discarded it (fatal), so a second attempt draws a fresh one.
      console.warn(`queryPrimary: retrying after ${err.code || 'fatal'} (stale pooled connection)`)
      return await run()
    }
    throw err
  }
}

// Test connection
export async function testMySQLPrimaryConnection() {
  try {
    const pool = getMySQLPrimaryPool()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    return { success: true, message: 'MySQL Primary connected' }
  } catch (error) {
    return { success: false, message: `MySQL Primary error: ${error}` }
  }
}

// At the end of mysql-primary.ts
export async function getUsers() {
  return queryPrimary<any[]>(
    `SELECT 
      id,
      username,
      name,
      email,
      nickname,
      phone,
      mobile,
      title,
      role,
      active
    FROM Users 
    WHERE active = 1
    ORDER BY name ASC`
  )
}
