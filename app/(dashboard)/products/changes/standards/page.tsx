'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  X, Save, Pencil, Clock, CheckCircle, XCircle, FileText, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { getApiUrl } from '@/lib/api'

type ESCF = {
  id: number
  department: string | null
  affected_departments: string | null
  wcm: string | null
  initiator: string | null
  pes: string | null
  subdate: string | null
  subtime: string | null
  escf_status: number | null
  pe_disposition: string | null
  status: string
  [key: string]: any
}

type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Implemented' | 'Rejected'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Implemented: 'bg-green-100 text-green-700',
    Approved: 'bg-blue-100 text-blue-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Rejected: 'bg-red-100 text-red-700',
  }
  const icons: Record<string, any> = {
    Implemented: CheckCircle,
    Approved: CheckCircle,
    Pending: Clock,
    Rejected: XCircle,
  }
  const Icon = icons[status] || Clock
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      <Icon size={12} /> {status}
    </span>
  )
}

// ─── Detail/Edit View ────────────────────────────────────────────
function ESCFDetail({ escfId, isAdmin, onClose }: {
  escfId: number; isAdmin: boolean; onClose: () => void
}) {
  const [record, setRecord] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchRecord() }, [escfId])

  const fetchRecord = async () => {
    setLoading(true)
    try {
      const res = await fetch(getApiUrl(`/api/products/changes/standards?id=${escfId}`))
      if (!res.ok) throw new Error('Failed to fetch')
      const r = await res.json()
      setRecord(r.record)
      setFormData(r.record)
      setHistory(r.history || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/products/changes/standards'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Save failed')
      setEditing(false)
      await fetchRecord()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-blue-600 mr-3" />
        <span className="text-slate-600">Loading...</span>
      </div>
    )
  }

  if (!record) {
    return <div className="p-6 text-red-600">Record not found</div>
  }

  // Determine which fields to show
  const knownFields = ['id', 'department', 'affected_departments', 'wcm', 'initiator', 'pes',
    'subdate', 'subtime', 'escf_status', 'pe_disposition']
  const extraFields = Object.keys(record).filter(k => !knownFields.includes(k) && record[k] !== null && record[k] !== '')

  const computedStatus = (() => {
    const s = formData.escf_status
    const d = formData.pe_disposition || ''
    if (s === 2) return 'Rejected'
    if (!d) return 'Pending'
    if (d === 'Approved' && s === 1) return 'Implemented'
    if (d === 'Approved' && s === 0) return 'Approved'
    return 'Approved'
  })()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              ESCF #{record.id}
              <StatusBadge status={computedStatus} />
            </h3>
            <p className="text-sm text-slate-500">{record.initiator} · {record.subdate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setFormData(record) }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2">
                <X size={18} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                <Save size={18} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              {isAdmin && (
                <button onClick={() => setEditing(true)}
                  className="px-4 py-2 text-green-700 hover:bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                  <Pencil size={18} /> Edit
                </button>
              )}
              <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2">
                <X size={18} /> Close
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Summary grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'ID', field: 'id', editable: false },
            { label: 'Department', field: 'department', editable: true },
            { label: 'Affected Departments', field: 'affected_departments', editable: true },
            { label: 'WCM', field: 'wcm', editable: true },
            { label: 'Initiator', field: 'initiator', editable: true },
            { label: 'PES', field: 'pes', editable: true },
            { label: 'Submit Date', field: 'subdate', editable: false },
            { label: 'Submit Time', field: 'subtime', editable: false },
            { label: 'PE Disposition', field: 'pe_disposition', editable: true },
            { label: 'ESCF Status', field: 'escf_status', editable: true },
          ].map(f => (
            <div key={f.field}>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{f.label}</p>
              {editing && f.editable ? (
                <input type="text" value={formData[f.field] ?? ''}
                  onChange={e => updateField(f.field, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm text-slate-800">{record[f.field] ?? <span className="text-slate-300">—</span>}</p>
              )}
            </div>
          ))}
        </div>

        {/* Extra fields */}
        {extraFields.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Additional Fields</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {extraFields.map(k => (
                <div key={k}>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{k}</p>
                  {editing ? (
                    <input type="text" value={formData[k] ?? ''}
                      onChange={e => updateField(k, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  ) : (
                    <p className="text-sm text-slate-800 break-words">{String(record[k] ?? '')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change History */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Change History ({history.length})</h4>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">No changes recorded yet</p>
          ) : (
            <div className="space-y-2">
              {history.map((h: any) => (
                <div key={h.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700">{h.field_name}</span>
                    <span className="text-xs text-slate-400">{h.changed_by} · {new Date(h.changed_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    <span className="text-red-500 line-through">{h.old_value || '(empty)'}</span>
                    {' → '}
                    <span className="text-green-600">{h.new_value || '(empty)'}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Standards Page ─────────────────────────────────────────
export default function StandardsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ESCF[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<string>('id')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const pageSize = 25

  // Tab state
  const [openTabs, setOpenTabs] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<string>('list')

  const isAdmin = session?.user?.roles?.some((r: string) => r === 'Admin') || false

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/products/changes/standards'))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setData(r.data || [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => {
    let rows = data
    if (statusFilter !== 'all') {
      rows = rows.filter(r => r.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        String(r.id).includes(q) ||
        String(r.department || '').toLowerCase().includes(q) ||
        String(r.initiator || '').toLowerCase().includes(q) ||
        String(r.wcm || '').toLowerCase().includes(q) ||
        String(r.pes || '').toLowerCase().includes(q) ||
        String(r.affected_departments || '').toLowerCase().includes(q)
      )
    }
    return [...rows].sort((a, b) => {
      const va = String(a[sortKey] ?? '')
      const vb = String(b[sortKey] ?? '')
      const cmp = sortKey === 'id'
        ? (a.id - b.id)
        : va.localeCompare(vb, undefined, { numeric: true })
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [data, search, statusFilter, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'id' ? 'desc' : 'asc') }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown size={14} className="text-slate-300" />
    return sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
  }

  const handleRowClick = (escf: ESCF) => {
    if (!openTabs.includes(escf.id)) {
      setOpenTabs(prev => [...prev, escf.id])
    }
    setActiveTab(`escf-${escf.id}`)
  }

  const closeTab = (id: number) => {
    setOpenTabs(prev => prev.filter(t => t !== id))
    setActiveTab('list')
  }

  // Status counts for filter buttons
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: data.length, Pending: 0, Approved: 0, Implemented: 0, Rejected: 0 }
    data.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })
    return counts
  }, [data])

  // ─── Tab-based rendering ──────────────────────────────────────
  if (activeTab.startsWith('escf-')) {
    const id = parseInt(activeTab.replace('escf-', ''))
    return (
      <div className="p-6 h-[calc(100vh-4rem)]">
        {/* Tab bar */}
        <div className="border-b border-slate-200 mb-4 flex gap-1 overflow-x-auto">
          <button onClick={() => setActiveTab('list')}
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap">
            All Standards
          </button>
          {openTabs.map(tabId => (
            <button key={tabId} onClick={() => setActiveTab(`escf-${tabId}`)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === `escf-${tabId}` ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              ESCF #{tabId}
              <span onClick={e => { e.stopPropagation(); closeTab(tabId) }}
                className="p-0.5 hover:bg-slate-200 rounded"><X size={14} /></span>
            </button>
          ))}
        </div>
        <div className="h-[calc(100%-3rem)]">
          <ESCFDetail escfId={id} isAdmin={isAdmin} onClose={() => closeTab(id)} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Tab bar */}
      <div className="border-b border-slate-200 mb-4 flex gap-1 overflow-x-auto flex-shrink-0">
        <button className="px-4 py-2.5 text-sm font-medium border-b-2 border-blue-600 text-blue-600 whitespace-nowrap">
          All Standards
        </button>
        {openTabs.map(tabId => (
          <button key={tabId} onClick={() => setActiveTab(`escf-${tabId}`)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap flex items-center gap-2">
            ESCF #{tabId}
            <span onClick={e => { e.stopPropagation(); closeTab(tabId) }}
              className="p-0.5 hover:bg-slate-200 rounded"><X size={14} /></span>
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <Link href="/products/changes" className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Standards</h2>
        <span className="text-sm text-slate-500">({filtered.length} records)</span>
      </div>

      {/* Status filter buttons */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        {(['all', 'Pending', 'Approved', 'Implemented', 'Rejected'] as StatusFilter[]).map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              statusFilter === s
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-slate-200 text-slate-600 hover:border-blue-300'
            }`}>
            {s === 'all' ? 'All' : s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search ID, department, initiator, WCM, PES..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <button onClick={fetchData} disabled={loading}
          className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-3">{error}</div>}

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 overflow-y-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '6%' }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              {[['id','ID'],['department','Department'],['affected_departments','Affected Depts'],['wcm','WCM'],['initiator','Initiator'],['pes','PES'],['subdate','Date'],['status','Status']].map(([k,l]) => (
                <th key={k} className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none" onClick={() => toggleSort(k)}>
                  <div className="flex items-center gap-1">{l} <SortIcon col={k} /></div>
                </th>
              ))}
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Loading...
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No records found</td></tr>
            ) : paginated.map((row, idx) => (
              <tr key={`${row.id}-${idx}`}
                className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer"
                onClick={() => handleRowClick(row)}>
                <td className="px-3 py-2.5 font-mono font-medium text-slate-800">{row.id}</td>
                <td className="px-3 py-2.5 text-slate-700 truncate">{row.department || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 text-xs truncate">{row.affected_departments || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 truncate">{row.wcm || '—'}</td>
                <td className="px-3 py-2.5 text-slate-700 truncate">{row.initiator || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 truncate">{row.pes || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600 text-xs">{row.subdate || '—'}</td>
                <td className="px-3 py-2.5"><StatusBadge status={row.status} /></td>
                <td className="px-3 py-2.5">
                  <FileText size={16} className="text-slate-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 flex-shrink-0">
        <span className="text-sm text-slate-500">
          Page {page + 1} of {totalPages || 1}
        </span>
        <div className="flex gap-1">
          <button onClick={() => setPage(0)} disabled={page === 0}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">First</button>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">Previous</button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pn = page < 3 ? i : page - 2 + i
            if (pn >= totalPages) return null
            return (
              <button key={pn} onClick={() => setPage(pn)}
                className={`px-3 py-1 rounded text-sm ${pn === page ? 'bg-slate-800 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
                {pn + 1}
              </button>
            )
          })}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">Next</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-sm">Last</button>
        </div>
      </div>
    </div>
  )
}
