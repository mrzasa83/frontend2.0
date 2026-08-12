import { NextRequest, NextResponse } from 'next/server'
import { validateJob } from '@/lib/ldi-client'
import { logActivity } from '@/lib/mysql'

export async function POST(request: NextRequest) {
  try {
    const { job, operator, loggingEnabled = true, genesisHost, genesisUser, archiveBasePath } = await request.json()

    if (!job) {
      return NextResponse.json(
        { error: 'Job number is required' },
        { status: 400 }
      )
    }

    if (loggingEnabled && operator) {
      await logActivity(operator, job, 'ldi_validate', undefined, { job })
    }

    const result = await validateJob(job, genesisHost, genesisUser, archiveBasePath)

    if (loggingEnabled && operator) {
      await logActivity(operator, job, 
        result.valid ? 'ldi_validate_success' : 'ldi_validate_failed',
        undefined,
        { valid: result.valid, errors: result.errors }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('LDI Validate Error:', error)
    return NextResponse.json(
      { 
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
        info: {},
      },
      { status: 500 }
    )
  }
}
