'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Tabs from '@/components/ui/Tabs'
import FilePreviewModal from '@/components/products/FilePreviewModal'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, ScanLine, Plus, X, Trash2,
  ClipboardList, ScrollText, Files, Eye, Download, ChevronLeft, ChevronRight,
} from 'lucide-react'
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
  how_added: string; title: string; classification: string
  found_pages?: string; source_file?: string; confidence?: string
}
type Clause = { id: number; standard: string; clause_number: string; title: string; classification: string }

const LIST_COLS: { key: string; label: string; w?: number }[] = [
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
function ext(name: string) { const m = /\.([^.]+)$/.exec(name || ''); return m ? m[1].toLowerCase() : '' }

export default function POsPage() {
  const { data: session } = useSession()
  const [openPOs, setOpenPOs] = useState<PORow[]>([])
  const [activeTab, setActiveTab] = useState('all')

  const openPO = (po: PORow) => {
    const id = `po-${po.po_number}-${po.customer}`
    if (!openPOs.find(p => `po-${p.po_number}-${p.customer}` === id)) setOpenPOs(v => [...v, po])
    setActiveTab(id)
  }
  const closePO = (po: PORow) => {
    const id = `po-${po.po_number}-${po.customer}`
    setOpenPOs(v => v.filter(p => `po-${p.po_number}-${p.customer}` !== id))
    setActiveTab('all')
  }

  const tabs = [
    { id: 'all', label: 'All POs', content: <POList onOpen={openPO} />, closeable: false },
    ...openPOs.map(po => {
      const id = `po-${po.po_number}-${po.customer}`
      return {
        id, label: po.po_number, closeable: true, onClose: () => closePO(po),
        content: <PODetail key={id} po={po} session={session} />,
      }
    }),
  ]

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">POs</h1>
        <p className="text-sm text-slate-600">Purchase orders from the QC PO catalog · one row per PO # + customer</p>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} preserveState={true} />
        </div>
      </div>
    </div>
  )
}

// ---- List tab (server-side paginated / filtered / sorted) ----
function POList({ onOpen }: { onOpen: (po: PORow) => void }) {
  const [rows, setRows] = useState<PORow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [qInput, setQInput] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'latest_mtime', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  // Per-column filters (typed) and the debounced copy actually sent to the server.
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({})

  // Debounce filter typing so we aren't firing a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedFilters(colFilters)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [colFilters])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const p = new URLSearchParams({
        page: String(page), pageSize: '100', sort: sort.key, dir: sort.dir,
      })
      if (q.trim()) p.set('q', q.trim())
      const PARAM: Record<string, string> = {
        po_number: 'f_po', customer: 'f_customer', apc_part: 'f_apc', latest_version: 'f_version',
      }
      for (const [key, val] of Object.entries(appliedFilters)) {
        const name = PARAM[key]
        if (name && val.trim()) p.set(name, val.trim())
      }
      const res = await fetch(getApiUrl(`/api/contract/pos?${p.toString()}`))
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      const r = await res.json()
      setRows(r.rows || []); setPages(r.pages || 1); setTotal(r.total || 0)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [page, sort, q, appliedFilters])
  useEffect(() => { load() }, [load])

  const toggleSort = (key: string) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }
  const commitSearch = () => { setQ(qInput); setPage(1) }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${total.toLocaleString()} POs · page ${page} of ${pages}`}
          {Object.values(appliedFilters).some(v => v.trim()) && (
            <button onClick={() => setColFilters({})}
              className="ml-2 text-blue-600 hover:underline">clear filters</button>
          )}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={qInput} onChange={e => setQInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitSearch() }}
              placeholder="Search PO / customer / part…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={commitSearch} className="px-2.5 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Go</button>
          {q && <button onClick={() => { setQ(''); setQInput(''); setPage(1) }} className="px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">✕</button>}
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[calc(100vh-300px)]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {LIST_COLS.map(c => {
                const active = sort.key === c.key
                return (
                  <th key={c.key} style={{ width: c.w }} className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-200">
                    <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-slate-900">
                      {c.label}
                      {active ? (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={10} className="text-slate-300" />}
                    </button>
                  </th>
                )
              })}
            </tr>
            <tr>
              {LIST_COLS.map(c => {
                const filterable = ['po_number', 'customer', 'apc_part', 'latest_version'].includes(c.key)
                return (
                  <th key={c.key} className="px-1 py-1 border-b border-slate-200 bg-white">
                    {filterable && (
                      <input value={colFilters[c.key] || ''}
                        onChange={e => setColFilters(f => ({ ...f, [c.key]: e.target.value }))}
                        placeholder="filter"
                        className="w-full min-w-[60px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={LIST_COLS.length} className="px-3 py-8 text-center text-slate-400"><RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={LIST_COLS.length} className="px-3 py-8 text-center text-slate-400">No POs match.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={`${r.po_number}|${r.customer}|${i}`} onClick={() => onOpen(r)}
                className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
                <td className="px-3 py-1.5 font-mono text-blue-600 font-medium hover:underline">{r.po_number}</td>
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

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 flex items-center gap-1"><ChevronLeft size={14} /> Prev</button>
          <span className="text-slate-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 flex items-center gap-1">Next <ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  )
}

// ---- PO detail (side-rail tabs) ----
function PODetail({ po, session }: { po: PORow; session: any }) {
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
    { id: 'general', label: 'General', icon: ClipboardList },
    { id: 'clauses', label: 'Clauses', icon: ScrollText },
    { id: 'files', label: 'Files', icon: Files },
  ] as const

  return (
    <div>
      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      <div className="flex gap-0 min-h-[400px]">
        <div className="w-52 flex-shrink-0 border-r border-slate-200">
          {TABS.map(t => {
            const Icon = t.icon; const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left rounded-lg transition-colors ${active ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon size={16} /> {t.label}
              </button>
            )
          })}
        </div>
        <div className="flex-1 pl-6 min-w-0">
          {tab === 'general' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">General</h3>
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
            </div>
          )}
          {tab === 'clauses' && <ClausesTab po={po} relations={relations} files={files} reload={loadDetail} session={session} />}
          {tab === 'files' && <FilesTab files={files} loading={loading} />}
        </div>
      </div>
    </div>
  )
}

// ---- Files tab: preview (eye) + download ----
function FilesTab({ files, loading }: { files: POFile[]; loading: boolean }) {
  const [preview, setPreview] = useState<{ files: any[]; index: number } | null>(null)
  if (loading) return <div className="text-slate-500 py-6 flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
  if (!files.length) return <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">No files for this PO.</div>

  const previewList = files.map(f => ({ name: f.file_name, path: f.file_path, extension: ext(f.file_name) }))
  const download = (f: POFile) => window.open(getApiUrl(`/api/files/serve?path=${encodeURIComponent(f.file_path)}&download=true`), '_blank')

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Files</h3>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Version</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">File</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Date</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-24">Size</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-24">View</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) => (
              <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 text-slate-700">{f.version_label || '—'}</td>
                <td className="px-3 py-1.5 text-slate-600">{f.file_name}</td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">{fmtDate(f.file_mtime)}</td>
                <td className="px-3 py-1.5 text-right text-slate-500 text-xs tabular-nums">{f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : ''}</td>
                <td className="px-3 py-1.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setPreview({ files: previewList, index: i })} className="text-slate-500 hover:text-blue-600" title="Preview"><Eye size={16} /></button>
                    <button onClick={() => download(f)} className="text-slate-500 hover:text-blue-600" title="Download"><Download size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview && (
        <FilePreviewModal files={preview.files} index={preview.index}
          onIndexChange={(i: number) => setPreview(p => p ? { ...p, index: i } : p)}
          onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

// ---- Clauses tab: relations + Auto Scan (with file select) + Manual add ----
function ClausesTab({ po, relations, files, reload, session }: { po: PORow; relations: PORelation[]; files: POFile[]; reload: () => void; session: any }) {
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [scanError, setScanError] = useState('')
  const [fileChoices, setFileChoices] = useState<any[] | null>(null)
  const [manualOpen, setManualOpen] = useState(false)

  const doScan = async (file_path?: string) => {
    setScanning(true); setScanError(''); setScanResult(null); setFileChoices(null)
    try {
      const res = await fetch(getApiUrl('/api/contract/pos/scan'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po_number: po.po_number, customer: po.customer, ...(file_path ? { file_path } : {}) }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Scan failed')
      if (r.needsFileChoice) { setFileChoices(r.files); setScanning(false); return }
      setScanResult(r)
    } catch (e: any) { setScanError(e.message) }
    setScanning(false)
  }

  const acceptSuggestion = async (clause_id: number, found_pages = '') => {
    await fetch(getApiUrl('/api/contract/pos/clauses'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        po_number: po.po_number, customer: po.customer, clause_id,
        via: 'auto', found_pages, source_file: scanResult?.scanned_file || '',
      }),
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
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Clauses</h3>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => doScan()} disabled={scanning}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
          {scanning ? <RefreshCw size={14} className="animate-spin" /> : <ScanLine size={14} />}
          {scanning ? 'Scanning…' : 'Auto Scan'}
        </button>
        <button onClick={() => setManualOpen(true)}
          className="px-3 py-1.5 text-sm border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-1.5">
          <Plus size={14} /> Manually add
        </button>
      </div>

      {scanError && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{scanError}</div>}

      {/* File chooser when multiple PDFs */}
      {fileChoices && (
        <div className="mb-4 border border-amber-200 bg-amber-50 rounded-lg p-3">
          <p className="text-sm text-slate-700 mb-2">This PO has multiple PDFs — pick the one to scan:</p>
          <div className="space-y-1">
            {fileChoices.map((f, i) => (
              <button key={i} onClick={() => doScan(f.file_path)}
                className="w-full text-left px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-blue-50 flex items-center gap-2 text-sm">
                <span className="text-slate-500 w-16 shrink-0">{f.version_label || '—'}</span>
                <span className="text-slate-700 truncate">{f.file_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {scanResult && (
        <div className="mb-4 border border-blue-200 bg-blue-50/50 rounded-lg p-3">
          <div className="text-sm text-slate-700 mb-2">
            Scanned <span className="font-medium">{scanResult.scanned_file}</span> ({scanResult.version || 'latest'}) ·
            {' '}{scanResult.pages} pages{scanResult.ocr_pages ? `, ${scanResult.ocr_pages} via OCR` : ''} ·
            {' '}{scanResult.suggestions?.length || 0} catalog matches.
            <span className="text-slate-500"> Accept the ones that apply — it’s your call.</span>
          </div>
          {scanResult.suggestions?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded overflow-hidden mb-2">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr>
                  <th className="px-3 py-1.5 text-left text-xs text-slate-600">Standard</th>
                  <th className="px-3 py-1.5 text-left text-xs text-slate-600">Clause</th>
                  <th className="px-3 py-1.5 text-left text-xs text-slate-600">Title</th>
                  <th className="px-3 py-1.5 text-left text-xs text-slate-600 w-20">Page</th>
                  <th className="px-3 py-1.5 text-right text-xs text-slate-600 w-24"></th>
                </tr></thead>
                <tbody>
                  {scanResult.suggestions.map((s: any) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-3 py-1.5 text-slate-700">{s.standard}</td>
                      <td className="px-3 py-1.5 font-mono text-slate-800">{s.clause_number}</td>
                      <td className="px-3 py-1.5 text-slate-600 truncate max-w-md">{s.title}</td>
                      <td className="px-3 py-1.5">
                        <PageLinks pages={s.pages || []} path={scanResult?.scanned_path || ''} />
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {s.already_related ? <span className="text-xs text-green-600">✓ related</span>
                          : <button onClick={() => acceptSuggestion(s.id, s.found_pages || '')} className="text-xs text-blue-600 hover:underline">Accept</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {scanResult.unmatched?.length > 0 && (
            <p className="text-xs text-slate-500">Also found in text but not in the catalog: {scanResult.unmatched.map((u: any) => u.number).join(', ')}.</p>
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
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-24">Page</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-32">How Added</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {relations.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-400 text-sm">No clauses related yet. Use Auto Scan or Manually add.</td></tr>
            ) : relations.map(r => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 font-mono text-slate-600">{po.po_number}</td>
                <td className="px-3 py-1.5 text-slate-700">{r.standard}</td>
                <td className="px-3 py-1.5 font-mono text-slate-800">{r.clause_number}</td>
                <td className="px-3 py-1.5 text-slate-600 truncate max-w-md">{r.title}</td>
                <td className="px-3 py-1.5">
                  <PageLinks
                    pages={(r.found_pages || '').split(',').map(x => parseInt(x, 10)).filter(n => !isNaN(n))}
                    path={pdfPathFor(r.source_file || '', files)} />
                </td>
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

/** Resolve a stored source file name back to its full path from the PO's file list. */
function pdfPathFor(sourceFile: string, files: POFile[]): string {
  if (!sourceFile) return ''
  const hit = files.find(f => f.file_name === sourceFile)
  return hit?.file_path || ''
}

/**
 * Page numbers a clause was found on. Each links into the PDF at that page —
 * browsers' built-in PDF viewers honour the #page=N fragment.
 */
function PageLinks({ pages, path }: { pages: number[]; path: string }) {
  if (!pages?.length) return <span className="text-slate-300 text-xs">—</span>
  return (
    <span className="flex flex-wrap gap-1">
      {pages.map(p => (
        path ? (
          <a key={p}
            href={`${getApiUrl(`/api/files/serve?path=${encodeURIComponent(path)}`)}#page=${p}`}
            target="_blank" rel="noopener noreferrer"
            title={`Open the PDF at page ${p}`}
            className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-blue-700 hover:bg-blue-100">
            {p}
          </a>
        ) : (
          <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{p}</span>
        )
      ))}
    </span>
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

  const s = q.trim().toUpperCase()
  const matches = !s ? [] : all.filter(c =>
    c.clause_number.toUpperCase().includes(s) || c.title.toUpperCase().includes(s) || c.standard.toUpperCase().includes(s)
  ).slice(0, 30)

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
