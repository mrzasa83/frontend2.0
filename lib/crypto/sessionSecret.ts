import crypto from 'crypto'

/**
 * Symmetric encryption for the transient AD credential we carry in the session.
 *
 * We must reuse the plaintext password the user typed at login in order to SSH
 * to workstations as that user (bcrypt in the DB is one-way and cannot be
 * reversed). We therefore encrypt it at login and store the ciphertext in the
 * NextAuth JWT — which NextAuth additionally encrypts as a JWE. The key is
 * derived from CRED_ENC_KEY (preferred) or NEXTAUTH_SECRET so no new required
 * env var is introduced.
 *
 * Format: v1:<iv b64>:<authTag b64>:<ciphertext b64>
 */

const VERSION = 'v1'

function key(): Buffer {
  const secret = process.env.CRED_ENC_KEY || process.env.NEXTAUTH_SECRET || ''
  if (!secret) throw new Error('CRED_ENC_KEY / NEXTAUTH_SECRET not set')
  // Normalize any-length secret to a 32-byte key
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`
}

export function decryptSecret(blob: string | undefined | null): string | null {
  if (!blob) return null
  try {
    const [v, ivb, tagb, ctb] = blob.split(':')
    if (v !== VERSION) return null
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivb, 'base64'))
    decipher.setAuthTag(Buffer.from(tagb, 'base64'))
    const pt = Buffer.concat([decipher.update(Buffer.from(ctb, 'base64')), decipher.final()])
    return pt.toString('utf8')
  } catch {
    return null
  }
}

/**
 * Derive the AD / Linux login name from an app username or display name.
 * Rule: first initial + last name, lowercased (e.g. "michael.rzasa" or
 * "Michael Rzasa" -> "mrzasa"). If the value is already a single token with no
 * separator (already "mrzasa"), it is returned lowercased as-is.
 */
export function deriveAdUsername(usernameOrName: string): string {
  const raw = (usernameOrName || '').trim()
  if (!raw) return ''
  const parts = raw.split(/[.\s_]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1]).toLowerCase()
  }
  return raw.toLowerCase()
}
