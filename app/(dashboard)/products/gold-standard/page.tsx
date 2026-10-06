'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  RefreshCw, Search, Plus, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, X,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import GoldStandardDetail from '@/components/products/GoldStandardDetail'

/**
 * Products -> Gold Standard.
 *
 * A gold standard is a frozen, editable copy of everything that goes into a
 * batch card for one customer part, so other parts can be compared against
 * it. The list is the entry point; clicking a row opens the same General /
 * BOM / Route / Like Parts layout a Product uses.
 */

type Row = {
  id: number
  technology: string
  technologyId: number | null
  apcPartNumber: string
  customerPartNumber: string
  program: string
  customerName: string
  status: string
  cardCount: number
  likePartCount: number
  capturedAt: string | null
}

type SortKey = 'technology' | 'apcPartNumber' | 'customerPartNumber' | 'program' | 'likePartCount'

export default function GoldStandardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('technology')
  const [sortAsc, setSortAsc] = useState(true)
  const [openId, setOpenId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/products/gold-standard'))
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      setRows(d.standards || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? rows.filter(r => [r.technology, r.apcPartNumber, r.customerPartNumber, r.program, r.customerName]
          .some(v => (v || '').toLowerCase().includes(q)))
      : rows
    const dir = sortAsc ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir
    })
  }, [rows, search, sortKey, sortAsc])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc(a => !a)
    else { setSortKey(k); setSortAsc(true) }
  }
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (k !== sortKey) return <ArrowUpDown className="w-3 h-3 opacity-40" />
    return sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
  }
  const Th = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th className={`px-3 py-2 ${right ? 'text-right' : ''}`}>
      <button onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-slate-700 ${right ? 'flex-row-reverse' : ''}`}>
        {label} <SortIcon k={k} />
      </button>
    </th>
  )

  if (openId != null) {
    return (
      <div className="p-6">
        <GoldStandardDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gold Standard</h1>
          <p className="text-sm text-slate-600">
            Blessed batch card data, captured from Paradigm, for comparing like parts against.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Technology, part, program…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={load} disabled={loading} title="Refresh"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={14} /> New Gold Standard
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 break-words">{error}</div>
        </div>
      )}

      {loading && !rows.length ? (
        <div className="flex items-center gap-2 py-16 justify-center text-slate-500">
          <RefreshCw size={18} className="animate-spin" /> Loading…
        </div>
      ) : !sorted.length ? (
        <div className="py-16 text-center text-sm text-slate-500">
          {rows.length ? 'No standards match that search.'
            : 'No gold standards yet. Use New Gold Standard to capture one from a customer part.'}
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <Th k="technology" label="Technology" />
                <Th k="apcPartNumber" label="APC Part Number" />
                <Th k="customerPartNumber" label="Customer Part Number" />
                <Th k="program" label="Program" />
                <Th k="likePartCount" label="Like Parts" right />
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(r => (
                <tr key={r.id} onClick={() => setOpenId(r.id)}
                  className="hover:bg-blue-50/50 cursor-pointer">
                  <td className="px-3 py-2">{r.technology || <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{r.apcPartNumber}</td>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-slate-600">{r.customerPartNumber}</td>
                  <td className="px-3 py-2">{r.program || <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.likePartCount}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === 'active' ? 'bg-green-100 text-green-700'
                        : r.status === 'retired' ? 'bg-slate-100 text-slate-500'
                        : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                    {/* A standard with no cards is a capture that did not
                        finish. Flagging it in the list means nobody opens it
                        expecting data and finds four empty tabs. */}
                    {!r.cardCount && (
                      <span className="ml-2 text-xs text-amber-600" title="No batch card data captured">
                        not captured
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && <AddDialog onClose={() => setAdding(false)}
        onCreated={(id) => { setAdding(false); load(); setOpenId(id) }} />}
    </div>
  )
}

/**
 * New Gold Standard.
 *
 * Driven by the customer part number, because that is what buildCardSet()
 * takes — the same entry point the batch card generator uses, so the captured
 * copy matches the card rather than being a second interpretation of it.
 */
function AddDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [technologies, setTechnologies] = useState<{ id: number; name: string }[]>([])
  const [techWarning, setTechWarning] = useState('')
  const [form, setForm] = useState({
    customerPartNumber: '', apcPartNumber: '', program: '', technologyId: '', title: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(getApiUrl('/api/products/gold-standard/technologies'))
      .then(r => r.json())
      .then(d => { setTechnologies(d.technologies || []); if (d.warning) setTechWarning(d.warning) })
      .catch(() => setTechWarning('Could not load NPI technologies'))
  }, [])

  const submit = async () => {
    if (!form.customerPartNumber.trim()) { setErr('Customer part number is required'); return }
    setSaving(true); setErr('')
    try {
      const res = await fetch(getApiUrl('/api/products/gold-standard'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      // The row exists either way; a capture problem is reported on the detail
      // view rather than thrown away with the dialog.
      onCreated(Number(d.id))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally { setSaving(false) }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">New Gold Standard</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {err && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{err}</div>}
          {techWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              {techWarning}. The standard can still be created and a technology set later.
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">
              Customer Part Number <span className="text-red-500">*</span>
            </label>
            <input value={form.customerPartNumber} onChange={e => set('customerPartNumber', e.target.value)}
              placeholder="The part the batch card is built from"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <p className="mt-1 text-xs text-slate-500">
              Capturing reads the whole card sequence from Paradigm and can take a moment on a deep assembly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">APC Part Number</label>
              <input value={form.apcPartNumber} onChange={e => set('apcPartNumber', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Program</label>
              <input value={form.program} onChange={e => set('program', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Technology</label>
            <select value={form.technologyId} onChange={e => set('technologyId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">— none —</option>
              {technologies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Capturing…</> : <><Plus size={14} /> Create &amp; Capture</>}
          </button>
        </div>
      </div>
    </div>
  )
}
