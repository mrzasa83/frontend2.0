'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { RefreshCw, ArrowLeft, Database } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Props = {
  inspectionId: number
  onClose: () => void
  onDataChange?: () => void
}

const PHASE_COLORS: Record<string, string> = {
  Setup: 'bg-slate-100 text-slate-600',
  Measurement: 'bg-blue-100 text-blue-700',
  Verify: 'bg-indigo-100 text-indigo-700',
  Submitted: 'bg-yellow-100 text-yellow-700',
  Rework: 'bg-orange-100 text-orange-700',
  Completed: 'bg-green-100 text-green-700',
  Canceled: 'bg-red-100 text-red-700',
}

function PhaseBadge({ phase }: { phase: string }) {
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${PHASE_COLORS[phase] || 'bg-slate-100 text-slate-600'}`}>{phase}</span>
}

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'material-certs', label: 'Material Certs' },
  { id: 'history', label: 'History' },
]

export default function InspectionDetail({ inspectionId, onClose, onDataChange }: Props) {
  const { data: session } = useSession()
  const isAdmin = (session?.user?.roles || []).includes('Admin')
  const [record, setRecord] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('general')

  // Material certs
  const [certs, setCerts] = useState<any[]>([])
  const [certsLoading, setCertsLoading] = useState(false)
  const [certsError, setCertsError] = useState('')
  const [certsFetched, setCertsFetched] = useState(false)
  const [certFiles, setCertFiles] = useState<Record<string, { path: string; name: string }[]>>({})
  const [certSelections, setCertSelections] = useState<Record<string, { filePath: string; selectedBy: string; selectedAt: string }>>({})
  const [indexing, setIndexing] = useState(false)
  const [indexMsg, setIndexMsg] = useState('')
  const [certSort, setCertSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'purchasedPart', dir: 'asc' })
  const [colFilters, setColFilters] = useState<Record<string, string>>({})

  const canSelect = (session?.user?.roles || []).some((r: string) => ['Admin', 'Quality Control', 'Operations', 'Production Control'].includes(r))

  const saveSelection = async (purchasedPart: string, poNumber: string, batchSerial: string, filePath: string | null, clear = false) => {
    const key = `${purchasedPart}|${poNumber}|${batchSerial}`
    try {
      const res = await fetch(getApiUrl('/api/operations/inspections/material-certs/selection'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionId, purchasedPart, poNumber, batchSerial, filePath: filePath || '', clear }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      const r = await res.json()
      setCertSelections(prev => {
        const next = { ...prev }
        if (clear) delete next[key]
        else next[key] = { filePath: filePath || '', selectedBy: r.selectedBy || '', selectedAt: new Date().toISOString() }
        return next
      })
    } catch (e) { /* surfaced via UI state if needed */ }
  }

  const buildCatalog = async () => {
    setIndexing(true); setIndexMsg('')
    try {
      // Index the C of C tree (sub-path keeps the walk scoped/fast)
      const res = await fetch(getApiUrl('/api/operations/inspections/material-certs/index?subPath=NashuaScanDocStorage'), { method: 'POST' })
      const r = await res.json()
      if (!res.ok) throw new Error(r.details || r.error || 'Failed')
      setIndexMsg(`Catalog updated: ${r.indexed} folders indexed`)
      if (certsFetched) fetchCerts()
    } catch (e: any) { setIndexMsg(`Error: ${e.message}`) }
    setIndexing(false)
  }

  const fetchCerts = async () => {
    if (!record?.work_order) { setCertsError('No work order on this inspection'); return }
    setCertsLoading(true); setCertsError(''); setCertsFetched(true)
    try {
      const res = await fetch(getApiUrl(`/api/operations/inspections/material-certs?workOrder=${encodeURIComponent(record.work_order)}`))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      const list = r.certs || []
      setCerts(list)
      // Match cert rows to PDF files on the L drive (separate fs route)
      if (list.length) {
        try {
          const fr = await fetch(getApiUrl('/api/operations/inspections/material-certs/files'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              certs: list.map((c: any) => ({ purchasedPart: c.purchasedPart, poNumber: c.poNumber, batchSerial: c.batchSerial })),
            }),
          })
          if (fr.ok) setCertFiles((await fr.json()).matches || {})
        } catch { /* file matching is best-effort */ }
        // Load any persisted reviewer selections
        try {
          const sr = await fetch(getApiUrl(`/api/operations/inspections/material-certs/selection?inspectionId=${inspectionId}`))
          if (sr.ok) setCertSelections((await sr.json()).selections || {})
        } catch { /* best-effort */ }
      }
    } catch (e: any) { setCertsError(e.message) }
    setCertsLoading(false)
  }

  // Lazy-load certs when the tab is first opened
  useEffect(() => {
    if (activeTab === 'material-certs' && !certsFetched && record?.work_order) fetchCerts()
  }, [activeTab, record])

  const fetchRecord = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/operations/inspections?id=${inspectionId}`))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setRecord(r.record)
      setHistory(r.history || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRecord() }, [inspectionId])

  if (loading) return <div className="flex items-center gap-2 py-12 justify-center text-slate-500"><RefreshCw size={18} className="animate-spin" /> Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!record) return <div className="p-6 text-red-600">Record not found</div>

  const renderTab = (tabId: string) => {
    if (tabId === 'general') {
      const fields: [string, any][] = [
        ['Inspection #', record.inspection_number],
        ['Type', record.inspection_type],
        ['Product Type', record.product_type],
        ['Customer Part Number', record.part_number],
        ['PCB Number', record.pcb_number],
        ['Work Order', record.work_order],
        ['Owner', record.owner],
        ['Phase', record.phase],
        ['Site', record.site],
        ['Start Date', record.start_date ? new Date(record.start_date).toLocaleDateString() : null],
        ['Dependency', record.dependency ? `${record.dependency.inspection_number} (${record.dependency.phase})` : null],
        ['Created By', record.created_by],
        ['Created', record.created_at ? new Date(record.created_at).toLocaleString() : null],
      ]
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fields.map(([label, val]) => (
              <div key={label}>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm text-slate-800">{val || '—'}</p>
              </div>
            ))}
          </div>
          {record.notes && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-slate-800 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}
        </div>
      )
    }
    if (tabId === 'material-certs') {
      const fileFor = (c: any) => (certFiles[`${c.purchasedPart}|${c.poNumber}|${c.batchSerial}`] || [])
      const keyOf = (c: any) => `${c.purchasedPart}|${c.poNumber}|${c.batchSerial}`
      const effectiveFile = (c: any) => {
        const sel = certSelections[keyOf(c)]
        if (sel && sel.filePath) return sel.filePath
        const cands = fileFor(c)
        return cands.length ? cands[0].path : ''
      }
      const downloadUrl = (p: string) => getApiUrl(`/api/operations/inspections/material-certs/download?path=${encodeURIComponent(p)}`)

      // Column definitions: display value + sort value
      const cols: { key: string; label: string; disp: (c: any) => string }[] = [
        { key: 'purchasedPart', label: 'Purchased Part', disp: c => c.purchasedPart || '' },
        { key: 'description', label: 'Description', disp: c => c.description || '' },
        { key: 'batchSerial', label: 'Batch/Serial', disp: c => c.batchSerial || '' },
        { key: 'expDate', label: 'Exp Date', disp: c => c.expDate ? new Date(c.expDate).toLocaleDateString() : '' },
        { key: 'poNumber', label: 'PO #', disp: c => c.poNumber || '' },
        { key: 'poDate', label: 'PO Date', disp: c => c.poDate ? new Date(c.poDate).toLocaleDateString() : '' },
        { key: 'supplier', label: 'Supplier', disp: c => `${c.supplierName || ''}${c.supplierCode ? ' (' + c.supplierCode + ')' : ''}` },
        { key: 'status', label: 'Status', disp: c => (fileFor(c).length ? 'found' : 'missing') },
      ]
      const sortVal = (c: any, k: string): any => {
        if (k === 'expDate') return c.expDate ? new Date(c.expDate).getTime() : 0
        if (k === 'poDate') return c.poDate ? new Date(c.poDate).getTime() : 0
        const col = cols.find(x => x.key === k)
        return (col ? col.disp(c) : '').toLowerCase()
      }

      // Apply per-column filters then sort
      let view = certs.filter(c =>
        cols.every(col => {
          const f = (colFilters[col.key] || '').trim().toLowerCase()
          if (!f) return true
          return col.disp(c).toLowerCase().includes(f)
        })
      )
      view = [...view].sort((a, b) => {
        const av = sortVal(a, certSort.key), bv = sortVal(b, certSort.key)
        if (av < bv) return certSort.dir === 'asc' ? -1 : 1
        if (av > bv) return certSort.dir === 'asc' ? 1 : -1
        return 0
      })

      const toggleSort = (k: string) => setCertSort(s => s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' })
      const selectedCount = certs.filter(c => certSelections[keyOf(c)]).length
      const foundCount = certs.filter(c => fileFor(c).length).length
      const allShownSelected = view.length > 0 && view.every(c => certSelections[keyOf(c)])
      const toggleAllShown = () => {
        if (!canSelect) return
        if (allShownSelected) view.forEach(c => saveSelection(c.purchasedPart, c.poNumber, c.batchSerial, null, true))
        else view.forEach(c => { if (!certSelections[keyOf(c)]) saveSelection(c.purchasedPart, c.poNumber, c.batchSerial, effectiveFile(c) || '') })
      }

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-700">Material Certs ({certs.length})</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {foundCount} of {certs.length} matched to a file · {selectedCount} selected for this inspection
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button onClick={buildCatalog} disabled={indexing}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 disabled:opacity-50"
                  title="Walk the L drive and (re)build the cert folder index. Slow — only needed when new cert folders/files have been added.">
                  <Database size={14} className={indexing ? 'animate-pulse' : ''} /> {indexing ? 'Indexing...' : 'Build Catalog'}
                </button>
              )}
              <button onClick={fetchCerts} disabled={certsLoading || !record.work_order}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 disabled:opacity-50"
                title="Reload the BOM cert list from Paradigm and re-match files against the catalog. Fast.">
                <RefreshCw size={14} className={certsLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>
          {indexMsg && <p className="text-xs text-slate-500">{indexMsg}</p>}
          <p className="text-xs text-slate-400">Purchased materials in the work order BOM (by lot / PO / supplier). Check the rows that apply to this inspection; click a found file to open it.</p>

          {!record.work_order ? (
            <p className="text-sm text-amber-600">No work order is associated with this inspection.</p>
          ) : certsError ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{certsError}</div>
          ) : certsLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-slate-500"><RefreshCw size={18} className="animate-spin" /> Loading material certs...</div>
          ) : certs.length === 0 ? (
            <p className="text-sm text-slate-400">{certsFetched ? 'No purchased materials found for this work order' : 'Loading...'}</p>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 w-8 text-center">
                      <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} disabled={!canSelect}
                        title="Select all shown rows" className="cursor-pointer" />
                    </th>
                    {cols.map(col => (
                      <th key={col.key} onClick={() => toggleSort(col.key)}
                        className="px-3 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap cursor-pointer select-none hover:text-slate-900">
                        {col.label}
                        {certSort.key === col.key && <span className="ml-1">{certSort.dir === 'asc' ? '▲' : '▼'}</span>}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-white">
                    <th className="px-2 py-1"></th>
                    {cols.map(col => (
                      <th key={col.key} className="px-2 py-1">
                        <input value={colFilters[col.key] || ''}
                          onChange={e => setColFilters(f => ({ ...f, [col.key]: e.target.value }))}
                          placeholder="filter"
                          className="w-full text-xs font-normal border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.map((c, i) => {
                    const key = keyOf(c)
                    const candidates = fileFor(c)
                    const selected = !!certSelections[key]
                    const eff = effectiveFile(c)
                    return (
                      <tr key={`${c.purchasedPart}-${c.batchSerial}-${i}`} className={`border-t border-slate-100 hover:bg-slate-50 ${selected ? 'bg-blue-50/40' : ''}`}>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={selected} disabled={!canSelect}
                            onChange={() => selected
                              ? saveSelection(c.purchasedPart, c.poNumber, c.batchSerial, null, true)
                              : saveSelection(c.purchasedPart, c.poNumber, c.batchSerial, eff || '')}
                            className="cursor-pointer" />
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-800 whitespace-nowrap">{c.purchasedPart || '—'}</td>
                        <td className="px-3 py-2 text-slate-600 text-xs">{c.description || '—'}</td>
                        <td className="px-3 py-2 font-mono text-slate-600 text-xs">{c.batchSerial || '—'}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{c.expDate ? new Date(c.expDate).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2 font-mono text-slate-600 text-xs">{c.poNumber || '—'}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{c.poDate ? new Date(c.poDate).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2 text-slate-600 text-xs">{c.supplierName || '—'}{c.supplierCode ? ` (${c.supplierCode})` : ''}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">
                          {candidates.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500" /> missing</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <a href={downloadUrl(eff || candidates[0].path)} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-green-700 hover:text-green-900 font-medium"
                                title={(eff || candidates[0].path).split('/').pop()}>
                                <span className="w-2 h-2 rounded-full bg-green-500" /> found
                              </a>
                              {candidates.length > 1 && (
                                <select value={eff}
                                  onChange={e => canSelect && saveSelection(c.purchasedPart, c.poNumber, c.batchSerial, e.target.value)}
                                  className="text-xs border border-slate-200 rounded px-1 py-0.5 max-w-[150px]" disabled={!canSelect}
                                  title="Multiple files matched — pick the correct one">
                                  {candidates.map((f, fi) => <option key={fi} value={f.path}>{f.name}</option>)}
                                </select>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {view.length === 0 && (
                    <tr><td colSpan={cols.length + 1} className="px-3 py-6 text-center text-slate-400 text-sm">No rows match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }
    if (tabId === 'history') {
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700">Change History ({history.length})</h4>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">No changes recorded</p>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Field</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Old</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">New</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">By</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">When</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-700">{h.field_name}</td>
                      <td className="px-3 py-2 text-red-500 text-xs">{h.old_value || '—'}</td>
                      <td className="px-3 py-2 text-green-600 text-xs">{h.new_value || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{h.changed_by}</td>
                      <td className="px-3 py-2 text-slate-500 text-xs">{new Date(h.changed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 flex-shrink-0">
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"><ArrowLeft size={20} /></button>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            {record.inspection_number} <PhaseBadge phase={record.phase} />
          </h3>
          <p className="text-sm text-slate-500">{record.inspection_type} · {record.product_type}{record.part_number ? ` · ${record.part_number}` : ''}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        <div className="w-48 border-r border-slate-200 py-2 flex-shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                activeTab === t.id ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderTab(activeTab)}
        </div>
      </div>
    </div>
  )
}
