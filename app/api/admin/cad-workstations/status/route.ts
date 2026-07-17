import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { runSSHCommand } from '@/lib/ssh/runCommand'

export const dynamic = 'force-dynamic'

const SSH_USER = process.env.CAD_SSH_USER || ''
const SSH_PASS = process.env.CAD_SSH_PASSWORD || ''
const SSH_PORT = parseInt(process.env.CAD_SSH_PORT || '22', 10)

// Emit one "SESS|user|loginEpoch|nowEpoch" line per login session. `who`
// includes local AND ssh logins. Login epoch is computed on the remote host
// (its own clock/timezone) so durations are correct regardless of container TZ.
const REMOTE_CMD =
  'export LC_ALL=C; now=$(date +%s); ' +
  'who 2>/dev/null | while read -r u ln d t rest; do ' +
  'ep=$(date -d "$d $t" +%s 2>/dev/null || echo 0); ' +
  'echo "SESS|$u|$ep|$now"; done'

type UserInfo = {
  user: string
  sessions: number
  loggedInSecs: number   // duration since earliest active session
}

function parse(output: string, excludeUser: string): UserInfo[] {
  const byUser: Record<string, { sessions: number; earliest: number; now: number }> = {}
  const exclude = excludeUser.toLowerCase()

  for (const line of output.split('\n')) {
    const m = line.match(/^SESS\|(\S+)\|(\d+)\|(\d+)$/)
    if (!m) continue
    const user = m[1]
    const ep = parseInt(m[2], 10)
    const now = parseInt(m[3], 10)
    const lu = user.toLowerCase()
    if (lu === 'root' || lu === exclude) continue     // skip root + service acct
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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('Admin')) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }
  if (!SSH_USER || !SSH_PASS) {
    return NextResponse.json({ error: 'CAD_SSH_USER / CAD_SSH_PASSWORD are not configured' }, { status: 500 })
  }

  try {
    const machines = await queryPrimary(
      'SELECT id, hostname, label FROM cad_workstations WHERE enabled = 1 ORDER BY sort_order ASC, hostname ASC'
    ) as any[]

    const results = await Promise.all((machines || []).map(async (m) => {
      try {
        const { stdout } = await runSSHCommand({
          host: m.hostname, port: SSH_PORT, username: SSH_USER, password: SSH_PASS,
          command: REMOTE_CMD, timeoutMs: 10000,
        })
        const users = parse(stdout, SSH_USER)
        return { id: m.id, hostname: m.hostname, label: m.label, reachable: true, error: null, users, activeCount: users.length }
      } catch (e: any) {
        return { id: m.id, hostname: m.hostname, label: m.label, reachable: false, error: e?.message || String(e), users: [], activeCount: 0 }
      }
    }))

    return NextResponse.json({ success: true, machines: results, checkedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ error: 'Failed', details: String(e) }, { status: 500 })
  }
}
