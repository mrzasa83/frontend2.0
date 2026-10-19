import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Readable } from 'stream'
import fs from 'fs'
import { resolveSelection, normalizeType, isSafeJob, isSafeRevision } from '@/lib/odb/archive'

export const dynamic = 'force-dynamic'
/** A cold archive read of a large job can take a while. */
export const maxDuration = 600

/**
 * Streams one job's data.tgz to the signed-in user's browser, under its
 * DataView name.
 *
 * Session only. An earlier revision of this route also accepted a signed token
 * so a generated PowerShell script could download without a cookie; that whole
 * mechanism is gone. A page that hands out a script which fetches files and
 * launches processes is indistinguishable from a malware dropper to any
 * endpoint-detection product, and ours flagged it. An ordinary authenticated
 * browser download is the entire client story now.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const who = (session.user as any).username || session.user.name || 'unknown'

  const sp = new URL(request.url).searchParams
  const job = (sp.get('job') || '').trim()
  const type = normalizeType(sp.get('type'))
  const rev = (sp.get('rev') || '').trim()

  if (!isSafeJob(job) || !isSafeRevision(rev)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  let resolved
  try {
    resolved = resolveSelection(job, type, rev)
  } catch {
    return NextResponse.json({ error: `No data.tgz for ${job} ${type} ${rev}` }, { status: 404 })
  }

  console.log(`[dataview] ${who} downloaded ${resolved.downloadName} (${resolved.bytes} bytes)`)

  // Streamed, not buffered: these are whole job archives, and holding one in
  // the container's heap per concurrent download is how the container dies.
  const stream = Readable.toWeb(
    fs.createReadStream(resolved.filePath)) as unknown as ReadableStream

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Length': String(resolved.bytes),
      'Content-Disposition': `attachment; filename="${resolved.downloadName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
