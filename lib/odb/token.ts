/**
 * Short-lived, scoped fetch tokens for the DataView acquire script.
 *
 * The acquire script runs in PowerShell, not the browser, so it has no session
 * cookie. Rather than let it authenticate as the user, each generated script
 * carries one token that:
 *   - names the user it was minted for (so downloads stay attributable),
 *   - lists exactly the files that script was built for, so a leaked token
 *     cannot be turned into a reader for the whole archive, and
 *   - expires, so a script left in Downloads stops working.
 *
 * HMAC-SHA256 over the payload with NEXTAUTH_SECRET. No new env var, no
 * database table, nothing to clean up — this is a proof of concept, and a
 * stateless token is the part of it least likely to need unwinding later.
 */

import crypto from 'crypto'
import type { DataType } from './archive'

export type FetchItem = { job: string; type: DataType; rev: string }

type Payload = {
  /** Username, for the download log line. */
  u: string
  /** Expiry, epoch seconds. */
  exp: number
  /** Allowed files, as "job|TYPE|rev" to keep the token compact. */
  f: string[]
}

const TTL_SECONDS = Number(process.env.ODB_TOKEN_TTL_SECONDS || 3600)

function secret(): Buffer {
  const s = process.env.ODB_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || ''
  if (!s) throw new Error('NEXTAUTH_SECRET is not set; cannot sign fetch tokens')
  return crypto.createHash('sha256').update(s).digest()
}

const b64u = (b: Buffer) => b.toString('base64url')

function sign(body: string): string {
  return b64u(crypto.createHmac('sha256', secret()).update(body).digest())
}

export const itemKey = (i: FetchItem) => `${i.job}|${i.type}|${i.rev}`

export function mintFetchToken(user: string, items: FetchItem[]): {
  token: string; expiresAt: Date
} {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS
  const payload: Payload = { u: user, exp, f: items.map(itemKey) }
  const body = b64u(Buffer.from(JSON.stringify(payload), 'utf8'))
  return { token: `${body}.${sign(body)}`, expiresAt: new Date(exp * 1000) }
}

/**
 * Verify a token and confirm it covers this particular file.
 * Returns the username on success, or null for any failure — an invalid
 * signature, an expired token and a file the token doesn't cover are all the
 * same answer to the caller, which is 403.
 */
export function verifyFetchToken(token: string, item: FetchItem): string | null {
  try {
    const [body, mac] = String(token || '').split('.')
    if (!body || !mac) return null
    const expected = sign(body)
    // Lengths match by construction, but a mismatched length would make
    // timingSafeEqual throw rather than return false.
    if (mac.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null

    const p: Payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!p || typeof p.exp !== 'number' || p.exp < Math.floor(Date.now() / 1000)) return null
    if (!Array.isArray(p.f) || !p.f.includes(itemKey(item))) return null
    return String(p.u || '')
  } catch {
    return null
  }
}
