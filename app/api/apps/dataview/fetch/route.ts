import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Readable } from 'stream'
import fs from 'fs'
import { resolveSelection, normalizeType, isSafeJob, isSafeRevision } from '@/lib/odb/archive'
import { verifyFetchToken } from '@/lib/odb/token'

export const dynamic = 'force-dynamic'
/** A cold archive read of a large job can take a while. */
export const maxDuration = 600

/**
 * Streams one job's data.tgz under its DataView name.
 *
 * Two ways in, because two different clients call it:
 *   - a signed-in browser (the "download just this one" link on the page), and
 *   - the acquire script, which has no cookie and presents the scoped token
 *     minted when that script was generated.
 *
 * NOTE: this route is listed as an exemption in proxy.ts, so the token path is
 * reachable at all — the proxy otherwise redirects anything without a session
 * to the login page, which a PowerShell download would silently save as HTML.
 */
export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const job = (sp.get('job') || '').trim()
  const type = normalizeType(sp.get('type'))
  const rev = (sp.get('rev') || '').trim()
  const token = sp.get('t') || ''

  if (!isSafeJob(job) || !isSafeRevision(rev)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  let who = ''
  if (token) {
    const user = verifyFetchToken(token, { job, type, rev })
    if (!user) {
      return NextResponse.json({
        error: 'This download link has expired or does not cover this file. ' +
          'Generate a new acquire script in DataView.',
      }, { status: 403 })
    }
    who = user
  } else {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    who = (session.user as any).username || session.user.name || 'unknown'
  }

  let resolved
  try {
    resolved = resolveSelection(job, type, rev)
  } catch {
    return NextResponse.json({ error: `No data.tgz for ${job} ${type} ${rev}` }, { status: 404 })
  }

  console.log(`[dataview] ${who} fetched ${resolved.downloadName} (${resolved.bytes} bytes)`)

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
