import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as fs from 'fs'
import * as path from 'path'

// Map of allowed base paths (security: only serve from these directories)
const ALLOWED_BASES = [
  '/mnt/sdrive/FrontEndQCFolders',
  '/mnt/sdrive/AttDocs',
  '/mnt/tdrive/Packaging and Shipping',
  '/mnt/jdrive'
]

// MIME types for common file extensions
const MIME_TYPES: Record<string, string> = {
  'pdf': 'application/pdf',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'zip': 'application/zip',
  'xml': 'application/xml'
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const download = searchParams.get('download') === 'true'

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Security check: ensure path is under an allowed base
    const normalizedPath = path.normalize(filePath)
    const isAllowed = ALLOWED_BASES.some(base => normalizedPath.startsWith(base))
    
    if (!isAllowed) {
      return NextResponse.json({ error: 'Access denied to this path' }, { status: 403 })
    }

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get file stats
    const stats = fs.statSync(normalizedPath)
    
    if (stats.isDirectory()) {
      return NextResponse.json({ error: 'Cannot serve directories' }, { status: 400 })
    }

    // Determine content type
    const ext = path.extname(normalizedPath).toLowerCase().slice(1)
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    // Read file
    const fileBuffer = fs.readFileSync(normalizedPath)
    const fileName = path.basename(normalizedPath)

    // Build response headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': stats.size.toString(),
      'Cache-Control': 'private, max-age=3600'
    }

    // For downloads or non-viewable types, set Content-Disposition
    if (download || !['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'].includes(ext)) {
      headers['Content-Disposition'] = `attachment; filename="${fileName}"`
    } else {
      headers['Content-Disposition'] = `inline; filename="${fileName}"`
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}
