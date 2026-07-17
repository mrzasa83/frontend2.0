import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import { runSSHCommand } from '@/lib/ssh/runCommand'

export const dynamic = 'force-dynamic'

const SSH_USER = process.env.CAD_SSH_USER || ''
const SSH_PASS = process.env.CAD_SSH_PASSWORD || ''
const SSH_PORT = parseInt(process.env.CAD_SSH_PORT || '22', 10)

// One round trip per host: who is logged in + a full process list (uid/user/
// elapsed-seconds/command). We filter to real users (uid >= 1000) app-side.
const REMOTE_CMD =
  "who 2>/dev/null; echo '===PS==='; ps -eo uid=,user=,etimes=,comm= --no-headers 2>/dev/null"

type UserInfo = {
  user: string
  processCount: number
  oldestSecs: number
  newestSecs: number
  loggedIn: boolean
}

function parse(output: string) {
  const [whoPart, psPart = ''] = output.split('===PS===')

  // Login sessions (who): first token of each line is the user
  const loggedInUsers = new Set<string>()
  for (const line of whoPart.split('\n')) {
    const u = line.trim().split(/\s+/)[0]
    if (u && u.toLowerCase() !== 'root') loggedInUsers.add(u)
  }

  // Processes: keep real users (uid >= 1000), group by user
  const byUser: Record<string, { count: number; oldest: number; newest: number }> = {}
  for (const line of psPart.split('\n')) {
    const m = line.match(/^\s*(\d+)\s+(\S+)\s+(\d+)\s+(.*)$/)
    if (!m) continue
    const uid = parseInt(m[1], 10)
    const user = m[2]
    const etimes = parseInt(m[3], 10)
    if (uid < 1000 || user.toLowerCase() === 'root') continue
    if (!byUser[user]) byUser[user] = { count: 0, oldest: 0, newest: Number.MAX_SAFE_INTEGER }
    byUser[user].count++
    byUser[user].oldest = Math.max(byUser[user].oldest, etimes)
    byUser[user].newest = Math.min(byUser[user].newest, etimes)
  }

  const allUsers = new Set<string>([...loggedInUsers, ...Object.keys(byUser)])
  const users: UserInfo[] = [...allUsers].map(user => ({
    user,
    processCount: byUser[user]?.count || 0,
    oldestSecs: byUser[user]?.oldest || 0,
    newestSecs: byUser[user] ? byUser[user].newest : 0,
    loggedIn: loggedInUsers.has(user),
  })).sort((a, b) => b.oldestSecs - a.oldestSecs)

  return users
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
        const users = parse(stdout)
        return {
          id: m.id, hostname: m.hostname, label: m.label,
          reachable: true, error: null,
          users,
          activeCount: users.filter(u => u.loggedIn || u.processCount > 0).length,
        }
      } catch (e: any) {
        return {
          id: m.id, hostname: m.hostname, label: m.label,
          reachable: false, error: e?.message || String(e),
          users: [], activeCount: 0,
        }
      }
    }))

    return NextResponse.json({ success: true, machines: results, checkedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ error: 'Failed', details: String(e) }, { status: 500 })
  }
}
