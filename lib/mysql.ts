import mysql from 'mysql2/promise'

const config = {
  host: process.env.DB_MYSQL_PRIMARY_HOST || '',
  port: parseInt(process.env.DB_MYSQL_PRIMARY_PORT || '3306'),
  database: process.env.DB_MYSQL_PRIMARY_DATABASE || '',
  user: process.env.DB_MYSQL_PRIMARY_USER || '',
  password: process.env.DB_MYSQL_PRIMARY_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

let pool: mysql.Pool | null = null

export function getMySQLPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(config)
  }
  return pool
}

export async function queryMySQL<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    const connection = getMySQLPool()
    const [rows] = await connection.execute(query, params)
    return rows as T[]
  } catch (error) {
    console.error('MySQL Query Error:', error)
    throw error
  }
}

export async function logActivity(
  operator: string,
  workOrder: string,
  action: string,
  machine?: string,
  data?: any
): Promise<void> {
  try {
    const query = `
      INSERT INTO activity_log_mdi (operator, work_order, action, machine, data, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `
    await queryMySQL(query, [
      operator,
      workOrder,
      action,
      machine || null,
      data ? JSON.stringify(data) : null,
    ])
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw - logging failure shouldn't break the app
  }
}

/**
 * Get configuration value from config_mdi table
 */
export async function getConfig(system: string, key: string): Promise<any> {
  try {
    const query = `
      SELECT config_value FROM config_mdi 
      WHERE system = ? AND config_key = ?
    `
    const result = await queryMySQL<{ config_value: string }>(query, [system, key])
    
    if (result.length > 0) {
      // Parse JSON value
      return JSON.parse(result[0].config_value)
    }
    return null
  } catch (error) {
    console.error('Failed to get config:', error)
    return null
  }
}

/**
 * Set configuration value in config_mdi table
 */
export async function setConfig(
  system: string, 
  key: string, 
  value: any,
  updatedBy?: string
): Promise<boolean> {
  try {
    const query = `
      INSERT INTO config_mdi (system, config_key, config_value, updated_at, updated_by)
      VALUES (?, ?, ?, NOW(), ?)
      ON DUPLICATE KEY UPDATE 
        config_value = VALUES(config_value),
        updated_at = NOW(),
        updated_by = VALUES(updated_by)
    `
    await queryMySQL(query, [
      system,
      key,
      JSON.stringify(value),
      updatedBy || null
    ])
    return true
  } catch (error) {
    console.error('Failed to set config:', error)
    return false
  }
}

/**
 * Get all configuration for a system
 */
export async function getAllConfig(system: string): Promise<Record<string, any>> {
  try {
    const query = `
      SELECT config_key, config_value FROM config_mdi 
      WHERE system = ?
    `
    const results = await queryMySQL<{ config_key: string; config_value: string }>(query, [system])
    
    const config: Record<string, any> = {}
    for (const row of results) {
      config[row.config_key] = JSON.parse(row.config_value)
    }
    return config
  } catch (error) {
    console.error('Failed to get all config:', error)
    return {}
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (pool) {
    await pool.end()
  }
})
