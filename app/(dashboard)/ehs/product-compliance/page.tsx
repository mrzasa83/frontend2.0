'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Tabs from '@/components/ui/Tabs'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Plus, X,
  ShieldCheck, Layers, Package, Route as RouteIcon, History as HistoryIcon, Save, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { hasRole } from '@/lib/config/access'
import { rollUpAll, materialPasses, type MaterialLine } from '@/lib/ehs/productCompliance'

type Assessment = {
  id: number; apc_part: string; customer_part: string; part_type: string
  reach_status: string; rohs_status: string; prop65_status: string
  material_count: number; covered_count: number
  assessed_by: string; assessed_at: string
  notes?: string
}
type BomNode = {
  part_number: string; description: string; manufacturer: string
  pm: string; level: number; quantity: number | null; parent_part: string
}
type ProductDetail = {
  apc_part: string; customer_part?: string; part_type: string
  materials: MaterialLine[]
  bom?: BomNode[]
  bom_total: number; purchased_count: number; manufactured_count?: number
  rollup: { reach: string; rohs: string; prop65: string }
  route: any[]
  history: Assessment[]
}

const verdictBadge = (v: string) =>
  String(v).toLowerCase() === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
const statusBadge = (v: string) => {
  const s = (v || '').toLowerCase()
  if (s === 'compliant') return 'bg-green-100 text-green-700'
  if (s === 'non-compliant') return 'bg-red-100 text-red-700'
  if (s === 'exempt') return 'bg-blue-50 text-blue-700'
  return 'bg-amber-50 text-amber-600'
}
const fmtDate = (v: any) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()
}

export default function ProductCompliancePage() {
  const { data: session } = useSession()
  const roles: string[] = ((session?.user as any)?.roles) || []
  const canEdit = hasRole(roles, 'Admin', 'EHSadmin')

  const [openProducts, setOpenProducts] = useState<{ apc_part: string; customer_part: string }[]>([])
  const [activeTab, setActiveTab] = useState('list')
  const [reloadKey, setReloadKey] = useState(0)

  const openProduct = (apc_part: string, customer_part = '') => {
    if (!openProducts.find(p => p.apc_part === apc_part)) {
      setOpenProducts(v => [...v, { apc_part, customer_part }])
    }
    setActiveTab(`prod-${apc_part}`)
  }
  const closeProduct = (apc_part: string) => {
    setOpenProducts(v => v.filter(p => p.apc_part !== apc_part))
    setActiveTab('list')
  }

  const tabs = [
    {
      id: 'list', label: 'Assessed Products', closeable: false,
      content: <AssessedList key={`list-${reloadKey}`} canEdit={canEdit} onOpen={openProduct} />,
    },
    ...openProducts.map(p => ({
      id: `prod-${p.apc_part}`, label: p.apc_part, closeable: true,
      onClose: () => closeProduct(p.apc_part),
      content: (
        <ProductDetailView key={`prod-${p.apc_part}`} apcPart={p.apc_part}
          customerPart={p.customer_part} canEdit={canEdit}
          onSaved={() => setReloadKey(k => k + 1)} />
      ),
    })),
  ]

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Product Compliance</h1>
        <p className="text-sm text-slate-600">
          Assess a product against the material families backing its BOM
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

// ---------------- Assessed products list ----------------
const LIST_COLS = [
  { key: 'apc_part', label: 'Part Number', w: 150 },
  { key: 'part_type', label: 'Type', w: 90 },
  { key: 'customer_part', label: 'Customer Part Number', w: 190 },
  { key: 'reach_status', label: 'REACH', w: 90 },
  { key: 'rohs_status', label: 'RoHS', w: 90 },
  { key: 'prop65_status', label: 'Prop 65', w: 90 },
  { key: 'assessed_at', label: 'Date Assessed', w: 130 },
]

function AssessedList({ canEdit, onOpen }: { canEdit: boolean; onOpen: (p: string, c?: string) => void }) {
  const [rows, setRows] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState({ key: 'assessed_at', dir: 'desc' as 'asc' | 'desc' })
  const [picking, setPicking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/ehs/product-compliance'))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load')
      setRows(r.rows || [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const shown = useMemo(() => {
    const out = rows.filter(r =>
      Object.entries(filters).every(([k, v]) =>
        !v.trim() || String((r as any)[k] ?? '').toLowerCase().includes(v.toLowerCase())))
    const { key, dir } = sort
    return [...out].sort((a, b) => {
      const av = String((a as any)[key] ?? ''), bv = String((b as any)[key] ?? '')
      return (dir === 'asc' ? 1 : -1) * av.localeCompare(bv)
    })
  }, [rows, filters, sort])

  const toggleSort = (key: string) =>
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(shown.map(r => ({
      'Part Number': r.apc_part, Type: r.part_type, 'Customer Part Number': r.customer_part,
      REACH: r.reach_status, RoHS: r.rohs_status, 'Prop 65': r.prop65_status,
      Materials: r.material_count, 'In a family': r.covered_count,
      'Assessed By': r.assessed_by, 'Date Assessed': fmtDate(r.assessed_at),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Product Compliance')
    XLSX.writeFile(wb, `product-compliance_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm text-slate-500">{loading ? 'Loading…' : `${shown.length} products assessed`}</p>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={() => setPicking(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <Plus size={14} /> Assess a product
            </button>
          )}
          <button onClick={exportExcel} disabled={!shown.length}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
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
              {LIST_COLS.map(c => (
                <th key={c.key} className="px-1 py-1 border-b border-slate-200 bg-white">
                  <input value={filters[c.key] || ''}
                    onChange={e => setFilters(f => ({ ...f, [c.key]: e.target.value }))}
                    placeholder="filter"
                    className="w-full min-w-[60px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={LIST_COLS.length} className="px-3 py-8 text-center text-slate-400"><RefreshCw size={18} className="animate-spin inline mr-2" /> Loading…</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={LIST_COLS.length} className="px-3 py-8 text-center text-slate-400">
                Nothing assessed yet.{canEdit && ' Use “Assess a product” to start.'}
              </td></tr>
            ) : shown.map(r => (
              <tr key={r.id} onClick={() => onOpen(r.apc_part, r.customer_part)}
                className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
                <td className="px-3 py-1.5 font-mono text-blue-600 font-medium">{r.apc_part}</td>
                <td className="px-3 py-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${r.part_type === 'ASM' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>{r.part_type}</span>
                </td>
                <td className="px-3 py-1.5 font-mono text-slate-700">{r.customer_part}</td>
                {[r.reach_status, r.rohs_status, r.prop65_status].map((v, i) => (
                  <td key={i} className="px-3 py-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${verdictBadge(v)}`}>{v}</span>
                  </td>
                ))}
                <td className="px-3 py-1.5 text-slate-500 text-xs">
                  {fmtDate(r.assessed_at)}<span className="text-slate-400"> · {r.assessed_by}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {picking && <ProductPicker onClose={() => setPicking(false)}
        onPick={(p, c) => { setPicking(false); onOpen(p, c) }} />}
    </div>
  )
}

function ProductPicker({ onClose, onPick }: { onClose: () => void; onPick: (p: string, c: string) => void }) {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [busy, setBusy] = useState(false)
  // Obsolete parts are out of scope by default — they're the bulk of the
  // history and would bury current work in the results.
  const [includeObsolete, setIncludeObsolete] = useState(false)

  useEffect(() => {
    if (q.trim().length < 2) { setRows([]); return }
    const t = setTimeout(async () => {
      setBusy(true)
      try {
        const p = new URLSearchParams({ q: q.trim() })
        if (includeObsolete) p.set('includeObsolete', '1')
        const res = await fetch(getApiUrl(`/api/ehs/product-compliance/search?${p.toString()}`))
        const r = await res.json()
        setRows(r.rows || [])
      } catch { /* leave the list as-is */ }
      setBusy(false)
    }, 300)
    return () => clearTimeout(t)
  }, [q, includeObsolete])

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Assess a product</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} autoFocus
              placeholder="Production or sales part number…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap"
            title="Obsolete parts are excluded unless you ask for them">
            <input type="checkbox" checked={includeObsolete}
              onChange={e => setIncludeObsolete(e.target.checked)} />
            Include obsolete
          </label>
        </div>

        <div className="max-h-80 overflow-auto border border-slate-200 rounded-lg">
          {busy ? (
            <p className="text-sm text-slate-400 p-3">Searching…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-400 p-3">
              {q.trim().length < 2 ? 'Type at least two characters.' : 'No matching products.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-40">Prod Part #</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-40">Sales Part #</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Customer</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-36">Program</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} onClick={() => onPick(r.prod_part, r.sales_part)}
                    className="border-t border-slate-100 hover:bg-blue-50 cursor-pointer">
                    <td className="px-3 py-1.5 font-mono text-slate-800">{r.prod_part}</td>
                    <td className="px-3 py-1.5 font-mono text-slate-600">
                      {r.sales_part || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 truncate max-w-[240px]">{r.customer_name}</td>
                    <td className="px-3 py-1.5 text-slate-600">
                      {r.program || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        r.status === 'OBSOLETE' ? 'bg-slate-200 text-slate-600'
                        : r.status === 'Released' ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {rows.length >= 100 && (
          <p className="text-xs text-slate-400 mt-2">
            Showing the first 100 matches — narrow the search to see more.
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------- Product detail (rail on the RIGHT) ----------------
function ProductDetailView({ apcPart, customerPart, canEdit, onSaved }:
  { apcPart: string; customerPart: string; canEdit: boolean; onSaved: () => void }) {
  const [tab, setTab] = useState<'compliance' | 'bom' | 'route' | 'history'>('compliance')
  const [data, setData] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/ehs/product-compliance/product?part=${encodeURIComponent(apcPart)}`))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load')
      setData(r)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [apcPart])
  useEffect(() => { load() }, [load])

  const RAIL = [
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'bom', label: 'BOM', icon: Layers },
    { id: 'route', label: 'Route', icon: RouteIcon },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ] as const

  if (loading) return <div className="text-slate-500 py-8 flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
  if (error) return <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
  if (!data) return null

  const custPart = data.customer_part || customerPart

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 font-mono flex items-center gap-2">
          {apcPart}
          <span className={`text-xs px-1.5 py-0.5 rounded font-sans font-normal ${data.part_type === 'ASM' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>
            {data.part_type}
          </span>
        </h2>
        <p className="text-sm text-slate-600">
          {data.purchased_count} unique purchased materials
          {data.manufactured_count ? <> · {data.manufactured_count} sub-assemblies expanded</> : null}
          {' '}· {data.bom_total} BOM nodes
          {custPart && <span className="text-slate-400"> · customer {custPart}</span>}
        </p>
      </div>

      {/* Content left, rail right */}
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
          {tab === 'compliance' && (
            <ComplianceTab data={data} apcPart={apcPart} customerPart={custPart}
              canEdit={canEdit} onSaved={() => { load(); onSaved() }} />
          )}
          {tab === 'bom' && <BomTab bom={data.bom || []} materials={data.materials} />}
          {tab === 'route' && <RouteTab route={data.route} />}
          {tab === 'history' && <HistoryTab history={data.history} />}
        </div>
      </div>
    </div>
  )
}

function ComplianceTab({ data, apcPart, customerPart, canEdit, onSaved }:
  { data: ProductDetail; apcPart: string; customerPart: string; canEdit: boolean; onSaved: () => void }) {
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [confirming, setConfirming] = useState(false)

  const rollup = useMemo(() => rollUpAll(data.materials), [data.materials])
  const unassigned = data.materials.filter(m => !m.family_name)
  const perPart = data.materials.filter(m => m.per_part_evidence)

  const save = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      const res = await fetch(getApiUrl('/api/ehs/product-compliance'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apc_part: apcPart, customer_part: customerPart,
          reach_status: rollup.reach, rohs_status: rollup.rohs, prop65_status: rollup.prop65,
          materials: data.materials, notes,
        }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to save')
      setMsg(`Signed off by ${r.assessed_by}`); setConfirming(false); setNotes('')
      onSaved()
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Compliance</h3>
      {err && <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{err}</div>}
      {msg && <div className="p-3 mb-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{msg}</div>}

      <div className="grid grid-cols-3 gap-3 mb-4">
        {([['REACH', rollup.reach], ['RoHS', rollup.rohs], ['Prop 65', rollup.prop65]] as const).map(([label, v]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">{label}</div>
            <div className={`inline-block px-3 py-1 rounded-lg text-lg font-bold ${verdictBadge(v)}`}>{v}</div>
          </div>
        ))}
      </div>

      {(unassigned.length > 0 || perPart.length > 0) && (
        <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            {unassigned.length > 0 && <>{unassigned.length} material{unassigned.length === 1 ? '' : 's'} not in any family. </>}
            {perPart.length > 0 && <>{perPart.length} in a family that needs per-part evidence. </>}
            A category only passes when every material clears it.
          </span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[340px] mb-4">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Material</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Family</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">REACH</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">RoHS</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Prop 65</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-slate-600 w-16">OK</th>
            </tr>
          </thead>
          <tbody>
            {data.materials.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400 text-sm">
                No purchased materials found on this BOM.
              </td></tr>
            ) : data.materials.map((m, i) => {
              const ok = (['reach', 'rohs', 'prop65'] as const).every(c => materialPasses(m, c))
              return (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-1.5">
                    <div className="font-mono text-slate-800">{m.part_number}</div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">{m.description}</div>
                  </td>
                  <td className="px-3 py-1.5">
                    {m.family_name
                      ? <span className="text-slate-700">{m.family_name}</span>
                      : <span className="text-amber-600 text-xs">unassigned</span>}
                    {m.per_part_evidence && (
                      <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-700">per part</span>
                    )}
                  </td>
                  {[m.reach_status, m.rohs_status, m.prop65_status].map((v, j) => (
                    <td key={j} className="px-3 py-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge(v)}`}>{v || '—'}</span>
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-center">
                    {ok ? <CheckCircle2 size={15} className="text-green-600 mx-auto" />
                        : <AlertTriangle size={14} className="text-amber-500 mx-auto" />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <label className="block text-xs font-medium text-slate-500 mb-1">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Anything worth recording about this assessment."
            className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg mb-2 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          {!confirming ? (
            <button onClick={() => setConfirming(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
              <Save size={14} /> Save record
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-700">
                Record that on today’s date the evidence supports
                <strong> REACH {rollup.reach} · RoHS {rollup.rohs} · Prop 65 {rollup.prop65}</strong>?
              </span>
              <button onClick={save} disabled={busy}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {busy ? 'Saving…' : 'OK, sign off'}
              </button>
              <button onClick={() => setConfirming(false)}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BomTab({ bom, materials }: { bom: BomNode[]; materials: MaterialLine[] }) {
  const [filter, setFilter] = useState('')
  const [purchasedOnly, setPurchasedOnly] = useState(true)

  // Family lookup, so purchased rows can show where they landed.
  const familyOf = new Map(materials.map(m => [m.part_number.toUpperCase(), m]))

  const rows = (bom.length ? bom : materials.map(m => ({
    part_number: m.part_number, description: m.description, manufacturer: m.manufacturer,
    pm: 'P', level: 1, quantity: m.quantity ?? null, parent_part: '',
  }))) as BomNode[]

  const shown = rows
    .filter(r => !purchasedOnly || r.pm === 'P')
    .filter(r => !filter.trim() ||
      `${r.part_number} ${r.description} ${r.manufacturer}`.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">BOM</h3>
          <p className="text-xs text-slate-500">
            Fully expanded through every sub-assembly · {shown.length} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-slate-600"
            title="Uncheck to see the manufactured sub-assemblies as well">
            <input type="checkbox" checked={purchasedOnly}
              onChange={e => setPurchasedOnly(e.target.checked)} />
            Purchased only
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[460px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Part Number</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Description</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Manufacturer</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-16">Lvl</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-44">Family</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400 text-sm">No materials.</td></tr>
            ) : shown.map((r, i) => {
              const m = familyOf.get(r.part_number.toUpperCase())
              const manufactured = r.pm === 'M'
              return (
                <tr key={`${r.part_number}-${i}`} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-1.5">
                    <span className="flex items-center gap-1.5">
                      {manufactured
                        ? <Layers size={13} className="text-purple-500 shrink-0"
                            aria-label="Manufactured sub-assembly" />
                        : <Package size={13} className="text-cyan-600 shrink-0"
                            aria-label="Purchased material" />}
                      <span className={`font-mono ${manufactured ? 'text-purple-700' : 'text-slate-800'}`}>
                        {r.part_number}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-slate-600">{r.description}</td>
                  <td className="px-3 py-1.5 text-slate-600">{r.manufacturer}</td>
                  <td className="px-3 py-1.5 text-slate-400 text-xs tabular-nums">{r.level}</td>
                  <td className="px-3 py-1.5">
                    {manufactured
                      ? <span className="text-xs text-slate-400">sub-assembly</span>
                      : m?.family_name
                        ? <span className="text-slate-700">{m.family_name}</span>
                        : <span className="text-amber-600 text-xs">unassigned</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RouteTab({ route }: { route: any[] }) {
  const params = (r: any) => [r.PARAMETER_1, r.PARAMETER_2, r.PARAMETER_3, r.PARAMETER_4, r.PARAMETER_5]
    .map(v => (v === null || v === undefined ? '' : String(v).trim())).filter(Boolean)
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-3">Route</h3>
      {!route.length ? (
        <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">
          No released route found for this part.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-16">Step</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-32">Dept</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Department</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Instructions / Parameters</th>
              </tr>
            </thead>
            <tbody>
              {route.map((r, i) => {
                const inst = [r.INST_1, r.INST_2].filter(Boolean)
                const pnames = [r.PARAM_1, r.PARAM_2].filter(Boolean)
                const pvals = params(r)
                return (
                  <tr key={i} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-1.5 tabular-nums text-slate-700">{r.STEP_NUMBER}</td>
                    <td className="px-3 py-1.5 font-mono text-slate-800">{r.DEPT_CODE}</td>
                    <td className="px-3 py-1.5 text-slate-600">{r.DEPT_NAME}</td>
                    <td className="px-3 py-1.5 text-slate-600">
                      {inst.map((t: string, j: number) => <div key={j} className="text-xs">{t}</div>)}
                      {pnames.length > 0 && (
                        <div className="text-xs text-slate-500 mt-0.5">{pnames.join(' · ')}</div>
                      )}
                      {pvals.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">{pvals.join(' | ')}</div>
                      )}
                      {!inst.length && !pnames.length && !pvals.length && <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function HistoryTab({ history }: { history: Assessment[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-3">History</h3>
      {!history.length ? (
        <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">
          No signoffs recorded for this product yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-32">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-32">Signed by</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-24">REACH</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-24">RoHS</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-24">Prop 65</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-28">Materials</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 text-slate-700">{fmtDate(h.assessed_at)}</td>
                  <td className="px-3 py-1.5 text-slate-700">{h.assessed_by}</td>
                  {[h.reach_status, h.rohs_status, h.prop65_status].map((v, i) => (
                    <td key={i} className="px-3 py-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${verdictBadge(v)}`}>{v}</span>
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-slate-500 text-xs">
                    {h.covered_count}/{h.material_count} in a family
                  </td>
                  <td className="px-3 py-1.5 text-slate-500 text-xs">{h.notes || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
