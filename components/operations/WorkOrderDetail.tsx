'use client'

import { useState, useEffect, Fragment } from 'react'
import { ClipboardList, Route as RouteIcon, FileCheck, ClipboardCheck, RefreshCw, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import ReleasedFilesTab from '@/components/products/ReleasedFilesTab'

// Groups a step row + its (optional) expanded detail row under one key.
const FragmentRow = ({ children }: { children: React.ReactNode }) => <Fragment>{children}</Fragment>

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
  INSTRUCTION_CODES?: string | null
  INSTRUCTION_TEXT?: string | null
  PARAMETERS?: string | null
  PARAMETER_NAMES?: string | null
  EXT_PARAMETERS?: string | null
}

type HistoryStep = {
  STEP_NO: number
  WORK_CENTER: string
  WORK_CENTER_NAME: string
  DATE_IN: string | null
  TIME_IN: number | null
  QUAN_IN_BKLG: number | null
  QUAN_PROD: number | null
}

const TABS = [
  { id: 'general', label: 'General', icon: ClipboardList },
  { id: 'route', label: 'Route', icon: RouteIcon },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'final-inspection', label: 'Final Inspection', icon: ClipboardCheck },
  { id: 'po-certs', label: 'PO Certs', icon: FileCheck },
]

// Fields shown on the General tab, sourced directly from the Daily Plan row.
const GENERAL_FIELDS: { key: string; label: string }[] = [
  { key: 'WORK_ORDER', label: 'Work Order' },
  { key: 'LOCATION', label: 'Status / Location' },
  { key: 'ABBR_NAME', label: 'Customer' },
  { key: 'CUSTOMER_PART_NUMBER', label: 'Customer Part #' },
  { key: 'INV_PART_NUMBER', label: 'Inventory Part #' },
  { key: 'INV_PART_DESCRIPTION', label: 'Description' },
  { key: 'PTY', label: 'Priority' },
  { key: 'SCHED', label: 'Qty Scheduled' },
  { key: 'BKLG', label: 'Backlog' },
  { key: 'NRUP', label: 'Parts / Panel' },
  { key: 'STEP', label: 'Step' },
  { key: 'CURRENT_STEP_OF_STEPS', label: 'Step Of' },
  { key: 'DATE_IN', label: 'Date In' },
  { key: 'SCH_COMP', label: 'Sch Complete' },
  { key: 'PROD_CODE', label: 'Prod Code' },
  { key: 'PROD_LINE', label: 'Prod Line' },
  { key: 'ANALYSIS_CODE_3', label: 'Analysis Code 3' },
  { key: 'ANALYSIS_CODE_5', label: 'Analysis Code 5' },
]

export default function WorkOrderDetail({ workOrder, row }: WorkOrderDetailProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [general, setGeneral] = useState<Record<string, any> | null>(null)
  const [route, setRoute] = useState<RouteStep[]>([])
  const [history, setHistory] = useState<HistoryStep[]>([])
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)

  // The 5-digit customer part number drives the Final Inspection + PO Cert tabs.
  // Prefer the table row (reliably populated); fall back to the WO query.
  const customerPart = String(
    row?.CUSTOMER_PART_NUMBER ?? general?.CUSTOMER_PN ?? ''
  ).trim()
  const customer = String(row?.ABBR_NAME ?? general?.CUSTOMER ?? '').trim()

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/operations/daily-plan/work-order?workOrder=${encodeURIComponent(workOrder)}`))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed to load')
      const r = await res.json()
      setGeneral(r.general || null)
      setRoute(r.route || [])
      setHistory(r.history || [])
      setCurrentStep(r.currentStep ?? null)
      setFetched(true)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  // Route data is fetched lazily the first time the Route tab is opened.
  useEffect(() => {
    if ((activeTab === 'route' || activeTab === 'history') && !fetched && !loading) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const fmt = (v: any) => {
    if (v == null || v === '') return '—'
    // Dates
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d.toLocaleDateString()
    }
    return String(v)
  }

  // Prefer the table row for the General display (reliably populated); the WO
  // query only supplements any fields the row doesn't carry.
  const generalData: Record<string, any> = { ...(general || {}), ...(row || {}) }

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
            <h3 className="text-lg font-semibold text-slate-800 mb-4">General</h3>
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
              <h3 className="text-lg font-semibold text-slate-800">
                Route <span className="font-normal text-slate-400 text-sm">({route.length} steps)</span>
                {currentStep != null && route.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-blue-600">· currently at step {currentStep}</span>
                )}
              </h3>
              <button onClick={load} disabled={loading}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-slate-500"><RefreshCw size={18} className="animate-spin" /> Loading route…</div>
            ) : route.length === 0 ? (
              <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">
                No route for this work order. Work orders in backlog or unreleased don’t have a route yet.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-2 w-8"></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-16">Step</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Dept Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Dept Name</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-28">% Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {route.map((s, i) => {
                      const isCurrent = currentStep != null && s.STEP_NUMBER === currentStep
                      const isDone = currentStep != null && s.STEP_NUMBER < currentStep
                      const hasDetail = !!(s.INSTRUCTION_CODES?.trim() || s.INSTRUCTION_TEXT?.trim() || s.PARAMETERS?.trim() || s.PARAMETER_NAMES?.trim() || s.EXT_PARAMETERS?.trim())
                      const open = expandedSteps.has(s.STEP_NUMBER)
                      return (
                        <FragmentRow key={`${s.STEP_NUMBER}-${i}`}>
                          <tr
                            className={`border-t border-slate-100 ${isCurrent ? 'bg-blue-50' : isDone ? 'bg-slate-50/60' : ''} ${hasDetail ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                            onClick={() => {
                              if (!hasDetail) return
                              setExpandedSteps(prev => {
                                const n = new Set(prev); n.has(s.STEP_NUMBER) ? n.delete(s.STEP_NUMBER) : n.add(s.STEP_NUMBER); return n
                              })
                            }}>
                            <td className="px-2 py-2 text-center text-slate-400">
                              {hasDetail ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                            </td>
                            <td className="px-3 py-2 tabular-nums">
                              <span className={`inline-flex items-center gap-1 ${isCurrent ? 'font-semibold text-blue-700' : 'text-slate-800'}`}>
                                {s.STEP_NUMBER}
                                {isCurrent && <span className="text-[10px] uppercase tracking-wide bg-blue-600 text-white px-1.5 py-0.5 rounded">current</span>}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-700">{s.DEPT_CODE || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{s.DEPT_NAME || '—'}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                              {s.PERCENT_COMPLETE == null ? '—' : `${s.PERCENT_COMPLETE}%`}
                            </td>
                          </tr>
                          {open && hasDetail && (
                            <tr className="border-t border-slate-100 bg-slate-50">
                              <td></td>
                              <td colSpan={4} className="px-3 py-3">
                                <div className="space-y-2 text-xs">
                                  {s.INSTRUCTION_CODES?.trim() && (
                                    <div><span className="font-medium text-slate-500 uppercase tracking-wide">Instructions: </span>
                                      <span className="font-mono text-slate-700">{s.INSTRUCTION_CODES}</span></div>
                                  )}
                                  {s.INSTRUCTION_TEXT?.trim() && (
                                    <div className="text-slate-600">{s.INSTRUCTION_TEXT}</div>
                                  )}
                                  {s.PARAMETER_NAMES?.trim() && (
                                    <div><span className="font-medium text-slate-500 uppercase tracking-wide">Parameters: </span>
                                      <span className="text-slate-700">{s.PARAMETER_NAMES}</span></div>
                                  )}
                                  {s.PARAMETERS?.trim() && (
                                    <div><span className="font-medium text-slate-500 uppercase tracking-wide">Values: </span>
                                      <span className="font-mono text-slate-700">{s.PARAMETERS}</span></div>
                                  )}
                                  {s.EXT_PARAMETERS?.trim() && (
                                    <div>
                                      <span className="font-medium text-slate-500 uppercase tracking-wide">Additional Parameters: </span>
                                      <div className="mt-0.5 space-y-0.5">
                                        {s.EXT_PARAMETERS.split('; ').map((line, li) => (
                                          <div key={li} className="font-mono text-slate-700">{line}</div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </FragmentRow>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Final Inspection + PO Certs reuse the exact ReleasedFilesTab engine,
            focused on the single sub-tab and driven by the customer part number. */}
        {activeTab === 'history' && (() => {
          // Build entry timestamps per step from DATA9469, then compute dwell as
          // the gap to the NEXT recorded entry (or now, for the last one).
          const toTs = (dateIn: string | null, timeIn: number | null): number | null => {
            if (!dateIn) return null
            const d = new Date(dateIn)
            if (isNaN(d.getTime())) return null
            const t = Math.trunc(Number(timeIn ?? 0))
            const s = String(t).padStart(6, '0')
            d.setHours(Number(s.slice(0, 2)) || 0, Number(s.slice(2, 4)) || 0, Number(s.slice(4, 6)) || 0, 0)
            return d.getTime()
          }
          const hist = [...history].sort((a, b) => a.STEP_NO - b.STEP_NO)
          const entries = hist.map(h => ({ step: h.STEP_NO, ts: toTs(h.DATE_IN, h.TIME_IN), h }))
          const dwellByStep = new Map<number, string>()
          const dateByStep = new Map<number, { date: string; time: number | null }>()
          const now = Date.now()
          entries.forEach((e, i) => {
            if (e.h.DATE_IN) dateByStep.set(e.step, { date: e.h.DATE_IN, time: e.h.TIME_IN })
            if (e.ts == null) return
            const nextTs = entries.slice(i + 1).find(n => n.ts != null)?.ts ?? now
            const ms = Math.max(0, nextTs - e.ts)
            const totalH = Math.floor(ms / 3_600_000)
            const d = Math.floor(totalH / 24)
            const h = totalH % 24
            dwellByStep.set(e.step, d > 0 ? `${d}d ${h}h` : `${h}h`)
          })
          const activeSteps = new Set(hist.map(h => h.STEP_NO))
          const fmtEntry = (step: number) => {
            const e = dateByStep.get(step)
            if (!e) return '—'
            const d = new Date(e.date)
            if (isNaN(d.getTime())) return '—'
            const ds = d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' })
            if (e.time == null) return ds
            const s = String(Math.trunc(e.time)).padStart(6, '0')
            return `${ds} ${s.slice(0, 2)}:${s.slice(2, 4)}`
          }
          // Prefer the full route as the skeleton; fall back to history-only if no route.
          const skeleton = route.length
            ? route.map(r => ({ step: r.STEP_NUMBER, code: r.DEPT_CODE, name: r.DEPT_NAME }))
            : hist.map(h => ({ step: h.STEP_NO, code: h.WORK_CENTER, name: h.WORK_CENTER_NAME }))

          return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Step History
                  {currentStep != null && <span className="ml-2 text-sm font-normal text-blue-600">· currently at step {currentStep}</span>}
                </h3>
                <button onClick={load} disabled={loading}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
              {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              {loading ? (
                <div className="flex items-center gap-2 py-8 text-slate-500"><RefreshCw size={18} className="animate-spin" /> Loading history…</div>
              ) : skeleton.length === 0 ? (
                <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  No route or step history for this work order (backlog / not yet started).
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-16">Step</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Dept</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-40">Entered</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-28">Time at Step</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skeleton.map((s, i) => {
                        const active = activeSteps.has(s.step)
                        const isCurrent = currentStep != null && s.step === currentStep
                        const dwell = dwellByStep.get(s.step)
                        return (
                          <tr key={`${s.step}-${i}`} className={`border-t border-slate-100 ${isCurrent ? 'bg-blue-50' : active ? 'bg-slate-50/60' : ''}`}>
                            <td className="px-3 py-2 tabular-nums">
                              <span className={`inline-flex items-center gap-1 ${isCurrent ? 'font-semibold text-blue-700' : 'text-slate-800'}`}>
                                {s.step}
                                {isCurrent && <span className="text-[10px] uppercase tracking-wide bg-blue-600 text-white px-1.5 py-0.5 rounded">current</span>}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-700">{s.code || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{s.name || '—'}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{fmtEntry(s.step)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                              {dwell ? <span className={isCurrent ? 'text-blue-700 font-medium' : ''}>{dwell}{isCurrent ? ' (so far)' : ''}</span> : <span className="text-slate-300">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <p className="text-xs text-slate-400 px-3 py-2 border-t border-slate-100">
                    Time at step is the gap between recorded step entries (from production transactions). Steps with no recorded activity show “—”.
                  </p>
                </div>
              )}
            </div>
          )
        })()}

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
