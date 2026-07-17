import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const SERVICE = process.env.JOHN_SERVICE_URL || 'http://john-zip-recovery:8080'
const TOKEN = process.env.JOHN_API_TOKEN || ''

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('Admin')) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }
  try {
    const inForm = await request.formData()
    const file = inForm.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const out = new FormData()
    out.append('file', file, (file as any).name || 'archive.zip')

    const res = await fetch(`${SERVICE}/crack`, {
      method: 'POST',
      headers: TOKEN ? { 'x-api-token': TOKEN } : undefined,
      body: out,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json({ error: data.detail || 'Service error' }, { status: res.status })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Could not reach recovery service', details: String(e) }, { status: 502 })
  }
}
