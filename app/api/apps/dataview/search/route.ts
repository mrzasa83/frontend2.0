import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchJob, normalizeType, isSafeJob, ARCHIVE_ROOT, ARCHIVE_UNC } from '@/lib/odb/archive'
import fs from 'fs'

export const dynamic = 'force-dynamic'

/**
 * Revisions of one job, newest first, with the released one flagged.
 *
 * Any signed-in user may search: this is the same archive FrontVue already
 * exposes to everyone, and the files it hands back are the ones the floor is
 * meant to be looking at.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = new URL(request.url).searchParams
  const job = (sp.get('job') || '').trim()
  const type = normalizeType(sp.get('type'))

  if (!job) return NextResponse.json({ error: 'A job number is required' }, { status: 400 })
  if (!isSafeJob(job)) {
    return NextResponse.json({ error: 'Job numbers are letters, digits, dash and underscore only' }, { status: 400 })
  }

  // A missing mount and a missing job look identical from readdir, and the
  // difference matters: one is an infrastructure problem, the other a typo.
  const root = ARCHIVE_ROOT()
  if (!fs.existsSync(root)) {
    return NextResponse.json({
      error: `The job archive is not mounted in this container (${root}). ` +
        'Check the archive bind-mount on the host, or set ODB_ARCHIVE_ROOT.',
    }, { status: 503 })
  }

  try {
    return NextResponse.json({
      success: true,
      shareConfigured: !!ARCHIVE_UNC(),
      ...searchJob(job, type),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
