import sql from 'mssql'

const config: sql.config = {
  server: process.env.DB_MSSQL_1_HOST || '',
  port: parseInt(process.env.DB_MSSQL_1_PORT || '1433'),
  database: process.env.DB_MSSQL_1_DATABASE || '',
  user: process.env.DB_MSSQL_1_USER || '',
  password: process.env.DB_MSSQL_1_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getMSSQLConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config)
  }
  return pool
}

export async function queryMSSQL<T = any>(query: string, params?: any): Promise<T[]> {
  try {
    const connection = await getMSSQLConnection()
    const request = connection.request()
    
    // Add parameters if provided
    if (params) {
      Object.keys(params).forEach((key) => {
        request.input(key, params[key])
      })
    }
    
    const result = await request.query(query)
    return result.recordset
  } catch (error) {
    console.error('MS SQL Query Error:', error)
    throw error
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (pool) {
    await pool.close()
  }
})
