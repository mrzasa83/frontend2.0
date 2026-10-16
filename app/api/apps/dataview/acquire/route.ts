import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  resolveSelection, normalizeType, isSafeJob, isSafeRevision, CLIENT_DEFAULTS,
} from '@/lib/odb/archive'
import { mintFetchToken, type FetchItem } from '@/lib/odb/token'
import { buildAcquireScript, type AcquireFile } from '@/lib/odb/acquireScript'

export const dynamic = 'force-dynamic'

/**
 * Builds the PowerShell acquire script for a selection.
 *
 * Every file is resolved on disk here, before the script is written, so the
 * script carries real sizes and the user learns about a missing revision now
 * rather than halfway through a download on the floor.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = (session.user as any).username || session.user.name || 'unknown'

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 })
  }

  const rawItems = Array.isArray(body?.items) ? body.items : []
  if (!rawItems.length) return NextResponse.json({ error: 'Nothing selected' }, { status: 400 })
  if (rawItems.length > 50) {
    return NextResponse.json({ error: 'That is more than 50 files; split it into a few runs' }, { status: 400 })
  }

  const defaults = CLIENT_DEFAULTS()
  const viewerRoot = String(body?.viewerRoot || defaults.viewerRoot).trim() || defaults.viewerRoot
  const jobsDir = String(body?.jobsDir || defaults.jobsDir).trim() || defaults.jobsDir

  // The script downloads over the same host the browser is on, so the URL is
  // built from this request rather than from an env var that would be wrong
  // the moment someone reaches the app by another name.
  const origin = new URL(request.url).origin
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  const items: FetchItem[] = []
  const files: AcquireFile[] = []
  const missing: string[] = []

  for (const raw of rawItems) {
    const job = String(raw?.job || '').trim()
    const type = normalizeType(raw?.type)
    const rev = String(raw?.rev || '').trim()
    if (!isSafeJob(job) || !isSafeRevision(rev)) { missing.push(`${job} ${type} ${rev}`); continue }
    try {
      const r = resolveSelection(job, type, rev)
      items.push({ job, type, rev })
      files.push({
        job, type, rev,
        name: r.downloadName,
        bytes: r.bytes,
        url: `${origin}${basePath}/api/apps/dataview/fetch`
          + `?job=${encodeURIComponent(job)}&type=${type}&rev=${encodeURIComponent(rev)}`,
      })
    } catch {
      missing.push(`${job} ${type} ${rev}`)
    }
  }

  if (!files.length) {
    return NextResponse.json({
      error: 'None of the selected files could be read from the archive',
      missing,
    }, { status: 404 })
  }

  const { token, expiresAt } = mintFetchToken(user, items)
  // One token for the whole script, appended per URL so each download carries it.
  for (const f of files) f.url += `&t=${encodeURIComponent(token)}`

  const script = buildAcquireScript({ files, viewerRoot, jobsDir, user, expiresAt })
  const stamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="DataView-Acquire_${stamp}.ps1"`,
      'Cache-Control': 'no-store',
      // Surfaced in the UI so a partly-resolvable selection is visible rather
      // than quietly shrinking.
      'X-DataView-Missing': String(missing.length),
    },
  })
}
