'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, RefreshCw, AlertTriangle, Layers, X } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import RawMaterialTraceabilityTab from '@/components/inspections/RawMaterialTraceabilityTab'
import CertInventoryTab from '@/components/inspections/CertInventoryTab'
import { productTypeForWorkOrder } from '@/lib/inspections/productType'

/**
 * Operations -> Inspections -> Material Traceability.
 *
 * The same report the Material Certs tab runs inside a First Article, reached
 * without one. Quality gets asked "what went into this job" for work orders
 * that have no FAI on them, and before this the only way in was to create an
 * inspection that nobody wanted.
 *
 * Two states, deliberately: look up a work order, then read the report. The
 * report component and the certificate archive are the SAME components the
 * FAI uses — not copies — so a fix to either lands in both places at once.
 */

type WorkOrder = {
  workOrder: string
  customerPart?: string
  pcbNumber?: string
  site?: string
  status?: string
}

export default function MaterialTraceabilityPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WorkOrder[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  /** The work order being read. null = the lookup screen. */
  const [selected, setSelected] = useState<WorkOrder | null>(null)
  const [tab, setTab] = useState<'raw-material' | 'archive'>('raw-material')

  const lookup = async () => {
    const wo = query.trim()
    if (!wo) return
    setLoading(true); setError(''); setResults([]); setSearched(false)
    try {
      const res = await fetch(getApiUrl(
        `/api/operations/inspections/lookup?workOrder=${encodeURIComponent(wo)}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      const rows: WorkOrder[] = d.workOrders || []
      setResults(rows)
      setSearched(true)
      // One hit is not a choice. Open it rather than making the user click a
      // radio button and then a second button to confirm what is already
      // the only option.
      if (rows.length === 1) setSelected(rows[0])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSearched(true)
    } finally { setLoading(false) }
  }

  /* ─────────────────────────── the report ─────────────────────────── */

  if (selected) {
    const prod = productTypeForWorkOrder(selected.pcbNumber, selected.customerPart)
    return (
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div className="min-w-0">
            {/* Closing returns to the lookup, not to the Inspections menu —
                the next question is usually another work order. */}
            <button onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-2">
              <ArrowLeft size={14} /> Look up another work order
            </button>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
              <span className="font-mono">{selected.workOrder}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                prod.type === 'ASM' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>
                {prod.type}
              </span>
            </h1>
            <p className="text-sm text-slate-600">
              {[selected.customerPart && `Customer part ${selected.customerPart}`,
                selected.pcbNumber, selected.site, selected.status]
                .filter(Boolean).join(' · ')}
            </p>
          </div>
          <button onClick={() => setSelected(null)} title="Close"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 mb-4 p-1 bg-slate-50 border border-slate-200 rounded-lg w-fit">
          {([['raw-material', 'Raw Material'], ['archive', 'Cert Archive']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                tab === id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'raw-material'
          ? <RawMaterialTraceabilityTab workOrder={selected.workOrder} />
          // No inspection here, so the archive is browse-and-download only;
          // the attach column hides itself.
          : <CertInventoryTab />}
      </div>
    )
  }

  /* ─────────────────────────── the lookup ─────────────────────────── */

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/operations/inspections"
          className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Material Traceability</h1>
      </div>
      <p className="text-sm text-slate-600 mb-6 ml-9">
        What was actually issued to a work order, from the material issue ledger —
        with the certificate for each lot.
      </p>

      <div className="max-w-2xl ml-9">
        <label className="block text-sm font-medium text-slate-700 mb-1">Work Order Number</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} autoFocus
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') lookup() }}
              placeholder="357639"
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button onClick={lookup} disabled={loading || !query.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? 'Looking up…' : 'Look Up'}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          The six-digit number is enough — the splits and suffixes are matched for you.
        </p>

        {error && (
          <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div className="min-w-0 break-words">{error}</div>
          </div>
        )}

        {!!results.length && (
          <div className="mt-5">
            <div className="text-sm font-medium text-slate-700 mb-2">
              Select Work Order ({results.length})
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Work Order</th>
                    <th className="px-3 py-2">Customer Part</th>
                    <th className="px-3 py-2">Inv Part Number</th>
                    <th className="px-3 py-2">Site</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map(wo => {
                    const prod = productTypeForWorkOrder(wo.pcbNumber, wo.customerPart)
                    return (
                      <tr key={wo.workOrder} onClick={() => setSelected(wo)}
                        className="hover:bg-blue-50/60 cursor-pointer">
                        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-blue-700">
                          {wo.workOrder}
                        </td>
                        <td className="px-3 py-2 text-xs">{wo.customerPart || '—'}</td>
                        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                          {wo.pcbNumber || <span className="text-slate-300">—</span>}
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                            prod.type === 'ASM' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>
                            {prod.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">{wo.site || '—'}</td>
                        <td className="px-3 py-2 text-xs text-amber-700">{wo.status || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {searched && !results.length && !error && (
          <div className="mt-5 flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
            <Layers size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              No open work orders match <span className="font-mono">{query.trim()}</span> in
              the last 12 months. A closed or older job will not appear here even though its
              material issues are still on the ledger.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
