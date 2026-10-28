import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canReadModule } from '@/lib/config/access'
import { queryPrimary } from '@/lib/db/mysql-primary'
import {
  getOpenSalesOrders, openForPart, totalsFor, salesOrderCacheAge,
  statusLabel, type SalesOrderRow,
} from '@/lib/contract/salesOrders'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Open sales order lines.
 *
 * Readable from Contract and from Products: the per-part tab under
 * Products ▸ Released serves the same data for one part, and gating it on the
 * Contract module alone would hide it from the product engineers it is for.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = (session.user as any)?.roles || []
  if (!canReadModule(roles, 'contract') && !canReadModule(roles, 'products')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams

  try {
    // One part: the Products ▸ Released tab. Skips filtering and paging.
    const part = (sp.get('part') || '').trim()
    if (part) {
      const rows = await openForPart(part)
      return NextResponse.json({
        success: true, part, rows, totals: totalsFor(rows),
        cacheAgeMs: salesOrderCacheAge(),
      })
    }

    let rows = await getOpenSalesOrders(sp.get('refresh') === '1')

    // "My parts": the caller's own ticked list. Resolved here rather than
    // passed in, so a stale browser tab cannot show someone else's.
    if (sp.get('mine') === '1') {
      const uid = Number((session.user as any)?.id)
      const watched: any[] = uid
        ? await queryPrimary(
            'SELECT customer_part FROM so_watchlist WHERE user_id = ?', [uid])
        : []
      const set = new Set(watched.map(w => String(w.customer_part || '').trim().toUpperCase()))
      rows = rows.filter(r => set.has(r.customerPart.toUpperCase()))
    }

    const like = (v: string, hay: any) =>
      String(hay ?? '').toLowerCase().includes(v.toLowerCase())
    const f = (k: string) => (sp.get(k) || '').trim()
    const fPart = f('f_part'), fCust = f('f_cust'), fSo = f('f_so')
    const fStatus = f('f_status'), q = f('q')
    const lateOnly = sp.get('late') === '1'
    const owedOnly = sp.get('owed') === '1'

    const filtered = rows.filter(r => {
      if (q && !(like(q, r.customerPart) || like(q, r.customerName) || like(q, r.salesOrder))) return false
      if (fPart && !like(fPart, r.customerPart)) return false
      if (fCust && !like(fCust, r.customerName)) return false
      if (fSo && !like(fSo, r.salesOrder)) return false
      if (fStatus && String(r.status ?? '') !== fStatus) return false
      if (lateOnly && !r.late) return false
      if (owedOnly && r.qtyOwed <= 0) return false
      return true
    })

    const sortKey = (sp.get('sort') || 'customerPart') as keyof SalesOrderRow
    const dir = (sp.get('dir') || 'asc').toLowerCase() === 'desc' ? -1 : 1
    const NUMERIC = new Set(['partsOrdered', 'partsShipped', 'qtyOwed', 'partPrice', 'valueOwed', 'status'])
    filtered.sort((a, b) => {
      const av: any = a[sortKey], bv: any = b[sortKey]
      if (NUMERIC.has(sortKey as string)) return dir * ((av ?? -1) - (bv ?? -1))
      return dir * String(av ?? '').localeCompare(String(bv ?? ''))
    })

    // Totals are over the FILTERED set, which is the point of them: filter to
    // a part and the header answers "how many do we still owe on 12018".
    const totals = totalsFor(filtered)

    const all = sp.get('all') === '1'
    const page = all ? 1 : Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
    const pageSize = all
      ? Math.max(filtered.length, 1)
      : Math.min(500, Math.max(1, parseInt(sp.get('pageSize') || '100', 10) || 100))

    return NextResponse.json({
      success: true,
      rows: all ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page, pageSize, pages: Math.ceil(filtered.length / pageSize) || 1,
      openLines: rows.length,
      totals,
      statuses: [...new Set(rows.map(r => r.status))]
        .filter(s => s != null).sort((a, b) => (a as number) - (b as number))
        .map(s => ({ value: s, label: statusLabel(s as number) })),
      cacheAgeMs: salesOrderCacheAge(),
    })
  } catch (error) {
    console.error('Sales orders error:', error)
    return NextResponse.json({
      error: 'Failed to load sales orders',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
