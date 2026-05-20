'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  X, Clock, CheckCircle, XCircle, FileText, ArrowLeft,
  ChevronDown, ChevronRight, BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getApiUrl } from '@/lib/api'
import ESCFDetail from '@/components/changes/ESCFDetail'

type ESCF = {
  id: number; department: string | null; affected_departments: string | null
  wcm: string | null; initiator: string | null; pes: string | null
  subdate: string | null; subtime: string | null; escf_status: number | null
  pe_disposition: string | null; status: string; [key: string]: any
}
type ActionItem = {
  id: number; escf_id: number; action_text: string; owner: string | null
  due_date: string | null; status: string; created_at: string
}
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Implemented' | 'Rejected' | 'Legacy'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Implemented: 'bg-green-100 text-green-700', Approved: 'bg-blue-100 text-blue-700',
    Pending: 'bg-yellow-100 text-yellow-700', Rejected: 'bg-red-100 text-red-700',
    Legacy: 'bg-slate-100 text-slate-600',
  }
  const icons: Record<string, any> = { Implemented: CheckCircle, Approved: CheckCircle, Pending: Clock, Rejected: XCircle, Legacy: Clock }
  const Icon = icons[status] || Clock
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}><Icon size={12} /> {status}</span>
}

// Collapsible panel
function Panel({ title, icon, defaultOpen, children, count }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; count?: number
}) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
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

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return Math.floor((d.getTime() - Date.now()) / 86400000)
}

function dueDateColor(dueDate: string | null): string {
  if (!dueDate) return 'text-slate-500'
  const days = daysUntil(dueDate)
  if (days === null) return 'text-slate-500'
  if (days < 0) return 'text-red-600 font-medium'     // past due
  if (days < 3) return 'text-yellow-600 font-medium'   // less than 3 days
  return 'text-green-600'                               // 3+ days
}

function dueDateBg(dueDate: string | null): string {
  if (!dueDate) return ''
  const days = daysUntil(dueDate)
  if (days === null) return ''
  if (days < 0) return 'bg-red-50'
  if (days < 3) return 'bg-yellow-50'
  return ''
}

function formatDays(n: number | null): string {
  if (n === null) return '—'
  if (n === 0) return 'Today'
  if (n === 1) return '1 day'
  return `${n} days`
}

// ─── Main Page ───────────────────────────────────────────────────
export default function StandardsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ESCF[]>([])
  const [allActions, setAllActions] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<string>('submitted_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const pageSize = 25
  const [openTabs, setOpenTabs] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<string>('list')
  const [actionsTab, setActionsTab] = useState<'open' | 'complete'>('open')

  const isAdmin = session?.user?.roles?.some((r: string) => r === 'Admin') || false

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const [escfRes, actRes] = await Promise.all([
        fetch(getApiUrl('/api/products/changes/standards')),
        fetch(getApiUrl('/api/products/changes/standards/actions?escfId=all')),
      ])
      if (escfRes.ok) {
        const r = await escfRes.json()
        setData(r.data || [])
      }
      if (actRes.ok) {
        const r = await actRes.json()
        setAllActions(r.actions || [])
      }
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // ─── Dashboard data ────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: data.length, Pending: 0, Approved: 0, Implemented: 0, Rejected: 0, Legacy: 0 }
    data.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })
    return counts
  }, [data])

  const chartData = useMemo(() => [
    { name: 'Pending', value: statusCounts.Pending, color: '#eab308' },
    { name: 'Approved', value: statusCounts.Approved, color: '#3b82f6' },
    { name: 'Implemented', value: statusCounts.Implemented, color: '#22c55e' },
    { name: 'Rejected', value: statusCounts.Rejected, color: '#ef4444' },
  ], [statusCounts])

  const approvedItems = useMemo(() =>
    data.filter(r => r.status === 'Approved')
      .map(r => ({ ...r, daysSince: daysSince(r.disposed_at) }))
      .sort((a, b) => (b.daysSince || 0) - (a.daysSince || 0)),
  [data])

  const pendingItems = useMemo(() =>
    data.filter(r => r.status === 'Pending')
      .map(r => ({ ...r, daysSince: daysSince(r.submitted_at) }))
      .sort((a, b) => (b.daysSince || 0) - (a.daysSince || 0)),
  [data])

  const openActions = useMemo(() => allActions.filter(a => a.status === 'Open'), [allActions])
  const completeActions = useMemo(() => allActions.filter(a => a.status === 'Complete'), [allActions])

  // ─── Table filtering ───────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = data
    if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        String(r.id).includes(q) || String(r.department || '').toLowerCase().includes(q) ||
        String(r.initiator || '').toLowerCase().includes(q) || String(r.wcm || '').toLowerCase().includes(q) ||
        String(r.pes || '').toLowerCase().includes(q) || String(r.affected_departments || '').toLowerCase().includes(q) ||
        String(r.current_standards || '').toLowerCase().includes(q) ||
        String(r.requested_change || '').toLowerCase().includes(q) ||
        String(r.reason_for_change || '').toLowerCase().includes(q)
      )
    }
    if (dateFrom) { const from = new Date(dateFrom); rows = rows.filter(r => r.submitted_at && new Date(r.submitted_at) >= from) }
    if (dateTo) { const to = new Date(dateTo + 'T23:59:59'); rows = rows.filter(r => r.submitted_at && new Date(r.submitted_at) <= to) }
    return [...rows].sort((a, b) => {
      if (sortKey === 'id') return sortDir === 'desc' ? b.id - a.id : a.id - b.id
      if (sortKey === 'submitted_at' || sortKey === 'closed_at' || sortKey === 'disposed_at') {
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

  const handleRowClick = (escf: ESCF) => {
    if (!openTabs.includes(escf.id)) setOpenTabs(prev => [...prev, escf.id])
    setActiveTab(`escf-${escf.id}`)
  }
  const closeTab = (id: number) => { setOpenTabs(prev => prev.filter(t => t !== id)); setActiveTab('list') }

  // ─── Detail view ───────────────────────────────────────────
  if (activeTab.startsWith('escf-')) {
    const id = parseInt(activeTab.replace('escf-', ''))
    return (
      <div className="p-6 h-[calc(100vh-4rem)]">
        <div className="border-b border-slate-200 mb-4 flex gap-1 overflow-x-auto">
          <button onClick={() => setActiveTab('list')}
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap">
            All Standards
          </button>
          {openTabs.map(tabId => (
            <button key={tabId} onClick={() => setActiveTab(`escf-${tabId}`)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === `escf-${tabId}` ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
              }`}>
              ESCF #{tabId}
              <span onClick={e => { e.stopPropagation(); closeTab(tabId) }} className="p-0.5 hover:bg-slate-200 rounded"><X size={14} /></span>
            </button>
          ))}
        </div>
        <div className="h-[calc(100%-3rem)]">
          <ESCFDetail escfId={id} isAdmin={isAdmin} onClose={() => closeTab(id)}
            onOpenEscf={(newId) => { if (!openTabs.includes(newId)) setOpenTabs(prev => [...prev, newId]); setActiveTab(`escf-${newId}`) }}
            onDataChange={fetchData} />
        </div>
      </div>
    )
  }

  // ─── Actions table helper ──────────────────────────────────
  const ActionsTable = ({ items }: { items: ActionItem[] }) => (
    <div className="max-h-64 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-20">ESCF#</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Action</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Due Date</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-32">Owner</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400 italic">No items</td></tr>
          ) : items.map(a => (
            <tr key={a.id} className={`border-t border-slate-100 hover:bg-slate-50 cursor-pointer ${dueDateBg(a.due_date)}`}
              onClick={() => handleRowClick({ id: a.escf_id } as ESCF)}>
              <td className="px-3 py-2 font-mono text-slate-800">{a.escf_id}</td>
              <td className="px-3 py-2 text-slate-700 truncate max-w-xs">{a.action_text}</td>
              <td className={`px-3 py-2 text-xs ${dueDateColor(a.due_date)}`}>
                {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}
                {a.due_date && a.status === 'Open' && (
                  <span className="ml-1">
                    {daysUntil(a.due_date) !== null && daysUntil(a.due_date)! < 0 ? `(${Math.abs(daysUntil(a.due_date)!)}d overdue)` :
                     daysUntil(a.due_date) === 0 ? '(today)' : `(${daysUntil(a.due_date)}d)`}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-slate-600 text-xs">{a.owner || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // ─── List view with panels ─────────────────────────────────
  return (
    <div className="p-6 flex flex-col gap-4 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Tab bar */}
      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto flex-shrink-0">
        <button className="px-4 py-2.5 text-sm font-medium border-b-2 border-blue-600 text-blue-600 whitespace-nowrap">All Standards</button>
        {openTabs.map(tabId => (
          <button key={tabId} onClick={() => setActiveTab(`escf-${tabId}`)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap flex items-center gap-2">
            ESCF #{tabId}
            <span onClick={e => { e.stopPropagation(); closeTab(tabId) }} className="p-0.5 hover:bg-slate-200 rounded"><X size={14} /></span>
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link href="/products/changes" className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"><ArrowLeft size={20} /></Link>
        <h2 className="text-xl font-bold text-slate-800">Standards</h2>
        <span className="text-sm text-slate-500">({data.length} records)</span>
        <div className="flex-1" />
        <button onClick={fetchData} disabled={loading} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* ─── Dashboard Panel ──────────────────────────────────── */}
      <Panel title="Dashboard" icon={<BarChart3 size={16} className="text-blue-600" />} defaultOpen={true}>
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bar Chart */}
            <div className="lg:col-span-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Status Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
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

            {/* Approved — awaiting implementation */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Approved — Awaiting Implementation ({approvedItems.length})
              </p>
              <div className="max-h-44 overflow-y-auto border border-slate-100 rounded">
                {approvedItems.length === 0 ? <p className="p-3 text-xs text-slate-400 italic">None</p> : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr><th className="px-2 py-1 text-left">ID</th><th className="px-2 py-1 text-left">Department</th><th className="px-2 py-1 text-right">Days</th></tr>
                    </thead>
                    <tbody>
                      {approvedItems.map(r => (
                        <tr key={r.id} className="border-t border-slate-100 hover:bg-blue-50 cursor-pointer" onClick={() => handleRowClick(r)}>
                          <td className="px-2 py-1 font-mono">{r.id}</td>
                          <td className="px-2 py-1 text-slate-600 truncate">{r.department}</td>
                          <td className="px-2 py-1 text-right text-blue-600 font-medium">{formatDays(r.daysSince)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Pending — awaiting review */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Pending — Awaiting Review ({pendingItems.length})
              </p>
              <div className="max-h-44 overflow-y-auto border border-slate-100 rounded">
                {pendingItems.length === 0 ? <p className="p-3 text-xs text-slate-400 italic">None</p> : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr><th className="px-2 py-1 text-left">ID</th><th className="px-2 py-1 text-left">Department</th><th className="px-2 py-1 text-right">Days</th></tr>
                    </thead>
                    <tbody>
                      {pendingItems.map(r => (
                        <tr key={r.id} className="border-t border-slate-100 hover:bg-yellow-50 cursor-pointer" onClick={() => handleRowClick(r)}>
                          <td className="px-2 py-1 font-mono">{r.id}</td>
                          <td className="px-2 py-1 text-slate-600 truncate">{r.department}</td>
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

      {/* ─── Standards Table Panel ─────────────────────────────── */}
      <Panel title="Standards" icon={<FileText size={16} className="text-slate-600" />} defaultOpen={true} count={filtered.length}>
        <div className="p-4 space-y-3">
          {/* Status filter buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'Pending', 'Approved', 'Implemented', 'Rejected', 'Legacy'] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  statusFilter === s ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                }`}>{s === 'all' ? 'All' : s} ({statusCounts[s] || 0})</button>
            ))}
          </div>

          {/* Search + Date Range */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
                placeholder="Search ID, department, initiator, standards, changes..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">From:</span>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0) }}
                className="px-2 py-2 border border-slate-200 rounded-lg text-sm" />
              <span className="text-xs text-slate-500">To:</span>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0) }}
                className="px-2 py-2 border border-slate-200 rounded-lg text-sm" />
              {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(0) }} className="text-xs text-blue-600">Clear</button>}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-y-auto max-h-[400px]">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup><col style={{width:'8%'}}/><col style={{width:'14%'}}/><col style={{width:'16%'}}/><col style={{width:'10%'}}/><col style={{width:'14%'}}/><col style={{width:'10%'}}/><col style={{width:'12%'}}/><col style={{width:'10%'}}/><col style={{width:'6%'}}/></colgroup>
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200">
                  {[['id','ID'],['department','Department'],['affected_departments','Affected Depts'],['wcm','WCM'],['initiator','Initiator'],['pes','PES'],['submitted_at','Submitted'],['status','Status']].map(([k,l]) => (
                    <th key={k} className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none text-xs" onClick={() => toggleSort(k)}>
                      <div className="flex items-center gap-1">{l} <SortIcon col={k} /></div>
                    </th>
                  ))}
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500"><RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No records found</td></tr>
                ) : paginated.map((row, idx) => (
                  <tr key={`${row.id}-${idx}`} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer" onClick={() => handleRowClick(row)}>
                    <td className="px-3 py-2.5 font-mono font-medium text-slate-800">{row.id}</td>
                    <td className="px-3 py-2.5 text-slate-700 truncate">{row.department || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600 text-xs truncate">{row.affected_departments || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600 truncate">{row.wcm || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-700 truncate">{row.initiator || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600 truncate">{row.pes || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600 text-xs">{row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—'}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-2.5"><FileText size={16} className="text-slate-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Page {page + 1} of {totalPages || 1}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(0)} disabled={page === 0} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">First</button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">Previous</button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pn = page < 3 ? i : page - 2 + i
                if (pn >= totalPages) return null
                return <button key={pn} onClick={() => setPage(pn)} className={`px-3 py-1 rounded text-sm ${pn === page ? 'bg-slate-800 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>{pn + 1}</button>
              })}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">Next</button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">Last</button>
            </div>
          </div>
        </div>
      </Panel>

      {/* ─── Actions Panel ────────────────────────────────────── */}
      <Panel title="Actions" icon={<CheckCircle size={16} className="text-green-600" />} defaultOpen={false}
        count={openActions.length + completeActions.length}>
        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setActionsTab('open')}
              className={`px-4 py-2 text-sm rounded-lg border ${actionsTab === 'open' ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 text-slate-600'}`}>
              Open ({openActions.length})
            </button>
            <button onClick={() => setActionsTab('complete')}
              className={`px-4 py-2 text-sm rounded-lg border ${actionsTab === 'complete' ? 'border-green-500 bg-green-50 text-green-700 font-medium' : 'border-slate-200 text-slate-600'}`}>
              Completed ({completeActions.length})
            </button>
          </div>
          <ActionsTable items={actionsTab === 'open' ? openActions : completeActions} />
        </div>
      </Panel>
    </div>
  )
}
