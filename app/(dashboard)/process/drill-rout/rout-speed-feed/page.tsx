'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft, Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown,
  X, ChevronRight, FileText
} from 'lucide-react'
import Link from 'next/link'
import { getApiUrl } from '@/lib/api'

type MCNRecord = {
  id: number
  initiator: string | null
  subDate: string | null
  toolnum: string | null
  partnum: string | null
  change: string | null
  reason: string | null
  chngeffect: string | null
  [key: string]: any
}

type SortKey = 'subDate' | 'partnum' | 'toolnum' | 'initiator'
type SortDir = 'asc' | 'desc'

function formatDate(d: string | null): string {
  if (!d) return ''
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch { return d }
}

// ─── Detail View ─────────────────────────────────────────────────
function RecordDetail({ record, onClose }: { record: MCNRecord; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('details')

  // Fields for the top summary grid (exclude change/reason — those go below)
  const summaryFields = [
    { label: 'ID', value: record.id },
    { label: 'Initiator', value: record.initiator },
    { label: 'Date', value: formatDate(record.subDate) },
    { label: 'Part Number', value: record.partnum },
    { label: 'Tool Number', value: record.toolnum },
    { label: 'Change Effect', value: record.chngeffect },
  ]

  // All other columns from the record that aren't already shown
  const knownKeys = new Set(['id', 'initiator', 'subDate', 'toolnum', 'partnum', 'change', 'reason', 'chngeffect'])
  const extraFields = Object.entries(record)
    .filter(([k, v]) => !knownKeys.has(k) && v !== null && v !== '')
    .map(([k, v]) => ({ label: k, value: String(v) }))

  const tabs = [
    { id: 'details', label: 'Details' },
    // Future tabs can be added here
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              MCN #{record.id}
              {record.partnum && (
                <span className="ml-2 text-sm font-normal text-slate-500">— {record.partnum}</span>
              )}
            </h3>
            <p className="text-sm text-slate-500">
              {record.initiator} · {formatDate(record.subDate)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 px-6 flex-shrink-0">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Summary grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {summaryFields.map(f => (
                <div key={f.label}>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{f.label}</p>
                  <p className="text-sm text-slate-800">{f.value || <span className="text-slate-300">—</span>}</p>
                </div>
              ))}
            </div>

            {/* Extra fields from the record */}
            {extraFields.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                {extraFields.map(f => (
                  <div key={f.label}>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{f.label}</p>
                    <p className="text-sm text-slate-800">{f.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Change — large text field */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Change
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[100px] text-sm text-slate-800 whitespace-pre-wrap">
                {record.change || <span className="text-slate-300 italic">No change description</span>}
              </div>
            </div>

            {/* Reason — large text field */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Reason
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[100px] text-sm text-slate-800 whitespace-pre-wrap">
                {record.reason || <span className="text-slate-300 italic">No reason provided</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main List Page ──────────────────────────────────────────────
export default function RoutSpeedFeedPage() {
  const [data, setData] = useState<MCNRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('subDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedRecord, setSelectedRecord] = useState<MCNRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<MCNRecord | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(getApiUrl('/api/process/drill-rout/rout-speed-feed'))
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || 'Failed to fetch')
      }
      const result = await res.json()
      setData(result.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = async (id: number) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(getApiUrl(`/api/process/drill-rout/rout-speed-feed?id=${id}`))
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setDetailRecord(result.record)
    } catch {
      // Fall back to the list record
      setDetailRecord(data.find(r => r.id === id) || null)
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleRowClick = (record: MCNRecord) => {
    setSelectedRecord(record)
    fetchDetail(record.id)
  }

  const handleCloseDetail = () => {
    setSelectedRecord(null)
    setDetailRecord(null)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.trim().toLowerCase()
    return data.filter(r =>
      (r.partnum || '').toLowerCase().includes(q) ||
      (r.toolnum || '').toLowerCase().includes(q) ||
      (r.initiator || '').toLowerCase().includes(q) ||
      (r.change || '').toLowerCase().includes(q)
    )
  }, [data, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'subDate':
          cmp = new Date(a.subDate || 0).getTime() - new Date(b.subDate || 0).getTime()
          break
        case 'partnum':
          cmp = (a.partnum || '').localeCompare(b.partnum || '', undefined, { numeric: true })
          break
        case 'toolnum':
          cmp = (a.toolnum || '').localeCompare(b.toolnum || '', undefined, { numeric: true })
          break
        case 'initiator':
          cmp = (a.initiator || '').localeCompare(b.initiator || '')
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'subDate' ? 'desc' : 'asc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={14} className="text-slate-300" />
    return sortDir === 'asc'
      ? <ArrowUp size={14} className="text-blue-600" />
      : <ArrowDown size={14} className="text-blue-600" />
  }

  // Show detail view
  if (selectedRecord && (detailRecord || loadingDetail)) {
    if (loadingDetail) {
      return (
        <div className="flex items-center justify-center h-full py-20">
          <RefreshCw size={24} className="animate-spin text-blue-600 mr-3" />
          <span className="text-slate-600">Loading record...</span>
        </div>
      )
    }
    return <RecordDetail record={detailRecord!} onClose={handleCloseDetail} />
  }

  // Column widths
  const COL = { date: '12%', part: '14%', tool: '14%', init: '12%', change: '48%' }

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/process/drill-rout"
            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Rout - Speed/Feed Change</h1>
            <p className="text-sm text-slate-600">
              {data.length} MCN records
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search part, tool, initiator, or change..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {search && (
          <span className="text-sm text-slate-500">
            {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4 flex-shrink-0">
          {error}
        </div>
      )}

      {/* Scrollable table */}
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 overflow-y-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: COL.date }} />
            <col style={{ width: COL.part }} />
            <col style={{ width: COL.tool }} />
            <col style={{ width: COL.init }} />
            <col style={{ width: COL.change }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              <th
                className="px-4 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none"
                onClick={() => toggleSort('subDate')}
              >
                <div className="flex items-center gap-1">Date <SortIcon col="subDate" /></div>
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none"
                onClick={() => toggleSort('partnum')}
              >
                <div className="flex items-center gap-1">Part Number <SortIcon col="partnum" /></div>
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none"
                onClick={() => toggleSort('toolnum')}
              >
                <div className="flex items-center gap-1">Tool Number <SortIcon col="toolnum" /></div>
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none"
                onClick={() => toggleSort('initiator')}
              >
                <div className="flex items-center gap-1">Initiator <SortIcon col="initiator" /></div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Change</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Loading MCN records...
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  {search ? `No records matching "${search}"` : 'No rout speed/feed MCN records found'}
                </td>
              </tr>
            ) : (
              sorted.map(row => (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer group"
                >
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{formatDate(row.subDate)}</td>
                  <td className="px-4 py-2.5 font-mono font-medium text-slate-800 truncate">{row.partnum || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-700 truncate">{row.toolnum || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600 truncate">{row.initiator || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs truncate">
                    <div className="flex items-center gap-1">
                      <span className="truncate">{row.change || '—'}</span>
                      <ChevronRight size={14} className="flex-shrink-0 text-slate-300 group-hover:text-blue-500" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
