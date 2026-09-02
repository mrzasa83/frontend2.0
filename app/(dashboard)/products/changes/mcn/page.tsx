'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  ArrowLeft, RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, GitBranch,
  ChevronDown, ChevronRight, Download, PauseCircle,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Mcn = {
  id: number
  request: string
  mcn_status: number
  toolnum: string
  partnum: string
  customer: string
  initiator: string
  requester: string
  pe: string | null
  change: string
  reason: string
  chngreason: string
  chngeffect: string
  disposition: string | null
  submission_type: string | null
  hold_status: string | null
  hold_status_reason: string | null
  urgent: string | null
  eco: string | null
  subdate: string
  submitted_at: string | null
  closed_at: string | null
  status: string
  on_hold: number
  locations: string[]
  location: string
}

const STATUSES = ['Pending', 'Approved', 'Implemented', 'Rejected'] as const

const STATUS_STYLE: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-blue-100 text-blue-700',
  Implemented: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
}
const STATUS_BAR: Record<string, string> = {
  Pending: '#f59e0b',
  Approved: '#3b82f6',
  Implemented: '#22c55e',
  Rejected: '#ef4444',
}

const fmtDate = (v: any) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString()
}

/** Whole days between a submission and now. */
const daysInQueue = (v: any) => {
  if (!v) return null
  const d = new Date(v)
  if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

export default function ProductChangesPage() {
  const [rows, setRows] = useState<Mcn[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDash, setShowDash] = useState(true)
  const [showAudit, setShowAudit] = useState(false)

  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [holdFilter, setHoldFilter] = useState<'all' | 'hold' | 'nohold'>('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'submitted_at', dir: 'desc' })

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/products/changes/mcn'))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load')
      setRows(r.data || []); setLocations(r.locations || []); setAudit(r.statusAudit || [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = { Pending: 0, Approved: 0, Implemented: 0, Rejected: 0 }
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1
    return c
  }, [rows])

  const onHoldCount = useMemo(() => rows.filter(r => r.on_hold).length, [rows])

  // Open work, oldest first — the queue that needs attention.
  const openQueue = useMemo(() =>
    rows
      .filter(r => r.status === 'Pending' || r.status === 'Approved')
      .sort((a, b) => new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime()),
    [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (holdFilter === 'hold' && !r.on_hold) return false
      if (holdFilter === 'nohold' && r.on_hold) return false
      if (locationFilter && !(r.locations || []).includes(locationFilter)) return false
      if (from && (!r.submitted_at || new Date(r.submitted_at) < new Date(from))) return false
      if (to) {
        const end = new Date(to); end.setDate(end.getDate() + 1)
        if (!r.submitted_at || new Date(r.submitted_at) >= end) return false
      }
      if (q) {
        const hay = `${r.id} ${r.request} ${r.toolnum} ${r.partnum} ${r.customer} ${r.initiator} ${r.change} ${r.reason}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, statusFilter, holdFilter, locationFilter, search, from, to])

  const sorted = useMemo(() => {
    const { key, dir } = sort
    return [...filtered].sort((a, b) => {
      const av = (a as any)[key], bv = (b as any)[key]
      let cmp: number
      if (key === 'submitted_at' || key === 'closed_at') {
        cmp = new Date(av || 0).getTime() - new Date(bv || 0).getTime()
      } else if (key === 'id' || key === 'on_hold') {
        cmp = (Number(av) || 0) - (Number(bv) || 0)
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''))
      }
      return dir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort])

  const toggleSort = (key: string) =>
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })

  const chartData = STATUSES.map(s => ({ name: s, count: counts[s] || 0 }))

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(sorted.map(r => ({
      ID: r.id, Request: r.request, 'Tool #': r.toolnum, 'Part #': r.partnum,
      Customer: r.customer, Location: r.location, Status: r.status,
      'On Hold': r.on_hold ? 'Yes' : 'No', 'Hold Reason': r.hold_status_reason || '',
      Initiator: r.initiator, Requester: r.requester,
      Change: r.change, Reason: r.reason, 'Change Reason': r.chngreason, Effect: r.chngeffect,
      Disposition: r.disposition || '', Submitted: fmtDate(r.submitted_at), Closed: fmtDate(r.closed_at),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Product Changes')
    XLSX.writeFile(wb, `product-changes_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const COLS = [
    { key: 'id', label: 'ID', w: 'w-20' },
    { key: 'request', label: 'Request', w: 'w-56' },
    { key: 'toolnum', label: 'Tool #', w: 'w-24' },
    { key: 'partnum', label: 'Part #', w: 'w-32' },
    { key: 'customer', label: 'Customer', w: 'w-40' },
    { key: 'location', label: 'Location', w: 'w-36' },
    { key: 'submitted_at', label: 'Submitted', w: 'w-28' },
    { key: 'status', label: 'Status', w: 'w-28' },
    { key: 'on_hold', label: 'Hold', w: 'w-20' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/products/changes" className="text-slate-400 hover:text-slate-700">
          <ArrowLeft size={20} />
        </Link>
        <GitBranch size={20} className="text-emerald-600" />
        <h1 className="text-xl font-bold text-slate-800">Product Changes</h1>
        <span className="text-sm text-slate-500">({rows.length.toLocaleString()} records)</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">read only</span>
        <button onClick={load} disabled={loading} className="ml-auto text-slate-400 hover:text-slate-700">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Dashboard */}
      <div className="bg-white border border-slate-200 rounded-lg mb-4">
        <button onClick={() => setShowDash(!showDash)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {showDash ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Dashboard
        </button>
        {showDash && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 border-t border-slate-100">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Status distribution</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
                  <Bar dataKey="count">
                    {chartData.map(d => <Cell key={d.name} fill={STATUS_BAR[d.name]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                Open — days in queue ({openQueue.length})
              </div>
              <div className="border border-slate-200 rounded-lg overflow-auto max-h-[190px]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-600">ID</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-600">Tool #</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-600">Part #</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-600">Customer</th>
                      <th className="px-2 py-1.5 text-right text-xs font-medium text-slate-600">In Queue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openQueue.length === 0 ? (
                      <tr><td colSpan={5} className="px-2 py-4 text-center text-slate-400 text-sm">Nothing open.</td></tr>
                    ) : openQueue.slice(0, 50).map(r => {
                      const d = daysInQueue(r.submitted_at)
                      return (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="px-2 py-1 text-slate-700">{r.id}</td>
                          <td className="px-2 py-1 font-mono text-slate-700">{r.toolnum}</td>
                          <td className="px-2 py-1 font-mono text-slate-600">{r.partnum}</td>
                          <td className="px-2 py-1 text-slate-600 truncate max-w-[160px]">{r.customer}</td>
                          <td className={`px-2 py-1 text-right ${d != null && d > 30 ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                            {d == null ? '' : d === 0 ? 'Today' : `${d} days`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {(['All', ...STATUSES] as string[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-sm rounded-lg border ${
              statusFilter === s ? 'border-blue-500 text-blue-700 bg-blue-50 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {s} ({s === 'All' ? rows.length.toLocaleString() : (counts[s] || 0).toLocaleString()})
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        {/* On hold is independent of status — a record can be held in any state. */}
        <button onClick={() => setHoldFilter(holdFilter === 'hold' ? 'all' : 'hold')}
          className={`px-3 py-1 text-sm rounded-lg border flex items-center gap-1.5 ${
            holdFilter === 'hold' ? 'border-orange-500 text-orange-700 bg-orange-50 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>
          <PauseCircle size={14} /> On Hold ({onHoldCount.toLocaleString()})
        </button>
        <button onClick={() => setHoldFilter(holdFilter === 'nohold' ? 'all' : 'nohold')}
          className={`px-3 py-1 text-sm rounded-lg border ${
            holdFilter === 'nohold' ? 'border-slate-500 text-slate-700 bg-slate-100 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>
          Not on hold
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ID, request, tool#, part#, customer, initiator…"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-80 focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
          title="Build location, derived from the part's released route"
          className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="">All locations</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="text-sm text-slate-500">From</span>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
        <span className="text-sm text-slate-500">To</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
        <button onClick={exportExcel} disabled={!sorted.length}
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 disabled:opacity-50">
          <Download size={14} /> Excel
        </button>
        <span className="text-sm text-slate-500 ml-auto">{sorted.length.toLocaleString()} shown</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[calc(100vh-460px)]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              {COLS.map(c => {
                const active = sort.key === c.key
                return (
                  <th key={c.key} className={`px-3 py-2 text-left text-xs font-medium text-slate-600 ${c.w}`}>
                    <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-slate-900">
                      {c.label}
                      {active ? (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={10} className="text-slate-300" />}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLS.length} className="px-3 py-8 text-center text-slate-400">
                <RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…
              </td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={COLS.length} className="px-3 py-8 text-center text-slate-400">No product changes match.</td></tr>
            ) : sorted.slice(0, 500).map(r => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 text-slate-700">{r.id}</td>
                <td className="px-3 py-1.5 text-slate-600 text-xs font-mono truncate max-w-[220px]" title={r.request}>{r.request}</td>
                <td className="px-3 py-1.5 font-mono text-slate-800">{r.toolnum}</td>
                <td className="px-3 py-1.5 font-mono text-slate-600">{r.partnum}</td>
                <td className="px-3 py-1.5 text-slate-600 truncate max-w-[160px]">{r.customer}</td>
                <td className="px-3 py-1.5 text-slate-600 text-xs">
                  {r.location || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">{fmtDate(r.submitted_at)}</td>
                <td className="px-3 py-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-600'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  {r.on_hold
                    ? <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700"
                        title={r.hold_status_reason || 'On hold'}>Hold</span>
                    : <span className="text-slate-300 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > 500 && (
        <p className="text-xs text-slate-400 mt-2">Showing the first 500 of {sorted.length.toLocaleString()} — narrow the filters to see more.</p>
      )}

      {/* Status mapping audit — how the raw legacy values actually combine. */}
      <div className="mt-4">
        <button onClick={() => setShowAudit(!showAudit)} className="text-xs text-blue-600 hover:underline">
          {showAudit ? 'Hide' : 'Show'} status mapping check
        </button>
        {showAudit && (
          <div className="mt-2 bg-white border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-2">
              The four statuses are derived from mcn_status, disposition, submission type and whether
              the record is closed. This is the raw breakdown — use it to confirm the mapping is right.
            </p>
            <div className="overflow-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">mcn_status</th>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">disposition</th>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">submission_type</th>
                    <th className="px-2 py-1 text-left font-medium text-slate-600">closed</th>
                    <th className="px-2 py-1 text-right font-medium text-slate-600">count</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-2 py-1 text-slate-700">{a.mcn_status}</td>
                      <td className="px-2 py-1 text-slate-600">{a.disposition}</td>
                      <td className="px-2 py-1 text-slate-600">{a.submission_type}</td>
                      <td className="px-2 py-1 text-slate-600">{a.closed}</td>
                      <td className="px-2 py-1 text-right tabular-nums text-slate-700">{Number(a.n).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
