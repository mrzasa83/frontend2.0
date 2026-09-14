'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Tabs from '@/components/ui/Tabs'
import DrawingNoteDetail from '@/components/products/DrawingNoteDetail'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, StickyNote,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Note = {
  id: number; note_code: string; name: string; description: string
  text: string; customer: string; status: string
  version_no: number; version_count: number
  part_count: number; part_numbers: string
  approved_at: string | null; created_at: string
}

type SortKey = 'note_code' | 'name' | 'customer' | 'status' | 'part_count'

const statusBadge = (s: string) =>
  s === 'Active' ? 'bg-green-100 text-green-700'
    : s === 'Pending' ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-500'

export default function DrawingNotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('note_code')
  const [sortAsc, setSortAsc] = useState(true)
  // Opened notes become tabs across the top, matching the other product apps.
  const [openCodes, setOpenCodes] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('list')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(getApiUrl('/api/products/drawing-notes'))
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load')
      setNotes(d.notes || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notes.filter(n => {
      if (statusFilter && n.status !== statusFilter) return false
      if (!term) return true
      return [n.note_code, n.name, n.description, n.text, n.customer, n.part_numbers]
        .some(v => (v || '').toLowerCase().includes(term))
    })
  }, [notes, search, statusFilter])

  const sorted = useMemo(() => {
    const rows = [...filtered]
    rows.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
      return sortAsc
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''))
    })
    return rows
  }, [filtered, sortKey, sortAsc])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc(v => !v)
    else { setSortKey(k); setSortAsc(true) }
  }
  const SortIcon = ({ k }: { k: SortKey }) =>
    k !== sortKey ? <ArrowUpDown className="w-3 h-3 opacity-40" />
      : sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />

  const openNote = (code: string) => {
    setOpenCodes(c => (c.includes(code) ? c : [...c, code]))
    setActiveTab(code)
  }
  const closeNote = (code: string) => {
    setOpenCodes(c => c.filter(x => x !== code))
    setActiveTab('list')
  }

  const listTab = (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Drawing Notes ({sorted.length}{search || statusFilter ? ` of ${notes.length}` : ''})
          </h3>
          <p className="text-sm text-slate-600">
            Notes captured from released product drawings. Archive new ones from
            Products ▸ Released ▸ Final Inspection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search notes, parts…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg">
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {loading && notes.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-4">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-4">
          {notes.length === 0
            ? 'No notes captured yet. Open a released drawing under Final Inspection and use "Archive Drawing Notes".'
            : 'Nothing matches that filter.'}
        </p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                {([['note_code', 'ID'], ['name', 'Name'], ['customer', 'Customer'],
                  ['status', 'Status'], ['part_count', 'Parts']] as [SortKey, string][]).map(([k, label]) => (
                  <th key={k} onClick={() => toggleSort(k)}
                    className="px-3 py-2 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 whitespace-nowrap">
                    <span className="flex items-center gap-1">{label} <SortIcon k={k} /></span>
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Description</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Text</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(n => (
                <tr key={n.id} onClick={() => openNote(n.note_code)}
                  className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                  title="Open this note">
                  <td className="px-3 py-2 font-mono text-xs font-semibold text-blue-700 whitespace-nowrap">
                    {n.note_code}
                  </td>
                  <td className="px-3 py-2">{n.name || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{n.customer || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(n.status)}`}>
                      {n.status}
                    </span>
                    {n.version_count > 1 && (
                      <span className="ml-1 text-[10px] text-slate-500">v{n.version_no}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums" title={n.part_numbers}>{n.part_count}</td>
                  <td className="px-3 py-2 max-w-xs truncate">{n.description || '—'}</td>
                  <td className="px-3 py-2 max-w-md truncate text-slate-600" title={n.text}>{n.text || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const tabs = [
    { id: 'list', label: 'All Notes', content: listTab, closeable: false },
    ...openCodes.map(code => ({
      id: code,
      label: code,
      content: <DrawingNoteDetail code={code} onChanged={load} />,
      closeable: true,
      onClose: () => closeNote(code),
    })),
  ]

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <StickyNote className="w-5 h-5 text-slate-600" />
        <h2 className="text-xl font-bold text-slate-800">Drawing Notes</h2>
      </div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
