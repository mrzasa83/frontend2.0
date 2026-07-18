import crypto from 'crypto'

// Reversible encryption for stored settings (e.g. the delete-FAI password so it
// can be revealed in System Settings). Keyed off NEXTAUTH_SECRET from .env.local
// so no extra secret is needed.
const SECRET = process.env.NEXTAUTH_SECRET || process.env.SETTINGS_ENC_KEY || 'dev-only-insecure-key'
const KEY = crypto.scryptSync(SECRET, 'fai-settings-v1', 32)

export function encryptSetting(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function decryptSetting(stored: string): string {
  try {
    const [ivHex, tagHex, dataHex] = stored.split(':')
    if (!ivHex || !tagHex || !dataHex) return ''
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
    return dec.toString('utf8')
  } catch {
    return ''
  }
}
