import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { runSSHCommand } from '@/lib/ssh/runCommand'
import { decryptSecret, deriveAdUsername } from '@/lib/crypto/sessionSecret'

export const dynamic = 'force-dynamic'

const SSH_PORT = parseInt(process.env.CAD_SSH_PORT || '22', 10)
// Optional last-resort service account. Preferred path is per-user creds; these
// can be removed from .env.local once per-user auth is confirmed working.
const FALLBACK_USER = process.env.CAD_SSH_USER || ''
const FALLBACK_PASS = process.env.CAD_SSH_PASSWORD || ''

const REMOTE_CMD =
  'export LC_ALL=C; now=$(date +%s); ' +
  'who 2>/dev/null | while read -r u ln d t rest; do ' +
  'ep=$(date -d "$d $t" +%s 2>/dev/null || echo 0); ' +
  'echo "SESS|$u|$ep|$now"; done'

type UserInfo = { user: string; sessions: number; loggedInSecs: number }

function parse(output: string, excludeUser: string): UserInfo[] {
  const byUser: Record<string, { sessions: number; earliest: number; now: number }> = {}
  const exclude = (excludeUser || '').toLowerCase()

  for (const line of output.split('\n')) {
    const m = line.match(/^SESS\|(\S+)\|(\d+)\|(\d+)$/)
    if (!m) continue
    const user = m[1]
    const ep = parseInt(m[2], 10)
    const now = parseInt(m[3], 10)
    const lu = user.toLowerCase()
    if (lu === 'root' || (exclude && lu === exclude)) continue
    if (!byUser[user]) byUser[user] = { sessions: 0, earliest: Number.MAX_SAFE_INTEGER, now }
    byUser[user].sessions++
    if (ep > 0) byUser[user].earliest = Math.min(byUser[user].earliest, ep)
    byUser[user].now = now
  }

  return Object.entries(byUser).map(([user, v]) => ({
    user,
    sessions: v.sessions,
    loggedInSecs: v.earliest === Number.MAX_SAFE_INTEGER ? 0 : Math.max(0, v.now - v.earliest),
  })).sort((a, b) => b.loggedInSecs - a.loggedInSecs)
}

// Distinguish an auth failure (wrong creds -> prompt the user) from a host being
// down/unreachable (network/timeout -> just report unreachable).
function isAuthError(msg: string): boolean {
  return /auth|permission denied|password|credential|all configured authentication methods failed/i.test(msg || '')
}

async function resolveCredentials(request: NextRequest): Promise<
  | { ok: true; username: string; password: string; source: string }
  | { ok: false }
> {
  // 1. Manual AD creds supplied in the request body (used once, never stored)
  let body: any = null
  try { body = await request.json() } catch { /* GET or empty body */ }
  if (body?.adUsername && body?.adPassword) {
    return { ok: true, username: String(body.adUsername), password: String(body.adPassword), source: 'manual' }
  }

  // 2. Logged-in user's own credential from the encrypted token
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  const pass = decryptSecret((token as any)?.adSecret)
  if (token?.username && pass) {
    return { ok: true, username: deriveAdUsername(String(token.username)), password: pass, source: 'session' }
  }

  // 3. Optional service-account fallback
  if (FALLBACK_USER && FALLBACK_PASS) {
    return { ok: true, username: FALLBACK_USER, password: FALLBACK_PASS, source: 'env' }
  }

  return { ok: false }
}

async function handle(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('Admin')) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  const cred = await resolveCredentials(request)
  if (!cred.ok) {
    // No usable credential - ask the UI to collect AD username/password
    return NextResponse.json(
      { error: 'No credentials available', needsCredentials: true },
      { status: 401 }
    )
  }

  try {
    const machines = await queryPrimary(
      'SELECT id, hostname, label FROM cad_workstations WHERE enabled = 1 ORDER BY sort_order ASC, hostname ASC'
    ) as any[]

    let sawAuthError = false

    const results = await Promise.all((machines || []).map(async (m) => {
      try {
        const { stdout } = await runSSHCommand({
          host: m.hostname, port: SSH_PORT, username: cred.username, password: cred.password,
          command: REMOTE_CMD, timeoutMs: 10000,
        })
        const users = parse(stdout, cred.username)
        return { id: m.id, hostname: m.hostname, label: m.label, reachable: true, error: null, users, activeCount: users.length }
      } catch (e: any) {
        const msg = e?.message || String(e)
        if (isAuthError(msg)) sawAuthError = true
        return { id: m.id, hostname: m.hostname, label: m.label, reachable: false, error: msg, users: [], activeCount: 0 }
      }
    }))

    // If every machine failed and we saw an auth error, the credential itself is
    // bad - prompt for manual AD creds (unless they were already manual).
    const allFailed = results.length > 0 && results.every(r => !r.reachable)
    if (sawAuthError && allFailed && cred.source !== 'manual') {
      return NextResponse.json(
        { error: 'Authentication failed for your account on the workstations', needsCredentials: true, credSource: cred.source },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      machines: results,
      checkedAt: new Date().toISOString(),
      credSource: cred.source,
      credUser: cred.username,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed', details: String(e) }, { status: 500 })
  }
}

// GET: try session (or env) creds automatically.
export async function GET(request: NextRequest) { return handle(request) }
// POST: same, but the body may carry manual AD username/password.
export async function POST(request: NextRequest) { return handle(request) }
