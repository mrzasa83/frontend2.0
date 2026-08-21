import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const LDRIVE_ROOT = process.env.LDRIVE_ROOT || '/mnt/ldrive'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path') || ''
  const disposition = searchParams.get('download') === 'true' ? 'attachment' : 'inline'

  // Security: must resolve under the L drive root and be a PDF
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(LDRIVE_ROOT) + path.sep) || !resolved.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const data = await fs.readFile(resolved)
    const filename = path.basename(resolved)
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename.replace(/"/g, '')}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'File not found', details: error instanceof Error ? error.message : String(error) }, { status: 404 })
  }
}
