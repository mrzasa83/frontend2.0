'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  RefreshCw, Save, Plus, Check, FileText, ExternalLink, Image as ImageIcon,
  ClipboardList, Ruler, ShieldCheck, Package, History, X,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Version = {
  id: number; version_no: number; status: string; name: string
  description: string | null; note_text: string | null
  measure_description: string | null; measure_how_to: string | null
  created_by: string; created_at: string
  approved_at: string | null; approved_by: string
  inactivated_at: string | null; superseded_by: number | null
}
type Source = {
  id: number; apc_part_number: string; customer_part_number: string
  customer: string; pdf_path: string; pdf_name: string
  page_no: number; zone_label: string
  drawing_number: string; drawing_rev: string; drawing_rev_date: string | null
  sheet_label: string; extraction_method: string; note_number: string
  scanned_by: string; scanned_at: string
  bbox_x0: number | null
}
type Approval = {
  id: number; version_id: number; version_no: number; aspect: string
  approved_by: string; approved_at: string; comment: string
}

const statusBadge = (s: string) =>
  s === 'Active' ? 'bg-green-100 text-green-700'
    : s === 'Pending' ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-500'

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—'

export default function DrawingNoteDetail({ code, onChanged }: {
  code: string
  onChanged?: () => void
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('overview')
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partial<Version>>({})
  const [saving, setSaving] = useState(false)
  const [imageFor, setImageFor] = useState<Source | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(getApiUrl(`/api/products/drawing-notes/${encodeURIComponent(code)}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load')
      setData(d)
      // Land on whatever is in force, else the newest version.
      const active = (d.versions || []).find((v: Version) => v.status === 'Active')
      const pick = active || d.versions?.[0]
      setSelectedVersionId(pick?.id ?? null)
      setDraft(pick ? { ...pick } : {})
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  useEffect(() => { if (code) load() }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  const versions: Version[] = data?.versions || []
  const sources: Source[] = data?.sources || []
  const approvals: Approval[] = data?.approvals || []
  const version = useMemo(
    () => versions.find(v => v.id === selectedVersionId) || null,
    [versions, selectedVersionId]
  )
  const editable = version?.status === 'Pending'

  const pickVersion = (id: number) => {
    setSelectedVersionId(id)
    const v = versions.find(x => x.id === id)
    setDraft(v ? { ...v } : {})
  }

  const post = async (body: any) => {
    const res = await fetch(getApiUrl(`/api/products/drawing-notes/${encodeURIComponent(code)}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error || 'Request failed')
    return d
  }

  const save = async () => {
    if (!version) return
    setSaving(true); setError(null)
    try {
      await post({
        action: 'save_version', version_id: version.id,
        name: draft.name ?? '', description: draft.description ?? '',
        note_text: draft.note_text ?? '',
        measure_description: draft.measure_description ?? '',
        measure_how_to: draft.measure_how_to ?? '',
      })
      await load(); onChanged?.()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const newVersion = async () => {
    setSaving(true); setError(null)
    try {
      const d = await post({ action: 'new_version' })
      await load(); onChanged?.()
      setSelectedVersionId(d.version_id)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const approve = async (aspect: 'description' | 'how_to') => {
    if (!version) return
    setSaving(true); setError(null)
    try {
      await post({ action: 'approve', version_id: version.id, aspect })
      await load(); onChanged?.()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const approvedAspects = new Set(
    approvals.filter(a => a.version_id === selectedVersionId).map(a => a.aspect)
  )

  if (loading && !data) return <p className="text-sm text-slate-500 italic p-4">Loading {code}…</p>
  if (!data) return <p className="text-sm text-red-600 p-4">{error || 'Not found'}</p>

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'measure', label: 'Measure', icon: Ruler },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
    { id: 'parts', label: `APC Parts (${new Set(sources.map(s => s.apc_part_number)).size})`, icon: Package },
    { id: 'history', label: 'History', icon: History },
  ]

  return (
    <div className="flex h-full gap-6">
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                <Icon size={18} />
                <span className="flex-1 text-left">{t.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex-1 min-w-0">
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 font-mono">{data.note.note_code}</h3>
                <p className="text-sm text-slate-600">{data.note.customer}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Status follows the selected version, not the note. */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(version?.status || 'Pending')}`}>
                  {version?.status || 'Pending'}
                </span>
                <select
                  value={selectedVersionId ?? ''}
                  onChange={e => pickVersion(Number(e.target.value))}
                  className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg"
                >
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>
                      v{v.version_no} — {v.status}
                    </option>
                  ))}
                </select>
                <button onClick={newVersion} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                  <Plus size={16} /> New version
                </button>
              </div>
            </div>

            <Field label="Name" value={draft.name ?? ''} editable={!!editable}
              onChange={v => setDraft(d => ({ ...d, name: v }))} />
            <Field label="Description" value={draft.description ?? ''} editable={!!editable} rows={3}
              onChange={v => setDraft(d => ({ ...d, description: v }))} />
            <Field label="Note text (as it reads on the drawing)" value={draft.note_text ?? ''}
              editable={!!editable} rows={5} mono
              onChange={v => setDraft(d => ({ ...d, note_text: v }))} />

            {!editable && (
              <p className="text-xs text-slate-500">
                This version is {version?.status?.toLowerCase()} and is the record of what was
                signed off, so it can&apos;t be edited. Create a new version to make changes.
              </p>
            )}
            {editable && (
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Save size={16} /> {saving ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>
        )}

        {tab === 'measure' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Measure <span className="text-sm font-normal text-slate-500">v{version?.version_no}</span>
            </h3>
            <Field label="Description" value={draft.measure_description ?? ''} editable={!!editable} rows={4}
              onChange={v => setDraft(d => ({ ...d, measure_description: v }))} />
            <Field label="How To" value={draft.measure_how_to ?? ''} editable={!!editable} rows={8}
              onChange={v => setDraft(d => ({ ...d, measure_how_to: v }))} />
            {editable && (
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Save size={16} /> {saving ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>
        )}

        {tab === 'approvals' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Approvals</h3>
            {version?.status === 'Pending' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-700 mb-2">
                  v{version.version_no} needs both signatures before it becomes active.
                </p>
                <div className="flex gap-2">
                  {(['description', 'how_to'] as const).map(a => (
                    <button key={a} onClick={() => approve(a)}
                      disabled={saving || approvedAspects.has(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40">
                      <Check size={16} />
                      {approvedAspects.has(a) ? 'Signed: ' : 'Approve '}
                      {a === 'description' ? 'description' : 'how to measure'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Table
              head={['Version', 'Aspect', 'Approved by', 'Date', 'Comment']}
              rows={approvals.map(a => [
                `v${a.version_no}`,
                a.aspect === 'how_to' ? 'How to measure' : 'Description',
                a.approved_by, fmt(a.approved_at), a.comment || '—',
              ])}
              empty="No approvals recorded yet."
            />
          </div>
        )}

        {tab === 'parts' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">APC Parts</h3>
            <p className="text-sm text-slate-600">
              Every drawing this note was found on, with where it sits on the sheet.
            </p>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>{['APC Part', 'Customer Part', 'Drawing', 'Rev', 'Location', 'Source', 'Note'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {sources.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500 italic">
                      Not linked to any drawing yet.
                    </td></tr>
                  ) : sources.map(s => (
                    <tr key={s.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs font-semibold">{s.apc_part_number}</td>
                      <td className="px-3 py-2">{s.customer_part_number || '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{s.drawing_number || '—'}</td>
                      <td className="px-3 py-2">{s.drawing_rev || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="font-mono text-xs">{s.zone_label || '?'}</span>
                        <span className="text-slate-500 text-xs">, page {s.page_no}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-slate-600" title={s.pdf_path}>
                          {s.pdf_name || '—'}
                        </span>
                        {s.extraction_method === 'ocr' && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]"
                            title="Read by OCR — check the wording before approving">OCR</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => { setImageError(null); setImageFor(s) }} disabled={s.bbox_x0 === null}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:text-slate-300"
                          title={s.bbox_x0 === null ? 'No position recorded' : 'Show the note on the drawing'}>
                          <ImageIcon size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">History</h3>
            <Table
              head={['Version', 'Event', 'Date', 'By', 'Detail']}
              rows={(data.history || []).map((h: any) => [
                `v${h.version_no}`, h.event, fmt(h.at), h.by || '—', h.detail || '',
              ])}
              empty="Nothing recorded yet."
            />
          </div>
        )}
      </div>

      {imageFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setImageFor(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div>
                <h5 className="font-semibold text-slate-800">
                  {imageFor.apc_part_number} — note {imageFor.note_number}
                </h5>
                <p className="text-xs text-slate-600">
                  {imageFor.zone_label}, page {imageFor.page_no} · {imageFor.pdf_name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a href={getApiUrl(`/api/products/drawing-notes/crop?source_id=${imageFor.id}`)}
                  download={`note-${imageFor.apc_part_number}-${imageFor.note_number}.png`}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                  <ExternalLink size={14} /> Save image
                </a>
                <button onClick={() => setImageFor(null)} className="p-1 hover:bg-slate-100 rounded">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto bg-slate-50">
              {/* The crop is rendered on demand and can fail — a missing
                  poppler, an unwritable cache dir, a moved source PDF. A bare
                  <img> turns all of that into a broken-image icon with no
                  explanation, so the error is fetched and shown instead. */}
              {imageError ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {imageError}
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={getApiUrl(`/api/products/drawing-notes/crop?source_id=${imageFor.id}`)}
                  alt={`Note ${imageFor.note_number} on ${imageFor.apc_part_number}`}
                  className="max-w-full bg-white border border-slate-200"
                  onError={async () => {
                    try {
                      const r = await fetch(getApiUrl(
                        `/api/products/drawing-notes/crop?source_id=${imageFor.id}`))
                      const d = await r.json()
                      setImageError(d.error || 'Could not render the note image.')
                    } catch {
                      setImageError('Could not render the note image.')
                    }
                  }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, editable, onChange, rows = 1, mono = false }: {
  label: string; value: string; editable: boolean
  onChange: (v: string) => void; rows?: number; mono?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {editable ? (
        rows > 1 ? (
          <textarea value={value} rows={rows} onChange={e => onChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${mono ? 'font-mono' : ''}`} />
        ) : (
          <input type="text" value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        )
      ) : (
        <p className={`px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap ${mono ? 'font-mono text-xs' : ''}`}>
          {value || <span className="text-slate-400">—</span>}
        </p>
      )}
    </div>
  )
}

function Table({ head, rows, empty }: { head: string[]; rows: any[][]; empty: string }) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-slate-100"><tr>
          {head.map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-slate-700">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={head.length} className="px-3 py-6 text-center text-slate-500 italic">{empty}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-200">
              {r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
