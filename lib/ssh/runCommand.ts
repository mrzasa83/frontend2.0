import { Client } from 'ssh2'

export type SSHResult = { stdout: string; stderr: string }

/**
 * Run a single command over SSH with password auth (AD service account).
 * Handles keyboard-interactive password prompts, enforces an overall timeout,
 * and always tears the connection down.
 */
export function runSSHCommand(opts: {
  host: string
  port: number
  username: string
  password: string
  command: string
  timeoutMs?: number
}): Promise<SSHResult> {
  const { host, port, username, password, command, timeoutMs = 10000 } = opts
  return new Promise((resolve, reject) => {
    const conn = new Client()
    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { conn.end() } catch { /* ignore */ }
      fn()
    }
    const timer = setTimeout(() => finish(() => reject(new Error('SSH timeout'))), timeoutMs)

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) return finish(() => reject(err))
        stream
          .on('close', () => finish(() => resolve({ stdout, stderr })))
          .on('data', (d: Buffer) => { stdout += d.toString() })
        stream.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
      })
    })

    // Some sshd configs require keyboard-interactive for passwords
    conn.on('keyboard-interactive', (_n, _i, _l, prompts, cb) => {
      cb(prompts.map(() => password))
    })

    conn.on('error', (e) => finish(() => reject(e)))

    conn.connect({
      host,
      port,
      username,
      password,
      readyTimeout: timeoutMs,
      tryKeyboard: true,
    })
  })
}
