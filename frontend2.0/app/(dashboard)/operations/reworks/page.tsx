'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Wrench, Plus, Search, RefreshCw, X, BarChart3, ChevronDown, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getApiUrl } from '@/lib/api'
import { canWriteScope } from '@/lib/config/access'
import ReworkDetail from '@/components/reworks/ReworkDetail'
import StepPicker, { Step } from '@/components/reworks/StepPicker'

type Rework = {
  id: number; rework_number: string; customer_name: string | null; customer_part: string | null
  work_order: string | null; pcb_number: string | null; inspection_report: string | null
  authorized_by: string | null; rework_date: string | null; status: string; site: string | null; created_at: string
}

const STATUSES = ['Open', 'Closed', 'Canceled']
const STATUS_COLORS: Record<string, string> = { Open: '#f59e0b', Closed: '#22c55e', Canceled: '#94a3b8' }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open: 'bg-amber-100 text-amber-700', Closed: 'bg-green-100 text-green-700', Canceled: 'bg-slate-200 text-slate-600',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white border border-slate-200 rounded-lg flex-shrink-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 px-4 py-3 text-left">
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        {icon}<span className="text-sm font-medium text-slate-700">{title}</span>
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  )
}

export default function ReworksPage() {
  const { data: session } = useSession()
  const roles = (session?.user?.roles || []) as string[]
  const username = (session?.user as any)?.username || session?.user?.name || ''
  const canCreate = canWriteScope(roles, 'operations/reworks')

  const [data, setData] = useState<Rework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openTabs, setOpenTabs] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<string>('list')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [lookupMode, setLookupMode] = useState<'wo' | 'part'>('wo')
  const [lookupVal, setLookupVal] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupResults, setLookupResults] = useState<any[]>([])
  const [selectedWO, setSelectedWO] = useState<any>(null)
  const [form, setForm] = useState<any>({ inspectionReport: '', authorizedBy: '', reworkDate: '', discrepancy: '' })
  const [steps, setSteps] = useState<Step[]>([])
  const [createError, setCreateError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/operations/reworks'))
      if (!res.ok) throw new Error('Failed to load reworks')
      setData((await res.json()).data || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const r of data) c[r.status] = (c[r.status] || 0) + 1
    return c
  }, [data])

  const chartData = useMemo(() =>
    STATUSES.map(s => ({ name: s, value: statusCounts[s] || 0, color: STATUS_COLORS[s] })).filter(d => d.value > 0),
    [statusCounts])

  const filtered = useMemo(() => {
    let rows = data
    if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        [r.rework_number, r.customer_name, r.customer_part, r.work_order, r.pcb_number, r.authorized_by, r.site]
          .some(v => (v || '').toLowerCase().includes(q)))
    }
    return rows
  }, [data, statusFilter, search])

  const openCreate = () => {
    setLookupMode('wo'); setLookupVal(''); setLookupResults([]); setSelectedWO(null)
    setForm({ inspectionReport: '', authorizedBy: username, reworkDate: new Date().toISOString().slice(0, 10), discrepancy: '' })
    setSteps([]); setCreateError(''); setShowCreate(true)
  }

  const handleLookup = async () => {
    if (!lookupVal.trim()) return
    setLookingUp(true); setCreateError(''); setLookupResults([]); setSelectedWO(null)
    try {
      const param = lookupMode === 'wo'
        ? `workOrder=${encodeURIComponent(lookupVal.trim())}`
        : `partNumber=${encodeURIComponent(lookupVal.trim())}`
      const res = await fetch(getApiUrl(`/api/operations/reworks/lookup?${param}`))
      if (!res.ok) throw new Error((await res.json()).error || 'Lookup failed')
      const r = await res.json()
      if (!r.workOrders?.length) setCreateError('No matching work orders found')
      setLookupResults(r.workOrders || [])
    } catch (e: any) { setCreateError(e.message) }
    finally { setLookingUp(false) }
  }

  const handleCreate = async () => {
    if (!selectedWO) { setCreateError('Select a work order'); return }
    setSubmitting(true); setCreateError('')
    try {
      const res = await fetch(getApiUrl('/api/operations/reworks'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: selectedWO.customerName, customerPart: selectedWO.customerPart,
          workOrder: selectedWO.workOrder, pcbNumber: selectedWO.pcbNumber, site: selectedWO.site,
          inspectionReport: form.inspectionReport, authorizedBy: form.authorizedBy,
          reworkDate: form.reworkDate || null, discrepancy: form.discrepancy,
          steps: steps.map(s => ({ code: s.code, name: s.name, notes: s.notes })),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Create failed')
      setShowCreate(false); fetchData()
    } catch (e: any) { setCreateError(e.message) }
    finally { setSubmitting(false) }
  }

  const handleRowClick = (id: number) => {
    if (!openTabs.includes(id)) setOpenTabs(prev => [...prev, id])
    setActiveTab(`rw-${id}`)
  }
  const closeTab = (id: number) => { setOpenTabs(prev => prev.filter(t => t !== id)); setActiveTab('list') }

  // ─── Detail tab view ───
  if (activeTab.startsWith('rw-')) {
    const id = parseInt(activeTab.replace('rw-', ''))
    return (
      <div className="p-6 h-[calc(100vh-4rem)]">
        <div className="border-b border-slate-200 mb-4 flex gap-1 overflow-x-auto">
          <button onClick={() => setActiveTab('list')} className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap">All Reworks</button>
          {openTabs.map(tabId => {
            const rw = data.find(d => d.id === tabId)
            return (
              <button key={tabId} onClick={() => setActiveTab(`rw-${tabId}`)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === `rw-${tabId}` ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                {rw?.rework_number || `#${tabId}`}
                <span onClick={e => { e.stopPropagation(); closeTab(tabId) }} className="p-0.5 hover:bg-slate-200 rounded"><X size={14} /></span>
              </button>
            )
          })}
        </div>
        <div className="h-[calc(100%-3rem)] bg-white rounded-lg border border-slate-200 px-4">
          <ReworkDetail reworkId={id} onClose={() => closeTab(id)} onDataChange={fetchData} />
        </div>
      </div>
    )
  }

  // ─── List view ───
  return (
    <div className="p-6 flex flex-col gap-4 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex items-center gap-3 flex-shrink-0">
        <Wrench size={22} className="text-blue-600" />
        <h2 className="text-xl font-bold text-slate-800">Reworks</h2>
        <span className="text-sm text-slate-500">({data.length})</span>
        <div className="flex-1" />
        {canCreate && (
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"><Plus size={16} /> New Rework</button>
        )}
        <button onClick={fetchData} disabled={loading} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <Panel title="Dashboard" icon={<BarChart3 size={16} className="text-blue-600" />}>
        <div className="p-4">
          {chartData.length === 0 ? <p className="text-sm text-slate-400 italic">No reworks yet</p> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>{chartData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${statusFilter === s ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
            {s === 'all' ? 'All' : s} ({s === 'all' ? data.length : (statusCounts[s] || 0)})
          </button>
        ))}
      </div>

      <div className="relative max-w-md flex-shrink-0">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rework#, part#, work order, customer, site..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-y-auto flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr className="border-b border-slate-200">
              {['Rework #', 'Customer', 'APC Part', 'Work Order', 'PCB Number', 'Insp Report', 'Authorized By', 'Status', 'Site', 'Date'].map(h => (
                <th key={h} className="px-3 py-3 text-left font-medium text-slate-600 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500"><RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">No reworks found</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} onClick={() => handleRowClick(r.id)} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
                <td className="px-3 py-2.5 font-semibold text-slate-800">{r.rework_number}</td>
                <td className="px-3 py-2.5 text-slate-600">{r.customer_name || '—'}</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">{r.customer_part || '—'}</td>
                <td className="px-3 py-2.5 font-mono text-slate-600 text-xs">{r.work_order || '—'}</td>
                <td className="px-3 py-2.5 font-mono text-slate-600 text-xs">{r.pcb_number || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{r.inspection_report || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{r.authorized_by || '—'}</td>
                <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2.5 text-slate-500">{r.site || '—'}</td>
                <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{r.rework_date ? new Date(r.rework_date).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">New Rework</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {createError && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{createError}</div>}

              {/* Lookup */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
                  <button onClick={() => { setLookupMode('wo'); setLookupResults([]); setSelectedWO(null) }} className={`px-3 py-1.5 ${lookupMode === 'wo' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>By Work Order</button>
                  <button onClick={() => { setLookupMode('part'); setLookupResults([]); setSelectedWO(null) }} className={`px-3 py-1.5 ${lookupMode === 'part' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>By Part #</button>
                </div>
                <input value={lookupVal} onChange={e => setLookupVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLookup() }}
                  placeholder={lookupMode === 'wo' ? 'Work order e.g. 76181' : 'Customer part # (DATA0050)'}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <button onClick={handleLookup} disabled={lookingUp || !lookupVal.trim()} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">{lookingUp ? 'Searching…' : 'Search'}</button>
              </div>

              {/* Results */}
              {lookupResults.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0"><tr>
                      <th className="px-2 py-1.5 w-8"></th>
                      {['Work Order', 'Customer', 'APC Part', 'PCB #', 'Status', 'Site'].map(h => <th key={h} className="px-2 py-1.5 text-left text-xs font-medium text-slate-600">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {lookupResults.map((w, i) => (
                        <tr key={i} onClick={() => setSelectedWO(w)} className={`border-t border-slate-100 cursor-pointer ${selectedWO === w ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-2 py-1.5 text-center"><input type="radio" checked={selectedWO === w} onChange={() => setSelectedWO(w)} /></td>
                          <td className="px-2 py-1.5 font-mono text-xs">{w.workOrder}</td>
                          <td className="px-2 py-1.5 text-xs">{w.customerName || '—'}</td>
                          <td className="px-2 py-1.5 font-mono text-xs">{w.customerPart}</td>
                          <td className="px-2 py-1.5 font-mono text-xs">{w.pcbNumber}</td>
                          <td className="px-2 py-1.5 text-xs">{w.status}</td>
                          <td className="px-2 py-1.5 text-xs">{w.site}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedWO && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3">
                    <div><p className="text-xs text-slate-500 uppercase">Customer</p><p className="text-sm text-slate-800">{selectedWO.customerName || '—'}</p></div>
                    <div><p className="text-xs text-slate-500 uppercase">APC Part #</p><p className="text-sm text-slate-800 font-mono">{selectedWO.customerPart}</p></div>
                    <div><p className="text-xs text-slate-500 uppercase">Work Order</p><p className="text-sm text-slate-800 font-mono">{selectedWO.workOrder}</p></div>
                    <div><p className="text-xs text-slate-500 uppercase">PCB Number</p><p className="text-sm text-slate-800 font-mono">{selectedWO.pcbNumber}</p></div>
                    <div><p className="text-xs text-slate-500 uppercase">Site</p><p className="text-sm text-slate-800">{selectedWO.site}</p></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Inspection Report #</label>
                      <input value={form.inspectionReport} onChange={e => setForm((f: any) => ({ ...f, inspectionReport: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Authorized By</label>
                      <input value={form.authorizedBy} onChange={e => setForm((f: any) => ({ ...f, authorizedBy: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Date</label>
                      <input type="date" value={form.reworkDate} onChange={e => setForm((f: any) => ({ ...f, reworkDate: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Discrepancy</label>
                    <textarea value={form.discrepancy} onChange={e => setForm((f: any) => ({ ...f, discrepancy: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Rework Steps / Special Instructions</label>
                    <StepPicker steps={steps} onChange={setSteps} />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleCreate} disabled={submitting || !selectedWO} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Creating…' : 'Create Rework'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
