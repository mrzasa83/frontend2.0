'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  RefreshCw, Search, Plus, ArrowLeft, X, ClipboardCheck,
  ChevronDown, ChevronRight, BarChart3, Link2, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getApiUrl } from '@/lib/api'
import InspectionDetail from '@/components/inspections/InspectionDetail'

type Inspection = {
  id: number; inspection_number: string; inspection_type: string; product_type: string
  part_number: string | null; work_order: string | null; start_date: string | null
  owner: string | null; phase: string; site: string | null; dependency_id: number | null
  notes: string | null; created_by: string; created_at: string
}

const PHASES = ['Setup', 'Measurement', 'Verify', 'Submitted', 'Rework', 'Completed', 'Canceled']
const PHASE_COLORS: Record<string, string> = {
  Setup: 'bg-slate-100 text-slate-600',
  Measurement: 'bg-blue-100 text-blue-700',
  Verify: 'bg-indigo-100 text-indigo-700',
  Submitted: 'bg-yellow-100 text-yellow-700',
  Rework: 'bg-orange-100 text-orange-700',
  Completed: 'bg-green-100 text-green-700',
  Canceled: 'bg-red-100 text-red-700',
}
const CHART_COLORS: Record<string, string> = {
  Setup: '#94a3b8', Measurement: '#3b82f6', Verify: '#6366f1',
  Submitted: '#eab308', Rework: '#f97316', Completed: '#22c55e', Canceled: '#ef4444',
}

function PhaseBadge({ phase }: { phase: string }) {
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${PHASE_COLORS[phase] || 'bg-slate-100 text-slate-600'}`}>{phase}</span>
}

function Panel({ title, icon, defaultOpen, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50">
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        {icon}
        <span className="text-sm font-semibold text-slate-700">{title}</span>
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  )
}

export default function FirstArticlePage() {
  const { data: session } = useSession()
  const [data, setData] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [openTabs, setOpenTabs] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<string>('list')
  const [showCreate, setShowCreate] = useState(false)

  // Lookup workflow
  const [lookupMode, setLookupMode] = useState<'part' | 'wo'>('part')
  const [lookupPart, setLookupPart] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupWorkOrders, setLookupWorkOrders] = useState<any[]>([])
  const [selectedWO, setSelectedWO] = useState<any>(null)
  const [createForm, setCreateForm] = useState({
    owner: '', startDate: new Date().toISOString().split('T')[0], dependencyId: '', notes: ''
  })
  const [createError, setCreateError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const roles: string[] = session?.user?.roles || []
  const username = (session?.user as any)?.username || session?.user?.name || ''
  const canCreate = roles.some(r => ['Admin', 'Quality Control', 'Operations', 'Production Control'].includes(r))

  // Determine PCB vs ASM from part number prefix (7 = PCB, 1 = ASM)
  const productTypeFromPart = (part: string): string => {
    const p = (part || '').trim()
    if (p.startsWith('7')) return 'PCB'
    if (p.startsWith('1')) return 'ASM'
    return 'PCB'
  }

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/operations/inspections?type=First Article'))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setData(r.data || [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const phaseCounts = useMemo(() => {
    const c: Record<string, number> = { all: data.length }
    data.forEach(r => { c[r.phase] = (c[r.phase] || 0) + 1 })
    return c
  }, [data])

  const chartData = useMemo(() =>
    PHASES.map(p => ({ name: p, value: phaseCounts[p] || 0, color: CHART_COLORS[p] }))
      .filter(d => d.value > 0),
  [phaseCounts])

  const filtered = useMemo(() => {
    let rows = data
    if (phaseFilter !== 'all') rows = rows.filter(r => r.phase === phaseFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r.inspection_number.toLowerCase().includes(q) ||
        String(r.part_number || '').toLowerCase().includes(q) ||
        String(r.work_order || '').toLowerCase().includes(q) ||
        String(r.owner || '').toLowerCase().includes(q) ||
        String(r.site || '').toLowerCase().includes(q)
      )
    }
    return rows
  }, [data, search, phaseFilter])

  const depMap = useMemo(() => {
    const m: Record<number, string> = {}
    data.forEach(r => { m[r.id] = r.inspection_number })
    return m
  }, [data])

  const openCreate = () => {
    setLookupPart(''); setLookupWorkOrders([]); setSelectedWO(null)
    setCreateForm({ owner: username, startDate: new Date().toISOString().split('T')[0], dependencyId: '', notes: '' })
    setCreateError(''); setShowCreate(true)
  }

  const handleLookup = async () => {
    if (!lookupPart.trim()) return
    setLookingUp(true); setCreateError(''); setLookupWorkOrders([]); setSelectedWO(null)
    try {
      const param = lookupMode === 'wo'
        ? `workOrder=${encodeURIComponent(lookupPart.trim())}`
        : `partNumber=${encodeURIComponent(lookupPart.trim())}`
      const res = await fetch(getApiUrl(`/api/operations/inspections/lookup?${param}`))
      if (!res.ok) throw new Error((await res.json()).details || 'Lookup failed')
      const r = await res.json()
      if (!r.workOrders?.length) {
        setCreateError(lookupMode === 'wo'
          ? 'No open work orders match that number'
          : 'No open work orders found for parts using this part number')
      }
      setLookupWorkOrders(r.workOrders || [])
    } catch (e: any) { setCreateError(e.message) }
    setLookingUp(false)
  }

  const handleCreate = async () => {
    setCreateError('')
    if (!selectedWO) { setCreateError('Select a work order'); return }
    setSubmitting(true)
    try {
      const res = await fetch(getApiUrl('/api/operations/inspections'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectionType: 'First Article',
          productType: productTypeFromPart(selectedWO.customerPart),
          partNumber: selectedWO.customerPart,
          workOrder: selectedWO.workOrder,
          startDate: createForm.startDate || null,
          owner: createForm.owner || username,
          site: selectedWO.site || null,
          dependencyId: createForm.dependencyId || null,
          notes: createForm.notes || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setShowCreate(false)
      fetchData()
    } catch (e: any) { setCreateError(e.message) }
    setSubmitting(false)
  }

  const handleRowClick = (id: number) => {
    if (!openTabs.includes(id)) setOpenTabs(prev => [...prev, id])
    setActiveTab(`insp-${id}`)
  }
  const closeTab = (id: number) => { setOpenTabs(prev => prev.filter(t => t !== id)); setActiveTab('list') }

  // ─── Detail view (tabbed, like Changes apps) ───────────────
  if (activeTab.startsWith('insp-')) {
    const id = parseInt(activeTab.replace('insp-', ''))
    return (
      <div className="p-6 h-[calc(100vh-4rem)]">
        <div className="border-b border-slate-200 mb-4 flex gap-1 overflow-x-auto">
          <button onClick={() => setActiveTab('list')}
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap">
            All First Articles
          </button>
          {openTabs.map(tabId => {
            const insp = data.find(d => d.id === tabId)
            return (
              <button key={tabId} onClick={() => setActiveTab(`insp-${tabId}`)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === `insp-${tabId}` ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                }`}>
                {insp?.inspection_number || `#${tabId}`}
                <span onClick={e => { e.stopPropagation(); closeTab(tabId) }} className="p-0.5 hover:bg-slate-200 rounded"><X size={14} /></span>
              </button>
            )
          })}
        </div>
        <div className="h-[calc(100%-3rem)] bg-white rounded-lg border border-slate-200">
          <InspectionDetail inspectionId={id} onClose={() => closeTab(id)} onDataChange={fetchData} />
        </div>
      </div>
    )
  }

  // ─── List view ─────────────────────────────────────────────
  return (
    <div className="p-6 flex flex-col gap-4 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link href="/operations/inspections" className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"><ArrowLeft size={20} /></Link>
        <ClipboardCheck size={22} className="text-blue-600" />
        <h2 className="text-xl font-bold text-slate-800">First Article Inspection</h2>
        <span className="text-sm text-slate-500">({data.length})</span>
        <div className="flex-1" />
        {canCreate && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} /> New FAI
          </button>
        )}
        <button onClick={fetchData} disabled={loading} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Dashboard */}
      <Panel title="Dashboard" icon={<BarChart3 size={16} className="text-blue-600" />} defaultOpen={true}>
        <div className="p-4">
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No inspections yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      {/* Phase filters */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        {['all', ...PHASES].filter(p => p === 'all' || phaseCounts[p]).map(p => (
          <button key={p} onClick={() => setPhaseFilter(p)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              phaseFilter === p ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-blue-300'
            }`}>{p === 'all' ? 'All' : p} ({phaseCounts[p] || 0})</button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md flex-shrink-0">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search number, part#, work order, owner, site..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-y-auto flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr className="border-b border-slate-200">
              {['Inspection #', 'Prod', 'Part #', 'Work Order', 'Owner', 'Phase', 'Site', 'Dependency', 'Start'].map(h => (
                <th key={h} className="px-3 py-3 text-left font-medium text-slate-600 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500"><RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No inspections found</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer" onClick={() => handleRowClick(r.id)}>
                <td className="px-3 py-2.5 font-mono font-medium text-slate-800">{r.inspection_number}</td>
                <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded ${r.product_type === 'ASM' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>{r.product_type}</span></td>
                <td className="px-3 py-2.5 text-slate-600 font-mono text-xs">{r.part_number || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 font-mono text-xs">{r.work_order || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 text-xs">{r.owner || '—'}</td>
                <td className="px-3 py-2.5"><PhaseBadge phase={r.phase} /></td>
                <td className="px-3 py-2.5 text-slate-600 text-xs">{r.site || '—'}</td>
                <td className="px-3 py-2.5 text-slate-500 text-xs">
                  {r.dependency_id ? (
                    <span className="inline-flex items-center gap-1"><Link2 size={12} /> {depMap[r.dependency_id] || `#${r.dependency_id}`}</span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2.5 text-slate-500 text-xs">{r.start_date ? new Date(r.start_date).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal — lookup workflow */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Plus size={20} className="text-blue-600" /> New First Article</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {createError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertTriangle size={16} /> {createError}</div>}

              {/* Step 1: Search mode + lookup */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => { setLookupMode('part'); setLookupWorkOrders([]); setSelectedWO(null); setLookupPart('') }}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${lookupMode === 'part' ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 text-slate-600'}`}>
                    By Part Number
                  </button>
                  <button onClick={() => { setLookupMode('wo'); setLookupWorkOrders([]); setSelectedWO(null); setLookupPart('') }}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${lookupMode === 'wo' ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 text-slate-600'}`}>
                    By Work Order
                  </button>
                </div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {lookupMode === 'wo' ? 'Work Order Number' : 'Part Number (Where-Used Search)'}
                </label>
                <div className="flex gap-2">
                  <input type="text" value={lookupPart} onChange={e => setLookupPart(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                    placeholder={lookupMode === 'wo' ? 'e.g. 12345' : 'e.g. 72011'}
                    onKeyDown={e => { if (e.key === 'Enter') handleLookup() }} />
                  <button onClick={handleLookup} disabled={lookingUp || !lookupPart.trim()}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
                    {lookingUp ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />} Look Up
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {lookupMode === 'wo'
                    ? 'Searches open work orders (LIKE match, last 12 months).'
                    : 'Finds customer parts using this part (excludes Z-prefix), then their open work orders.'}
                </p>
              </div>

              {/* Step 2: Select work order */}
              {lookupWorkOrders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Work Order ({lookupWorkOrders.length})</label>
                  <div className="border border-slate-200 rounded-lg max-h-52 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-8"></th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Work Order</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Customer Part</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Inv Part</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Site</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lookupWorkOrders.map((wo, i) => (
                          <tr key={`${wo.workOrder}-${i}`}
                            className={`border-t border-slate-100 cursor-pointer ${selectedWO?.workOrder === wo.workOrder ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                            onClick={() => setSelectedWO(wo)}>
                            <td className="px-3 py-2">
                              <input type="radio" checked={selectedWO?.workOrder === wo.workOrder} readOnly className="text-blue-600" />
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-800">{wo.workOrder}</td>
                            <td className="px-3 py-2 font-mono text-slate-600">{wo.customerPart}
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${productTypeFromPart(wo.customerPart) === 'ASM' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                {productTypeFromPart(wo.customerPart)}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-600 text-xs">{wo.invPartNumber}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{wo.site || '—'}</td>
                            <td className="px-3 py-2 text-slate-500 text-xs">{wo.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 3: Finalize (after WO selected) */}
              {selectedWO && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
                    <p className="px-3 py-2 bg-slate-50 rounded-lg text-sm">{productTypeFromPart(selectedWO.customerPart)} <span className="text-xs text-slate-400">(auto)</span></p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Site</label>
                    <p className="px-3 py-2 bg-slate-50 rounded-lg text-sm">{selectedWO.site || '—'} <span className="text-xs text-slate-400">(from WO)</span></p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
                    <input type="text" value={createForm.owner} onChange={e => setCreateForm(p => ({ ...p, owner: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input type="date" value={createForm.startDate} onChange={e => setCreateForm(p => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  {/* Dependency for ASM */}
                  {productTypeFromPart(selectedWO.customerPart) === 'ASM' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Dependency (PCB Inspection)</label>
                      <select value={createForm.dependencyId} onChange={e => setCreateForm(p => ({ ...p, dependencyId: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                        <option value="">None</option>
                        {data.filter(d => d.product_type === 'PCB').map(d => (
                          <option key={d.id} value={d.id}>{d.inspection_number} — {d.part_number || ''}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea value={createForm.notes} onChange={e => setCreateForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={submitting || !selectedWO}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create FAI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
