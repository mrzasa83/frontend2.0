import { NextRequest, NextResponse } from 'next/server'

const LDI_BACKEND = process.env.LDI_BACKEND_URL || 'http://localhost:8100'

// GET /api/image-compare?action=pairs|model-status|pair-images&...
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')
  try {
    if (action === 'pairs') {
      const label = req.nextUrl.searchParams.get('label') || ''
      const limit = req.nextUrl.searchParams.get('limit') || '50'
      const url = `${LDI_BACKEND}/api/image-compare/pairs?limit=${limit}${label ? `&label=${label}` : ''}`
      const r = await fetch(url)
      return NextResponse.json(await r.json())
    }
    if (action === 'model-status') {
      const r = await fetch(`${LDI_BACKEND}/api/image-compare/model/status`)
      return NextResponse.json(await r.json())
    }
    if (action === 'pair-images') {
      const pairId = req.nextUrl.searchParams.get('pairId')
      const r = await fetch(`${LDI_BACKEND}/api/image-compare/pairs/${pairId}/images`)
      return NextResponse.json(await r.json())
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/image-compare — multipart form proxy for compare, upload, train, predict
export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')
  try {
    if (action === 'compare' || action === 'upload' || action === 'predict') {
      // Forward multipart form data to Python
      const formData = await req.formData()
      const endpoint = action === 'compare' ? 'compare'
        : action === 'upload' ? 'pairs'
        : 'model/predict'
      const r = await fetch(`${LDI_BACKEND}/api/image-compare/${endpoint}`, {
        method: 'POST',
        body: formData,
      })
      return NextResponse.json(await r.json(), { status: r.status })
    }
    if (action === 'train') {
      const body = await req.json()
      const params = new URLSearchParams({
        epochs: String(body.epochs || 30),
        learning_rate: String(body.learning_rate || 0.001),
        batch_size: String(body.batch_size || 8),
      })
      const r = await fetch(`${LDI_BACKEND}/api/image-compare/model/train?${params}`, { method: 'POST' })
      return NextResponse.json(await r.json(), { status: r.status })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PUT /api/image-compare?action=label&pairId=xxx&label=pass|fail
export async function PUT(req: NextRequest) {
  const pairId = req.nextUrl.searchParams.get('pairId')
  const label = req.nextUrl.searchParams.get('label')
  try {
    const r = await fetch(`${LDI_BACKEND}/api/image-compare/pairs/${pairId}/label?label=${label}`, { method: 'PUT' })
    return NextResponse.json(await r.json(), { status: r.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/image-compare?action=pair&pairId=xxx  OR  action=model
export async function DELETE(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')
  try {
    if (action === 'pair') {
      const pairId = req.nextUrl.searchParams.get('pairId')
      const r = await fetch(`${LDI_BACKEND}/api/image-compare/pairs/${pairId}`, { method: 'DELETE' })
      return NextResponse.json(await r.json())
    }
    if (action === 'model') {
      const r = await fetch(`${LDI_BACKEND}/api/image-compare/model`, { method: 'DELETE' })
      return NextResponse.json(await r.json())
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
