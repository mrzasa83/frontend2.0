import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule } from '@/lib/config/access'
import { getPartsWithFamilies, partsCacheAge } from '@/lib/ehs/partsCache'
import { isPcbMaterial } from '@/lib/materials/panelSize'

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

    // Material kind: 'pcb' is the shorthand for the board stack itself
    // (laminate, prepreg and copper foil), which is what people mean by
    // "PCB materials". Entry, backup and dry film are panel-sized but are
    // consumables, so they are reachable only by naming them.
    const kind = (sp.get('kind') || '').trim()
    const fSize = (sp.get('f_size') || '').trim()

    const filtered = rows.filter(r => {
      if (kind === 'pcb' && !isPcbMaterial(r.material_kind)) return false
      else if (kind && kind !== 'pcb' && r.material_kind !== kind) return false
      // Matches either orientation and the standardised form, so "18x24"
      // finds 18 x 24, 24 x 18 and the W x L column alike.
      if (fSize) {
        const norm = fSize.replace(/\s|"/g, '').toLowerCase()
        const forms = [
          `${r.panel_grain}x${r.panel_cross}`,
          `${r.panel_cross}x${r.panel_grain}`,
          `${r.panel_width}x${r.panel_length}`,
        ]
        if (!forms.some(f => f.includes(norm))) return false
      }
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
    // Panel dimensions sort as numbers; everything else as text. Sorting
    // "18" against "9" as strings puts the 9" panel last.
    const NUMERIC = new Set(['panel_width', 'panel_length', 'panel_grain', 'panel_cross', 'thickness_in'])
    filtered.sort((a, b) => {
      const av = (a as any)[sortKey], bv = (b as any)[sortKey]
      if (NUMERIC.has(sortKey)) {
        const an = av ?? -1, bn = bv ?? -1
        return dir * (an - bn)
      }
      return dir * String(av ?? '').localeCompare(String(bv ?? ''))
    })

    const total = filtered.length
    const assigned = rows.filter(r => r.PRODUCT_FAMILY).length
    const pcbTotal = rows.filter(r => isPcbMaterial(r.material_kind)).length

    // all=1 returns every matching row in one response, for the Excel export.
    // The table never asks for this — it pages — so the 500-row cap below
    // still protects the interactive path. Everything is already in memory
    // from the cache, so this costs a serialization, not a query.
    const all = sp.get('all') === '1'
    const page = all ? 1 : Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
    const pageSize = all
      ? Math.max(total, 1)
      : Math.min(500, Math.max(1, parseInt(sp.get('pageSize') || '100', 10) || 100))
    const paged = all ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize)

    return NextResponse.json({
      success: true,
      rows: paged,
      total, page, pageSize, pages: Math.ceil(total / pageSize) || 1,
      totalParts: rows.length,
      pcbTotal,
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
