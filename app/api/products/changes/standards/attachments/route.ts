import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'
import * as fs from 'fs'

const ESCF_ATTACHMENTS_PATH = '/mnt/jdrive/APC EngJobs/00 DocControl/escf'

// GET: fetch attachment metadata for an ESCF
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const escfId = searchParams.get('escfId')
  if (!escfId) return NextResponse.json({ error: 'escfId required' }, { status: 400 })

  try {
    // Get local metadata
    const meta = await queryPrimary(
      'SELECT * FROM escf_attachments WHERE escf_id = ? ORDER BY filename ASC',
      [escfId]
    )

    // Check which files exist on disk
    const escfDir = `${ESCF_ATTACHMENTS_PATH}/${escfId}`
    const filesOnDisk: Record<string, { size: number; modified: string }> = {}
    try {
      if (fs.existsSync(escfDir)) {
        const entries = fs.readdirSync(escfDir)
        for (const entry of entries) {
          try {
            const stat = fs.statSync(`${escfDir}/${entry}`)
            if (stat.isFile()) {
              filesOnDisk[entry] = {
                size: stat.size,
                modified: stat.mtime.toISOString(),
              }
            }
          } catch {}
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      escfId: Number(escfId),
      metadata: meta,
      filesOnDisk,
      basePath: escfDir,
    })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({
      error: 'Failed to fetch', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// POST: upsert attachment metadata (description, sync flag)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { escfId, filename, description } = await request.json()
    if (!escfId || !filename) {
      return NextResponse.json({ error: 'escfId and filename required' }, { status: 400 })
    }

    const username = (session.user as any)?.username || session.user?.name || 'unknown'

    await queryPrimary(`
      INSERT INTO escf_attachments (escf_id, filename, description, created_by)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE description = VALUES(description), updated_at = CURRENT_TIMESTAMP
    `, [escfId, filename, description || null, username])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving attachment meta:', error)
    return NextResponse.json({
      error: 'Failed to save', details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
