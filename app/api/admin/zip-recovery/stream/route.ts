import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const SERVICE = process.env.JOHN_SERVICE_URL || 'http://john-zip-recovery:8080'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('Admin')) {
    return new Response('Forbidden', { status: 403 })
  }
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return new Response('id required', { status: 400 })

  const upstream = await fetch(`${SERVICE}/stream/${id}`, {
    headers: { Accept: 'text/event-stream' },
  })
  if (!upstream.ok || !upstream.body) {
    return new Response('Stream unavailable', { status: 502 })
  }
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
