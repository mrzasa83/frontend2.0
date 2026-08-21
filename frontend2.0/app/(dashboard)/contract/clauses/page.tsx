'use client'

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import { useSession } from 'next-auth/react'
import { RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Clause = {
  id: number
  standard: string
  clause_number: string
  title: string
  clause_text: string | null
  effective_date: string
  classification: string
  reviewer: string
  date_reviewed: string
  comments: string | null
  sources: string
  updated_by: string | null
}

const COLUMNS: { key: keyof Clause; label: string; w?: number }[] = [
  { key: 'standard', label: 'Standard', w: 120 },
  { key: 'clause_number', label: 'Clause #', w: 140 },
  { key: 'title', label: 'Title', w: 360 },
  { key: 'classification', label: 'Classification', w: 130 },
  { key: 'effective_date', label: 'Effective', w: 110 },
  { key: 'reviewer', label: 'Reviewer', w: 150 },
  { key: 'sources', label: 'Source', w: 160 },
]

// Common classification values for the admin dropdown; free text also allowed.
const CLASS_OPTIONS = ['Y', 'N', 'N/A', 'RESERVED', '']

function classBadge(v: string) {
  const s = (v || '').toUpperCase()
  if (s === 'Y') return 'bg-green-100 text-green-700'
  if (s === 'N') return 'bg-red-100 text-red-700'
  if (s === 'N/A') return 'bg-slate-100 text-slate-500'
  if (!s) return 'bg-amber-50 text-amber-600'
  return 'bg-blue-50 text-blue-700'
}

export default function ClausesPage() {
  const { data: session } = useSession()
  const isAdmin = ((session?.user as any)?.roles || []).includes('Admin')

  const [rows, setRows] = useState<Clause[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [standardFilter, setStandardFilter] = useState('')
  const [sort, setSort] = useState<{ key: keyof Clause; dir: 'asc' | 'desc' } | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/contract/clauses'))
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      const r = await res.json()
      setRows(r.rows || [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const standards = useMemo(() => {
    const s = new Set(rows.map(r => r.standard).filter(Boolean))
    return Array.from(s).sort()
  }, [rows])

  const filtered = useMemo(() => {
    const g = globalFilter.trim().toLowerCase()
    return rows.filter(row => {
      if (standardFilter && row.standard !== standardFilter) return false
      if (g) {
        const hay = `${row.standard} ${row.clause_number} ${row.title} ${row.classification} ${row.clause_text ?? ''} ${row.comments ?? ''}`.toLowerCase()
        if (!hay.includes(g)) return false
      }
      for (const [k, v] of Object.entries(colFilters)) {
        if (!v) continue
        if (!String((row as any)[k] ?? '').toLowerCase().includes(v.toLowerCase())) return false
      }
      return true
    })
  }, [rows, globalFilter, colFilters, standardFilter])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { key, dir } = sort
    return [...filtered].sort((a, b) => {
      const av = String(a[key] ?? ''), bv = String(b[key] ?? '')
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [filtered, sort])

  const toggleSort = (key: keyof Clause) =>
    setSort(s => s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' })

  const startEdit = (c: Clause) => { setEditing(c.id); setEditValue(c.classification || '') }
  const cancelEdit = () => { setEditing(null); setEditValue('') }

  const saveEdit = async (id: number) => {
    setSaving(true)
    try {
      const res = await fetch(getApiUrl('/api/contract/clauses'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, classification: editValue }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed')
      const r = await res.json()
      setRows(rs => rs.map(x => x.id === id ? { ...x, classification: r.classification ?? editValue, updated_by: r.updated_by ?? x.updated_by } : x))
      setEditing(null); setEditValue('')
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const data = sorted.map(r => ({
      Standard: r.standard, 'Clause #': r.clause_number, Title: r.title,
      Classification: r.classification, Effective: r.effective_date,
      Reviewer: r.reviewer, 'Date Reviewed': r.date_reviewed,
      Comments: r.comments ?? '', Source: r.sources,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 50 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 40 }, { wch: 18 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clauses')
    XLSX.writeFile(wb, `contract-clauses_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clauses</h1>
          <p className="text-sm text-slate-600">
            Standardized FAR / DFAR / agency clause catalog
            {!loading && <span className="text-slate-400"> · {sorted.length} of {rows.length}</span>}
            {!isAdmin && <span className="text-slate-400"> · view only</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">All standards</option>
            {standards.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search clauses…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={exportExcel} disabled={!sorted.length}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
            <Download size={14} /> Excel
          </button>
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[calc(100vh-220px)]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="w-8 border-b border-slate-200" />
              {COLUMNS.map(c => {
                const active = sort?.key === c.key
                return (
                  <th key={c.key} style={{ width: c.w }}
                    className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-200">
                    <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-slate-900">
                      {c.label}
                      {active ? (sort!.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={10} className="text-slate-300" />}
                    </button>
                  </th>
                )
              })}
              {isAdmin && <th className="px-3 py-2 border-b border-slate-200 w-20" />}
            </tr>
            <tr>
              <th className="border-b border-slate-200 bg-white" />
              {COLUMNS.map(c => (
                <th key={c.key} className="px-1 py-1 border-b border-slate-200 bg-white">
                  <input value={colFilters[c.key] || ''} onChange={e => setColFilters(f => ({ ...f, [c.key]: e.target.value }))}
                    placeholder="filter"
                    className="w-full min-w-[60px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                </th>
              ))}
              {isAdmin && <th className="border-b border-slate-200 bg-white" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLUMNS.length + 2} className="px-3 py-8 text-center text-slate-400">
                <RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…
              </td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={COLUMNS.length + 2} className="px-3 py-8 text-center text-slate-400">No clauses match.</td></tr>
            ) : sorted.map(c => (
              <Fragment key={c.id}>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-2 text-center">
                    <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      className="text-slate-400 hover:text-slate-700">
                      {expanded === c.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{c.standard}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-800">{c.clause_number}</td>
                  <td className="px-3 py-1.5 text-slate-600">{c.title}</td>
                  <td className="px-3 py-1.5">
                    {editing === c.id ? (
                      <div className="flex items-center gap-1">
                        <input list="class-opts" value={editValue} onChange={e => setEditValue(e.target.value)}
                          autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') cancelEdit() }}
                          className="w-20 text-xs border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        <button onClick={() => saveEdit(c.id)} disabled={saving} className="text-green-600 hover:text-green-800"><Check size={15} /></button>
                        <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-700"><X size={15} /></button>
                      </div>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${classBadge(c.classification)}`}>
                        {c.classification || '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-slate-500 text-xs">{c.effective_date}</td>
                  <td className="px-3 py-1.5 text-slate-500 text-xs">{c.reviewer}</td>
                  <td className="px-3 py-1.5 text-slate-400 text-xs">{c.sources}</td>
                  {isAdmin && (
                    <td className="px-3 py-1.5">
                      {editing !== c.id && (
                        <button onClick={() => startEdit(c)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline">Edit</button>
                      )}
                    </td>
                  )}
                </tr>
                {expanded === c.id && (
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <td />
                    <td colSpan={COLUMNS.length + (isAdmin ? 1 : 0)} className="px-3 py-3">
                      <div className="text-sm text-slate-700 space-y-2 max-w-4xl">
                        {c.clause_text
                          ? <div><span className="text-xs font-semibold text-slate-500 uppercase">Clause Text</span>
                              <p className="whitespace-pre-wrap mt-1">{c.clause_text}</p></div>
                          : <p className="text-slate-400 italic">No clause text on file for this entry.</p>}
                        {c.comments && <div><span className="text-xs font-semibold text-slate-500 uppercase">Comments</span>
                          <p className="mt-1">{c.comments}</p></div>}
                        <div className="flex gap-6 text-xs text-slate-500 pt-1">
                          {c.date_reviewed && <span>Reviewed: {c.date_reviewed}</span>}
                          {c.updated_by && <span>Classification last set by: {c.updated_by}</span>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <datalist id="class-opts">
        {CLASS_OPTIONS.map(o => <option key={o} value={o} />)}
      </datalist>
    </div>
  )
}
