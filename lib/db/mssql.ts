import sql from 'mssql'

// Connection pools
const pools: { [key: string]: sql.ConnectionPool } = {}

export interface MSSQLConfig {
  name: string
  host: string
  port: number
  user: string
  password: string
  database: string
}

export function getMSSQLConfig(name: string): MSSQLConfig | null {
  const host = process.env[`DB_MSSQL_${name}_HOST`]
  const port = process.env[`DB_MSSQL_${name}_PORT`]
  const user = process.env[`DB_MSSQL_${name}_USER`]
  const password = process.env[`DB_MSSQL_${name}_PASSWORD`]
  const database = process.env[`DB_MSSQL_${name}_DATABASE`]

  if (!host || !user || !password || !database) {
    return null
  }

  return {
    name,
    host,
    port: parseInt(port || '1433'),
    user,
    password, // Password will be used directly, not in connection string
    database
  }
}

export async function getMSSQLPool(name: string): Promise<sql.ConnectionPool> {
  if (pools[name]) {
    return pools[name]
  }

  const config = getMSSQLConfig(name)
  if (!config) {
    throw new Error(`MSSQL configuration not found for: ${name}`)
  }

  const pool = new sql.ConnectionPool({
    server: config.host,
    port: config.port,
    user: config.user,
    password: config.password, // Pass password directly as string
    database: config.database,
    // The baseline every query gets unless it asks for more. Stated rather
    // than inherited from the driver, so the number that produced an ETIMEOUT
    // is findable in this file.
    requestTimeout: MSSQL_DEFAULT_TIMEOUT_MS,
    options: {
      encrypt: false, // Set to true if using Azure
      trustServerCertificate: true,
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  })

  await pool.connect()
  pools[name] = pool
  return pool
}

/**
 * Default ceiling on a single Paradigm query.
 *
 * mssql's own default is 15s, which is what a traceability report on a deep
 * assembly was hitting — the same report takes well over that to print from
 * Paradigm itself, so the query is slow rather than stuck. Named here so the
 * limit is visible, and overridable per call for the handful of reports that
 * are legitimately long-running.
 */
export const MSSQL_DEFAULT_TIMEOUT_MS =
  parseInt(process.env.DB_MSSQL_QUERY_TIMEOUT_MS || '15000', 10)

/** The longest any single query may be given, however it is asked for. */
export const MSSQL_MAX_TIMEOUT_MS =
  parseInt(process.env.DB_MSSQL_MAX_QUERY_TIMEOUT_MS || '60000', 10)

/** Clamp a requested timeout into the allowed range. */
export function clampMSSQLTimeout(ms: unknown): number {
  const n = Number(ms)
  if (!Number.isFinite(n) || n <= 0) return MSSQL_DEFAULT_TIMEOUT_MS
  return Math.min(Math.max(Math.round(n), MSSQL_DEFAULT_TIMEOUT_MS), MSSQL_MAX_TIMEOUT_MS)
}

export async function queryMSSQL<T = any>(
  name: string,
  query: string,
  params?: { [key: string]: any },
  timeoutMs?: number,
): Promise<T> {
  const pool = await getMSSQLPool(name)

  /**
   * Per-request, not per-pool. A long ceiling on the pool would apply to every
   * caller, so one genuinely stuck query anywhere would hold a connection for
   * a minute; only the caller that knows its report is slow raises it.
   *
   * node-mssql takes this as a constructor override — pool.request(conf) —
   * which tedious applies with req.setTimeout(). There is no settable
   * `timeout` property on Request, so assigning one compiles and does
   * nothing.
   */
  // The cast is on the METHOD: node-mssql's typings declare request() with no
  // arguments, while the implementation passes conf straight to the Request
  // constructor. Verified against mssql 12.7.0.
  const request = (pool.request as any)(
    { requestTimeout: clampMSSQLTimeout(timeoutMs) }) as sql.Request

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value)
    })
  }

  // Read-only reporting path against Paradigm/Engenix: read uncommitted so we
  // never take shared locks that could block production writers. Applied at the
  // batch level, this covers every table in the query — all JOINs and
  // subqueries — equivalent to WITH (NOLOCK) on each, but without editing SQL.
  // Set per batch so a pooled connection is never left in this state for a
  // subsequent caller. NOTE: writes go through executeMSSQL, which is
  // deliberately left at the default (committed) isolation.
  const result = await request.query(
    `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\n${query}`
  )
  return result.recordset as T
}

// Execute an UPDATE/INSERT/DELETE (returns rowsAffected)
export async function executeMSSQL(
  name: string,
  query: string,
  params?: { [key: string]: any }
): Promise<number> {
  const pool = await getMSSQLPool(name)
  const request = pool.request()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value)
    })
  }

  const result = await request.query(query)
  return result.rowsAffected.reduce((a, b) => a + b, 0)
}

// Test connection
export async function testMSSQLConnection(name: string) {
  try {
    const pool = await getMSSQLPool(name)
    await pool.query('SELECT 1 as test')
    return { success: true, message: `MSSQL ${name} connected` }
  } catch (error) {
    return { success: false, message: `MSSQL ${name} error: ${error}` }
  }
}

