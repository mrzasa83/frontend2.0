'use client'

import { useState, useEffect, useCallback } from 'react'
import FilePreviewModal from '@/components/products/FilePreviewModal'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Eye, Database, AlertTriangle,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

/**
 * Browse the whole certificate-of-conformance archive from inside an FAI record
 * and tie individual certs to it.
 *
 * The BOM-driven Material Certs tab answers "does each material on this work
 * order have a cert?". This answers the other question — "find me any cert in
 * the archive and attach it to this inspection" — which matters when the tie
 * isn't derivable from the BOM.
 *
 * Selections are stored in inspection_cert_selections, the same table the
 * BOM-driven tab uses, so both views agree on what's attached.
 */

type CertRow = {
  id: number; site: string; material_type: string; apc_part: string
  part_description?: string; part_found?: number
  po_number: string; lot: string; file_name: string; file_path: string
  file_mtime: string | null; file_size: number | null
}

const COLS = [
  { key: 'po_number', label: 'PO Number', filter: 'po', w: 130 },
  { key: 'lot', label: 'Lot', filter: 'lot', w: 120 },
  { key: 'apc_part', label: 'APC Part', filter: 'part', w: 160 },
  { key: 'part_description', label: 'Description', filter: '', w: 200 },
  { key: 'material_type', label: 'Material Type', filter: 'type', w: 140 },
  { key: 'file_name', label: 'File', filter: '', w: 240 },
  { key: 'file_mtime', label: 'Date', filter: '', w: 100 },
]

const fmtDate = (v: any) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()
}

/** Key matching inspection_cert_selections' unique constraint. */
const keyOf = (part: string, po: string, lot: string) => `${part}|${po}|${lot}`

export default function CertInventoryTab({ inspectionId }: { inspectionId: number | string }) {
  const [rows, setRows] = useState<CertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState<Record<string, string>>({})
  const [apcOnly, setApcOnly] = useState(true)
  const [site, setSite] = useState('')
  const [sort, setSort] = useState({ key: 'file_mtime', dir: 'desc' as 'asc' | 'desc' })
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [materialTypes, setMaterialTypes] = useState<string[]>([])
  const [sites, setSites] = useState<string[]>([])
  const [selected, setSelected] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState('')
  const [preview, setPreview] = useState<{ files: any[]; index: number } | null>(null)
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    const t = setTimeout(() => { setApplied(filters); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [filters])

  const loadSelections = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/api/operations/inspections/material-certs/selection?inspectionId=${inspectionId}`))
      if (!res.ok) return
      const r = await res.json()
      setSelected(r.selections || {})
    } catch { /* selections are additive; a failure here isn't fatal */ }
  }, [inspectionId])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const p = new URLSearchParams({
        page: String(page), pageSize: '100', sort: sort.key, dir: sort.dir,
        apcOnly: apcOnly ? '1' : '0',
      })
      for (const [k, v] of Object.entries(applied)) if (v.trim()) p.set(k, v.trim())
      if (site) p.set('site', site)
      const res = await fetch(getApiUrl(`/api/operations/inspections/material-certs/pos?${p.toString()}`))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Search failed')
      setRows(r.rows || []); setPages(r.pages || 1); setTotal(r.total || 0)
      setMaterialTypes(r.materialTypes || []); setSites(r.sites || [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [page, sort, applied, site, apcOnly])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadSelections() }, [loadSelections])
  useEffect(() => {
    fetch(getApiUrl('/api/operations/inspections/material-certs/po-index'))
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setStatus(d) }).catch(() => {})
  }, [])

  const toggle = async (r: CertRow, on: boolean) => {
    const k = keyOf(r.apc_part, r.po_number, r.lot)
    setSaving(k)
    try {
      const res = await fetch(getApiUrl('/api/operations/inspections/material-certs/selection'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectionId,
          purchasedPart: r.apc_part,
          poNumber: r.po_number,
          batchSerial: r.lot,
          filePath: r.file_path,
          clear: !on,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save')
      setSelected(prev => {
        const next = { ...prev }
        if (on) next[k] = { filePath: r.file_path }
        else delete next[k]
        return next
      })
    } catch (e: any) { setError(e.message) }
    setSaving('')
  }

  const toggleSort = (key: string) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }

  const selectedCount = Object.keys(selected).length

  return (
    <div>
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">PO Cert Search</h3>
          <p className="text-xs text-slate-500">
            The full certificate archive · tick a cert to tie it to this inspection
            {status?.files ? <> · {Number(status.files).toLocaleString()} indexed</> : null}
            {status?.lastIndexed ? <> · last indexed {new Date(status.lastIndexed).toLocaleString()}</> : null}
          </p>
        </div>
        <div className="text-sm">
          <span className={selectedCount ? 'text-green-700 font-medium' : 'text-slate-500'}>
            {selectedCount} tied to this FAI
          </span>
        </div>
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {status?.lastRun?.status === 'partial' && (
        <div className="p-2 mb-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex gap-2">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>Last refresh couldn’t reach every archive: {status.lastRun.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${total.toLocaleString()} certificates${pages > 1 ? ` · page ${page} of ${pages}` : ''}`}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 text-sm text-slate-600"
            title="Only folders whose name matches a Paradigm part number">
            <input type="checkbox" checked={apcOnly}
              onChange={e => { setApcOnly(e.target.checked); setPage(1) }} />
            APC System Parts Only
          </label>
          <select value={site} onChange={e => { setSite(e.target.value); setPage(1) }}
            className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">All sites</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={filters.q || ''} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
              placeholder="PO, lot, part, file…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[calc(100vh-380px)]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-2 py-2 w-10 border-b border-slate-200" />
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
              <th className="px-3 py-2 border-b border-slate-200 w-20 text-right text-xs font-medium text-slate-600">View</th>
            </tr>
            <tr>
              <th className="border-b border-slate-200 bg-white" />
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
                      className="w-full min-w-[50px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                  ) : null}
                </th>
              ))}
              <th className="border-b border-slate-200 bg-white" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLS.length + 2} className="px-3 py-8 text-center text-slate-400">
                <RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={COLS.length + 2} className="px-3 py-8 text-center text-slate-400">
                No certificates match.
              </td></tr>
            ) : rows.map((r, i) => {
              const k = keyOf(r.apc_part, r.po_number, r.lot)
              const isOn = !!selected[k]
              return (
                <tr key={r.id} className={`border-b border-slate-100 ${isOn ? 'bg-green-50/60' : 'hover:bg-slate-50'}`}>
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" checked={isOn} disabled={saving === k}
                      onChange={e => toggle(r, e.target.checked)}
                      title="Tie this certificate to this inspection" />
                  </td>
                  <td className="px-3 py-1.5 font-mono text-slate-800">{r.po_number || <span className="text-amber-600 text-xs">no PUR#</span>}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-700">{r.lot || <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-700">
                    {r.apc_part}
                    {r.part_found === 0 && (
                      <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-600"
                        title="Folder name doesn't match a Paradigm part">?</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-slate-600 text-xs truncate max-w-[200px]" title={r.part_description || ''}>
                    {r.part_description || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-1.5 text-slate-600">{r.material_type}</td>
                  <td className="px-3 py-1.5 text-slate-600 text-xs truncate max-w-[240px]" title={r.file_path}>{r.file_name}</td>
                  <td className="px-3 py-1.5 text-slate-500 text-xs">{fmtDate(r.file_mtime)}</td>
                  <td className="px-3 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setPreview({
                        files: rows.map(x => ({ name: x.file_name, path: x.file_path, extension: 'pdf' })),
                        index: i,
                      })} className="text-slate-500 hover:text-blue-600" title="Preview"><Eye size={15} /></button>
                      <a href={getApiUrl(`/api/operations/inspections/material-certs/download?path=${encodeURIComponent(r.file_path)}&download=true`)}
                        target="_blank" rel="noopener noreferrer"
                        className="text-slate-500 hover:text-blue-600" title="Download"><Download size={14} /></a>
                    </div>
                  </td>
                </tr>
              )
            })}
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
