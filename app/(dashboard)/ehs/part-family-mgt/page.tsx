'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Tabs from '@/components/ui/Tabs'
import FilePreviewModal from '@/components/products/FilePreviewModal'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, X, Trash2, Download, Eye,
  ShieldCheck, FileText, ListFilter, AlertTriangle, Upload, Save, Pencil,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { CRITERIA_FIELDS, CRITERIA_OPERATORS, COMPLIANCE_VALUES, type Criterion } from '@/lib/ehs/familyMatch'

type Part = {
  RKEY: number | string
  INV_PART_NUMBER: string
  INV_PART_DESCRIPTION: string
  MANUFACTURER_NAME: string
  ACTIVE_FLAG: string
  PRODUCT_FAMILY: string
  family_id: number | null
  reach_status: string
  rohs_status: string
  prop65_status: string
  per_part_evidence?: boolean
  overlap: string[] | null
}
type Family = {
  id: number
  family_name: string
  description: string
  reach_status: string
  rohs_status: string
  prop65_status: string
  classification_notes: string | null
  inherit_compliance?: number
  sort_order: number
  active: number
  match_count?: number
  criteria: Criterion[]
  updated_by?: string | null
}
type FamilyDoc = {
  id: number; doc_type: string; title: string; file_name: string
  file_path: string; file_size: number | null; uploaded_by: string; uploaded_at: string
}

const statusBadge = (v: string) => {
  const s = (v || '').toLowerCase()
  if (s === 'compliant') return 'bg-green-100 text-green-700'
  if (s === 'non-compliant') return 'bg-red-100 text-red-700'
  if (s === 'exempt') return 'bg-blue-50 text-blue-700'
  return 'bg-amber-50 text-amber-600'
}
const ext = (n: string) => { const m = /\.([^.]+)$/.exec(n || ''); return m ? m[1].toLowerCase() : '' }

export default function PartFamilyMgtPage() {
  const { data: session } = useSession()
  const roles: string[] = ((session?.user as any)?.roles) || []
  const canEdit = roles.includes('Admin') || roles.includes('EHSadmin')

  const [openFamilies, setOpenFamilies] = useState<Family[]>([])
  const [activeTab, setActiveTab] = useState('parts')
  const [reloadKey, setReloadKey] = useState(0)

  const openFamily = (f: Family) => {
    if (!openFamilies.find(x => x.id === f.id)) setOpenFamilies(v => [...v, f])
    setActiveTab(`fam-${f.id}`)
  }
  const closeFamily = (id: number) => {
    setOpenFamilies(v => v.filter(x => x.id !== id))
    setActiveTab('families')
  }
  const refreshAll = () => setReloadKey(k => k + 1)

  const tabs = [
    { id: 'parts', label: 'Parts', closeable: false, content: <PartsTab key={`parts-${reloadKey}`} /> },
    {
      id: 'families', label: 'Families', closeable: false,
      content: <FamiliesTab key={`fams-${reloadKey}`} canEdit={canEdit} onOpen={openFamily} onChanged={refreshAll} />,
    },
    ...openFamilies.map(f => ({
      id: `fam-${f.id}`, label: f.family_name, closeable: true,
      onClose: () => closeFamily(f.id),
      content: <FamilyDetail key={`fam-${f.id}`} familyId={f.id} canEdit={canEdit} onChanged={refreshAll} />,
    })),
  ]

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Part Family Mgt</h1>
        <p className="text-sm text-slate-600">
          Bucket purchased parts into material families and record their REACH / RoHS / Prop 65 position
          {!canEdit && <span className="text-slate-400"> · view only</span>}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} preserveState={true} />
        </div>
      </div>
    </div>
  )
}

// ---------------- Parts tab ----------------
const PART_COLS = [
  { key: 'INV_PART_NUMBER', label: 'Part Number', filter: 'f_part', w: 160 },
  { key: 'INV_PART_DESCRIPTION', label: 'Description', filter: 'f_desc' },
  { key: 'MANUFACTURER_NAME', label: 'Manufacturer', filter: 'f_mfr', w: 200 },
  { key: 'PRODUCT_FAMILY', label: 'Product Family', filter: 'f_family', w: 190 },
  { key: 'ACTIVE_FLAG', label: 'Active', filter: '', w: 70 },
]

function PartsTab() {
  const [rows, setRows] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState<Record<string, string>>({})
  const [unassignedOnly, setUnassignedOnly] = useState(false)
  const [partMode, setPartMode] = useState<'contains' | 'starts'>('starts')
  const [famOptions, setFamOptions] = useState<string[]>([])

  // Family names for the Product Family dropdown.
  useEffect(() => {
    fetch(getApiUrl('/api/ehs/families'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.families) setFamOptions(d.families.map((f: any) => f.family_name)) })
      .catch(() => {})
  }, [])
  const [sort, setSort] = useState({ key: 'INV_PART_NUMBER', dir: 'asc' as 'asc' | 'desc' })
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({ totalParts: 0, assigned: 0, unassigned: 0 })

  useEffect(() => {
    const t = setTimeout(() => { setApplied(filters); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [filters])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const p = new URLSearchParams({
        page: String(page), pageSize: '100', sort: sort.key, dir: sort.dir,
      })
      for (const [k, v] of Object.entries(applied)) if (v.trim()) p.set(k, v.trim())
      p.set('f_part_mode', partMode)
      if (unassignedOnly) p.set('unassigned', '1')
      const res = await fetch(getApiUrl(`/api/ehs/parts?${p.toString()}`))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load parts')
      setRows(r.rows || []); setPages(r.pages || 1); setTotal(r.total || 0)
      setSummary({ totalParts: r.totalParts || 0, assigned: r.assigned || 0, unassigned: r.unassigned || 0 })
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [page, sort, applied, unassignedOnly, partMode])
  useEffect(() => { load() }, [load])

  const toggleSort = (key: string) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
      RKEY: r.RKEY, 'Part Number': r.INV_PART_NUMBER, Description: r.INV_PART_DESCRIPTION,
      Manufacturer: r.MANUFACTURER_NAME, 'Product Family': r.PRODUCT_FAMILY,
      REACH: r.reach_status, RoHS: r.rohs_status, 'Prop 65': r.prop65_status, Active: r.ACTIVE_FLAG,
    })))
    ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 46 }, { wch: 24 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 8 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Parts')
    XLSX.writeFile(wb, `ehs-parts_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : (
            <>
              {total.toLocaleString()} shown · {summary.totalParts.toLocaleString()} purchased parts ·{' '}
              <span className="text-green-700">{summary.assigned.toLocaleString()} in a family</span> ·{' '}
              <span className="text-amber-600">{summary.unassigned.toLocaleString()} unassigned</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input type="checkbox" checked={unassignedOnly}
              onChange={e => { setUnassignedOnly(e.target.checked); setPage(1) }} />
            Unassigned only
          </label>
          <button onClick={exportExcel} disabled={!rows.length}
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

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[calc(100vh-330px)]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {PART_COLS.map(c => {
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
              {PART_COLS.map(c => (
                <th key={c.key} className="px-1 py-1 border-b border-slate-200 bg-white align-top">
                  {c.filter === 'f_part' ? (
                    <div className="flex gap-1">
                      <select value={partMode} onChange={e => { setPartMode(e.target.value as 'contains' | 'starts'); setPage(1) }}
                        title="How the part-number filter matches"
                        className="text-xs font-normal border border-slate-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300">
                        <option value="starts">starts</option>
                        <option value="contains">has</option>
                      </select>
                      <input value={filters.f_part || ''}
                        onChange={e => setFilters(f => ({ ...f, f_part: e.target.value }))}
                        placeholder={partMode === 'starts' ? 'PPGLB' : 'filter'}
                        className="w-full min-w-[50px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                    </div>
                  ) : c.filter === 'f_family' ? (
                    <select value={filters.f_family || ''}
                      onChange={e => { setFilters(f => ({ ...f, f_family: e.target.value })); setPage(1) }}
                      className="w-full text-xs font-normal border border-slate-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300">
                      <option value="">All</option>
                      <option value="__unassigned__">— Unassigned —</option>
                      {famOptions.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  ) : c.filter ? (
                    <input value={filters[c.filter] || ''}
                      onChange={e => setFilters(f => ({ ...f, [c.filter]: e.target.value }))}
                      placeholder="filter"
                      className="w-full min-w-[60px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={PART_COLS.length} className="px-3 py-8 text-center text-slate-400"><RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={PART_COLS.length} className="px-3 py-8 text-center text-slate-400">No parts match.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={`${r.RKEY}-${i}`} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 font-mono text-slate-800">{r.INV_PART_NUMBER}</td>
                <td className="px-3 py-1.5 text-slate-600">{r.INV_PART_DESCRIPTION}</td>
                <td className="px-3 py-1.5 text-slate-600">{r.MANUFACTURER_NAME}</td>
                <td className="px-3 py-1.5">
                  {r.PRODUCT_FAMILY ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-slate-800">{r.PRODUCT_FAMILY}</span>
                      {r.overlap && (
                        <span title={`Also matches: ${r.overlap.join(', ')}`}>
                          <AlertTriangle size={12} className="text-amber-500" />
                        </span>
                      )}
                    </span>
                  ) : <span className="text-amber-600 text-xs">unassigned</span>}
                  {r.per_part_evidence && (
                    <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-700"
                      title="This family does not flow its classification down — this part needs its own evidence">
                      per part
                    </span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">{r.ACTIVE_FLAG}</td>
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
    </div>
  )
}

// ---------------- Families tab ----------------
function FamiliesTab({ canEdit, onOpen, onChanged }: { canEdit: boolean; onOpen: (f: Family) => void; onChanged: () => void }) {
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/ehs/families'))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load families')
      setFamilies(r.families || [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return families
    return families.filter(f =>
      f.family_name.toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q))
  }, [families, filter])

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm text-slate-500">{loading ? 'Loading…' : `${shown.length} families`}</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search families…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          {canEdit && (
            <button onClick={() => setCreating(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <Plus size={14} /> New family
            </button>
          )}
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Family</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Description</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-24">Parts</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">REACH</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">RoHS</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Prop 65</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400"><RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                No families yet.{canEdit && ' Use “New family” to define one.'}
              </td></tr>
            ) : shown.map(f => (
              <tr key={f.id} onClick={() => onOpen(f)} className="border-t border-slate-100 hover:bg-blue-50 cursor-pointer">
                <td className="px-3 py-1.5 font-medium text-blue-600">
                  {f.family_name}
                  {!(f.inherit_compliance ?? 1) && (
                    <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 font-normal"
                      title="Parts do not inherit this family's compliance level">per part</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-slate-600 truncate max-w-md">{f.description}</td>
                <td className="px-3 py-1.5 tabular-nums text-slate-700">{f.match_count ?? '—'}</td>
                {[f.reach_status, f.rohs_status, f.prop65_status].map((v, i) => (
                  <td key={i} className="px-3 py-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge(v)}`}>{v || 'Unknown'}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <NewFamilyModal onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(); onChanged() }} />
      )}
    </div>
  )
}

function NewFamilyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState<Criterion[]>([
    { field: 'INV_PART_NUMBER', operator: 'LIKE', pattern: '', seq: 0 },
  ])
  const [inherit, setInherit] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setBusy(true); setErr('')
    try {
      const res = await fetch(getApiUrl('/api/ehs/families'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_name: name, description, criteria, inherit_compliance: inherit }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || 'Failed to create')
      onCreated()
    } catch (e: any) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">New family</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        {err && <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{err}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Family name</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="ISOLA FR406 Prepreg"
              className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>
        <CriteriaEditor criteria={criteria} onChange={setCriteria} />
        <label className="flex items-start gap-2 mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
          <input type="checkbox" className="mt-0.5" checked={!inherit} onChange={e => setInherit(!e.target.checked)} />
          <span className="text-sm text-slate-700">
            Parts cannot inherit this family’s compliance level
            <span className="block text-xs text-slate-500 mt-0.5">
              Every part will need its own supporting documents.
            </span>
          </span>
        </label>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={save} disabled={busy || !name.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'Creating…' : 'Create family'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------- Criteria editor (shared) ----------------
function CriteriaEditor({ criteria, onChange }: { criteria: Criterion[]; onChange: (c: Criterion[]) => void }) {
  const set = (i: number, patch: Partial<Criterion>) =>
    onChange(criteria.map((c, j) => j === i ? { ...c, ...patch } : c))
  const add = () => onChange([...criteria, { field: 'INV_PART_NUMBER', operator: 'LIKE', pattern: '', seq: criteria.length }])
  const remove = (i: number) => onChange(criteria.filter((_, j) => j !== i))

  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1">
        Additional criteria — all are AND’d on top of the base search
      </div>
      <div className="space-y-2">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-8">{i === 0 ? 'and' : 'and'}</span>
            <select value={c.field} onChange={e => set(i, { field: e.target.value })}
              className="px-2 py-1 text-sm border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              {CRITERIA_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={c.operator} onChange={e => set(i, { operator: e.target.value })}
              className="px-2 py-1 text-sm border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              {CRITERIA_OPERATORS.map(o => <option key={o} value={o}>{o.toLowerCase()}</option>)}
            </select>
            <input value={c.pattern} onChange={e => set(i, { pattern: e.target.value })}
              placeholder="PPGLB%"
              className="flex-1 px-2 py-1 text-sm font-mono border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <button onClick={() => remove(i)} className="text-slate-400 hover:text-red-600" title="Remove"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
        <Plus size={13} /> Add criterion
      </button>
    </div>
  )
}

// ---------------- Family detail (left rail) ----------------
function FamilyDetail({ familyId, canEdit, onChanged }: { familyId: number; canEdit: boolean; onChanged: () => void }) {
  const [tab, setTab] = useState<'classification' | 'documents' | 'definition'>('classification')
  const [family, setFamily] = useState<Family | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [docs, setDocs] = useState<FamilyDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/ehs/families?id=${familyId}`))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load')
      setFamily(r.family); setParts(r.parts || []); setDocs(r.documents || [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [familyId])
  useEffect(() => { load() }, [load])

  // Classification first, supporting documents next, definition last — as asked.
  const RAIL = [
    { id: 'classification', label: 'Classification', icon: ShieldCheck },
    { id: 'documents', label: 'Support Documents', icon: FileText },
    { id: 'definition', label: 'Definition', icon: ListFilter },
  ] as const

  if (loading) return <div className="text-slate-500 py-8 flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
  if (error) return <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
  if (!family) return null

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {family.family_name}
            {!(family.inherit_compliance ?? 1) && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-normal">
                per-part evidence
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-600">
            {family.description || <span className="text-slate-400">No description</span>}
            <span className="text-slate-400"> · {parts.length} parts</span>
          </p>
        </div>
        {canEdit && (
          <button onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-sm border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-1.5">
            <Pencil size={14} /> Edit details
          </button>
        )}
      </div>
      {editing && (
        <EditFamilyModal family={family} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); onChanged() }} />
      )}
      <div className="flex gap-0 min-h-[420px]">
        <div className="w-52 flex-shrink-0 border-r border-slate-200">
          {RAIL.map(t => {
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
          {tab === 'classification' && <ClassificationTab family={family} canEdit={canEdit} reload={() => { load(); onChanged() }} />}
          {tab === 'documents' && <DocumentsTab family={family} docs={docs} canEdit={canEdit} reload={load} />}
          {tab === 'definition' && <DefinitionTab family={family} parts={parts} canEdit={canEdit} reload={() => { load(); onChanged() }} />}
        </div>
      </div>
    </div>
  )
}

function EditFamilyModal({ family, onClose, onSaved }:
  { family: Family; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(family.family_name)
  const [description, setDescription] = useState(family.description || '')
  const [inherit, setInherit] = useState((family.inherit_compliance ?? 1) ? true : false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setBusy(true); setErr('')
    try {
      const res = await fetch(getApiUrl('/api/ehs/families'), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: family.id, family_name: name, description,
          inherit_compliance: inherit,
        }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || 'Failed to save')
      onSaved()
    } catch (e: any) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Edit family</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        {err && <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{err}</div>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Family name</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <label className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={!inherit}
              onChange={e => setInherit(!e.target.checked)} />
            <span className="text-sm text-slate-700">
              Parts cannot inherit this family’s compliance level
              <span className="block text-xs text-slate-500 mt-0.5">
                Every part in the family needs its own supporting documents. The family-level
                REACH / RoHS / Prop 65 values stop flowing down to the parts list.
              </span>
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={save} disabled={busy || !name.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ClassificationTab({ family, canEdit, reload }: { family: Family; canEdit: boolean; reload: () => void }) {
  const [reach, setReach] = useState(family.reach_status || 'Unknown')
  const [rohs, setRohs] = useState(family.rohs_status || 'Unknown')
  const [prop65, setProp65] = useState(family.prop65_status || 'Unknown')
  const [notes, setNotes] = useState(family.classification_notes || '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const save = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      const res = await fetch(getApiUrl('/api/ehs/families'), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: family.id, reach_status: reach, rohs_status: rohs,
          prop65_status: prop65, classification_notes: notes,
        }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || 'Failed to save')
      setMsg('Saved'); reload()
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }

  const Row = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {canEdit ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
          {COMPLIANCE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      ) : (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge(value)}`}>{value}</span>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Classification</h3>
      {!(family.inherit_compliance ?? 1) && (
        <div className="p-3 mb-4 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900 flex gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            This family does not flow its compliance level down. The values below describe the family
            as a whole, but every part still needs its own supporting documents — the parts list shows
            no inherited status for them.
          </span>
        </div>
      )}
      {err && <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{err}</div>}
      {msg && <div className="p-2 mb-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{msg}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Row label="REACH" value={reach} onChange={setReach} />
        <Row label="RoHS" value={rohs} onChange={setRohs} />
        <Row label="Prop 65" value={prop65} onChange={setProp65} />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Why — the reasoning behind this classification
        </label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={6} readOnly={!canEdit}
          placeholder="Cite the declaration, supplier statement or test report that supports this position."
          className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 read-only:bg-slate-50" />
      </div>
      {canEdit && (
        <button onClick={save} disabled={busy}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
          <Save size={14} /> {busy ? 'Saving…' : 'Save classification'}
        </button>
      )}
      {family.updated_by && <p className="text-xs text-slate-400 mt-3">Last changed by {family.updated_by}</p>}
    </div>
  )
}

function DocumentsTab({ family, docs, canEdit, reload }: { family: Family; docs: FamilyDoc[]; canEdit: boolean; reload: () => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [docType, setDocType] = useState('General')
  const [title, setTitle] = useState('')
  const [preview, setPreview] = useState<{ files: any[]; index: number } | null>(null)

  const upload = async (file: File) => {
    setBusy(true); setErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('family_id', String(family.id))
      fd.append('doc_type', docType)
      fd.append('title', title)
      const res = await fetch(getApiUrl('/api/ehs/families/documents'), { method: 'POST', body: fd })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Upload failed')
      setTitle(''); reload()
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }

  const remove = async (id: number) => {
    await fetch(getApiUrl(`/api/ehs/families/documents?id=${id}`), { method: 'DELETE' })
    reload()
  }

  const previewList = docs.map(d => ({ name: d.file_name, path: d.file_path, extension: ext(d.file_name) }))

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Support Documents</h3>
      <p className="text-xs text-slate-500 mb-4">
        Evidence backing this family’s classification. Filed on the S drive under
        <span className="font-mono"> FrontEndQCFolders\MtrlComp</span> as {family.family_name}-{'{date}'}.
      </p>

      {err && <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{err}</div>}

      {canEdit && (
        <div className="flex items-end gap-2 flex-wrap mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              {['General', 'REACH', 'RoHS', 'Prop 65'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Title (optional)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Supplier declaration 2026"
              className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">File</label>
            <input type="file" disabled={busy}
              onChange={e => { const f = e.target.files?.[0]; if (f) { upload(f); e.target.value = '' } }}
              className="block text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
          </div>
          {busy && <span className="text-sm text-slate-500 flex items-center gap-1"><Upload size={14} className="animate-pulse" /> Uploading…</span>}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-24">Type</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">File</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Title</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Uploaded</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 w-28">View</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400 text-sm">
                No supporting documents yet.
              </td></tr>
            ) : docs.map((d, i) => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5"><span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{d.doc_type}</span></td>
                <td className="px-3 py-1.5 text-slate-700">{d.file_name}</td>
                <td className="px-3 py-1.5 text-slate-500">{d.title}</td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">
                  {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : ''}
                  {d.uploaded_by ? ` · ${d.uploaded_by}` : ''}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setPreview({ files: previewList, index: i })}
                      className="text-slate-500 hover:text-blue-600" title="Preview"><Eye size={16} /></button>
                    <a href={getApiUrl(`/api/files/serve?path=${encodeURIComponent(d.file_path)}&download=true`)}
                      target="_blank" rel="noopener noreferrer"
                      className="text-slate-500 hover:text-blue-600" title="Download"><Download size={15} /></a>
                    {canEdit && (
                      <button onClick={() => remove(d.id)} className="text-slate-400 hover:text-red-600" title="Remove from list"><Trash2 size={14} /></button>
                    )}
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

function DefinitionTab({ family, parts, canEdit, reload }: { family: Family; parts: Part[]; canEdit: boolean; reload: () => void }) {
  const [criteria, setCriteria] = useState<Criterion[]>(family.criteria || [])
  const [preview, setPreview] = useState<{ count: number; parts: Part[]; sql: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const runPreview = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      const res = await fetch(getApiUrl('/api/ehs/families/preview'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Preview failed')
      setPreview({ count: r.count, parts: r.parts || [], sql: r.sql })
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }

  const save = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      const res = await fetch(getApiUrl('/api/ehs/families'), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: family.id, criteria }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || 'Failed to save')
      setMsg('Definition saved'); reload()
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }

  const shown = preview ? preview.parts : parts

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Definition</h3>
      <p className="text-xs text-slate-500 mb-4">
        The base search selects active purchased parts that don’t start with Z. Criteria below narrow it further.
      </p>

      {err && <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{err}</div>}
      {msg && <div className="p-2 mb-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{msg}</div>}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
        <div className="text-xs font-medium text-slate-500 mb-2">Base search (fixed)</div>
        <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap mb-3">{`P_M = 'P' and ACTIVE_FLAG = 'Y' and INV_PART_NUMBER not like 'Z%'`}</pre>
        {canEdit ? (
          <CriteriaEditor criteria={criteria} onChange={setCriteria} />
        ) : (
          <div className="text-sm text-slate-600 space-y-1">
            {(family.criteria || []).map((c, i) => (
              <div key={i} className="font-mono text-xs">and {c.field} {c.operator.toLowerCase()} '{c.pattern}'</div>
            ))}
            {!(family.criteria || []).length && <span className="text-slate-400">No criteria defined.</span>}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button onClick={runPreview} disabled={busy}
            className="px-3 py-1.5 text-sm border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-50">
            {busy ? 'Testing…' : 'Test criteria'}
          </button>
          {canEdit && (
            <button onClick={save} disabled={busy}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
              <Save size={14} /> Save definition
            </button>
          )}
          {preview && (
            <span className="text-sm text-slate-600">
              matches <span className="font-medium">{preview.count.toLocaleString()}</span> parts
            </span>
          )}
        </div>
      </div>

      {preview?.sql && (
        <details className="mb-4">
          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">Show the equivalent SQL</summary>
          <pre className="mt-2 text-xs font-mono bg-slate-900 text-slate-100 rounded-lg p-3 overflow-auto">{preview.sql}</pre>
        </details>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[380px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Part Number</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Description</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Manufacturer</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400 text-sm">
                No parts match these criteria yet.
              </td></tr>
            ) : shown.map((p, i) => (
              <tr key={`${p.RKEY}-${i}`} className="border-t border-slate-100">
                <td className="px-3 py-1.5 font-mono text-slate-800">{p.INV_PART_NUMBER}</td>
                <td className="px-3 py-1.5 text-slate-600">{p.INV_PART_DESCRIPTION}</td>
                <td className="px-3 py-1.5 text-slate-600">{p.MANUFACTURER_NAME}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview && preview.count > preview.parts.length && (
        <p className="text-xs text-slate-400 mt-1">Showing the first {preview.parts.length} of {preview.count} matches.</p>
      )}
    </div>
  )
}
