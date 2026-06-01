'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  ArrowLeft, GitBranch, FileText, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { getApiUrl } from '@/lib/api'

type ECO = {
  id: number; request: string; eco_status: number; partnum: string | null
  customer: string | null; submission_type: string | null; disposition: string | null
  cam_operator: string | null; urgent: string | null; status: string
  submitted_at: string | null; closed_at: string | null; [key: string]: any
}
type SortDir = 'asc' | 'desc'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: 'bg-yellow-100 text-yellow-700',
    Closed: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
  }
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
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

  // Distinct statuses present in the data (since eco_status meaning is TBD)
  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    data.forEach(r => set.add(r.status))
    return ['all', ...Array.from(set).sort()]
  }, [data])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: data.length }
    data.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1 })
    return counts
  }, [data])

  const filtered = useMemo(() => {
    let rows = data
    if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter)
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

      {/* Workflow note */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        <AlertCircle size={16} />
        Status filter is based on raw <code className="px-1 bg-amber-100 rounded">eco_status</code> values. Workflow definitions to be refined.
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

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
              <tr key={`${row.id}-${idx}`} className="border-b border-slate-100 hover:bg-purple-50">
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
