'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, AlertTriangle, Download, Search, Star, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import Tabs from '@/components/ui/Tabs'
import ProductEdit from '@/components/products/ProductEdit'
import SalesOrderTable, {
  SalesOrderTotalsBar, type SalesOrderRow, type SalesOrderTotals,
} from '@/components/contract/SalesOrderTable'

export default function SalesOrdersPage() {
  const [openParts, setOpenParts] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('list')

  const openPart = (part: string) => {
    if (!part) return
    setOpenParts(v => v.includes(part) ? v : [...v, part])
    setActiveTab(`part-${part}`)
  }
  const closePart = (part: string) => {
    setOpenParts(v => v.filter(p => p !== part))
    setActiveTab('list')
  }

  const tabs = [
    { id: 'list', label: 'Open Orders', closeable: false,
      content: <OrdersList onOpenPart={openPart} /> },
    ...openParts.map(p => ({
      id: `part-${p}`,
      label: (
        <span className="flex items-center gap-1.5">
          {p}
          <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-100 text-cyan-700">Part</span>
        </span>
      ),
      closeable: true,
      onClose: () => closePart(p),
      content: <PartTab key={p} customerPart={p} />,
    })),
  ]

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Sales Orders</h1>
        <p className="text-sm text-slate-600">
          Open order lines from Paradigm — what is ordered, what has shipped, and what we still owe
        </p>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} preserveState={true} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────── the list ────────────────────────────────────

function OrdersList({ onOpenPart }: { onOpenPart: (part: string) => void }) {
  const [rows, setRows] = useState<SalesOrderRow[]>([])
  const [totals, setTotals] = useState<SalesOrderTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const [filters, setFilters] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState<Record<string, string>>({})
  const [statuses, setStatuses] = useState<{ value: number; label: string }[]>([])
  const [lateOnly, setLateOnly] = useState(false)
  const [owedOnly, setOwedOnly] = useState(true)
  const [mine, setMine] = useState(false)

  const [sort, setSort] = useState({ key: 'customerPart', dir: 'asc' as 'asc' | 'desc' })
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [openLines, setOpenLines] = useState(0)

  const [watched, setWatched] = useState<Set<string>>(new Set())

  // Debounced, so typing in a filter doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setApplied(filters); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [filters])

  const loadWatchlist = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/contract/sales-orders/watchlist'))
      if (!res.ok) return
      const d = await res.json()
      setWatched(new Set((d.parts || []).map((p: string) => p.trim())))
    } catch { /* the list still works without it */ }
  }, [])
  useEffect(() => { loadWatchlist() }, [loadWatchlist])

  const params = useCallback((extra: Record<string, string> = {}) => {
    const p = new URLSearchParams({ sort: sort.key, dir: sort.dir, ...extra })
    for (const [k, v] of Object.entries(applied)) if (v.trim()) p.set(k, v.trim())
    if (lateOnly) p.set('late', '1')
    if (owedOnly) p.set('owed', '1')
    if (mine) p.set('mine', '1')
    return p
  }, [applied, sort, lateOnly, owedOnly, mine])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const p = params({ page: String(page), pageSize: '100' })
      const res = await fetch(getApiUrl(`/api/contract/sales-orders?${p.toString()}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || d.details || 'Failed to load')
      setRows(d.rows || []); setTotals(d.totals || null)
      setPages(d.pages || 1); setTotal(d.total || 0); setOpenLines(d.openLines || 0)
      if (d.statuses?.length) setStatuses(d.statuses)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [params, page])
  useEffect(() => { load() }, [load])

  const toggleWatch = async (part: string) => {
    if (!part) return
    const on = watched.has(part)
    // Optimistic: the star should respond immediately, and a failure puts it
    // back rather than leaving the UI lying.
    setWatched(prev => {
      const next = new Set(prev)
      on ? next.delete(part) : next.add(part)
      return next
    })
    try {
      const res = on
        ? await fetch(getApiUrl(`/api/contract/sales-orders/watchlist?part=${encodeURIComponent(part)}`),
            { method: 'DELETE' })
        : await fetch(getApiUrl('/api/contract/sales-orders/watchlist'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ part }),
          })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed')
      if (mine) load()
    } catch (e: any) {
      setWatched(prev => {
        const next = new Set(prev)
        on ? next.add(part) : next.delete(part)
        return next
      })
      setError(e.message)
    }
  }

  const exportExcel = async () => {
    setExporting(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/contract/sales-orders?${params({ all: '1' }).toString()}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Export failed')
      const data: SalesOrderRow[] = d.rows || []
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data.map(r => ({
        'Customer Part': r.customerPart, Customer: r.customerName,
        'Sales Order': r.salesOrder, Item: r.itemNbr,
        Status: r.status, Ordered: r.partsOrdered, Shipped: r.partsShipped,
        'Qty Owed': r.qtyOwed, 'Part Price': r.partPrice,
        'Sch Date': r.schDate ? r.schDate.slice(0, 10) : '',
        Promise: r.promiseDate ? r.promiseDate.slice(0, 10) : '',
        Late: r.late ? 'Yes' : '',
      })))
      ws['!cols'] = [{ wch: 18 }, { wch: 26 }, { wch: 14 }, { wch: 8 }, { wch: 8 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 11 },
        { wch: 12 }, { wch: 12 }, { wch: 7 }]
      ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length, c: 11 } }) }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Open Orders')
      XLSX.writeFile(wb, `open-sales-orders_${data.length}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (e: any) { setError(e.message) }
    setExporting(false)
  }

  const set = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }))
  const toggleSort = (key: string) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }
  const clear = () => {
    setFilters({}); setLateOnly(false); setOwedOnly(true); setMine(false); setPage(1)
  }
  const filtersOn = Object.values(filters).some(v => v.trim()) || lateOnly || mine || !owedOnly

  return (
    <div>
      {/* ── controls ── */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2 top-2.5 text-slate-400" />
            <input value={filters.f_part || ''} onChange={e => set('f_part', e.target.value)}
              placeholder="Customer part"
              className="pl-7 pr-2 py-1.5 text-sm border border-slate-300 rounded-lg w-44 font-mono" />
          </div>
          <input value={filters.f_cust || ''} onChange={e => set('f_cust', e.target.value)}
            placeholder="Customer"
            className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg w-44" />
          <input value={filters.f_so || ''} onChange={e => set('f_so', e.target.value)}
            placeholder="Sales order"
            className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg w-36 font-mono" />
          <select value={filters.f_status || ''} onChange={e => set('f_status', e.target.value)}
            className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg bg-white">
            <option value="">Any status</option>
            {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input type="checkbox" checked={owedOnly}
              onChange={e => { setOwedOnly(e.target.checked); setPage(1) }} />
            Owed only
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input type="checkbox" checked={lateOnly}
              onChange={e => { setLateOnly(e.target.checked); setPage(1) }} />
            Late
          </label>
          <button onClick={() => { setMine(m => !m); setPage(1) }}
            title="Only the parts you follow"
            className={`px-2.5 py-1.5 text-sm rounded-lg border inline-flex items-center gap-1.5 ${
              mine ? 'bg-amber-50 border-amber-300 text-amber-800'
                   : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
            <Star size={13} className={mine ? 'fill-amber-400 text-amber-500' : ''} />
            My parts{watched.size ? ` (${watched.size})` : ''}
          </button>
          {filtersOn && (
            <button onClick={clear}
              className="px-2 py-1.5 text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
              <X size={13} /> Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} disabled={exporting || !total}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
            {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />} Excel
          </button>
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /><div className="break-words">{error}</div>
        </div>
      )}

      {/* Totals follow the filter — that is the point of them. Filter to one
          part and this answers "how many do we still owe on it". */}
      {totals && <SalesOrderTotalsBar totals={totals} />}

      <p className="text-sm text-slate-500 mb-2">
        {loading ? 'Loading…' : <>
          {total.toLocaleString()} line{total === 1 ? '' : 's'} shown of{' '}
          {openLines.toLocaleString()} open
          {mine && watched.size === 0 && <> · you are not following any parts yet — use the stars</>}
        </>}
      </p>

      <SalesOrderTable
        rows={rows} sort={sort} onSort={toggleSort} onOpenPart={onOpenPart}
        watched={watched} onToggleWatch={toggleWatch} showWatch
      />

      {pages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm text-slate-600">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-2 py-1 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className="px-2 py-1 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ───────────────────────── one part, opened in a tab ─────────────────────────

/**
 * Resolves the customer part to an APC product and shows it.
 *
 * The mapping is not guaranteed to be one-to-one, so more than one match is
 * offered rather than guessed at, and no match says so plainly instead of
 * rendering an empty product form.
 */
function PartTab({ customerPart }: { customerPart: string }) {
  const [items, setItems] = useState<any[]>([])
  const [chosen, setChosen] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const res = await fetch(getApiUrl(
          `/api/products/by-customer-part?part=${encodeURIComponent(customerPart)}`))
        const d = await res.json()
        if (!res.ok) throw new Error(d.error || 'Lookup failed')
        if (!live) return
        setItems(d.items || [])
        if ((d.items || []).length === 1) setChosen(d.items[0])
      } catch (e: any) { if (live) setError(e.message) }
      if (live) setLoading(false)
    })()
    return () => { live = false }
  }, [customerPart])

  if (loading) {
    return <div className="flex items-center gap-2 py-16 justify-center text-slate-500">
      <RefreshCw size={18} className="animate-spin" /> Finding {customerPart}…
    </div>
  }
  if (error) {
    return <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" /><div>{error}</div>
    </div>
  }
  if (!items.length) {
    return (
      <div className="p-6 text-sm text-slate-600">
        <p className="mb-1">
          No APC product is registered against customer part{' '}
          <span className="font-mono text-slate-900">{customerPart}</span>.
        </p>
        <p className="text-slate-500">
          The sales order line exists in Paradigm, but nothing in Products carries
          that customer number — most often a part built before it was catalogued,
          or a number that differs by spacing or revision suffix.
        </p>
      </div>
    )
  }
  if (!chosen) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-600 mb-3">
          {items.length} APC parts carry customer part{' '}
          <span className="font-mono">{customerPart}</span>. Pick one:
        </p>
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {items.map(i => (
            <li key={i.id}>
              <button onClick={() => setChosen(i)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50">
                <span className="font-mono text-blue-700">{i.apcPN}</span>
                <span className="text-slate-500 text-sm"> · {i.description || 'no description'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <ProductEdit
      product={chosen}
      readOnly
      onSave={() => {}}
      onCancel={() => setChosen(items.length > 1 ? null : chosen)}
    />
  )
}
