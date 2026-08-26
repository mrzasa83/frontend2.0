import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildInfo } from '@/lib/config/appEnv'

export const dynamic = 'force-dynamic'

/**
 * What this running instance is.
 *
 * Read at request time from the process environment, so it reflects the actual
 * container rather than anything inlined into the browser bundle — useful when
 * checking whether a deploy really landed.
 *
 * Signed-in users only: it names the databases and drive mounts, which is
 * exactly the sort of detail not to hand out anonymously.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const mem = process.memoryUsage?.()
  return NextResponse.json({
    ...buildInfo(),
    node: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    memoryMB: mem ? Math.round(mem.rss / 1024 / 1024) : null,
    // Names only — never credentials.
    databases: {
      primary: process.env.DB_MYSQL_PRIMARY_DATABASE || null,
      erpHost: process.env.DB_MSSQL_1_SERVER || null,
    },
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    nextauthUrl: process.env.NEXTAUTH_URL || null,
    serverTime: new Date().toISOString(),
  })
}
