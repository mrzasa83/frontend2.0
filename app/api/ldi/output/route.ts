import { NextRequest } from 'next/server'
import { logActivity } from '@/lib/mysql'

const LDI_BACKEND_URL = process.env.LDI_BACKEND_URL || 'http://localhost:8100'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job, layers, layerOverrides, machine, outputType, outputPath, dateCode, dateCodeFormat, dateCodeManual, operator, loggingEnabled = true, genesisHost, genesisUser, archiveBasePath } = body

    if (!job || !layers || layers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Job and layers are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (loggingEnabled && operator) {
      await logActivity(operator, job, 'ldi_output_start', undefined, {
        job, layers, machine, outputType, dateCode, dateCodeFormat,
      })
    }

    // Proxy the SSE stream from the Python backend
    const backendResponse = await fetch(`${LDI_BACKEND_URL}/api/output`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job,
        layers,
        layer_overrides: layerOverrides || [],
        machine: machine || '',
        output_type: outputType || 'OPFX',
        output_path: outputPath || '',
        date_code: dateCode,
        date_code_format: dateCodeFormat,
        date_code_manual: dateCodeManual,
        genesis_host: genesisHost || '',
        genesis_user: genesisUser || '',
        archive_base_path: archiveBasePath || '',
        operator: operator || '',
      }),
    })

    if (!backendResponse.ok) {
      const err = await backendResponse.json().catch(() => ({}))
      return new Response(
        JSON.stringify({ error: err.detail || 'Output failed' }),
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream the response through
    return new Response(backendResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('LDI Output Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Output failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
