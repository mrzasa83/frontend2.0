'use client'

/**
 * Shared EHS part panel — General / Compliance / Attachments / Where Used.
 *
 * Extracted from Products ▸ Material Mgt so EHS ▸ Product Compliance can show
 * the SAME view for each BOM line rather than a second, drifting copy. Anything
 * added here (a new evidence type, a new classification) appears in both places
 * by construction.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Layers, Info, Paperclip, RefreshCw, Save, Upload, Download,
  Trash2, X, Search, ExternalLink, AlertCircle, AlertTriangle, CheckCircle2,
  ClipboardList, Files, Eye,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import FilePreviewModal from '@/components/products/FilePreviewModal'
import { COMPLIANCE_VALUES } from '@/lib/ehs/familyMatch'

const statusBadge = (v: string) => {
  if (v === 'Compliant') return 'bg-green-100 text-green-700'
  if (v === 'Non-Compliant') return 'bg-red-100 text-red-700'
  if (v === 'Exempt') return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}
const ext = (n: string) => { const m = /\.([^.]+)$/.exec(n || ''); return m ? m[1].toLowerCase() : '' }

export type PartDetailData = {
  part: { rkey: number; part_number: string; description: string; manufacturer: string; active_flag: string; pm: string }
  family: { id: number; family_name: string; inherit_compliance: number; reach_status: string; rohs_status: string; prop65_status: string } | null
  compliance_source: string
  compliance: { reach_status: string; rohs_status: string; prop65_status: string }
  part_compliance: { reach_status: string; rohs_status: string; prop65_status: string; notes: string | null; updated_by: string; updated_at: string } | null
  notepad: string
  attachments: { name: string; description: string; path: string; windows_path: string; extension: string; print_on_traveller: boolean; servable?: boolean; reason?: string }[]
}

export default function PartPanel({ partNumber, canEdit, onChanged }:
  { partNumber: string; canEdit: boolean; onChanged: () => void }) {
  const [tab, setTab] = useState<'general' | 'attachments' | 'documents' | 'where-used'>('general')
  const [data, setData] = useState<PartDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/ehs/parts/detail?part=${encodeURIComponent(partNumber)}`))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load part')
      setData(r)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [partNumber])
  useEffect(() => { load() }, [load])

  const RAIL = [
    { id: 'general', label: 'General', icon: ClipboardList },
    { id: 'attachments', label: 'Attachments', icon: Files },
    { id: 'documents', label: 'EHS Docs', icon: Files },
    { id: 'where-used', label: 'Where Used', icon: Layers },
  ] as const

  if (loading) return <div className="text-slate-500 py-8 flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
  if (error) return <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
  if (!data) return null

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 font-mono flex items-center gap-2">
          {data.part.part_number}
          <span className="text-xs px-1.5 py-0.5 rounded font-sans font-normal bg-cyan-100 text-cyan-700">
            Part
          </span>
          {/* Where the compliance position comes from — spelled out, since
              "class: Family" on a part read as though the part were a family. */}
          {data.compliance_source === 'Family' && data.family && (
            <span className="text-xs px-1.5 py-0.5 rounded font-sans font-normal bg-slate-100 text-slate-600"
              title={`Compliance inherited from the ${data.family.family_name} family`}>
              compliance from family
            </span>
          )}
          {data.compliance_source === 'Part' && (
            <span className="text-xs px-1.5 py-0.5 rounded font-sans font-normal bg-purple-100 text-purple-700"
              title="This family doesn't flow its classification down, so this part carries its own">
              compliance per part
            </span>
          )}
        </h2>
        <p className="text-sm text-slate-600">{data.part.description}</p>
      </div>

      <div className="flex gap-0 min-h-[420px]">
        <div className="w-52 flex-shrink-0 border-r border-slate-200">
          {RAIL.map(t => {
            const Icon = t.icon; const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left rounded-lg transition-colors ${active ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon size={16} /> {t.label}
                {t.id === 'attachments' && data.attachments.length > 0 && (
                  <span className={`ml-auto text-xs ${active ? 'text-blue-100' : 'text-slate-400'}`}>{data.attachments.length}</span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex-1 pl-6 min-w-0">
          {tab === 'general' && <PartGeneralTab data={data} canEdit={canEdit} reload={() => { load(); onChanged() }} />}
          {tab === 'attachments' && <PartAttachmentsTab attachments={data.attachments} />}
          {tab === 'documents' && (
            <PartDocumentsTab partNumber={partNumber} canEdit={canEdit} />
          )}
          {tab === 'where-used' && <WhereUsedTab partNumber={partNumber} />}
        </div>
      </div>
    </div>
  )
}

/**
 * Which products consume this material — the BOM walked upward, so it catches
 * use at any depth, not just where the part sits directly on a top-level BOM.
 */

function WhereUsedTab({ partNumber }: { partNumber: string }) {
  const [rows, setRows] = useState<{ customer_part_number: string; customer_part_desc: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    fetch(getApiUrl(`/api/ehs/parts/where-used?part=${encodeURIComponent(partNumber)}`))
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || d.details || 'Failed to load')
        return d
      })
      .then(d => { if (!cancelled) setRows(d.rows || []) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [partNumber])

  const shown = rows.filter(r =>
    !filter.trim() ||
    `${r.customer_part_number} ${r.customer_part_desc}`.toLowerCase().includes(filter.toLowerCase()))

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(shown.map(r => ({
      'Customer Part Number': r.customer_part_number,
      'Customer Part Description': r.customer_part_desc,
    })))
    ws['!cols'] = [{ wch: 26 }, { wch: 44 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Where Used')
    XLSX.writeFile(wb, `where-used_${partNumber}.xlsx`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Where Used</h3>
          <p className="text-xs text-slate-500">
            Products whose BOM contains this material, at any level
            {!loading && !error && <> · {shown.length} of {rows.length}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={exportExcel} disabled={!shown.length}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 disabled:opacity-50">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[460px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-48">Customer Part Number</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Description</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2} className="px-3 py-8 text-center text-slate-400">
                <RefreshCw size={18} className="animate-spin inline mr-2" /> Walking the BOM…
              </td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={2} className="px-3 py-6 text-center text-slate-400 text-sm">
                {rows.length === 0 ? 'This material isn’t on any product BOM.' : 'No products match the filter.'}
              </td></tr>
            ) : shown.map((r, i) => (
              <tr key={`${r.customer_part_number}-${i}`} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 font-mono text-slate-800">{r.customer_part_number}</td>
                <td className="px-3 py-1.5 text-slate-600">{r.customer_part_desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PartGeneralTab({ data, canEdit, reload }:
  { data: PartDetailData; canEdit: boolean; reload: () => void }) {
  const perPart = data.compliance_source === 'Part'
  const [reach, setReach] = useState(data.compliance.reach_status || 'Unknown')
  const [rohs, setRohs] = useState(data.compliance.rohs_status || 'Unknown')
  const [prop65, setProp65] = useState(data.compliance.prop65_status || 'Unknown')
  const [notes, setNotes] = useState(data.part_compliance?.notes || '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const save = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      const res = await fetch(getApiUrl('/api/ehs/parts/compliance'), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_number: data.part.part_number,
          reach_status: reach, rohs_status: rohs, prop65_status: prop65, notes,
        }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || 'Failed to save')
      setMsg('Saved'); reload()
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value || <span className="text-slate-300">—</span>}</dd>
    </div>
  )

  return (
    <div className="max-w-3xl">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">General</h3>
      {err && <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{err}</div>}
      {msg && <div className="p-2 mb-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{msg}</div>}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Field label="Part Number" value={data.part.part_number} />
          <Field label="Manufacturer" value={data.part.manufacturer} />
          <div className="sm:col-span-2"><Field label="Description" value={data.part.description} /></div>
          <Field label="Product Family" value={data.family?.family_name || ''} />
          <Field label="Active" value={data.part.active_flag} />
        </dl>
      </div>

      {/* Compliance — inherited from the family, unless the family is per-part */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-slate-800">Compliance</h4>
          {data.compliance_source && (
            <span className={`text-xs px-2 py-0.5 rounded ${perPart ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
              from {perPart ? 'this part' : 'family'}
            </span>
          )}
        </div>

        {!data.family ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            This part isn’t in any family yet, so there is nothing to inherit and no classification to set.
            Define a family whose criteria capture it.
          </p>
        ) : perPart ? (
          <>
            <p className="text-xs text-slate-500 mb-3">
              “{data.family.family_name}” doesn’t pass its classification down, so this part carries its own.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              {([['REACH', reach, setReach], ['RoHS', rohs, setRohs], ['Prop 65', prop65, setProp65]] as const).map(([label, v, setter]) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  {canEdit ? (
                    <select value={v} onChange={e => (setter as any)(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                      {COMPLIANCE_VALUES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge(v)}`}>{v}</span>
                  )}
                </div>
              ))}
            </div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Why — evidence for this part</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} readOnly={!canEdit}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400 read-only:bg-slate-50" />
            {canEdit && (
              <button onClick={save} disabled={busy}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
                <Save size={14} /> {busy ? 'Saving…' : 'Save classification'}
              </button>
            )}
            {data.part_compliance?.updated_by && (
              <p className="text-xs text-slate-400 mt-2">Last set by {data.part_compliance.updated_by}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-3">
              Inherited from “{data.family.family_name}”. Change it on the family to change it here.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([['REACH', data.compliance.reach_status], ['RoHS', data.compliance.rohs_status], ['Prop 65', data.compliance.prop65_status]] as const).map(([label, v]) => (
                <div key={label}>
                  <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge(v)}`}>{v || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Notepad straight from Paradigm */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h4 className="font-semibold text-slate-800 mb-1">Notepad</h4>
        <p className="text-xs text-slate-500 mb-2">From Paradigm — read-only.</p>
        {data.notepad ? (
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-72 overflow-auto">{data.notepad}</pre>
        ) : (
          <p className="text-sm text-slate-400">No notepad entries on this part.</p>
        )}
      </div>
    </div>
  )
}

function PartAttachmentsTab({ attachments }:
  { attachments: PartDetailData['attachments'] }) {
  const [preview, setPreview] = useState<{ files: any[]; index: number } | null>(null)
  // Only files the server can actually read go into the preview list, so the
  // modal's prev/next never lands on one that 403s.
  const servable = attachments.filter(a => a.servable !== false)
  const previewList = servable.map(a => ({ name: a.name, path: a.path, extension: a.extension }))
  const previewIndexOf = (a: PartDetailData['attachments'][number]) =>
    servable.findIndex(s => s.path === a.path)

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-3">Attachments</h3>
      {!attachments.length ? (
        <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">
          No attachments on this part.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">File</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">On Traveller</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-24">View</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map((a, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-1.5 text-slate-700">{a.name}</td>
                  <td className="px-3 py-1.5 text-slate-500">{a.description}</td>
                  <td className="px-3 py-1.5">
                    {a.print_on_traveller
                      ? <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">Yes</span>
                      : <span className="text-xs text-slate-400">No</span>}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {a.servable === false ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600"
                        title={`${a.reason}\n\n${a.windows_path}`}>
                        <AlertTriangle size={13} /> unavailable
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setPreview({ files: previewList, index: Math.max(0, previewIndexOf(a)) })}
                          className="text-slate-500 hover:text-blue-600" title="Preview"><Eye size={16} /></button>
                        <a href={getApiUrl(`/api/files/serve?path=${encodeURIComponent(a.path)}&download=true`)}
                          target="_blank" rel="noopener noreferrer"
                          className="text-slate-500 hover:text-blue-600" title="Download"><Download size={15} /></a>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {attachments.some(a => a.servable === false) && (
        <p className="text-xs text-amber-700 mt-2 flex items-start gap-1.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>
            Some attachments sit on a network share this server doesn’t have mapped, so they can’t be
            opened from here. Hover “unavailable” to see the stored path — mapping that share (via the
            UNC_EXTRA_SHARES setting) makes them viewable.
          </span>
        </p>
      )}
      {preview && (
        <FilePreviewModal files={preview.files} index={preview.index}
          onIndexChange={(i: number) => setPreview(p => p ? { ...p, index: i } : p)}
          onClose={() => setPreview(null)} />
      )}
    </div>
  )
}


/**
 * EHS evidence held against this specific part.
 *
 * Distinct from the Attachments tab, which lists what Paradigm already has
 * against the item. These are documents an EHS reviewer uploads — a
 * certificate of compliance, a declaration, a supplier statement — and they are
 * the evidence behind the part's own REACH / RoHS / Prop 65 classification when
 * the family does not supply one.
 */
function PartDocumentsTab({ partNumber, canEdit }:
  { partNumber: string; canEdit: boolean }) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('General')
  const [title, setTitle] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(
        `/api/ehs/parts/documents?part=${encodeURIComponent(partNumber)}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load')
      setDocs(d.documents || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }, [partNumber])

  useEffect(() => { load() }, [load])

  const upload = async (file: File) => {
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('part', partNumber)
      fd.append('doc_type', docType)
      if (title) fd.append('title', title)
      const res = await fetch(getApiUrl('/api/ehs/parts/documents'), { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Upload failed')
      setTitle('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setUploading(false) }
  }

  const remove = async (id: number) => {
    try {
      const res = await fetch(getApiUrl(`/api/ehs/parts/documents?id=${id}`), { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Delete failed')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-200 rounded-lg">
          <select value={docType} onChange={e => setDocType(e.target.value)}
            className="px-2 py-1 text-sm border border-slate-300 rounded">
            {['General', 'REACH', 'RoHS', 'Prop 65', 'SDS'].map(t =>
              <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="text" value={title} placeholder="Title (optional)"
            onChange={e => setTitle(e.target.value)}
            className="px-2 py-1 text-sm border border-slate-300 rounded flex-1 min-w-[10rem]" />
          <label className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg cursor-pointer ${
            uploading ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            <Upload size={16} />
            {uploading ? 'Uploading…' : 'Add document'}
            <input type="file" className="hidden" disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
          </label>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 italic">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          No EHS evidence on file for this part.
        </p>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                {['Type', 'Title', 'File', 'Uploaded', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                      {d.doc_type}
                    </span>
                  </td>
                  <td className="px-3 py-2">{d.title || '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs" title={d.file_path}>{d.file_name}</td>
                  <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                    {d.uploaded_by} · {String(d.uploaded_at || '').slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 w-8">
                    {canEdit && (
                      <button onClick={() => remove(d.id)}
                        title="Remove this row (the file itself is kept)"
                        className="text-slate-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
