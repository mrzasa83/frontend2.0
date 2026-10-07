import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule } from '@/lib/config/access'
import { searchProductionParts } from '@/lib/products/partSearch'

export const dynamic = 'force-dynamic'

/**
 * The Gold Standard "like parts" picker.
 *
 * Same search as EHS -> Product Compliance -> Assess a product (one shared
 * query in lib/products/partSearch.ts), gated on Product read instead of EHS
 * read so every role that can open Gold Standard can use the picker.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const q = (sp.get('q') || '').trim()
  const includeObsolete = sp.get('includeObsolete') === '1'
  if (q.length < 2) return NextResponse.json({ success: true, rows: [] })

  try {
    return NextResponse.json({
      success: true,
      includeObsolete,
      rows: await searchProductionParts(q, includeObsolete),
    })
  } catch (error) {
    console.error('Gold Standard part search error:', error)
    return NextResponse.json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
