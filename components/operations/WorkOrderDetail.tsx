'use client'

import { useState, useEffect } from 'react'
import { ClipboardList, Route as RouteIcon, FileCheck, ClipboardCheck, RefreshCw } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import ReleasedFilesTab from '@/components/products/ReleasedFilesTab'

type WorkOrderDetailProps = {
  workOrder: string
  // Row values from the Daily Plan table (shown immediately on the General tab)
  row?: Record<string, any>
}

type RouteStep = {
  STEP_NUMBER: number
  DEPT_CODE: string
  DEPT_NAME: string
  PERCENT_COMPLETE: number | null
}

const TABS = [
  { id: 'general', label: 'General', icon: ClipboardList },
  { id: 'route', label: 'Route', icon: RouteIcon },
  { id: 'final-inspection', label: 'Final Inspection', icon: ClipboardCheck },
  { id: 'po-certs', label: 'PO Certs', icon: FileCheck },
]

// Fields shown on the General tab, sourced from the Daily Plan row / WO query.
const GENERAL_FIELDS: { key: string; label: string }[] = [
  { key: 'WORK_ORDER', label: 'Work Order' },
  { key: 'WO_STATUS', label: 'Status' },
  { key: 'CUSTOMER', label: 'Customer' },
  { key: 'CUSTOMER_PN', label: 'Customer Part #' },
  { key: 'INVENTORY_PN', label: 'Inventory Part #' },
  { key: 'DESCRIPTION', label: 'Description' },
  { key: 'PTY', label: 'Priority' },
  { key: 'QTY_SCHEDULED', label: 'Qty Scheduled' },
  { key: 'PARTS_PER_PANEL', label: 'Parts / Panel' },
  { key: 'SCH_COMPLETE', label: 'Sch Complete' },
  { key: 'ANALYSIS_CODE_3', label: 'Analysis Code 3' },
  { key: 'ANALYSIS_CODE_5', label: 'Analysis Code 5' },
]

export default function WorkOrderDetail({ workOrder, row }: WorkOrderDetailProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [general, setGeneral] = useState<Record<string, any> | null>(null)
  const [route, setRoute] = useState<RouteStep[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)

  // The 5-digit customer part number drives the Final Inspection + PO Cert tabs.
  const customerPart = String(
    general?.CUSTOMER_PN ?? row?.CUSTOMER_PART_NUMBER ?? ''
  ).trim()
  const customer = String(general?.CUSTOMER ?? row?.ABBR_NAME ?? '').trim()

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/operations/daily-plan/work-order?workOrder=${encodeURIComponent(workOrder)}`))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed to load')
      const r = await res.json()
      setGeneral(r.general || null)
      setRoute(r.route || [])
      setFetched(true)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  useEffect(() => { if (!fetched) load() /* eslint-disable-next-line */ }, [])

  const fmt = (v: any) => {
    if (v == null || v === '') return '—'
    // Dates
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d.toLocaleDateString()
    }
    return String(v)
  }

  // Merge the WO query result over the incoming row for the General display.
  const generalData: Record<string, any> = { ...(row || {}), ...(general || {}) }

  return (
    <div className="flex gap-0 min-h-[400px]">
      {/* Left rail */}
      <div className="w-52 flex-shrink-0 border-r border-slate-200 pr-0">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                active ? 'bg-blue-600 text-white font-medium rounded-lg' : 'text-slate-600 hover:bg-slate-100 rounded-lg'
              }`}>
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 pl-6 min-w-0">
        {activeTab === 'general' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">General</h3>
              <button onClick={load} disabled={loading}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {GENERAL_FIELDS.map(f => (
                <div key={f.key} className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{f.label}</span>
                  <span className="text-sm text-slate-800">{fmt(generalData[f.key])}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'route' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Route <span className="font-normal text-slate-400 text-sm">({route.length} steps)</span></h3>
              <button onClick={load} disabled={loading}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-slate-500"><RefreshCw size={18} className="animate-spin" /> Loading route…</div>
            ) : route.length === 0 ? (
              <p className="text-sm text-slate-400">No route steps found for this work order.</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-16">Step</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Dept Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Dept Name</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-24">% Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {route.map((s, i) => (
                      <tr key={`${s.STEP_NUMBER}-${i}`} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-800 tabular-nums">{s.STEP_NUMBER}</td>
                        <td className="px-3 py-2 font-mono text-slate-700">{s.DEPT_CODE}</td>
                        <td className="px-3 py-2 text-slate-600">{s.DEPT_NAME}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                          {s.PERCENT_COMPLETE == null ? '—' : `${s.PERCENT_COMPLETE}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Final Inspection + PO Certs reuse the exact ReleasedFilesTab engine,
            focused on the single sub-tab and driven by the customer part number. */}
        {activeTab === 'final-inspection' && (
          customerPart ? (
            <ReleasedFilesTab partNumber={customerPart} customer={customer}
              initialSubTab="final-inspection" onlySubTabs={['final-inspection']} />
          ) : (
            <p className="text-sm text-amber-600">No customer part number on this work order — cannot load Final Inspection.</p>
          )
        )}

        {activeTab === 'po-certs' && (
          customerPart ? (
            <ReleasedFilesTab partNumber={customerPart} customer={customer}
              initialSubTab="po-certs" onlySubTabs={['po-certs']} />
          ) : (
            <p className="text-sm text-amber-600">No customer part number on this work order — cannot load PO Certs.</p>
          )
        )}
      </div>
    </div>
  )
}
