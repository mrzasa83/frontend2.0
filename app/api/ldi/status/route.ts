import { NextResponse } from 'next/server'
import { getBackendStatus } from '@/lib/ldi-client'

export async function GET() {
  try {
    const status = await getBackendStatus()
    return NextResponse.json({ connected: true, ...status })
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Cannot reach LDI backend',
      genesis_connected: false,
      genesis_host: 'unknown',
    })
  }
}
