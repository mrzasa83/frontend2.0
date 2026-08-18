'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, ScanLine, Plus, X, Trash2, ArrowLeft } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type PORow = {
  po_number: string; customer: string; apc_part: string
  file_count: number; version_count: number; latest_version: string; latest_mtime: string | null
}
type POFile = {
  id: number; version_label: string; version_rank: number | null
  file_name: string; file_path: string; file_mtime: string | null; file_size: number | null
}
type PORelation = {
  id: number; clause_id: number; standard: string; clause_number: string
  how_added: string; source_file: string; confidence: string
  created_by: string; created_at: string; title: string; classification: string
}
type Clause = { id: number; standard: string; clause_number: string; title: string; classification: string }

const LIST_COLS: { key: keyof PORow; label: string; w?: number }[] = [
  { key: 'po_number', label: 'PO #', w: 150 },
  { key: 'customer', label: 'Customer', w: 150 },
  { key: 'apc_part', label: 'APC Part', w: 110 },
  { key: 'latest_version', label: 'Version', w: 100 },
  { key: 'version_count', label: 'Versions', w: 90 },
  { key: 'file_count', label: 'Files', w: 80 },
  { key: 'latest_mtime', label: 'Latest', w: 120 },
]

function fmtDate(v: any) {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(undefined, { year: '2-digit', month: 'numeric', day: 'numeric' })
}

export default function POsPage() {
  const { data: session } = useSession()
  const [rows, setRows] = useState<PORow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<{ key: keyof PORow; dir: 'asc' | 'desc' } | null>(null)
  const [selected, setSelected] = useState<PORow | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/contract/pos'))
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      const r = await res.json()
      setRows(r.rows || [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const g = globalFilter.trim().toLowerCase()
    return rows.filter(row => {
      if (g) {
        const hay = `${row.po_number} ${row.customer} ${row.apc_part} ${row.latest_version}`.toLowerCase()
        if (!hay.includes(g)) return false
      }
      for (const [k, v] of Object.entries(colFilters)) {
        if (!v) continue
        if (!String((row as any)[k] ?? '').toLowerCase().includes(v.toLowerCase())) return false
      }
      return true
    })
  }, [rows, globalFilter, colFilters])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { key, dir } = sort
    return [...filtered].sort((a, b) => {
      const av = a[key] ?? '', bv = b[key] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av
      return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
  }, [filtered, sort])

  const toggleSort = (key: keyof PORow) =>
    setSort(s => s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' })

  if (selected) return <PODetail po={selected} onBack={() => setSelected(null)} session={session} />

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">POs</h1>
          <p className="text-sm text-slate-600">
            Purchase orders from the QC PO catalog · one row per PO # + customer
            {!loading && <span className="text-slate-400"> · {sorted.length} of {rows.length}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search PO / customer…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
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
              {LIST_COLS.map(c => {
                const active = sort?.key === c.key
                return (
                  <th key={c.key} style={{ width: c.w }} className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-200">
                    <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-slate-900">
                      {c.label}
                      {active ? (sort!.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={10} className="text-slate-300" />}
                    </button>
                  </th>
                )
              })}
            </tr>
            <tr>
              {LIST_COLS.map(c => (
                <th key={c.key} className="px-1 py-1 border-b border-slate-200 bg-white">
                  <input value={colFilters[c.key] || ''} onChange={e => setColFilters(f => ({ ...f, [c.key]: e.target.value }))}
                    placeholder="filter"
                    className="w-full min-w-[60px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={LIST_COLS.length} className="px-3 py-8 text-center text-slate-400"><RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={LIST_COLS.length} className="px-3 py-8 text-center text-slate-400">No POs match.</td></tr>
            ) : sorted.map((r, i) => (
              <tr key={`${r.po_number}|${r.customer}|${i}`} onClick={() => setSelected(r)}
                className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
                <td className="px-3 py-1.5 font-mono text-blue-600 font-medium">{r.po_number}</td>
                <td className="px-3 py-1.5 text-slate-700">{r.customer}</td>
                <td className="px-3 py-1.5 font-mono text-slate-800">{r.apc_part}</td>
                <td className="px-3 py-1.5 text-slate-600">{r.latest_version || '—'}</td>
                <td className="px-3 py-1.5 text-slate-500 tabular-nums">{r.version_count}</td>
                <td className="px-3 py-1.5 text-slate-500 tabular-nums">{r.file_count}</td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">{fmtDate(r.latest_mtime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PODetail({ po, onBack, session }: { po: PORow; onBack: () => void; session: any }) {
  const [tab, setTab] = useState<'general' | 'clauses' | 'files'>('general')
  const [files, setFiles] = useState<POFile[]>([])
  const [relations, setRelations] = useState<PORelation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDetail = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/contract/pos?po=${encodeURIComponent(po.po_number)}&customer=${encodeURIComponent(po.customer)}`))
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      const r = await res.json()
      setFiles(r.files || []); setRelations(r.clauses || [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [po])
  useEffect(() => { loadDetail() }, [loadDetail])

  const TABS = [
    { id: 'general', label: 'General' },
    { id: 'clauses', label: 'Clauses' },
    { id: 'files', label: 'Files' },
  ] as const

  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft size={15} /> All POs
      </button>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800 font-mono">{po.po_number}</h1>
        <p className="text-sm text-slate-600">{po.customer} · APC {po.apc_part} · latest {po.latest_version || '—'}</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {tab === 'general' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-2xl">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><dt className="text-xs uppercase text-slate-400">PO #</dt><dd className="font-mono text-slate-800">{po.po_number}</dd></div>
            <div><dt className="text-xs uppercase text-slate-400">Customer</dt><dd className="text-slate-800">{po.customer}</dd></div>
            <div><dt className="text-xs uppercase text-slate-400">APC Part</dt><dd className="font-mono text-slate-800">{po.apc_part}</dd></div>
            <div><dt className="text-xs uppercase text-slate-400">Latest Version</dt><dd className="text-slate-800">{po.latest_version || '—'}</dd></div>
            <div><dt className="text-xs uppercase text-slate-400">Versions</dt><dd className="text-slate-800">{po.version_count}</dd></div>
            <div><dt className="text-xs uppercase text-slate-400">Files</dt><dd className="text-slate-800">{po.file_count}</dd></div>
            <div><dt className="text-xs uppercase text-slate-400">Latest File</dt><dd className="text-slate-800">{fmtDate(po.latest_mtime)}</dd></div>
            <div><dt className="text-xs uppercase text-slate-400">Related Clauses</dt><dd className="text-slate-800">{relations.length}</dd></div>
          </dl>
        </div>
      )}

      {tab === 'clauses' && <ClausesTab po={po} relations={relations} reload={loadDetail} session={session} />}
      {tab === 'files' && <FilesTab files={files} loading={loading} />}
    </div>
  )
}

function FilesTab({ files, loading }: { files: POFile[]; loading: boolean }) {
  if (loading) return <div className="text-slate-500 py-6 flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
  if (!files.length) return <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">No files for this PO.</div>
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Version</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">File</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Date</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-24">Size</th>
          </tr>
        </thead>
        <tbody>
          {files.map(f => (
            <tr key={f.id} className="border-t border-slate-100">
              <td className="px-3 py-1.5 text-slate-700">{f.version_label || '—'}</td>
              <td className="px-3 py-1.5 text-slate-600">{f.file_name}</td>
              <td className="px-3 py-1.5 text-slate-500 text-xs">{fmtDate(f.file_mtime)}</td>
              <td className="px-3 py-1.5 text-right text-slate-500 text-xs tabular-nums">{f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ClausesTab({ po, relations, reload, session }: { po: PORow; relations: PORelation[]; reload: () => void; session: any }) {
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [scanError, setScanError] = useState('')
  const [manualOpen, setManualOpen] = useState(false)

  const runScan = async () => {
    setScanning(true); setScanError(''); setScanResult(null)
    try {
      const res = await fetch(getApiUrl('/api/contract/pos/scan'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po_number: po.po_number, customer: po.customer }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Scan failed')
      setScanResult(r)
    } catch (e: any) { setScanError(e.message) }
    setScanning(false)
  }

  const acceptSuggestion = async (clause_id: number) => {
    await fetch(getApiUrl('/api/contract/pos/clauses'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ po_number: po.po_number, customer: po.customer, clause_id }),
    })
    reload()
    setScanResult((sr: any) => sr ? { ...sr, suggestions: sr.suggestions.map((s: any) => s.id === clause_id ? { ...s, already_related: true } : s) } : sr)
  }

  const removeRelation = async (id: number) => {
    await fetch(getApiUrl(`/api/contract/pos/clauses?id=${id}`), { method: 'DELETE' })
    reload()
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={runScan} disabled={scanning}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
          {scanning ? <RefreshCw size={14} className="animate-spin" /> : <ScanLine size={14} />}
          {scanning ? 'Scanning latest version…' : 'Auto Scan'}
        </button>
        <button onClick={() => setManualOpen(true)}
          className="px-3 py-1.5 text-sm border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-1.5">
          <Plus size={14} /> Manually add
        </button>
      </div>

      {scanError && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{scanError}</div>}

      {scanResult && (
        <div className="mb-4 border border-blue-200 bg-blue-50/50 rounded-lg p-3">
          <div className="text-sm text-slate-700 mb-2">
            Scanned <span className="font-medium">{scanResult.scanned_file}</span> ({scanResult.version || 'latest'}) ·
            {' '}{scanResult.pages} pages{scanResult.ocr_pages ? `, ${scanResult.ocr_pages} via OCR` : ''} ·
            {' '}{scanResult.suggestions?.length || 0} catalog matches.
            <span className="text-slate-500"> Review and accept the ones that apply — it’s your call.</span>
          </div>
          {scanResult.suggestions?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded overflow-hidden mb-2">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr>
                  <th className="px-3 py-1.5 text-left text-xs text-slate-600">Standard</th>
                  <th className="px-3 py-1.5 text-left text-xs text-slate-600">Clause</th>
                  <th className="px-3 py-1.5 text-left text-xs text-slate-600">Title</th>
                  <th className="px-3 py-1.5 text-right text-xs text-slate-600 w-24"></th>
                </tr></thead>
                <tbody>
                  {scanResult.suggestions.map((s: any) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-3 py-1.5 text-slate-700">{s.standard}</td>
                      <td className="px-3 py-1.5 font-mono text-slate-800">{s.clause_number}</td>
                      <td className="px-3 py-1.5 text-slate-600 truncate max-w-md">{s.title}</td>
                      <td className="px-3 py-1.5 text-right">
                        {s.already_related
                          ? <span className="text-xs text-green-600">✓ related</span>
                          : <button onClick={() => acceptSuggestion(s.id)} className="text-xs text-blue-600 hover:underline">Accept</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {scanResult.unmatched?.length > 0 && (
            <p className="text-xs text-slate-500">
              Also found in text but not in the catalog: {scanResult.unmatched.map((u: any) => u.number).join(', ')}.
            </p>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">PO #</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Standard</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Clause</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Title</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-32">How Added</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {relations.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400 text-sm">No clauses related yet. Use Auto Scan or Manually add.</td></tr>
            ) : relations.map(r => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 font-mono text-slate-600">{po.po_number}</td>
                <td className="px-3 py-1.5 text-slate-700">{r.standard}</td>
                <td className="px-3 py-1.5 font-mono text-slate-800">{r.clause_number}</td>
                <td className="px-3 py-1.5 text-slate-600 truncate max-w-md">{r.title}</td>
                <td className="px-3 py-1.5">
                  {r.how_added === 'auto'
                    ? <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Auto Scan</span>
                    : <span className="text-xs text-slate-600">{r.how_added}</span>}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <button onClick={() => removeRelation(r.id)} className="text-slate-400 hover:text-red-600" title="Remove"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {manualOpen && <ManualAddModal po={po} onClose={() => setManualOpen(false)} onAdded={() => { setManualOpen(false); reload() }} />}
    </div>
  )
}

function ManualAddModal({ po, onClose, onAdded }: { po: PORow; onClose: () => void; onAdded: () => void }) {
  const [all, setAll] = useState<Clause[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(getApiUrl('/api/contract/clauses'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAll(d.rows || []) })
      .catch(() => {})
  }, [])

  const matches = useMemo(() => {
    const s = q.trim().toUpperCase()
    if (!s) return []
    return all.filter(c =>
      c.clause_number.toUpperCase().includes(s) || c.title.toUpperCase().includes(s) || c.standard.toUpperCase().includes(s)
    ).slice(0, 30)
  }, [all, q])

  const add = async (clause_id: number) => {
    setBusy(true); setErr('')
    try {
      const res = await fetch(getApiUrl('/api/contract/pos/clauses'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po_number: po.po_number, customer: po.customer, clause_id }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to add')
      onAdded()
    } catch (e: any) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Add a clause to {po.po_number}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} autoFocus
            placeholder="Type a clause number, title, or standard…"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        {err && <div className="p-2 mb-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{err}</div>}
        <div className="max-h-72 overflow-auto border border-slate-100 rounded">
          {matches.length === 0 ? (
            <p className="text-sm text-slate-400 p-3">{q ? 'No matching clauses.' : 'Start typing to search the catalog.'}</p>
          ) : matches.map(c => (
            <button key={c.id} onClick={() => add(c.id)} disabled={busy}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center gap-2 disabled:opacity-50">
              <span className="text-xs text-slate-500 w-16 shrink-0">{c.standard}</span>
              <span className="font-mono text-sm text-slate-800 w-28 shrink-0">{c.clause_number}</span>
              <span className="text-sm text-slate-600 truncate">{c.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
