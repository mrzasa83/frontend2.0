'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import { Filter, RefreshCw, AlertTriangle, FileSpreadsheet, TrendingUp, BarChart3 } from 'lucide-react'

// Amphenol navy blue to match the PPTX style
const BAR_COLOR = '#1a2e5a'
const LINE_COLOR = '#6b7b8d'
const PARETO_LINE_COLOR = '#1a2e5a'

type ScrapResponse = {
  success: boolean
  files: { summary: string; detail: string }
  totalDetailRecords: number
  totalScrapPnls: number
  disciplines: string[]
  manufLevels: string[]
  runChartData: { month: string; scrapPnls: number; throughputPnls: number; yieldPct: number }[]
  paretoData: { description: string; code: string; panels: number; cumulativePct: number; value: number }[]
}

function formatMonth(ym: string): string {
  if (!ym || ym.length < 7) return ym
  const [y, m] = ym.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(m) - 1]} '${y.slice(2)}`
}

// ─── Run Chart (Slide 9) ─────────────────────────────────────────
// Bars = Scrapped PNLs (left axis), Line = Yield % (right axis)
function RunChart({ data, title }: { data: ScrapResponse['runChartData']; title: string }) {
  if (data.length === 0) return null

  const maxScrap = Math.max(...data.map(d => d.scrapPnls))
  // Round up to nice number
  const yMax = Math.ceil(maxScrap / 200) * 200 || 200

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-blue-700" />
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={data} margin={{ top: 10, right: 60, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#475569' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          {/* Left axis: Scrapped Panels */}
          <YAxis
            yAxisId="left"
            domain={[0, yMax]}
            tick={{ fontSize: 11, fill: '#475569' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          {/* Right axis: Yield % */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[70, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11, fill: '#475569' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-semibold text-slate-800 mb-1">{label}</p>
                  {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color }}>
                      {p.name}: {p.name === 'Yield %'
                        ? `${p.value.toFixed(1)}%`
                        : `${p.value.toFixed(1)} panels`}
                    </p>
                  ))}
                </div>
              )
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="rect"
          />
          <Bar
            yAxisId="left"
            dataKey="scrapPnls"
            name="Scrapped Panels"
            fill={BAR_COLOR}
            radius={[2, 2, 0, 0]}
            barSize={40}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="yieldPct"
            name="Yield %"
            stroke={LINE_COLOR}
            strokeWidth={2.5}
            dot={{ r: 4, fill: LINE_COLOR }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Pareto Chart (Slide 12) ─────────────────────────────────────
// Bars = Panels Scrapped desc, Line = Cumulative % of Scrap
function ParetoChart({ data, title }: { data: ScrapResponse['paretoData']; title: string }) {
  if (data.length === 0) return null

  // Top 15 + Other
  const top = data.slice(0, 15)
  const otherPanels = data.slice(15).reduce((s, d) => s + d.panels, 0)
  const grandTotal = data.reduce((s, d) => s + d.panels, 0)

  let chartData = top.map(d => ({
    name: d.description.length > 35 ? d.description.slice(0, 32) + '...' : d.description,
    fullName: d.description,
    code: d.code,
    panels: d.panels,
    cumulativePct: d.cumulativePct,
  }))

  if (otherPanels > 0) {
    chartData.push({
      name: 'All Other',
      fullName: `${data.length - 15} other defect types`,
      code: '',
      panels: Math.round(otherPanels * 100) / 100,
      cumulativePct: 100,
    })
  }

  // Left axis max = grand total (so cum % line starts at top of first bar)
  const yLeftMax = Math.ceil(grandTotal)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-blue-700" />
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <span className="text-xs text-slate-500 ml-2">
          ({data.length} defect types, {grandTotal.toFixed(1)} total panels)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: '#475569' }}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={100}
            tickLine={false}
          />
          {/* Left axis: panels (max = grand total for pareto alignment) */}
          <YAxis
            yAxisId="left"
            domain={[0, yLeftMax]}
            tick={{ fontSize: 11, fill: '#475569' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          {/* Right axis: cumulative % */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11, fill: '#475569' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              return (
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm max-w-sm">
                  <p className="font-semibold text-slate-800">{d?.fullName}</p>
                  {d?.code && <p className="text-xs text-slate-500">{d.code}</p>}
                  <p className="text-slate-700 mt-1">Panels: {d?.panels?.toFixed(2)}</p>
                  <p className="text-slate-700">Cumulative: {d?.cumulativePct?.toFixed(2)}%</p>
                </div>
              )
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="rect" />
          <Bar
            yAxisId="left"
            dataKey="panels"
            name="Panels Scrapped"
            fill={BAR_COLOR}
            radius={[2, 2, 0, 0]}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={i < 15 ? BAR_COLOR : '#94a3b8'} />
            ))}
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePct"
            name="Cumulative % of Scrap"
            stroke={PARETO_LINE_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: '#fff', stroke: PARETO_LINE_COLOR, strokeWidth: 2 }}
            label={({ x, y, value }: any) => (
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                fontSize={9}
                fill="#475569"
              >
                {value?.toFixed(1)}%
              </text>
            )}
          />
          <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.4} label="" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ScrapChartsPage() {
  const [data, setData] = useState<ScrapResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedDiscipline, setSelectedDiscipline] = useState('')
  const [selectedManufLevel, setSelectedManufLevel] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(getApiUrl('/api/process/scrap-data'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discipline: selectedDiscipline || undefined,
          manufLevel: selectedManufLevel || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || 'Failed to fetch')
      }
      setData(await res.json())
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scrap data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const runChartTitle = selectedDiscipline
    ? `Scrapped Panels by Month — ${selectedDiscipline}`
    : 'Scrapped Panels by Month — All Disciplines'

  const paretoTitle = selectedDiscipline
    ? `Defect Pareto — ${selectedDiscipline}`
    : 'Defect Pareto — All Disciplines'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Scrap Run Charts</h1>
        <p className="text-sm text-slate-600 mt-1">
          Panels rejected by discipline with yield trend and defect pareto analysis
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Discipline</label>
            <div className="relative">
              <Filter size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <select
                value={selectedDiscipline}
                onChange={e => setSelectedDiscipline(e.target.value)}
                className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white min-w-[180px]"
              >
                <option value="">All Disciplines</option>
                {data?.disciplines.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Manuf Level</label>
            <select
              value={selectedManufLevel}
              onChange={e => setSelectedManufLevel(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white min-w-[160px]"
            >
              <option value="">All Levels</option>
              {data?.manufLevels.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>

        {/* File info */}
        {data?.files && (
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <FileSpreadsheet size={14} />
            <span>Summary: {data.files.summary}</span>
            <span>|</span>
            <span>Detail: {data.files.detail}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Months</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{data.runChartData.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Scrap Transactions</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{data.totalDetailRecords.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Panels Scrapped</p>
            <p className="text-xl font-bold text-red-600 mt-1">{data.totalScrapPnls.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Defect Types</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{data.paretoData.length}</p>
          </div>
        </div>
      )}

      {/* Run Chart (Slide 9) */}
      {data && <RunChart data={data.runChartData} title={runChartTitle} />}

      {/* Pareto (Slide 12) */}
      {data && <ParetoChart data={data.paretoData} title={paretoTitle} />}

      {/* Loading state */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-blue-700 mr-3" />
          <span className="text-slate-600">Reading yield files from network share...</span>
        </div>
      )}

      {/* Empty state */}
      {data && data.totalDetailRecords === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <AlertTriangle size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600">No scrap data found for the selected filters.</p>
          <p className="text-sm text-slate-500 mt-1">
            Check that Net Yield files exist at J:\APC EngJobs\_admin\yield\
          </p>
        </div>
      )}
    </div>
  )
}
