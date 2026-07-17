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
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    await fetch(`${SERVICE}/abort/${id}`, {
      method: 'POST',
      headers: TOKEN ? { 'x-api-token': TOKEN } : undefined,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Could not reach service', details: String(e) }, { status: 502 })
  }
}
