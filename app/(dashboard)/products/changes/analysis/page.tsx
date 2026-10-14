'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, Printer } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

/**
 * Product Changes -> Reason for Change Analysis.
 *
 * Opens in its own tab and is laid out to print: Ctrl-P gives the PDF, with
 * the controls and chrome hidden by the print rules at the bottom.
 *
 * The one editorial decision in here is that the ranking is SPLIT. Only four
 * of the twelve reasons describe an error, and the largest single reason is a
 * deliberate improvement — so a league table over the whole population would
 * read as blame for work that went right. Errors are ranked on their own, and
 * the rest is shown as what it is.
 */

const KIND_LABEL: Record<string, string> = {
  error: 'Errors', rework: 'Rework', change: 'Deliberate change',
  improvement: 'Process improvement', external: 'Customer-driven',
  unclassified: 'Other / unclassified', unrecorded: 'No reason recorded',
}
const KIND_TONE: Record<string, string> = {
  error: 'bg-red-100 text-red-700', rework: 'bg-amber-100 text-amber-800',
  change: 'bg-blue-100 text-blue-700', improvement: 'bg-green-100 text-green-700',
  external: 'bg-violet-100 text-violet-700',
  unclassified: 'bg-slate-100 text-slate-600', unrecorded: 'bg-slate-100 text-slate-500',
}

const pct = (n: number, d: number) => d ? `${(n / d * 100).toFixed(1)}%` : '—'
const fmtDate = (v: any) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()
}

export default function ChangeAnalysisPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [months, setMonths] = useState(12)

  const load = useCallback(async (m: number) => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/products/changes/analysis?months=${m}&timeoutMs=60000`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      setData(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(months) }, [load, months])

  if (loading && !data) {
    return <div className="flex items-center gap-2 py-24 justify-center text-slate-500">
      <RefreshCw size={18} className="animate-spin" /> Reading both databases…
    </div>
  }
  if (error && !data) {
    return <div className="p-8 max-w-3xl">
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <div className="min-w-0 break-words">{error}</div>
      </div>
    </div>
  }
  if (!data) return null

  const total = data.population.closedInWindow || 0
  const errorTotal = (data.kinds || [])
    .filter((k: any) => k.kind === 'error' || k.kind === 'rework')
    .reduce((n: number, k: any) => n + k.count, 0)

  return (
    <div className="p-8 max-w-5xl mx-auto print:p-0 print:max-w-none">
      {/* ── controls, print-hidden ── */}
      <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Window</label>
          <select value={months} onChange={e => setMonths(Number(e.target.value))}
            className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg bg-white">
            {[6, 12, 24, 36].map(m => <option key={m} value={m}>Last {m} months</option>)}
          </select>
          {loading && <RefreshCw size={14} className="animate-spin text-slate-400" />}
        </div>
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900">
          <Printer size={14} /> Print / Save as PDF
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 print:hidden">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 break-words">{error}</div>
        </div>
      )}

      {/* ── header ── */}
      <header className="mb-6 pb-4 border-b-2 border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900">Reason for Change Analysis</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Closed Manufacturing Change Notices, last {data.months} months, with
          poor-methodizing rejects on the same parts.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Amphenol Printed Circuits · generated {new Date(data.generatedAt).toLocaleString()}
        </p>
      </header>

      {/* ── population ── */}
      <section className="mb-7">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Closed MCNs', total.toLocaleString()],
            ['Errors & rework', `${errorTotal.toLocaleString()} · ${pct(errorTotal, total)}`],
            ['Poor-methodizing rejects',
              data.rejects.available ? `${data.rejects.transactions} · ${data.rejects.quantity.toLocaleString()} pcs` : 'unavailable'],
            ['Parts in both', String(data.overlap.length)],
          ].map(([label, value]) => (
            <div key={label} className="border border-slate-200 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
              <div className="text-lg font-semibold text-slate-900">{value}</div>
            </div>
          ))}
        </div>
        {!!data.population.excludedUnparseableDate && (
          <p className="mt-2 text-xs text-slate-500">
            {data.population.excludedUnparseableDate} closed records carry a close date that
            does not parse and are excluded from every figure here.
          </p>
        )}
      </section>

      {/* ── how to read it ── */}
      <section className="mb-7 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">How to read this</h2>
        <p className="text-sm text-slate-700">
          Most changes are not mistakes. Of {total.toLocaleString()} closed notices,{' '}
          <b>{errorTotal.toLocaleString()} ({pct(errorTotal, total)})</b> record an error or
          rework; the rest are improvements, deliberate changes or customer requests. Team
          attribution below covers <em>only</em> the error and rework reasons — ranking every
          reason together would read as blame for work that went right.
        </p>
      </section>

      {/* ── what kind of change ── */}
      <section className="mb-7 break-inside-avoid">
        <h2 className="text-base font-semibold text-slate-900 mb-2">What kind of change</h2>
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-3 py-2">Kind</th><th className="px-3 py-2 text-right">Notices</th>
              <th className="px-3 py-2 text-right">Share</th><th className="px-3 py-2 w-1/3">&nbsp;</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...data.kinds].sort((a: any, b: any) => b.count - a.count).map((k: any) => (
              <tr key={k.kind}>
                <td className="px-3 py-1.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${KIND_TONE[k.kind] || ''}`}>
                    {KIND_LABEL[k.kind] || k.kind}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{k.count.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{pct(k.count, total)}</td>
                <td className="px-3 py-1.5">
                  <div className="h-2 bg-slate-100 rounded">
                    <div className="h-2 bg-slate-400 rounded" style={{ width: pct(k.count, total) }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── team attribution ── */}
      <section className="mb-7 break-inside-avoid">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Errors and rework by team</h2>
        <p className="text-xs text-slate-500 mb-2">
          {errorTotal.toLocaleString()} notices · {pct(errorTotal, total)} of all closed changes.
        </p>
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-3 py-2">Team</th><th className="px-3 py-2">Reasons</th>
              <th className="px-3 py-2 text-right">Notices</th>
              <th className="px-3 py-2 text-right">Share of errors</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.teams.map((t: any) => (
              <tr key={t.team}>
                <td className="px-3 py-1.5 font-medium text-slate-800">{t.team}</td>
                <td className="px-3 py-1.5 text-xs text-slate-600">
                  {Object.entries(t.reasons).map(([r, n]) => `${r} (${n})`).join(', ')}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{t.count}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{pct(t.count, errorTotal)}</td>
              </tr>
            ))}
            {!data.teams.length && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                No error or rework reasons in this window.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ── every reason ── */}
      <section className="mb-7">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Every reason, ranked</h2>
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Team</th><th className="px-3 py-2 text-right">Notices</th>
              <th className="px-3 py-2 text-right">Share</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.reasons.map((r: any) => (
              <tr key={r.reason}>
                <td className="px-3 py-1.5 text-slate-800">{r.reason}</td>
                <td className="px-3 py-1.5">
                  <span className={`px-2 py-0.5 rounded text-xs ${KIND_TONE[r.meta.kind] || ''}`}>
                    {KIND_LABEL[r.meta.kind] || r.meta.kind}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-slate-600">{r.meta.team || '—'}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.count.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{pct(r.count, total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── trend ── */}
      <section className="mb-7 break-inside-avoid">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Closed per month</h2>
        <div className="flex items-end gap-1 h-28 border-b border-slate-200 pb-0">
          {data.byMonth.map((m: any) => {
            const max = Math.max(...data.byMonth.map((x: any) => x.count), 1)
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end" title={`${m.month}: ${m.count}`}>
                <span className="text-[9px] text-slate-500 tabular-nums">{m.count}</span>
                <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${m.count / max * 88}px` }} />
              </div>
            )
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {data.byMonth.map((m: any) => (
            <div key={m.month} className="flex-1 text-center text-[9px] text-slate-500">
              {m.month.slice(2).replace('-', '/')}
            </div>
          ))}
        </div>
      </section>

      {/* ── the overlap ── */}
      <section className="mb-7">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          Parts with both a closed change and a poor-methodizing reject
        </h2>
        <p className="text-xs text-slate-500 mb-2">
          {data.rejects.available
            ? <>Paradigm recorded <b>{data.rejects.transactions}</b> poor-methodizing reject
              transactions across <b>{data.rejects.parts}</b> parts in this window
              ({data.rejects.quantity.toLocaleString()} pieces). Listed in full rather than as a
              rate — the population is too small for a percentage to mean anything, and a part
              appearing here is not evidence the change caused the reject.</>
            : <>Paradigm could not be reached, so the reject half of this report is missing.
              Everything above is unaffected.</>}
        </p>
        {data.overlap.length ? (
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-3 py-2">Part</th><th className="px-3 py-2 text-right">Rejects</th>
                <th className="px-3 py-2 text-right">Pieces</th>
                <th className="px-3 py-2">Reject codes</th><th className="px-3 py-2">Closed changes</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.overlap.map((o: any) => (
                <tr key={o.part} className="align-top">
                  <td className="px-3 py-1.5 font-mono text-xs">{o.part}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{o.rejectTransactions}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{o.rejectQuantity.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-xs text-slate-600">{o.rejectCodes.join('; ')}</td>
                  <td className="px-3 py-1.5 text-xs text-slate-600">
                    {o.mcns.map((m: any) => (
                      <div key={m.request}>
                        {m.reason}{m.team ? ` · ${m.team}` : ''}{m.closedOn ? ` · ${fmtDate(m.closedOn)}` : ''}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500 py-4">
            No part carries both in this window.
          </p>
        )}
      </section>

      <footer className="pt-4 border-t border-slate-200 text-xs text-slate-500">
        <p>
          Sources: MCN (node_app, {total.toLocaleString()} closed records) and Paradigm
          DATA0058/DATA0039 rejects matched on DATA0050 customer part number. Reject family
          matched on the description prefix &ldquo;POOR METHDZNG,&rdquo; which covers all
          eighteen codes in that family. Team attribution is a mapping maintained in
          lib/changes/changeAnalysis.ts, not a field in either database.
        </p>
      </footer>

      {/* Print rules: the page is the deliverable, so the chrome goes and
          sections are kept off page breaks. */}
      <style jsx global>{`
        @media print {
          nav, aside, header[role="banner"] { display: none !important; }
          body { background: #fff; }
          .break-inside-avoid { break-inside: avoid; }
          @page { margin: 14mm; }
        }
      `}</style>
    </div>
  )
}
