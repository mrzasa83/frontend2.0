'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Clock, Download } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Row = Record<string, any>

// Column definitions: key must match the SQL alias. label is the header.
const COLUMNS: { key: string; label: string; num?: boolean; date?: boolean }[] = [
  { key: 'ABBR_NAME', label: 'Customer' },
  { key: 'CUSTOMER_PART_NUMBER', label: 'Cust Part #' },
  { key: 'SALES_ORDER', label: 'Sales Order' },
  { key: 'WORK_ORDER', label: 'Work Order' },
  { key: 'PTY', label: 'Pty' },
  { key: 'INV_PART_NUMBER', label: 'Inv Part #' },
  { key: 'INV_PART_DESCRIPTION', label: 'Description' },
  { key: 'SCHED', label: 'Sched', num: true },
  { key: 'BKLG', label: 'Bklg', num: true },
  { key: 'PNLS', label: 'Pnls', num: true },
  { key: 'NRUP', label: 'NrUp', num: true },
  { key: 'STEP', label: 'Step' },
  { key: 'CURRENT_STEP_OF_STEPS', label: 'Step Of' },
  { key: 'LOCATION', label: 'Location' },
  { key: 'YEILD', label: 'Yield' },
  { key: 'DATE_IN', label: 'Date In', date: true },
  { key: 'SCH_COMP', label: 'Sch Comp', date: true },
  { key: 'PROD_CODE', label: 'Prod Code' },
  { key: 'PROD_LINE', label: 'Prod Line' },
  { key: 'WAREHOUSE_CODE', label: 'Whse' },
  { key: 'NAME', label: 'Whse Name' },
  { key: 'ANALYSIS_CODE_3', label: 'Anlys 3' },
  { key: 'ANALYSIS_CODE_5', label: 'Anlys 5' },
  { key: 'FLBDTK', label: 'Flbdtk' },
  { key: 'CIRC_SIZE', label: 'Circ Size' },
  { key: 'PNL_SIZE', label: 'Pnl Size' },
  { key: 'MATERIAL', label: 'Material' },
  { key: 'PROD_LEAD_TIME', label: 'Lead', num: true },
  { key: 'CALC_START_DATE', label: 'Calc Start', date: true },
  { key: 'RMA_NUMBER', label: 'RMA' },
  { key: 'DAYS_IN', label: 'Days In', num: true },
  { key: 'PERCENT_COMPLETE', label: '% Comp', num: true },
  { key: 'DEPT_CODE', label: 'Dept' },
  { key: 'DEPT_NAME', label: 'Dept Name' },
  { key: 'STEP_DEPT_CODE', label: 'Step Dept' },
  { key: 'STEP_DEPT_NAME', label: 'Step Dept Name' },
  { key: 'REMAINING_LABOR_HOURS', label: 'Rem Hrs', num: true },
]

function fmtDate(v: any): string {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(undefined, { year: '2-digit', month: 'numeric', day: 'numeric' })
}

export default function DailyPlanPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ms, setMs] = useState<number | null>(null)
  const [fetchedAt, setFetchedAt] = useState('')

  const [globalFilter, setGlobalFilter] = useState('')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const [laborHours, setLaborHours] = useState<Record<string, number>>({})
  const [laborLoading, setLaborLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(''); setLaborHours({})
    try {
      const res = await fetch(getApiUrl('/api/operations/daily-plan'))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed to load')
      const r = await res.json()
      setRows(r.rows || [])
      setMs(r.ms ?? null)
      setFetchedAt(r.fetchedAt || '')
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Filtering
  const filtered = useMemo(() => {
    const g = globalFilter.trim().toLowerCase()
    const active = Object.entries(colFilters).filter(([, v]) => v.trim())
    return rows.filter(row => {
      if (g) {
        const hit = COLUMNS.some(c => String(row[c.key] ?? '').toLowerCase().includes(g))
        if (!hit) return false
      }
      for (const [key, val] of active) {
        if (!String(row[key] ?? '').toLowerCase().includes(val.trim().toLowerCase())) return false
      }
      return true
    })
  }, [rows, globalFilter, colFilters])

  // Sorting
  const sorted = useMemo(() => {
    if (!sort) return filtered
    const col = COLUMNS.find(c => c.key === sort.key)
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (col?.num) return (Number(av) - Number(bv)) * dir
      if (col?.date) return (new Date(av).getTime() - new Date(bv).getTime()) * dir
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
    })
  }, [filtered, sort])

  const toggleSort = (key: string) =>
    setSort(s => s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' })

  // Lazy labor hours for the currently filtered set
  const loadLaborHours = async () => {
    const wos = [...new Set(sorted.map(r => String(r.WORK_ORDER ?? '').trim()).filter(Boolean))]
    if (!wos.length) return
    setLaborLoading(true)
    try {
      const res = await fetch(getApiUrl('/api/operations/daily-plan'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrders: wos }),
      })
      if (res.ok) setLaborHours((await res.json()).hours || {})
    } catch { /* best-effort */ }
    setLaborLoading(false)
  }

  const exportCsv = () => {
    const header = COLUMNS.map(c => c.label).join(',')
    const lines = sorted.map(row => COLUMNS.map(c => {
      let v = c.key === 'REMAINING_LABOR_HOURS' ? (laborHours[String(row.WORK_ORDER ?? '').trim()] ?? '') : row[c.key]
      if (c.date) v = fmtDate(v)
      const s = String(v ?? '').replace(/"/g, '""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    }).join(','))
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `daily-plan-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const cell = (row: Row, c: typeof COLUMNS[number]) => {
    if (c.key === 'REMAINING_LABOR_HOURS') {
      const h = laborHours[String(row.WORK_ORDER ?? '').trim()]
      return h == null ? <span className="text-slate-300">—</span> : h
    }
    if (c.date) return fmtDate(row[c.key])
    return row[c.key] ?? ''
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daily Plan</h1>
          <p className="text-sm text-slate-600">
            Active work orders (Paradigm)
            {ms != null && <span className="text-slate-400"> · {(ms / 1000).toFixed(1)}s</span>}
            {fetchedAt && <span className="text-slate-400"> · {new Date(fetchedAt).toLocaleTimeString()}</span>}
            {!loading && <span className="text-slate-400"> · {sorted.length} of {rows.length} rows</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search all columns..."
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-60 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={loadLaborHours} disabled={laborLoading || loading || !rows.length}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50"
            title="Fetch remaining labor hours for the filtered rows (slower query)">
            <Clock size={14} className={laborLoading ? 'animate-spin' : ''} /> Labor hrs
          </button>
          <button onClick={exportCsv} disabled={!sorted.length}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
            <Download size={14} /> CSV
          </button>
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-3 my-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 py-16 justify-center text-slate-500">
          <RefreshCw size={20} className="animate-spin" /> Loading Daily Plan… (this can take a moment)
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-8">No active work orders returned.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-auto" style={{ maxHeight: 'calc(100vh - 190px)' }}>
          <table className="text-xs whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {COLUMNS.map(c => {
                  const active = sort?.key === c.key
                  return (
                    <th key={c.key} className="px-2 py-2 text-left font-medium text-slate-600 border-b border-slate-200">
                      <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-slate-900">
                        {c.label}
                        {active ? (sort!.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={10} className="text-slate-300" />}
                      </button>
                    </th>
                  )
                })}
              </tr>
              <tr>
                {COLUMNS.map(c => (
                  <th key={c.key} className="px-1 py-1 bg-white border-b border-slate-200">
                    <input value={colFilters[c.key] || ''} onChange={e => setColFilters(f => ({ ...f, [c.key]: e.target.value }))}
                      placeholder="filter"
                      className="w-full min-w-[60px] text-xs font-normal border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={`${row.WORK_ORDER}-${i}`} className="hover:bg-slate-50 border-b border-slate-100">
                  {COLUMNS.map(c => (
                    <td key={c.key} className={`px-2 py-1 ${c.num ? 'text-right tabular-nums' : ''} text-slate-700`}>
                      {cell(row, c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
