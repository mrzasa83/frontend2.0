'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import FilePreviewModal from '@/components/products/FilePreviewModal'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Eye,
  Database, AlertTriangle,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type CertRow = {
  id: number; site: string; material_type: string; apc_part: string
  part_description?: string; part_found?: number
  po_number: string; lot: string; file_name: string; file_path: string
  rel_dir: string; file_mtime: string | null; file_size: number | null
}
type Status = {
  files: number; pos: number; parts: number; lastIndexed: string | null
  bySite: { site: string; files: number }[]
  lastRun: any
  roots: { site: string; path: string }[]
}

const COLS = [
  { key: 'po_number', label: 'PO Number', filter: 'po', w: 140 },
  { key: 'lot', label: 'Lot', filter: 'lot', w: 140 },
  { key: 'apc_part', label: 'APC Part', filter: 'part', w: 170 },
  { key: 'part_description', label: 'Description', filter: '', w: 240 },
  { key: 'material_type', label: 'Material Type', filter: 'type', w: 150 },
  { key: 'site', label: 'Site', filter: '', w: 90 },
  { key: 'file_name', label: 'File', filter: '' },
  { key: 'file_mtime', label: 'Date', filter: '', w: 110 },
]

const fmtDate = (v: any) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()
}

export default function MaterialCertPosPage() {
  const { data: session } = useSession()
  const roles: string[] = ((session?.user as any)?.roles) || []
  const canIndex = roles.includes('Admin') || roles.includes('Quality') || roles.includes('EHSadmin')

  const [rows, setRows] = useState<CertRow[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [indexing, setIndexing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState<Record<string, string>>({})
  const [site, setSite] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState({ key: 'file_mtime', dir: 'desc' as 'asc' | 'desc' })
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [materialTypes, setMaterialTypes] = useState<string[]>([])
  const [sites, setSites] = useState<string[]>([])
  const [preview, setPreview] = useState<{ files: any[]; index: number } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setApplied(filters); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [filters])

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/operations/inspections/material-certs/po-index'))
      if (res.ok) setStatus(await res.json())
    } catch { /* status is informational */ }
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const p = new URLSearchParams({
        page: String(page), pageSize: '100', sort: sort.key, dir: sort.dir,
      })
      for (const [k, v] of Object.entries(applied)) if (v.trim()) p.set(k, v.trim())
      if (site) p.set('site', site)
      if (from) p.set('from', from)
      if (to) p.set('to', to)
      const res = await fetch(getApiUrl(`/api/operations/inspections/material-certs/pos?${p.toString()}`))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Search failed')
      setRows(r.rows || []); setPages(r.pages || 1); setTotal(r.total || 0)
      setMaterialTypes(r.materialTypes || []); setSites(r.sites || [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [page, sort, applied, site, from, to])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadStatus() }, [loadStatus])

  const rebuild = async () => {
    setIndexing(true); setError(''); setNotice('')
    try {
      const res = await fetch(getApiUrl('/api/operations/inspections/material-certs/po-index'), { method: 'POST' })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Index failed')
      const bits = [`${r.found.toLocaleString()} PDFs found`, `${r.written.toLocaleString()} indexed`]
      if (r.removed) bits.push(`${r.removed.toLocaleString()} removed`)
      if (r.unparsed) bits.push(`${r.unparsed.toLocaleString()} without a PUR number`)
      if (r.unknownParts) bits.push(`${Number(r.unknownParts).toLocaleString()} folders with no Paradigm part`)
      setNotice(bits.join(' · ') + (r.problems?.length ? ` — ${r.problems.join('; ')}` : ''))
      await Promise.all([load(), loadStatus()])
    } catch (e: any) { setError(e.message) }
    setIndexing(false)
  }

  const toggleSort = (key: string) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }

  const serveUrl = (r: CertRow, download = false) =>
    getApiUrl(`/api/operations/inspections/material-certs/download?path=${encodeURIComponent(r.file_path)}${download ? '&download=true' : ''}`)

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
      'PO Number': r.po_number, Lot: r.lot, 'APC Part': r.apc_part,
      Description: r.part_description || '',
      'Material Type': r.material_type, Site: r.site, File: r.file_name,
      Date: fmtDate(r.file_mtime), Path: r.file_path,
    })))
    ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 38 }, { wch: 12 }, { wch: 70 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Material Cert POs')
    XLSX.writeFile(wb, `material-cert-pos_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Material Cert POs</h1>
        <p className="text-sm text-slate-600">
          Certificates of conformance from the scan archive, indexed by purchase order and lot
        </p>
      </div>

      {/* Inventory status */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <div className="text-xs uppercase text-slate-400">Certificates</div>
              <div className="text-lg font-semibold text-slate-800 tabular-nums">
                {status ? status.files.toLocaleString() : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">Purchase Orders</div>
              <div className="text-lg font-semibold text-slate-800 tabular-nums">
                {status ? status.pos.toLocaleString() : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">Parts</div>
              <div className="text-lg font-semibold text-slate-800 tabular-nums">
                {status ? status.parts.toLocaleString() : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">Last indexed</div>
              <div className="text-sm text-slate-700">
                {status?.lastIndexed ? new Date(status.lastIndexed).toLocaleString() : 'never'}
              </div>
            </div>
            {status?.bySite?.length ? (
              <div>
                <div className="text-xs uppercase text-slate-400">By site</div>
                <div className="text-sm text-slate-700">
                  {status.bySite.map(s => `${s.site} ${Number(s.files).toLocaleString()}`).join(' · ')}
                </div>
              </div>
            ) : null}
          </div>
          {canIndex && (
            <button onClick={rebuild} disabled={indexing}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
              <Database size={14} className={indexing ? 'animate-pulse' : ''} />
              {indexing ? 'Indexing…' : 'Refresh inventory'}
            </button>
          )}
        </div>
        {indexing && (
          <p className="text-xs text-slate-500 mt-2">
            Walking all three site archives. Large archives can take a couple of minutes.
          </p>
        )}
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {notice && (
        <div className="p-3 mb-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm flex gap-2">
          <Database size={15} className="mt-0.5 shrink-0" /><span>{notice}</span>
        </div>
      )}
      {status?.lastRun?.status === 'partial' && (
        <div className="p-3 mb-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>Last refresh couldn’t reach every archive: {status.lastRun.message}. Those sites kept their existing entries.</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${total.toLocaleString()} certificates${pages > 1 ? ` · page ${page} of ${pages}` : ''}`}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={site} onChange={e => { setSite(e.target.value); setPage(1) }}
            className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">All sites</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1 text-sm">
            <label className="text-xs text-slate-500">Date</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }}
              className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <span className="text-slate-400">–</span>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }}
              className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={filters.q || ''} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
              placeholder="PO, lot, part, file…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={exportExcel} disabled={!rows.length}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 disabled:opacity-50">
            <Download size={14} /> Excel
          </button>
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[calc(100vh-420px)]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {COLS.map(c => {
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
              <th className="px-3 py-2 border-b border-slate-200 w-24 text-right text-xs font-medium text-slate-600">View</th>
            </tr>
            <tr>
              {COLS.map(c => (
                <th key={c.key} className="px-1 py-1 border-b border-slate-200 bg-white">
                  {c.filter === 'type' ? (
                    <select value={filters.type || ''} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                      className="w-full text-xs font-normal border border-slate-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300">
                      <option value="">All</option>
                      {materialTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : c.filter ? (
                    <input value={filters[c.filter] || ''}
                      onChange={e => setFilters(f => ({ ...f, [c.filter]: e.target.value }))}
                      placeholder="filter"
                      className="w-full min-w-[60px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                  ) : null}
                </th>
              ))}
              <th className="border-b border-slate-200 bg-white" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLS.length + 1} className="px-3 py-8 text-center text-slate-400"><RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={COLS.length + 1} className="px-3 py-8 text-center text-slate-400">
                {status && status.files === 0
                  ? 'The inventory is empty — run “Refresh inventory” to index the archive.'
                  : 'No certificates match.'}
              </td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 font-mono text-slate-800">
                  {r.po_number || <span className="text-amber-600 text-xs">no PUR#</span>}
                </td>
                <td className="px-3 py-1.5 font-mono text-slate-700">{r.lot || <span className="text-slate-300">—</span>}</td>
                <td className="px-3 py-1.5 font-mono text-slate-700">
                  {r.apc_part}
                  {r.part_found === 0 && (
                    <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-600"
                      title="This folder name doesn't match a Paradigm part number">?</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-slate-600 text-xs truncate max-w-xs" title={r.part_description || ''}>
                  {r.part_description || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-1.5 text-slate-600">{r.material_type}</td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">{r.site}</td>
                <td className="px-3 py-1.5 text-slate-600 truncate max-w-md" title={r.file_path}>{r.file_name}</td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">{fmtDate(r.file_mtime)}</td>
                <td className="px-3 py-1.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setPreview({
                      files: rows.map(x => ({ name: x.file_name, path: x.file_path, extension: 'pdf' })),
                      index: i,
                    })} className="text-slate-500 hover:text-blue-600" title="Preview"><Eye size={16} /></button>
                    <a href={serveUrl(r, true)} target="_blank" rel="noopener noreferrer"
                      className="text-slate-500 hover:text-blue-600" title="Download"><Download size={15} /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40">Prev</button>
          <span className="text-slate-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40">Next</button>
        </div>
      )}

      {preview && (
        <FilePreviewModal files={preview.files} index={preview.index}
          onIndexChange={(i: number) => setPreview(p => p ? { ...p, index: i } : p)}
          onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
