'use client'

import { useState, useMemo, useRef } from 'react'
import {
  ScatterChart, Scatter, LineChart, Line, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { Upload, Download, RefreshCw, FileSpreadsheet, X } from 'lucide-react'
import {
  parseCmmSheet, computeStats, histogram, normalCurve, tpFrom,
  type FeatureRow,
} from '@/lib/process/drillRoutCpk'

type Meta = { part: string; machine: string; spindle: string; date: string }

const fmt = (v: number, d = 5) => (isFinite(v) ? v.toFixed(d) : '—')

export default function DrillRoutCpkPage() {
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<FeatureRow[]>([])
  const [error, setError] = useState('')
  const [warn, setWarn] = useState('')
  const [busy, setBusy] = useState(false)
  const [usl, setUsl] = useState(0.0014)
  const [lsl, setLsl] = useState(0)
  const [meta, setMeta] = useState<Meta>({ part: '', machine: '', spindle: '', date: '' })
  const [tab, setTab] = useState<'charts' | 'data'>('charts')
  const inputRef = useRef<HTMLInputElement>(null)

  // Re-derive TP whenever the convention changes (parse once, recompute cheaply).
  // TP is the vector of the X and Y location deviations: sqrt(dx^2 + dy^2).
  const view = useMemo(
    () => rows.map(r => ({ ...r, tp: tpFrom(r.xDelta, r.yDelta) })),
    [rows]
  )
  const stats = useMemo(() => (view.length ? computeStats(view, usl, lsl) : null), [view, usl, lsl])
  const bins = useMemo(() => (view.length ? histogram(view, 12, lsl, usl) : []), [view, lsl, usl])

  // Histogram bars and the fitted normal curve share one numeric axis.
  const histoData = useMemo(() => {
    if (!bins.length || !stats) return []
    const binWidth = bins[0].end - bins[0].start
    const from = bins[0].start
    const to = bins[bins.length - 1].end
    const curve = normalCurve(stats.mean, stats.sd, stats.n, binWidth, from, to, 80)
    const merged: { x: number; count?: number; curve?: number }[] =
      curve.map(c => ({ x: c.x, curve: c.curve }))
    for (const b of bins) merged.push({ x: b.mid, count: b.count })
    return merged.sort((a, b) => a.x - b.x)
  }, [bins, stats])

  const handleFile = async (file: File) => {
    setBusy(true); setError(''); setWarn(''); setRows([])
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      // Prefer a sheet that actually holds the CMM export.
      const names = wb.SheetNames
      const preferred = names.find(n => n.toLowerCase() === 'sheet1') || names[0]
      let res = parseCmmSheet(XLSX.utils.sheet_to_json(wb.Sheets[preferred], { header: 1 }) as any[][])
      if (!res.ok) {
        for (const n of names) {
          if (n === preferred) continue
          const alt = parseCmmSheet(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 }) as any[][])
          if (alt.ok) { res = alt; break }
        }
      }
      if (!res.ok) { setError(res.error || 'Could not read this file.'); setBusy(false); return }

      setRows(res.rows)
      setFileName(file.name)
      if (res.skipped) setWarn(`${res.skipped} feature${res.skipped === 1 ? '' : 's'} skipped — missing an X or Y row.`)
    } catch (e: any) {
      setError(e?.message || 'Failed to read the file.')
    }
    setBusy(false)
  }

  const reset = () => {
    setRows([]); setFileName(''); setError(''); setWarn('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const exportExcel = async () => {
    if (!view.length || !stats) return
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // Analysis sheet, mirroring the source workbook's layout.
    const analysis = view.map(r => ({
      Feature: r.feature,
      Tol: 'X', 'X Actual': r.xActual, 'X Nominal': r.xNominal,
      'Tol ': 'Y', 'Y Actual': r.yActual, 'Y Nominal': r.yNominal,
      'X Delta': r.xDelta, 'Y Delta': r.yDelta, TP: r.tp,
    }))
    const ws = XLSX.utils.json_to_sheet(analysis)
    ws['!cols'] = [{ wch: 12 }, { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Analysis')

    // Summary sheet with the run identification and the statistics.
    const summary = [
      ['Test Part', meta.part], ['Machine', meta.machine], ['Spindle', meta.spindle],
      ['Date Acquired', meta.date], ['Source File', fileName],
      [],
      ['n', stats.n], ['Mean TP', stats.mean], ['Std Dev', stats.sd],
      ['Min TP', stats.min], ['Max TP', stats.max], ['Range', stats.range],
      ['LSL', stats.lsl], ['USL', stats.usl],
      ['Cpk (min of Cpu/Cpl)', stats.cpk ?? ''], ['Cp', stats.cp ?? ''],
      ['Cpu (to USL)', stats.cpu ?? ''], ['Cpl (to LSL)', stats.cpl ?? ''],
      ['Sigma level', stats.sigmaLevel ?? ''],
      ['Out of spec', stats.outOfSpec], ['Below LSL', stats.belowLsl], ['Above USL', stats.aboveUsl],
      [], ['Mean X Delta', stats.meanX], ['Std Dev X', stats.sdX],
      ['Mean Y Delta', stats.meanY], ['Std Dev Y', stats.sdY],
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(summary)
    ws2['!cols'] = [{ wch: 22 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary')

    const slug = [meta.part, meta.machine, meta.spindle].filter(Boolean).join('_').replace(/[^\w.-]+/g, '-') || 'drill-rout-cpk'
    XLSX.writeFile(wb, `${slug}_cpk_${(meta.date || new Date().toISOString().slice(0, 10)).replace(/\//g, '-')}.xlsx`)
  }

  const scatterData = view.map(r => ({ x: r.xDelta, y: r.yDelta, feature: r.feature }))
  const runData = view.map((r, i) => ({ i: i + 1, feature: r.feature, X: r.xDelta, Y: r.yDelta, TP: r.tp }))

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800">Drill/Rout Cpk Calc</h1>
        <p className="text-sm text-slate-600">
          Upload a CMM export to compute true-position vectors and process capability.
        </p>
      </div>

      {/* ---- Run identification + file ---- */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Field label="Test Part" placeholder="24x36 ACC"
            value={meta.part} onChange={v => setMeta(m => ({ ...m, part: v }))} />
          <Field label="Machine" placeholder="HIT #28"
            value={meta.machine} onChange={v => setMeta(m => ({ ...m, machine: v }))} />
          <Field label="Spindle" placeholder="#1"
            value={meta.spindle} onChange={v => setMeta(m => ({ ...m, spindle: v }))} />
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date Acquired</label>
            <input type="date" value={meta.date} onChange={e => setMeta(m => ({ ...m, date: e.target.value }))}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">CMM file (.xlsx)</label>
            <input ref={inputRef} type="file" accept=".xlsx,.xls"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              className="block text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">LSL</label>
            <input type="number" step="0.0001" value={lsl}
              onChange={e => setLsl(Number(e.target.value) || 0)}
              className="w-28 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">USL</label>
            <input type="number" step="0.0001" value={usl}
              onChange={e => setUsl(Number(e.target.value) || 0)}
              className="w-28 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          {fileName && (
            <div className="flex items-center gap-2 text-sm text-slate-600 ml-auto">
              <FileSpreadsheet size={15} className="text-green-600" />
              <span className="truncate max-w-xs">{fileName}</span>
              <button onClick={reset} className="text-slate-400 hover:text-red-600" title="Clear"><X size={15} /></button>
            </div>
          )}
        </div>

      </div>

      {busy && <div className="text-sm text-slate-500 flex items-center gap-2 mb-4"><RefreshCw size={15} className="animate-spin" /> Reading file…</div>}
      {error && <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {warn && <div className="p-3 mb-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">{warn}</div>}

      {!rows.length && !busy && !error && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <Upload className="mx-auto text-slate-300 mb-3" size={36} />
          <p className="text-sm text-slate-500">
            Choose a CMM export above. Expected columns: Feature, Coef (or Tol), Actual, Nominal —
            with X and Y rows per feature.
          </p>
        </div>
      )}

      {rows.length > 0 && stats && (
        <>
          <div className="flex gap-1 border-b border-slate-200 mb-4">
            {([['charts', 'Charts'], ['data', 'Data']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                {label}
              </button>
            ))}
            <button onClick={exportExcel}
              className="ml-auto mb-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200">
              <Download size={14} /> Export Excel
            </button>
          </div>

          {tab === 'charts' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Charts column */}
              <div className="xl:col-span-2 space-y-4">
                <Panel title="Scatter — X vs Y deviation" subtitle="Each point is one feature’s deviation from nominal">
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" dataKey="x" name="X Delta" tick={{ fontSize: 11 }}
                        tickFormatter={v => v.toFixed(4)}
                        label={{ value: 'X Delta', position: 'insideBottom', offset: -15, fontSize: 12 }} />
                      <YAxis type="number" dataKey="y" name="Y Delta" tick={{ fontSize: 11 }}
                        tickFormatter={v => v.toFixed(4)}
                        label={{ value: 'Y Delta', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                      <ReferenceLine x={0} stroke="#94a3b8" />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Tooltip formatter={(v: any) => Number(v).toFixed(6)}
                        labelFormatter={() => ''}
                        content={({ payload }) => payload?.length ? (
                          <div className="bg-white border border-slate-200 rounded px-2 py-1 text-xs shadow">
                            <div className="font-medium">{payload[0].payload.feature}</div>
                            <div>X: {payload[0].payload.x.toFixed(6)}</div>
                            <div>Y: {payload[0].payload.y.toFixed(6)}</div>
                          </div>
                        ) : null} />
                      <Scatter data={scatterData} fill="#2563eb" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Panel>

                <Panel title="Run chart — X and Y deviation" subtitle="Feature order across the panel">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={runData} margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="i" tick={{ fontSize: 11 }}
                        label={{ value: 'Feature #', position: 'insideBottom', offset: -12, fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(4)} />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Tooltip formatter={(v: any) => Number(v).toFixed(6)}
                        labelFormatter={(l: any) => `Feature ${l}`} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="X" stroke="#2563eb" dot={{ r: 2 }} strokeWidth={1.5} />
                      <Line type="monotone" dataKey="Y" stroke="#f97316" dot={{ r: 2 }} strokeWidth={1.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </Panel>

                <Panel title="Histogram — true position (TP)"
                  subtitle={`Distribution with a fitted normal curve, against LSL ${lsl} and USL ${usl}`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={histoData} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" dataKey="x" domain={['dataMin', 'dataMax']}
                        tick={{ fontSize: 10 }} tickFormatter={(v: number) => v.toFixed(4)}
                        label={{ value: 'True position', position: 'insideBottom', offset: -15, fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }}
                        label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                      <Tooltip
                        content={({ payload, label }) => {
                          if (!payload?.length) return null
                          const bar = payload.find(p => p.dataKey === 'count')
                          const cur = payload.find(p => p.dataKey === 'curve')
                          return (
                            <div className="bg-white border border-slate-200 rounded px-2 py-1 text-xs shadow">
                              <div className="font-medium">TP {Number(label).toFixed(5)}</div>
                              {bar && <div>count: {bar.value as number}</div>}
                              {cur && <div className="text-slate-500">expected: {Number(cur.value).toFixed(2)}</div>}
                            </div>
                          )
                        }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="count" name="Measured" barSize={22}>
                        {histoData.map((d, i) => (
                          <Cell key={i} fill={(d.x > usl || d.x < lsl) ? '#dc2626' : '#2563eb'} />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="curve" name="Normal fit" stroke="#0f766e"
                        strokeWidth={2} dot={false} connectNulls />
                      <ReferenceLine x={lsl} stroke="#dc2626" strokeDasharray="4 3"
                        label={{ value: 'LSL', fill: '#dc2626', fontSize: 11, position: 'top' }} />
                      <ReferenceLine x={usl} stroke="#dc2626" strokeDasharray="4 3"
                        label={{ value: 'USL', fill: '#dc2626', fontSize: 11, position: 'top' }} />
                      {stats && <ReferenceLine x={stats.mean} stroke="#64748b" strokeDasharray="2 2"
                        label={{ value: 'x̄', fill: '#64748b', fontSize: 11, position: 'top' }} />}
                    </ComposedChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-slate-500 mt-1">
                    The curve is a normal distribution fitted to the measured mean and standard deviation —
                    it shows how much of the predicted spread falls inside the spec limits.
                  </p>
                </Panel>
              </div>

              {/* Stats column */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-800 mb-1">Capability</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {meta.part || 'Part —'} · {meta.machine || 'Machine —'} · {meta.spindle || 'Spindle —'}
                    {meta.date ? ` · ${meta.date}` : ''}
                  </p>
                  <div className="text-center py-3 border-y border-slate-100 mb-3">
                    <div className="text-4xl font-bold tabular-nums text-slate-800">
                      {stats.cpk !== null ? stats.cpk.toFixed(2) : '—'}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-slate-400 mt-1">
                      Cpk = min(Cpu, Cpl)
                    </div>
                  </div>
                  <dl className="space-y-1.5 text-sm">
                    <Stat label="n" value={String(stats.n)} />
                    <Stat label="Mean TP" value={fmt(stats.mean, 6)} />
                    <Stat label="Std Dev" value={fmt(stats.sd, 6)} />
                    <Stat label="Min TP" value={fmt(stats.min, 6)} />
                    <Stat label="Max TP" value={fmt(stats.max, 6)} />
                    <Stat label="Range" value={fmt(stats.range, 6)} />
                    <Stat label="LSL" value={String(stats.lsl)} />
                    <Stat label="USL" value={String(stats.usl)} />
                    <Stat label="Cp" value={stats.cp !== null ? stats.cp.toFixed(2) : '—'} />
                    <Stat label="Cpu (to USL)" value={stats.cpu !== null ? stats.cpu.toFixed(2) : '—'} />
                    <Stat label="Cpl (to LSL)" value={stats.cpl !== null ? stats.cpl.toFixed(2) : '—'} />
                    <Stat label="Sigma level" value={stats.sigmaLevel !== null ? stats.sigmaLevel.toFixed(2) : '—'} />
                    <Stat label="Out of spec" value={String(stats.outOfSpec)}
                      danger={stats.outOfSpec > 0} />
                  </dl>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-800 mb-3">Axis detail</h3>
                  <dl className="space-y-1.5 text-sm">
                    <Stat label="Mean X Delta" value={fmt(stats.meanX, 6)} />
                    <Stat label="Std Dev X" value={fmt(stats.sdX, 6)} />
                    <Stat label="Mean Y Delta" value={fmt(stats.meanY, 6)} />
                    <Stat label="Std Dev Y" value={fmt(stats.sdY, 6)} />
                  </dl>
                  <p className="text-xs text-slate-400 mt-3">
                    A non-zero mean on either axis points to an offset rather than random spread.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[calc(100vh-320px)]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {['Feature', 'X Actual', 'X Nominal', 'Y Actual', 'Y Nominal', 'X Delta', 'Y Delta', 'TP'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-slate-600 border-b border-slate-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-1.5 text-slate-700">{r.feature}</td>
                      <td className="px-3 py-1.5 tabular-nums text-slate-600">{r.xActual}</td>
                      <td className="px-3 py-1.5 tabular-nums text-slate-400">{r.xNominal}</td>
                      <td className="px-3 py-1.5 tabular-nums text-slate-600">{r.yActual}</td>
                      <td className="px-3 py-1.5 tabular-nums text-slate-400">{r.yNominal}</td>
                      <td className="px-3 py-1.5 tabular-nums text-slate-600">{fmt(r.xDelta, 6)}</td>
                      <td className="px-3 py-1.5 tabular-nums text-slate-600">{fmt(r.yDelta, 6)}</td>
                      <td className={`px-3 py-1.5 tabular-nums font-medium ${(r.tp > usl || r.tp < lsl) ? 'text-red-600' : 'text-slate-800'}`}>{fmt(r.tp, 6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
    </div>
  )
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mb-2">{subtitle}</p>}
      {children}
    </div>
  )
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular-nums font-medium ${danger ? 'text-red-600' : 'text-slate-800'}`}>{value}</dd>
    </div>
  )
}
