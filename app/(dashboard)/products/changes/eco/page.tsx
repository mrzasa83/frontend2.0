'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  ArrowLeft, GitBranch, FileText, AlertCircle, X
} from 'lucide-react'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  ArrowLeft, GitBranch, FileText, AlertCircle, X,
  ChevronDown, ChevronRight, BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getApiUrl } from '@/lib/api'
import ECODetail from '@/components/changes/ECODetail'

type ECO = {
  id: number; request: string; eco_status: number; partnum: string | null
  customer: string | null; submission_type: string | null; disposition: string | null
  cam_operator: string | null; urgent: string | null; status: string
  submitted_at: string | null; closed_at: string | null; [key: string]: any
}
type SortDir = 'asc' | 'desc'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Requested: 'bg-yellow-100 text-yellow-700',
    Completed: 'bg-green-100 text-green-700',
    Canceled: 'bg-red-100 text-red-700',
    Removed: 'bg-slate-100 text-slate-500',
    Other: 'bg-blue-100 text-blue-700',
  }
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

// Collapsible panel
function Panel({ title, icon, defaultOpen, children, count }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; count?: number
}) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        {icon}
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        {count !== undefined && <span className="text-xs text-slate-400 ml-1">({count})</span>}
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  )
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}
function formatDays(n: number | null): string {
  if (n === null) return '—'
  if (n === 0) return 'Today'
  if (n === 1) return '1 day'
  return `${n} days`
}

export default function ECOPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ECO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<string>('submitted_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const pageSize = 25
  const [openTabs, setOpenTabs] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<string>('list')

  const isAdmin = session?.user?.roles?.some((r: string) => r === 'Admin') || false

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/products/changes/eco'))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setData(r.data || [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // Status filter options in a sensible order (only show those present)
  const statusOptions = useMemo(() => {
    const present = new Set(data.map(r => r.status))
    const order = ['all', 'Requested', 'Completed', 'Canceled', 'Other', 'Removed']
    return order.filter(s => s === 'all' || present.has(s))
  }, [data])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    data.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1
      if (r.status !== 'Removed') counts.all++  // 'all' excludes Removed
    })
    return counts
  }, [data])

  const chartData = useMemo(() => [
    { name: 'Requested', value: statusCounts.Requested || 0, color: '#eab308' },
    { name: 'Completed', value: statusCounts.Completed || 0, color: '#22c55e' },
    { name: 'Canceled', value: statusCounts.Canceled || 0, color: '#ef4444' },
    { name: 'Other', value: statusCounts.Other || 0, color: '#3b82f6' },
  ], [statusCounts])

  const requestedItems = useMemo(() =>
    data.filter(r => r.status === 'Requested')
      .map(r => ({ ...r, daysSince: daysSince(r.submitted_at) }))
      .sort((a, b) => (b.daysSince || 0) - (a.daysSince || 0)),
  [data])

  const filtered = useMemo(() => {
    let rows = data
    if (statusFilter === 'all') {
      rows = rows.filter(r => r.status !== 'Removed')  // hide Removed by default
    } else {
      rows = rows.filter(r => r.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        String(r.id).includes(q) ||
        String(r.request || '').toLowerCase().includes(q) ||
        String(r.partnum || '').toLowerCase().includes(q) ||
        String(r.customer || '').toLowerCase().includes(q) ||
        String(r.cam_operator || '').toLowerCase().includes(q) ||
        String(r.submission_type || '').toLowerCase().includes(q) ||
        String(r.comments || '').toLowerCase().includes(q) ||
        String(r.action_required || '').toLowerCase().includes(q)
      )
    }
    if (dateFrom) { const from = new Date(dateFrom); rows = rows.filter(r => r.submitted_at && new Date(r.submitted_at) >= from) }
    if (dateTo) { const to = new Date(dateTo + 'T23:59:59'); rows = rows.filter(r => r.submitted_at && new Date(r.submitted_at) <= to) }
    return [...rows].sort((a, b) => {
      if (sortKey === 'id' || sortKey === 'eco_status') {
        const cmp = (Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0)
        return sortDir === 'desc' ? -cmp : cmp
      }
      if (sortKey === 'submitted_at' || sortKey === 'closed_at') {
        const da = a[sortKey] ? new Date(a[sortKey]).getTime() : 0
        const db = b[sortKey] ? new Date(b[sortKey]).getTime() : 0
        return sortDir === 'desc' ? db - da : da - db
      }
      const va = String(a[sortKey] ?? ''), vb = String(b[sortKey] ?? '')
      return sortDir === 'desc' ? vb.localeCompare(va, undefined, { numeric: true }) : va.localeCompare(vb, undefined, { numeric: true })
    })
  }, [data, search, statusFilter, sortKey, sortDir, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'id' || key === 'submitted_at' ? 'desc' : 'asc') }
  }
  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown size={14} className="text-slate-300" />
    return sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
  }

  const handleRowClick = (id: number) => {
    if (!openTabs.includes(id)) setOpenTabs(prev => [...prev, id])
    setActiveTab(`eco-${id}`)
  }
  const closeTab = (id: number) => { setOpenTabs(prev => prev.filter(t => t !== id)); setActiveTab('list') }

  // ─── Detail view ───────────────────────────────────────────
  if (activeTab.startsWith('eco-')) {
    const id = parseInt(activeTab.replace('eco-', ''))
    return (
      <div className="p-6 h-[calc(100vh-4rem)]">
        <div className="border-b border-slate-200 mb-4 flex gap-1 overflow-x-auto">
          <button onClick={() => setActiveTab('list')}
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap">
            All ECOs
          </button>
          {openTabs.map(tabId => (
            <button key={tabId} onClick={() => setActiveTab(`eco-${tabId}`)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === `eco-${tabId}` ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
              }`}>
              ECO #{tabId}
              <span onClick={e => { e.stopPropagation(); closeTab(tabId) }} className="p-0.5 hover:bg-slate-200 rounded"><X size={14} /></span>
            </button>
          ))}
        </div>
        <div className="h-[calc(100%-3rem)] bg-white rounded-lg border border-slate-200">
          <ECODetail ecoId={id} isAdmin={isAdmin} onClose={() => closeTab(id)} onDataChange={fetchData}
            navList={filtered.map(r => r.id)}
            onNavigate={(newId) => { setOpenTabs(prev => prev.map(t => t === id ? newId : t)); setActiveTab(`eco-${newId}`) }} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-4 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link href="/products/changes" className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"><ArrowLeft size={20} /></Link>
        <GitBranch size={22} className="text-purple-600" />
        <h2 className="text-xl font-bold text-slate-800">ECO</h2>
        <span className="text-sm text-slate-500">({data.length} records)</span>
        <div className="flex-1" />
        <button onClick={fetchData} disabled={loading} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* ─── Dashboard Panel ──────────────────────────────────── */}
      <Panel title="Dashboard" icon={<BarChart3 size={16} className="text-purple-600" />} defaultOpen={true}>
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Status Distribution</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Requested — days in queue */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Requested — Days in Queue ({requestedItems.length})
              </p>
              <div className="max-h-52 overflow-y-auto border border-slate-100 rounded">
                {requestedItems.length === 0 ? <p className="p-3 text-xs text-slate-400 italic">None in queue</p> : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr><th className="px-2 py-1 text-left">ID</th><th className="px-2 py-1 text-left">Part #</th><th className="px-2 py-1 text-left">Customer</th><th className="px-2 py-1 text-right">In Queue</th></tr>
                    </thead>
                    <tbody>
                      {requestedItems.map(r => (
                        <tr key={r.id} className="border-t border-slate-100 hover:bg-yellow-50 cursor-pointer" onClick={() => handleRowClick(r.id)}>
                          <td className="px-2 py-1 font-mono">{r.id}</td>
                          <td className="px-2 py-1 text-slate-600 truncate">{r.partnum || '—'}</td>
                          <td className="px-2 py-1 text-slate-600 truncate">{r.customer || '—'}</td>
                          <td className="px-2 py-1 text-right text-yellow-600 font-medium">{formatDays(r.daysSince)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </Panel>


      {/* Status filter buttons */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        {statusOptions.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              statusFilter === s ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-purple-300'
            }`}>{s === 'all' ? 'All' : s} ({statusCounts[s] || 0})</button>
        ))}
      </div>

      {/* Search + Date Range */}
      <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search ID, request, part#, customer, CAM operator..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">From:</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0) }}
            className="px-2 py-2 border border-slate-200 rounded-lg text-sm" />
          <span className="text-xs text-slate-500">To:</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0) }}
            className="px-2 py-2 border border-slate-200 rounded-lg text-sm" />
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(0) }} className="text-xs text-purple-600">Clear</button>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-y-auto flex-1">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{width:'7%'}}/><col style={{width:'20%'}}/><col style={{width:'14%'}}/>
            <col style={{width:'15%'}}/><col style={{width:'12%'}}/><col style={{width:'12%'}}/>
            <col style={{width:'12%'}}/><col style={{width:'8%'}}/>
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              {[['id','ID'],['request','Request'],['partnum','Part #'],['customer','Customer'],['submission_type','Type'],['cam_operator','CAM Op'],['submitted_at','Submitted'],['status','Status']].map(([k,l]) => (
                <th key={k} className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none text-xs" onClick={() => toggleSort(k)}>
                  <div className="flex items-center gap-1">{l} <SortIcon col={k} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500"><RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">No records found</td></tr>
            ) : paginated.map((row, idx) => (
              <tr key={`${row.id}-${idx}`} className="border-b border-slate-100 hover:bg-purple-50 cursor-pointer" onClick={() => handleRowClick(row.id)}>
                <td className="px-3 py-2.5 font-mono font-medium text-slate-800">{row.id}</td>
                <td className="px-3 py-2.5 text-slate-700 truncate" title={row.request}>{row.request || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 truncate font-mono text-xs" title={row.partnum || ''}>{row.partnum || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 truncate" title={row.customer || ''}>{row.customer || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 truncate text-xs">{row.submission_type || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 truncate text-xs">{row.cam_operator || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 text-xs">{row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—'}</td>
                <td className="px-3 py-2.5"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-sm text-slate-500">Page {page + 1} of {totalPages || 1} · {filtered.length} results</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(0)} disabled={page === 0} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">First</button>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">Previous</button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pn = page < 3 ? i : page - 2 + i
            if (pn >= totalPages) return null
            return <button key={pn} onClick={() => setPage(pn)} className={`px-3 py-1 rounded text-sm ${pn === page ? 'bg-purple-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>{pn + 1}</button>
          })}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">Next</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">Last</button>
        </div>
      </div>
    </div>
  )
}
