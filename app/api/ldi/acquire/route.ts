import { NextRequest, NextResponse } from 'next/server'
import { acquireJob } from '@/lib/ldi-client'
import { logActivity } from '@/lib/mysql'

export async function POST(request: NextRequest) {
  try {
    const { job, revisionChoice, operator, loggingEnabled = true, genesisHost, genesisUser, archiveBasePath } = await request.json()

    if (!job) {
      return NextResponse.json({ error: 'Job number is required' }, { status: 400 })
    }

    if (loggingEnabled && operator) {
      await logActivity(operator, job, 'ldi_acquire_start', undefined, { job, revisionChoice, genesisHost })
    }

    const result = await acquireJob(job, revisionChoice, genesisHost, genesisUser, archiveBasePath)

    if (loggingEnabled && operator) {
      await logActivity(operator, job, 'ldi_acquire_complete', undefined, {
        revision: result.revision,
        layerCount: result.layers.length,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('LDI Acquire Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Acquisition failed' },
      { status: 500 }
    )
  }
}
