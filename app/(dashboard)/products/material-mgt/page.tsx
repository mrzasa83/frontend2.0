'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Tabs from '@/components/ui/Tabs'
import FilePreviewModal from '@/components/products/FilePreviewModal'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, X, Trash2, Download, Eye,
  ShieldCheck, FileText, ListFilter, AlertTriangle, Upload, Save, Pencil, ClipboardList, Files, Layers,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { hasRole } from '@/lib/config/access'
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

export default function MaterialMgtPage() {
  const { data: session } = useSession()
  const roles: string[] = ((session?.user as any)?.roles) || []
  const canEdit = hasRole(roles, 'Admin', 'EHSadmin')

  const [openFamilies, setOpenFamilies] = useState<Family[]>([])
  const [openParts, setOpenParts] = useState<{ part: string; source: string }[]>([])
  const [activeTab, setActiveTab] = useState('parts')
  const [reloadKey, setReloadKey] = useState(0)

  const openPart = (part: string, source: string) => {
    if (!openParts.find(p => p.part === part)) setOpenParts(v => [...v, { part, source }])
    setActiveTab(`part-${part}`)
  }
  const closePart = (part: string) => {
    setOpenParts(v => v.filter(p => p.part !== part))
    setActiveTab('parts')
  }

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
    { id: 'parts', label: 'Parts', closeable: false, content: <PartsTab key={`parts-${reloadKey}`} onOpenPart={openPart} /> },
    {
      id: 'families', label: 'Families', closeable: false,
      content: <FamiliesTab key={`fams-${reloadKey}`} canEdit={canEdit} onOpen={openFamily} onChanged={refreshAll} />,
    },
    ...openParts.map(p => ({
      id: `part-${p.part}`,
      // The tab says which part it is and where its classification comes from.
      // The badge says which KIND of thing the tab holds. A Part is a single
      // active purchased line in Paradigm; a Family is a saved search that
      // collects parts. Labelling a part "Family" because it inherits its
      // classification from one was confusing.
      label: (
        <span className="flex items-center gap-1.5">
          {p.part}
          <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-100 text-cyan-700">Part</span>
        </span>
      ),
      closeable: true,
      onClose: () => closePart(p.part),
      content: <PartDetail key={`part-${p.part}`} partNumber={p.part} canEdit={canEdit} onChanged={refreshAll} />,
    })),
    ...openFamilies.map(f => ({
      id: `fam-${f.id}`,
      label: (
        <span className="flex items-center gap-1.5">
          {f.family_name}
          <span className="text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-700">Family</span>
        </span>
      ),
      closeable: true,
      onClose: () => closeFamily(f.id),
      content: <FamilyDetail key={`fam-${f.id}`} familyId={f.id} canEdit={canEdit} onChanged={refreshAll} />,
    })),
  ]

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Material Mgt</h1>
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

function PartsTab({ onOpenPart }: { onOpenPart: (part: string, source: string) => void }) {
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
              <tr key={`${r.RKEY}-${i}`}
                onClick={() => onOpenPart(r.INV_PART_NUMBER, r.PRODUCT_FAMILY ? (r.per_part_evidence ? 'Part' : 'Family') : '')}
                className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
                <td className="px-3 py-1.5 font-mono text-blue-600 font-medium">{r.INV_PART_NUMBER}</td>
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
  const [globalFilter, setGlobalFilter] = useState('')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'family_name', dir: 'asc' })
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 100

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

  // The saved search criteria, rendered the way they read in SQL.
  const criteriaText = (f: Family) =>
    (f.criteria || [])
      .map(c => `${c.field} ${String(c.operator).toLowerCase()} '${c.pattern}'`)
      .join(' and ')

  const COLS = [
    { key: 'family_name', label: 'Family', w: 190 },
    { key: 'criteria', label: 'Search Criteria' },
    { key: 'description', label: 'Description', w: 220 },
    { key: 'match_count', label: 'Parts', w: 80 },
    { key: 'reach_status', label: 'REACH', w: 120 },
    { key: 'rohs_status', label: 'RoHS', w: 120 },
    { key: 'prop65_status', label: 'Prop 65', w: 120 },
  ]

  const valueOf = (f: Family, key: string) =>
    key === 'criteria' ? criteriaText(f) : String((f as any)[key] ?? '')

  const filtered = useMemo(() => {
    const g = globalFilter.trim().toLowerCase()
    return families.filter(f => {
      if (g && !`${f.family_name} ${f.description} ${criteriaText(f)}`.toLowerCase().includes(g)) return false
      return Object.entries(colFilters).every(([k, v]) =>
        !v.trim() || valueOf(f, k).toLowerCase().includes(v.toLowerCase()))
    })
  }, [families, globalFilter, colFilters])

  const sorted = useMemo(() => {
    const { key, dir } = sort
    return [...filtered].sort((a, b) => {
      if (key === 'match_count') {
        return (dir === 'asc' ? 1 : -1) * ((a.match_count ?? 0) - (b.match_count ?? 0))
      }
      return (dir === 'asc' ? 1 : -1) * valueOf(a, key).localeCompare(valueOf(b, key))
    })
  }, [filtered, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { setPage(1) }, [globalFilter, colFilters, sort])

  const toggleSort = (key: string) =>
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(sorted.map(f => ({
      Family: f.family_name, 'Search Criteria': criteriaText(f), Description: f.description,
      Parts: f.match_count ?? '', REACH: f.reach_status, RoHS: f.rohs_status, 'Prop 65': f.prop65_status,
      'Parts inherit': (f.inherit_compliance ?? 1) ? 'Yes' : 'No — per part',
    })))
    ws['!cols'] = [{ wch: 22 }, { wch: 48 }, { wch: 34 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Families')
    XLSX.writeFile(wb, `material-families_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${sorted.length} families${pages > 1 ? ` · page ${page} of ${pages}` : ''}`}
          {Object.values(colFilters).some(v => v.trim()) && (
            <button onClick={() => setColFilters({})} className="ml-2 text-blue-600 hover:underline">clear filters</button>
          )}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} placeholder="Search families…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          {canEdit && (
            <button onClick={() => setCreating(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <Plus size={14} /> New family
            </button>
          )}
          <button onClick={exportExcel} disabled={!sorted.length}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 disabled:opacity-50">
            <Download size={14} /> Excel
          </button>
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[calc(100vh-330px)]">
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
            </tr>
            <tr>
              {COLS.map(c => (
                <th key={c.key} className="px-1 py-1 border-b border-slate-200 bg-white">
                  <input value={colFilters[c.key] || ''}
                    onChange={e => setColFilters(f => ({ ...f, [c.key]: e.target.value }))}
                    placeholder="filter"
                    className="w-full min-w-[60px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLS.length} className="px-3 py-8 text-center text-slate-400"><RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={COLS.length} className="px-3 py-8 text-center text-slate-400">
                No families match.{canEdit && ' Use “New family” to define one.'}
              </td></tr>
            ) : pageRows.map(f => (
              <tr key={f.id} onClick={() => onOpen(f)} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
                <td className="px-3 py-1.5 font-medium text-blue-600">
                  {f.family_name}
                  {!(f.inherit_compliance ?? 1) && (
                    <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 font-normal"
                      title="Parts do not inherit this family's compliance level">per part</span>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {criteriaText(f)
                    ? <span className="font-mono text-xs text-slate-600">{criteriaText(f)}</span>
                    : <span className="text-amber-600 text-xs">no criteria</span>}
                </td>
                <td className="px-3 py-1.5 text-slate-600 truncate max-w-xs">{f.description}</td>
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

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40">Prev</button>
          <span className="text-slate-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40">Next</button>
        </div>
      )}

      {creating && (
        <NewFamilyModal onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(); onChanged() }} />
      )}
    </div>
  )
}

// ---------------- Part detail (General + Attachments) ----------------
type PartDetailData = {
  part: { rkey: number; part_number: string; description: string; manufacturer: string; active_flag: string; pm: string }
  family: { id: number; family_name: string; inherit_compliance: number; reach_status: string; rohs_status: string; prop65_status: string } | null
  compliance_source: string
  compliance: { reach_status: string; rohs_status: string; prop65_status: string }
  part_compliance: { reach_status: string; rohs_status: string; prop65_status: string; notes: string | null; updated_by: string; updated_at: string } | null
  notepad: string
  attachments: { name: string; description: string; path: string; windows_path: string; extension: string; print_on_traveller: boolean; servable?: boolean; reason?: string }[]
}

function PartDetail({ partNumber, canEdit, onChanged }:
  { partNumber: string; canEdit: boolean; onChanged: () => void }) {
  const [tab, setTab] = useState<'general' | 'attachments' | 'where-used'>('general')
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

function NewFamilyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState<Criterion[]>([
    { field: 'INV_PART_NUMBER', operator: 'LIKE', conjunction: 'AND', pattern: '', seq: 0 },
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
  const add = () => onChange([...criteria,
    { field: 'INV_PART_NUMBER', operator: 'LIKE', conjunction: 'AND', pattern: '', seq: criteria.length }])
  const remove = (i: number) => onChange(criteria.filter((_, j) => j !== i))

  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1">
        Additional criteria, applied on top of the base search.
        <span className="font-normal text-slate-400"> AND binds tighter than OR — “A and B or C” means “(A and B) or C”.</span>
      </div>
      <div className="space-y-2">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            {i === 0 ? (
              <span className="text-xs text-slate-400 w-14" title="The first criterion always narrows the base search">and</span>
            ) : (
              <select value={(c.conjunction || 'AND').toUpperCase()}
                onChange={e => set(i, { conjunction: e.target.value })}
                title="How this criterion joins to the one above. AND binds tighter than OR."
                className="w-14 px-1 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="AND">and</option>
                <option value="OR">or</option>
              </select>
            )}
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
              <div key={i} className="font-mono text-xs">
                {i === 0 ? 'and' : (c.conjunction || 'AND').toLowerCase()} {c.field} {c.operator.toLowerCase()} '{c.pattern}'
              </div>
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
