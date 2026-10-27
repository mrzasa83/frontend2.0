import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule } from '@/lib/config/access'
import { getPartsWithFamilies } from '@/lib/ehs/partsCache'
import { isPcbMaterial, materialFamilyCode } from '@/lib/materials/panelSize'

export const dynamic = 'force-dynamic'

/**
 * The panel census: every distinct panel we buy material in, what it costs in
 * area, and which materials are available on it.
 *
 * Aggregated from the same cached part list the Parts tab uses, so a panel can
 * never disagree with the rows underneath it. Shaped as a tree — panel, then
 * material code, then the individual parts — because the question people
 * actually ask is "what can I get on an 18-inch panel", which is a drill-down,
 * not a filter.
 *
 * Sizes here are width x length with the NARROW side first; grain direction is
 * dropped on purpose. The machine constraint is the narrow side, so 24 x 18
 * and 18 x 24 are the same panel for this purpose.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'ehs') && !canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  // Board material by default: entry, backup and dry film are panel-sized but
  // are consumables, and they would distort a census of what we build on.
  const kind = (sp.get('kind') || 'pcb').trim()

  try {
    const all = await getPartsWithFamilies(sp.get('refresh') === '1')

    const rows = all.filter(r => {
      if (r.panel_width == null || r.panel_length == null) return false
      if (kind === 'all') return true
      if (kind === 'pcb') return isPcbMaterial(r.material_kind)
      return r.material_kind === kind
    })

    type Item = {
      part: string; code: string; desc: string; mfr: string
      thickness: number | null; copper: string; family: string
      kind: string; asNamed: string; sizeCheck: string
    }
    type Group = {
      code: string; kind: string; parts: number
      thinnest: number | null; thickest: number | null
      items: Item[]
    }
    type Panel = {
      key: string; width: number; length: number; area: number
      parts: number; kinds: Record<string, number>; groups: Group[]
    }

    const byPanel = new Map<string, Panel>()
    for (const r of rows) {
      const width = r.panel_width as number
      const length = r.panel_length as number
      const key = `${width} x ${length}`
      let p = byPanel.get(key)
      if (!p) {
        p = { key, width, length, area: Number((width * length).toFixed(4)),
          parts: 0, kinds: {}, groups: [] }
        byPanel.set(key, p)
      }
      p.parts++
      p.kinds[r.material_kind] = (p.kinds[r.material_kind] || 0) + 1

      // Grouped at grade level, not on the full material code: LBA, LBB and
      // LBE are all FR406, and grouping on the full code puts 253 branches
      // under 18 x 24. The full code stays on each part row.
      const code = materialFamilyCode(r.INV_PART_NUMBER)
      let g = p.groups.find(x => x.code === code)
      if (!g) {
        g = { code, kind: r.material_kind, parts: 0, thinnest: null, thickest: null, items: [] }
        p.groups.push(g)
      }
      g.parts++
      if (r.thickness_in != null) {
        g.thinnest = g.thinnest == null ? r.thickness_in : Math.min(g.thinnest, r.thickness_in)
        g.thickest = g.thickest == null ? r.thickness_in : Math.max(g.thickest, r.thickness_in)
      }
      g.items.push({
        part: r.INV_PART_NUMBER,
        code: r.material_code,
        desc: r.INV_PART_DESCRIPTION,
        mfr: r.MANUFACTURER_NAME,
        thickness: r.thickness_in,
        copper: r.copper_code,
        family: r.PRODUCT_FAMILY,
        kind: r.material_kind,
        // The size as the part number spells it, grain first. Kept so a row
        // can be tied back to its number even though the panel is normalised.
        asNamed: r.panel_grain != null ? `${r.panel_grain} x ${r.panel_cross}` : '',
        sizeCheck: r.size_check,
      })
    }

    const panels = [...byPanel.values()].sort((a, b) =>
      a.width - b.width || a.length - b.length)
    for (const p of panels) {
      p.groups.sort((a, b) => b.parts - a.parts || a.code.localeCompare(b.code))
      for (const g of p.groups) g.items.sort((a, b) => a.part.localeCompare(b.part))
    }

    const widths = [...new Set(panels.map(p => p.width))].sort((a, b) => a - b)
      .map(w => {
        const ps = panels.filter(p => p.width === w)
        return { width: w, panels: ps.length, parts: ps.reduce((n, p) => n + p.parts, 0) }
      })

    const nums = (xs: number[]) => xs.length
      ? { min: Math.min(...xs), max: Math.max(...xs) } : { min: 0, max: 0 }

    return NextResponse.json({
      success: true,
      kind,
      panels,
      widths,
      summary: {
        panels: panels.length,
        parts: rows.length,
        width: nums(panels.map(p => p.width)),
        length: nums(panels.map(p => p.length)),
        area: nums(panels.map(p => p.area)),
      },
    })
  } catch (error) {
    console.error('EHS panels error:', error)
    return NextResponse.json({
      error: 'Failed to build the panel census',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
