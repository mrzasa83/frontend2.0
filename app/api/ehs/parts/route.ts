import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule } from '@/lib/config/access'
import { getPartsWithFamilies, partsCacheAge } from '@/lib/ehs/partsCache'

export const dynamic = 'force-dynamic'

// The fixed base search for purchased parts. Every family narrows this further.
const BASE_SQL = `
  select
      RKEY,
      INV_PART_NUMBER,
      INV_PART_DESCRIPTION,
      MANUFACTURER_NAME,
      ACTIVE_FLAG
  from data0017
  where
      P_M = 'P' and
      ACTIVE_FLAG = 'Y' and
      INV_PART_NUMBER not like 'Z%'
  order by INV_PART_NUMBER`

// GET -> purchased parts with their resolved family.
// Query: q, f_part, f_desc, f_mfr, f_family, page, pageSize, sort, dir, unassigned=1
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  // Material Mgt sits under Product now, so either module grants read.
  if (!canReadModule(roles, 'ehs') && !canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  try {
    // Cached: the cross-database fetch and family matching used to run on every
    // keystroke, which is what made this filter feel slow.
    const rows = await getPartsWithFamilies(sp.get('refresh') === '1')

    // Filters
    const like = (v: string, hay: any) => String(hay ?? '').toLowerCase().includes(v.toLowerCase())
    const q = (sp.get('q') || '').trim()
    const fPart = (sp.get('f_part') || '').trim()
    const fDesc = (sp.get('f_desc') || '').trim()
    const fMfr = (sp.get('f_mfr') || '').trim()
    const fFamily = (sp.get('f_family') || '').trim()
    const unassignedOnly = sp.get('unassigned') === '1'

    // Part-number filter honours a match mode: 'starts' anchors at the front,
    // anything else is a contains match.
    const partMode = (sp.get('f_part_mode') || 'contains').toLowerCase()
    const startsWith = (v: string, hay: any) =>
      String(hay ?? '').toLowerCase().startsWith(v.toLowerCase())
    const matchPart = partMode === 'starts' ? startsWith : like

    // The family filter takes a family name, or the sentinel __unassigned__ for
    // parts that no family has claimed yet.
    const familyUnassigned = fFamily === '__unassigned__'

    const filtered = rows.filter(r => {
      if (q && !(like(q, r.INV_PART_NUMBER) || like(q, r.INV_PART_DESCRIPTION) || like(q, r.MANUFACTURER_NAME))) return false
      if (fPart && !matchPart(fPart, r.INV_PART_NUMBER)) return false
      if (fDesc && !like(fDesc, r.INV_PART_DESCRIPTION)) return false
      if (fMfr && !like(fMfr, r.MANUFACTURER_NAME)) return false
      if (familyUnassigned) { if (r.PRODUCT_FAMILY) return false }
      else if (fFamily && !like(fFamily, r.PRODUCT_FAMILY)) return false
      if (unassignedOnly && r.PRODUCT_FAMILY) return false
      return true
    })

    // Sort — defaults to part number, as requested.
    const sortKey = sp.get('sort') || 'INV_PART_NUMBER'
    const dir = (sp.get('dir') || 'asc').toLowerCase() === 'desc' ? -1 : 1
    filtered.sort((a, b) =>
      dir * String((a as any)[sortKey] ?? '').localeCompare(String((b as any)[sortKey] ?? '')))

    const total = filtered.length
    const assigned = rows.filter(r => r.PRODUCT_FAMILY).length
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
    const pageSize = Math.min(500, Math.max(1, parseInt(sp.get('pageSize') || '100', 10) || 100))
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

    return NextResponse.json({
      success: true,
      rows: paged,
      total, page, pageSize, pages: Math.ceil(total / pageSize) || 1,
      totalParts: rows.length,
      cacheAgeMs: partsCacheAge(),
      assigned,
      unassigned: rows.length - assigned,
    })
  } catch (error) {
    console.error('EHS parts query error:', error)
    return NextResponse.json({
      error: 'Failed to load parts',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
