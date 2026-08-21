import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as fs from 'fs'

// This is in a separate route file so it gets its own webpack chunk.
// The fs module works reliably in GET handlers.

function findInDir(dir: string, targetLower: string, maxDepth: number, results: string[]): void {
  if (maxDepth <= 0 || results.length >= 20) return
  let entries: string[]
  try {
    entries = fs.readdirSync(dir)
  } catch { return }

  for (const entry of entries) {
    if (results.length >= 20) return
    if (entry.startsWith('.')) continue
    const full = dir + '/' + entry
    try {
      const stat = fs.statSync(full)
      if (stat.isFile() && entry.toLowerCase() === targetLower) {
        results.push(full)
      } else if (stat.isDirectory()) {
        findInDir(full, targetLower, maxDepth - 1, results)
      }
    } catch { /* permission denied — skip */ }
  }
}

// GET: ?filename=somefile.pdf
// Returns found paths on /mnt/sdrive
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename) {
    return NextResponse.json({ error: 'filename parameter required' }, { status: 400 })
  }

  // Sanity check mount
  let mountOk = false
  try {
    fs.readdirSync('/mnt/sdrive')
    mountOk = true
  } catch { /* not mounted */ }

  if (!mountOk) {
    return NextResponse.json({ 
      error: '/mnt/sdrive not accessible',
      results: [] 
    }, { status: 500 })
  }

  const found: string[] = []
  findInDir('/mnt/sdrive', filename.toLowerCase(), 10, found)

  return NextResponse.json({
    success: true,
    filename,
    count: found.length,
    results: found,
  })
}
