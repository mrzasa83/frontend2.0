'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, FileDown, X, FileSpreadsheet } from 'lucide-react'
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
  /** The change opened for reading. Null = nothing open. */
  const [openChange, setOpenChange] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

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

  /**
   * The reason text, as a spreadsheet.
   *
   * The whole closed population, not just the overlap: themes live in the
   * volume, and twenty rows would not show one. Built client-side with the
   * same xlsx import the Product Changes list already uses.
   */
  const exportReasons = async () => {
    setExporting(true); setError('')
    try {
      const res = await fetch(getApiUrl(
        `/api/products/changes/analysis?export=reasons&months=${months}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet((d.rows || []).map((r: any) => ({
        ID: r.id, Request: r.request, 'Part #': r.part, Customer: r.customer,
        'Reason Code': r.reasonCode, Team: r.team, Kind: r.kind,
        Reason: r.reason, Change: r.change,
        PE: r.pe, Closed: fmtDate(r.closedOn),
      })))
      // Reason and Change are the columns being read; the rest is context.
      ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 20 },
                     { wch: 20 }, { wch: 14 }, { wch: 80 }, { wch: 80 }, { wch: 16 }, { wch: 12 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Change Reasons')
      XLSX.writeFile(wb, `change-reasons_${months}mo_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setExporting(false) }
  }

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
        <div className="flex items-center gap-2">
          <button onClick={exportReasons} disabled={exporting}
            title="Every closed change's reason text, for thematic analysis elsewhere"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            {exporting ? <RefreshCw size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            {exporting ? 'Building…' : 'Reasons → Excel'}
          </button>
          {/* A generated PDF rather than the print dialogue: landscape, fixed
              margins and page breaks, and none of the app's chrome. The link
              opens in a tab so the reader can save it from the viewer. */}
          <a href={getApiUrl(
              `/api/products/changes/analysis?format=pdf&months=${months}&timeoutMs=60000`)}
            target="_blank" rel="noopener noreferrer"
            title="Landscape PDF of this report — takes a few seconds to build"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900">
            <FileDown size={14} /> PDF
          </a>
        </div>
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

      {/* ── poor methodizing rejects ── */}
      <section className="mb-7">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Poor Methodizing Rejects</h2>
        <p className="text-xs text-slate-500 mb-2">
          {data.rejects.available
            ? <>Parts carrying both a closed change and a poor-methodizing reject.
              Paradigm recorded <b>{data.rejects.transactions}</b> such reject transactions across{' '}
              <b>{data.rejects.parts}</b> parts in this window
              ({data.rejects.quantity.toLocaleString()} pieces). Listed in full rather than as a
              rate — the population is too small for a percentage to mean anything, and a part
              appearing here is not evidence the change caused the reject.</>
            : <>Paradigm could not be reached, so the reject half of this report is missing.
              Everything above is unaffected.</>}
        </p>

        {!!data.overlap.length && (
          <div className="flex items-center gap-4 flex-wrap mb-2 text-xs">
            <span className="text-slate-600">
              <b className="text-slate-900">{data.overlapTotals.parts}</b> parts ·{' '}
              <b className="text-slate-900">{data.overlapTotals.changes}</b> changes ·{' '}
              <b className="text-slate-900">{data.overlapTotals.rejects}</b> rejects ·{' '}
              <b className="text-slate-900">{data.overlapTotals.quantity.toLocaleString()}</b> pieces
            </span>
            {!!data.overlapTotals.flagged && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700">
                <AlertTriangle size={12} />
                {data.overlapTotals.flagged} highlighted: a PPE Error closed on a part that also
                took a poor-methodizing reject
              </span>
            )}
          </div>
        )}

        {data.overlap.length ? (
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Part</th>
                <th className="px-3 py-2 text-right">Changes</th>
                <th className="px-3 py-2 text-right">Rejects</th>
                <th className="px-3 py-2 text-right">Pieces</th>
                <th className="px-3 py-2">Reject codes</th>
                <th className="px-3 py-2 w-2/5">Closed changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.overlap.map((o: any) => (
                /* A PPE Error against a poor-methodizing reject on the same
                   part is the pair worth reading, so the whole row carries it. */
                <tr key={o.part} className={`align-top ${o.hasPpeError ? 'bg-red-50' : ''}`}>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                    {o.part}
                    {o.hasPpeError && (
                      <span className="ml-1.5 inline-flex items-center" title="PPE Error closed on this part">
                        <AlertTriangle size={12} className="text-red-600" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{o.changeCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{o.rejectTransactions}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{o.rejectQuantity.toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{o.rejectCodes.join('; ')}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-2">
                      {o.mcns.map((m: any) => (
                        <div key={m.id} className="border-l-2 border-slate-200 pl-2">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {/* Opens the full record without leaving the report. */}
                            <button onClick={() => setOpenChange(m.id)}
                              className="font-mono text-xs text-blue-700 hover:underline print:no-underline print:text-slate-800">
                              {m.request}
                            </button>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${KIND_TONE[m.kind] || ''}`}>
                              {m.reasonCode}
                            </span>
                            {m.team && <span className="text-[10px] text-slate-500">{m.team}</span>}
                            {m.closedOn && <span className="text-[10px] text-slate-400">{fmtDate(m.closedOn)}</span>}
                          </div>
                          {m.changeText && (
                            <div className="text-xs text-slate-700 mt-0.5">
                              <span className="text-slate-400">Change: </span>{m.changeText}
                            </div>
                          )}
                          {m.reasonText && (
                            <div className="text-xs text-slate-600 mt-0.5">
                              <span className="text-slate-400">Reason: </span>{m.reasonText}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500 py-4">No part carries both in this window.</p>
        )}
      </section>

      {openChange != null && (
        <ChangeDialog id={openChange} onClose={() => setOpenChange(null)} />
      )}

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

/* ───────────────────────── one change, in full ───────────────────────── */

/** Fields worth leading with, in the order a reader wants them. Everything
 *  else on the record follows alphabetically — the legacy table has 99
 *  columns and most carry nothing. */
const LEAD_FIELDS: [string, string][] = [
  ['request', 'Request #'], ['status', 'Status'], ['toolnum', 'Tool #'],
  ['partnum', 'Part #'], ['customer', 'Customer'], ['custcode', 'Customer Code'],
  ['chngreason', 'Reason Change Needed'], ['chngeffect', 'Change Affects'],
  ['software', 'Software Affected'], ['wip', 'WIP / INV / FG Affected'],
  ['change', 'Change'], ['reason', 'Reason'],
  ['initiator', 'Initiator'], ['requester', 'Requester'], ['pe', 'PE'],
  ['ppe', 'PPE'], ['qe', 'QE'], ['disposition', 'Disposition'],
  ['pe_disposition', 'PE Disposition'], ['dis_reason', 'Disposition Reason'],
  ['whyreject', 'Why Rejected'], ['eco', 'ECO'], ['to_eco', 'To ECO'],
  ['subdate', 'Submitted'], ['closeddate', 'Closed'], ['closedby', 'Closed By'],
]

const HIDE = new Set([
  'id', 'mcn_status', 'status_group', 'on_hold', 'locations',
  'hold_status_history', 'attachments', 'costing_attachments',
])

const prettify = (k: string) =>
  k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

function ChangeDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true); setErr('')
      try {
        const res = await fetch(getApiUrl(`/api/products/changes/mcn?id=${id}`))
        const d = await res.json()
        if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
        if (!cancelled) setRecord(d.record)
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e))
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [id])

  // Esc closes, as it would anywhere else.
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const lead = record
    ? LEAD_FIELDS.filter(([k]) => String(record[k] ?? '').trim() !== '')
    : []
  const leadKeys = new Set(LEAD_FIELDS.map(([k]) => k))
  const rest = record
    ? Object.keys(record)
        .filter(k => !leadKeys.has(k) && !HIDE.has(k) && String(record[k] ?? '').trim() !== '')
        .sort()
    : []

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-6 overflow-y-auto print:hidden"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
          <h3 className="font-semibold text-slate-800">
            {record?.request || `Change #${id}`}
            {record?.status && (
              <span className="ml-2 text-xs font-normal text-slate-500">{record.status}</span>
            )}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center gap-2 py-10 justify-center text-slate-500">
              <RefreshCw size={16} className="animate-spin" /> Loading…
            </div>
          )}
          {err && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div className="min-w-0 break-words">{err}</div>
            </div>
          )}
          {record && (
            <>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {lead.map(([k, label]) => (
                  <div key={k} className={k === 'change' || k === 'reason' ? 'sm:col-span-2' : ''}>
                    <dt className="text-[10px] uppercase tracking-wider text-slate-500">{label}</dt>
                    <dd className="text-sm text-slate-800 whitespace-pre-line break-words">
                      {String(record[k])}
                    </dd>
                  </div>
                ))}
              </dl>

              {!!rest.length && (
                <details className="mt-5">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                    {rest.length} further fields on this record
                  </summary>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 pt-3 border-t border-slate-100">
                    {rest.map(k => (
                      <div key={k}>
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400">{prettify(k)}</dt>
                        <dd className="text-xs text-slate-700 whitespace-pre-line break-words">
                          {String(record[k])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
