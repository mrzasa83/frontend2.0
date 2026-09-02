import mysql from 'mysql2/promise'

// Secondary MySQL database ("Control Center" / amph_cc on apceng03).
// Holds LDI fiducial + polarity data used to build MDI XML.
const config = {
  host: process.env.DB_MYSQL_SECONDARY_HOST || '',
  port: parseInt(process.env.DB_MYSQL_SECONDARY_PORT || '3306'),
  database: process.env.DB_MYSQL_SECONDARY_DATABASE || '',
  user: process.env.DB_MYSQL_SECONDARY_USER || '',
  password: process.env.DB_MYSQL_SECONDARY_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
}

let pool: mysql.Pool | null = null

export function getSecondaryMySQLPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(config)
  }
  return pool
}

export async function querySecondaryMySQL<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    const connection = getSecondaryMySQLPool()
    const [rows] = await connection.execute(query, params)
    return rows as T[]
  } catch (error) {
    console.error('Secondary MySQL Query Error:', error)
    throw error
  }
}

export function isSecondaryConfigured(): boolean {
  return !!config.host && !!config.database && !!config.user
}
