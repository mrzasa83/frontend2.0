'use client'

import { Fragment, useState, useEffect, useCallback, useMemo } from 'react'
import {
  RefreshCw, AlertTriangle, Download, ChevronRight, ChevronDown, Layers, Search,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Item = {
  part: string; code: string; desc: string; mfr: string
  thickness: number | null; copper: string; family: string
  kind: string; asNamed: string; sizeCheck: string
}
type Group = {
  code: string; kind: string; parts: number
  thinnest: number | null; thickest: number | null; items: Item[]
}
type Panel = {
  key: string; width: number; length: number; area: number
  parts: number; kinds: Record<string, number>; groups: Group[]
}
type Data = {
  kind: string
  panels: Panel[]
  widths: { width: number; panels: number; parts: number }[]
  summary: {
    panels: number; parts: number
    width: { min: number; max: number }
    length: { min: number; max: number }
    area: { min: number; max: number }
  }
}

const KIND_LABELS: Record<string, string> = {
  laminate: 'Laminate / core', prepreg: 'Prepreg', foil: 'Copper foil',
  'entry-backup': 'Entry / backup', 'other-panel': 'Other panel', 'non-panel': 'Not a panel',
}
const KIND_TONES: Record<string, string> = {
  laminate: 'bg-blue-100 text-blue-700', prepreg: 'bg-violet-100 text-violet-700',
  foil: 'bg-amber-100 text-amber-700', 'entry-backup': 'bg-teal-100 text-teal-700',
  'other-panel': 'bg-slate-100 text-slate-600', 'non-panel': 'bg-slate-50 text-slate-400',
}

const n2 = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '')
const thk = (t: number | null) => t == null ? '' : `.${String(Math.round(t * 10000)).padStart(4, '0')}`

export default function PanelsTab() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kind, setKind] = useState('pcb')
  const [width, setWidth] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set())
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/ehs/panels?kind=${encodeURIComponent(kind)}`))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load panels')
      setData(r)
      setWidth(null); setOpenPanels(new Set()); setOpenGroups(new Set())
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [kind])
  useEffect(() => { load() }, [load])

  // Selecting a width narrows the panel list to that width's lengths, which is
  // the question people actually have: "my machine takes 18 inches — what
  // lengths can I get?"
  const panels = useMemo(() => {
    let p = data?.panels || []
    if (width != null) p = p.filter(x => x.width === width)
    const needle = q.trim().toLowerCase()
    if (needle) {
      p = p.filter(x => x.key.includes(needle)
        || x.groups.some(g => g.code.toLowerCase().includes(needle)
          || g.items.some(i => i.part.toLowerCase().includes(needle)
            || i.desc.toLowerCase().includes(needle))))
    }
    return p
  }, [data, width, q])

  const shown = useMemo(() => ({
    panels: panels.length,
    parts: panels.reduce((n, p) => n + p.parts, 0),
  }), [panels])

  const toggle = (set: Set<string>, k: string, fn: (s: Set<string>) => void) => {
    const next = new Set(set)
    next.has(k) ? next.delete(k) : next.add(k)
    fn(next)
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    const sum = XLSX.utils.json_to_sheet(panels.map(p => ({
      'W x L': p.key, W: p.width, L: p.length, Area: p.area, Parts: p.parts,
      ...Object.fromEntries(Object.entries(KIND_LABELS)
        .map(([k, label]) => [label, p.kinds[k] || 0])),
    })))
    sum['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 8 },
      { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 13 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, sum, 'Panels')

    const flat: any[] = []
    for (const p of panels) for (const g of p.groups) for (const i of g.items) {
      flat.push({
        'W x L': p.key, W: p.width, L: p.length, Area: p.area,
        Grade: g.code, 'Material Code': i.code, Kind: KIND_LABELS[i.kind] || i.kind,
        'Part Number': i.part, Description: i.desc, Manufacturer: i.mfr,
        'Thickness (in)': i.thickness ?? '', 'Copper Code': i.copper,
        'As Named': i.asNamed, 'Size Check': i.sizeCheck, Family: i.family,
      })
    }
    const det = XLSX.utils.json_to_sheet(flat)
    det['!cols'] = [{ wch: 14 }, { wch: 7 }, { wch: 7 }, { wch: 10 }, { wch: 9 },
      { wch: 14 }, { wch: 15 }, { wch: 22 }, { wch: 42 }, { wch: 20 }, { wch: 13 },
      { wch: 12 }, { wch: 12 }, { wch: 11 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, det, 'Materials')

    XLSX.writeFile(wb, `panels_${kind}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (loading && !data) {
    return <div className="flex items-center gap-2 py-16 justify-center text-slate-500">
      <RefreshCw size={18} className="animate-spin" /> Building the panel census…
    </div>
  }
  if (error) {
    return <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" /><div>{error}</div>
    </div>
  }
  if (!data) return null

  const s = data.summary
  const tiles: [string, string, string][] = [
    ['Panels', String(s.panels), `${s.parts.toLocaleString()} parts`],
    ['Width', `${n2(s.width.min)}" – ${n2(s.width.max)}"`, 'narrow side'],
    ['Length', `${n2(s.length.min)}" – ${n2(s.length.max)}"`, 'long side'],
    ['Area', `${n2(s.area.min)} – ${n2(s.area.max)}`, 'square inches'],
  ]

  return (
    <div>
      {/* ── controls ── */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <select value={kind} onChange={e => setKind(e.target.value)}
            className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg bg-white">
            <option value="pcb">PCB materials</option>
            <option value="laminate">Laminate / core</option>
            <option value="prepreg">Prepreg</option>
            <option value="foil">Copper foil</option>
            <option value="entry-backup">Entry / backup</option>
            <option value="other-panel">Other panel material</option>
            <option value="all">Every panel material</option>
          </select>
          <div className="relative">
            <Search size={13} className="absolute left-2 top-2.5 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="panel, code or part"
              className="pl-7 pr-2 py-1.5 text-sm border border-slate-300 rounded-lg w-56" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} disabled={!panels.length}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
            <Download size={14} /> Excel
          </button>
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── min / max ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {tiles.map(([label, value, note]) => (
          <div key={label} className="border border-slate-200 rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
            <div className="text-lg font-semibold text-slate-800 tabular-nums">{value}</div>
            <div className="text-[11px] text-slate-500">{note}</div>
          </div>
        ))}
      </div>

      {/* ── width filter ── */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className="text-xs text-slate-500 mr-1">Width</span>
        <button onClick={() => setWidth(null)}
          className={`px-2 py-1 text-xs rounded-lg border ${width == null
            ? 'bg-slate-800 text-white border-slate-800'
            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
          All
        </button>
        {data.widths.map(w => (
          <button key={w.width} onClick={() => setWidth(width === w.width ? null : w.width)}
            title={`${w.panels} panel${w.panels === 1 ? '' : 's'}, ${w.parts} parts`}
            className={`px-2 py-1 text-xs rounded-lg border tabular-nums ${width === w.width
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
            {n2(w.width)}"
            <span className={width === w.width ? 'text-slate-300' : 'text-slate-400'}> ·{w.parts}</span>
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500 mb-2">
        {shown.panels} panel{shown.panels === 1 ? '' : 's'} ·{' '}
        {shown.parts.toLocaleString()} part{shown.parts === 1 ? '' : 's'}
        {width != null && <> · width {n2(width)}&quot;</>}
      </p>

      {/* ── the tree ── */}
      <div className="border border-slate-200 rounded-lg overflow-auto max-h-[calc(100vh-460px)]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="text-left text-slate-600">
              <th className="px-3 py-2 font-medium" style={{ width: 230 }}>W x L</th>
              <th className="px-3 py-2 font-medium text-right" style={{ width: 70 }}>W</th>
              <th className="px-3 py-2 font-medium text-right" style={{ width: 70 }}>L</th>
              <th className="px-3 py-2 font-medium text-right" style={{ width: 90 }}>Area</th>
              <th className="px-3 py-2 font-medium text-right" style={{ width: 80 }}>Parts</th>
              <th className="px-3 py-2 font-medium">Materials</th>
            </tr>
          </thead>
          <tbody>
            {panels.map(p => {
              const open = openPanels.has(p.key)
              return (
                <Fragment key={p.key}>
                  <tr className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggle(openPanels, p.key, setOpenPanels)}>
                    <td className="px-3 py-1.5 font-medium text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        {open ? <ChevronDown size={14} className="text-slate-400" />
                          : <ChevronRight size={14} className="text-slate-400" />}
                        {p.key}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{n2(p.width)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{n2(p.length)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{n2(p.area)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-800">{p.parts}</td>
                    <td className="px-3 py-1.5">
                      <span className="flex items-center gap-1 flex-wrap">
                        {Object.entries(p.kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
                          <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded ${KIND_TONES[k] || ''}`}>
                            {KIND_LABELS[k] || k} {n}
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>

                  {open && p.groups.map(g => {
                    const gk = `${p.key}|${g.code}`
                    const gopen = openGroups.has(gk)
                    return (
                      <Fragment key={gk}>
                        <tr className="bg-slate-50/60 hover:bg-slate-100 cursor-pointer"
                          onClick={() => toggle(openGroups, gk, setOpenGroups)}>
                          <td className="px-3 py-1 pl-9 text-slate-700" colSpan={2}>
                            <span className="inline-flex items-center gap-1">
                              {gopen ? <ChevronDown size={12} className="text-slate-400" />
                                : <ChevronRight size={12} className="text-slate-400" />}
                              <span className="font-mono text-xs">{g.code}</span>
                              <span className="text-[10px] text-slate-400">grade</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${KIND_TONES[g.kind] || ''}`}>
                                {KIND_LABELS[g.kind] || g.kind}
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-1 text-right text-xs text-slate-500 tabular-nums" colSpan={2}>
                            {g.thinnest != null && <>{thk(g.thinnest)}
                              {g.thickest !== g.thinnest && <>–{thk(g.thickest)}</>}</>}
                          </td>
                          <td className="px-3 py-1 text-right tabular-nums text-slate-600">{g.parts}</td>
                          <td className="px-3 py-1 text-xs text-slate-500 truncate">
                            {g.items[0]?.desc}
                          </td>
                        </tr>
                        {gopen && g.items.map(i => (
                          <tr key={`${gk}|${i.part}`} className="hover:bg-blue-50/40">
                            <td className="px-3 py-1 pl-16 font-mono text-xs text-blue-700">{i.part}</td>
                            <td className="px-3 py-1 text-right text-xs text-slate-500 tabular-nums" colSpan={2}>
                              {i.asNamed !== p.key && i.asNamed}
                              {i.sizeCheck === 'conflict' && (
                                <span className="ml-1 text-amber-600"
                                  title="Part number and description disagree about this panel">!</span>
                              )}
                            </td>
                            <td className="px-3 py-1 text-right text-xs text-slate-500 tabular-nums">
                              {thk(i.thickness)}
                            </td>
                            <td className="px-3 py-1 text-right text-xs text-slate-500">{i.copper}</td>
                            <td className="px-3 py-1 text-xs text-slate-600 truncate">
                              {i.desc}
                              {i.mfr && <span className="text-slate-400"> · {i.mfr}</span>}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    )
                  })}
                </Fragment>
              )
            })}
            {!panels.length && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                Nothing matches.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-2">
        Width is always the narrow side; grain direction is dropped, so 24 x 18 and
        18 x 24 are one panel. Expand a row for the materials, and again for the parts.
      </p>
    </div>
  )
}
