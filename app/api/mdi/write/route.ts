import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Write generated MDI XML to the configured output location.
 *
 * Body: { xml: string, outputPath: string }
 * outputPath is the Admin Config "MDI XML Output folder" value. It may be a
 * full file path (…/testcasempr.xml) or a directory; if a directory, we write
 * a timestamped file into it.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { xml, outputPath } = await request.json()
    if (!xml || !outputPath) {
      return NextResponse.json({ error: 'xml and outputPath are required' }, { status: 400 })
    }

    // Decide file vs directory target.
    let target = outputPath as string
    const looksLikeFile = /\.xml$/i.test(target)
    const dir = looksLikeFile ? path.dirname(target) : target
    if (!looksLikeFile) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      target = path.join(target, `mdi_${stamp}.xml`)
    }

    // Diagnose the parent directory before writing, so the error tells the
    // operator WHICH thing is wrong rather than a generic failure. On this
    // deployment the output lives on a mount (e.g. /mnt/tdrive) that may not be
    // present or writable inside the container.
    try {
      await fs.access(dir)
    } catch {
      // Directory doesn't exist / isn't reachable. Check whether the mount root
      // itself is present to distinguish "mount missing" from "folder missing".
      const mountRoot = '/' + (dir.split('/').filter(Boolean)[0] || '')
      const secondLevel = dir.split('/').filter(Boolean).slice(0, 2).join('/')
      let mountPresent = false
      try { await fs.access('/' + secondLevel); mountPresent = true } catch {}
      return NextResponse.json({
        success: false,
        error: mountPresent
          ? `The folder '${dir}' does not exist on the app host (the mount ${'/' + secondLevel} is present, but that subfolder isn't). Create it, or pick an existing folder with Browse.`
          : `The output location isn't reachable from the app — '${'/' + secondLevel}' is not mounted inside the container. Mount the share (e.g. ${mountRoot}) into the frontImage container, then pick the folder with Browse.`,
      }, { status: 400 })
    }

    // Directory exists — check writability explicitly for a clear permission msg.
    try {
      await fs.access(dir, (await import('fs')).constants.W_OK)
    } catch {
      return NextResponse.json({
        success: false,
        error: `The folder '${dir}' exists but isn't writable by the app (running as its container UID). Grant write access, or choose a writable folder.`,
      }, { status: 400 })
    }

    await fs.writeFile(target, xml, 'utf-8')
    return NextResponse.json({ success: true, path: target })
  } catch (error) {
    console.error('MDI XML write error:', error)
    return NextResponse.json(
      {
        error: 'Failed to write XML file',
        details: error instanceof Error ? error.message : String(error),
        hint: 'Check that the MDI XML Output folder is mounted and writable by the app.',
      },
      { status: 500 }
    )
  }
}
