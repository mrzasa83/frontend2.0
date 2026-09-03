import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasRole } from '@/lib/config/access'
import { getLegacyNameOptions } from '@/lib/changes/legacyNames'

export const dynamic = 'force-dynamic'

/** Legacy MCN names, for the Engineer Roles dropdown. Admin only. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!hasRole(roles, 'Admin')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  try {
    const options = await getLegacyNameOptions()
    return NextResponse.json({ success: true, options, count: options.length })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to load legacy names',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
