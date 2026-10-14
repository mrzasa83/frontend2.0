import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule } from '@/lib/config/access'
import { buildChangeAnalysis, buildReasonExport } from '@/lib/changes/changeAnalysis'

export const dynamic = 'force-dynamic'
/** Above the Paradigm query ceiling, with room for the MySQL side. */
export const maxDuration = 90

/**
 * The reason-for-change analysis, both databases.
 *
 * Admin only. It reads the whole closed-MCN population rather than one
 * record, and attributes work to named teams — a management view rather than
 * an engineering one.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canReadModule((session.user as any)?.roles || [], 'admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const months = Number(sp.get('months')) || 12

  // The reason text on its own, for thematic analysis outside the app. Its
  // own mode rather than part of the report, because it is every record in
  // the window and the report only needs counts.
  if (sp.get('export') === 'reasons') {
    try {
      return NextResponse.json({ success: true, months, rows: await buildReasonExport(months) })
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to export reasons',
        details: error instanceof Error ? error.message : String(error),
      }, { status: 500 })
    }
  }

  try {
    const data = await buildChangeAnalysis({
      months,
      timeoutMs: Number(sp.get('timeoutMs')) || undefined,
    })
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('Change analysis error:', error)
    return NextResponse.json({
      error: 'Failed to build the analysis',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
