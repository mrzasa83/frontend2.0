'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Download, FileText,
  AlertTriangle, Layers,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

/**
 * Raw Material Traceability — Paradigm's "Work Order -> Raw Material" report,
 * driven by the work order on the FAI record.
 *
 * The three switches mirror the Paradigm dialog. The fourth, splits, is ours:
 * a job runs as a base number plus S0-/S1-/S2-/S3- splits and the material is
 * issued against the splits, so a report that silently picked one would be
 * reporting a quantity nobody asked for. Showing them all with the split on
 * each row is the honest default.
 */

type Material = {
  level: number
  issuedFrom: string
  issuedToWorkOrder: string
  partNumber: string
  description: string
  purchasedOrMade: string
  batchSerial: string
  quantity: number | null
  issueDate: string | null
  firstIssueDate: string | null
  lastIssueDate: string | null
  issueCount: number | null
  poNumber: string
  supplierName: string
  supplierCode: string
  expDate: string | null
  whsePtr: number | null
  locPtr: number | null
  issueRkey: number | null
  poPtr: number | null
  roPtr: number | null
  certs: {
    id: number; poNumber: string; lot: string; apcPart: string
    materialType: string; fileName: string; filePath: string
    fileMtime: string | null; partMatches: boolean
  }[]
  poNumberSource?: 'paradigm' | 'cert-archive'
  locationCode: string
  locationName: string
  warehouseCode: string
  countryOfOrigin: string
  countryOfOriginSource: string
  qtyReturned: number | null
  tranType: number | null
  workOrderCount: number | null
  firstWorkOrder: string
  lastWorkOrder: string
}

type SortKey = 'level' | 'issuedToWorkOrder' | 'partNumber' | 'description'
  | 'batchSerial' | 'quantity' | 'issueDate' | 'poNumber' | 'supplierName' | 'expDate'
  | 'locationCode' | 'countryOfOrigin'

const fmtDate = (v: any) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()
}

/** Paradigm prints these to three places; matching it makes the two reports
 *  comparable line by line, which is the whole point of replicating it. */
const fmtQty = (v: number | null) =>
  v == null ? '' : v.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })

export default function RawMaterialTraceabilityTab({ workOrder }: { workOrder?: string }) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [splits, setSplits] = useState<string[]>([])
  const [deepestLevel, setDeepestLevel] = useState(0)
  const [maxWorkOrdersPerRow, setMaxWorkOrdersPerRow] = useState(1)
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [certsFound, setCertsFound] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('partNumber')
  const [sortAsc, setSortAsc] = useState(true)

  // Defaults match the Paradigm dialog as it opens: sub levels on, concise on.
  const [includeSubLevels, setIncludeSubLevels] = useState(true)
  const [concise, setConcise] = useState(true)
  const [exactWorkOrder, setExactWorkOrder] = useState(false)

  const load = useCallback(async () => {
    if (!workOrder) return
    setLoading(true)
    setError('')
    try {
      const p = new URLSearchParams({
        workOrder,
        includeSubLevels: includeSubLevels ? '1' : '0',
        concise: concise ? '1' : '0',
        exactWorkOrder: exactWorkOrder ? '1' : '0',
      })
      const res = await fetch(getApiUrl(`/api/operations/inspections/raw-material-traceability?${p}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      setMaterials(d.materials || [])
      setSplits(d.splits || [])
      setDeepestLevel(d.deepestLevel || 0)
      setMaxWorkOrdersPerRow(d.maxWorkOrdersPerRow || 1)
      setDiagnostics(d.diagnostics || null)
      setCertsFound(d.certsFound || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setMaterials([])
      setSplits([])
      setDiagnostics(null)
    } finally {
      setLoading(false)
    }
  }, [workOrder, includeSubLevels, concise, exactWorkOrder])

  useEffect(() => { load() }, [load])

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? materials.filter(m =>
          [m.partNumber, m.description, m.batchSerial, m.poNumber,
           m.supplierName, m.issuedToWorkOrder, m.locationCode,
           m.locationName, m.countryOfOrigin]
            .some(v => (v || '').toLowerCase().includes(q)))
      : materials
    const dir = sortAsc ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [materials, search, sortKey, sortAsc])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc(a => !a)
    else { setSortKey(k); setSortAsc(true) }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (k !== sortKey) return <ArrowUpDown className="w-3 h-3 opacity-40" />
    return sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
  }

  /**
   * Excel export. Carries the work order and the switch settings into the
   * sheet, because a traceability record that doesn't say what it was run
   * with can't be audited later — and with splits in play, "which work order"
   * is not answered by the file name.
   */
  const exportToExcel = async () => {
    if (!sorted.length) return
    setExporting(true)
    try {
      const XLSX = await import('xlsx')

      const headers = concise
        ? ['Part Number', 'Description', 'Lot / Batch', 'RO/P.O. Number',
           'Supplier', 'Supplier Code', 'Cert File', 'Cert Path',
           'Location', 'C of O', 'Exp Date',
           'Qty Issued', 'Issues', 'First Issue', 'Last Issue', 'Level']
        : ['Level', 'Issued To Work Order', 'Issued From', 'Part Number',
           'Description', 'P/M', 'Lot / Batch', 'Qty Issued', 'Issue Date',
           'RO/P.O. Number', 'Supplier', 'Supplier Code', 'Cert File', 'Cert Path',
           'Warehouse', 'Location', 'C of O', 'Exp Date']

      const body = sorted.map(m => concise
        ? [m.partNumber, m.description, m.batchSerial, m.poNumber,
           m.supplierName, m.supplierCode,
           m.certs?.[0]?.fileName || '', m.certs?.[0]?.filePath || '',
           [m.locationCode, m.locationName].filter(Boolean).join(' '),
           m.countryOfOrigin, fmtDate(m.expDate), fmtQty(m.quantity),
           m.issueCount ?? '', fmtDate(m.firstIssueDate), fmtDate(m.lastIssueDate), m.level]
        : [m.level, m.issuedToWorkOrder, m.issuedFrom, m.partNumber,
           m.description, m.purchasedOrMade, m.batchSerial, fmtQty(m.quantity),
           fmtDate(m.issueDate), m.poNumber, m.supplierName, m.supplierCode,
           m.certs?.[0]?.fileName || '', m.certs?.[0]?.filePath || '',
           m.warehouseCode,
           [m.locationCode, m.locationName].filter(Boolean).join(' '),
           m.countryOfOrigin, fmtDate(m.expDate)])

      // Provenance block above the table. Keeps the file self-describing.
      const meta = [
        ['Work Order', workOrder || ''],
        ['Run', new Date().toLocaleString()],
        ['Include Sub Levels', includeSubLevels ? 'Yes' : 'No (this part only)'],
        ['Concise Output', concise ? 'Yes' : 'No'],
        ['Work Orders Included', exactWorkOrder ? workOrder || '' : splits.join(', ')],
        ['Qty Basis', concise && maxWorkOrdersPerRow > 1
          ? `Total summed across ${maxWorkOrdersPerRow} work orders (splits) — will not match a Paradigm page run for one split`
          : 'Per issue as recorded'],
        [],
      ]

      const ws = XLSX.utils.aoa_to_sheet([...meta, headers, ...body])
      ws['!cols'] = headers.map((h, i) => {
        const maxLen = Math.max(h.length, ...body.map(r => String(r[i] ?? '').length))
        return { wch: Math.min(maxLen + 2, 42) }
      })
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Raw Material')
      XLSX.writeFile(wb,
        `raw_material_${(workOrder || 'wo').replace(/[^\w.-]+/g, '_')}${concise ? '_concise' : ''}.xlsx`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setExporting(false)
    }
  }

  if (!workOrder) {
    return (
      <div className="p-6 text-sm text-slate-500">
        This record has no work order, so there is nothing to trace. Add one on the
        General tab.
      </div>
    )
  }

  const Switch = ({ on, set, label, hint }: {
    on: boolean; set: (v: boolean) => void; label: string; hint?: string
  }) => (
    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer" title={hint}>
      <button type="button" role="switch" aria-checked={on} onClick={() => set(!on)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors
          ${on ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
          ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      {label}
    </label>
  )

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="font-semibold text-slate-800">
            Raw Material Traceability ({sorted.length}
            {search ? ` of ${materials.length}` : ''})
          </h4>
          <p className="text-sm text-slate-600">
            What was actually issued to {workOrder}, from the material issue ledger.
            {concise && ' Purchased items only, one line per lot and PO.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Part, lot, PO, supplier…"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={load} disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportToExcel} disabled={exporting || !sorted.length}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Download size={14} /> {exporting ? 'Exporting…' : 'Excel'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
        {/* "This part only" is the same axis as "Include Sub Levels" on the
            Paradigm dialog, so it's one switch rather than two that can
            contradict each other. */}
        <Switch on={includeSubLevels} set={setIncludeSubLevels}
          label="Include sub levels"
          hint="Off = this part only: the work order's own issues, no sub-assembly jobs" />
        <Switch on={concise} set={setConcise}
          label="Concise output"
          hint="Purchased items only, one row per part / lot / PO" />
        <Switch on={exactWorkOrder} set={setExactWorkOrder}
          label="This work order only"
          hint="Off = include the base job and all of its S0/S1/S2/S3 splits" />
        {!includeSubLevels && (
          <span className="text-xs text-slate-500">Showing this part only</span>
        )}
      </div>

      {/* Splits are not a detail. The printed Paradigm report for -354516-01-000
          shows the base number in its header but carries S3's quantities, so a
          reviewer comparing the two needs to know which rows are which. */}
      {/* Splits are apportionments of one issue, not separate consumption.
          On -354516-01-000 the five shares of lot -354589-01-100 sum to
          exactly 3000.000 while the Paradigm page prints S3's 407.015 share.
          Both are right; shown side by side with no explanation, the 7.37x
          gap reads as a bug. In concise mode the quantity IS that sum, so the
          warning has to be louder there. */}
      {!exactWorkOrder && splits.length > 1 && (
        <div className="flex items-start gap-2 mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          <Layers size={16} className="mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">{splits.length} work orders in this result.</span>{' '}
            Material was issued against splits as well as the base job, and each
            split carries its own share.
            {concise && maxWorkOrdersPerRow > 1 ? (
              <>
                {' '}<span className="font-medium">Qty issued is the total across all
                {' '}{maxWorkOrdersPerRow} of them</span>, so it will not match a Paradigm
                page run for a single split. Turn on <em>This work order only</em> to
                compare line for line.
              </>
            ) : (
              <> Rows are labelled with the one they came from. Turn on{' '}
                <em>This work order only</em> to pin a single split.</>
            )}
            <div className="mt-1 font-mono text-xs">{splits.join('  ·  ')}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 break-words">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-slate-500">
          <RefreshCw size={18} className="animate-spin" /> Loading…
        </div>
      ) : !sorted.length ? (
        materials.length ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No rows match that search.
          </div>
        ) : (
          /* An empty report is a real answer, but "nothing found" alone leaves
             the user with nothing to do. The probes distinguish a spelling
             difference (fixable from here) from a job with nothing issued,
             a bad number, or a ledger that does not reach back far enough. */
          <div className="py-10 px-4 max-w-2xl mx-auto text-sm text-slate-600 space-y-3">
            <p className="text-center font-medium text-slate-700">
              No material issues recorded against {workOrder}.
            </p>

            {diagnostics?.reason === 'spelling' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                The ledger records this job under a different spelling:{' '}
                <span className="font-mono">{diagnostics.sameJobSpellings.join(', ')}</span>.
                {exactWorkOrder
                  ? <> Turn off <em>This work order only</em> to match them all.</>
                  : <> This should have matched — worth reporting, the normalising rule has a gap.</>}
              </div>
            )}

            {diagnostics?.reason === 'job-exists-no-issues' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <div className="font-medium mb-1">
                  The work order exists in Paradigm, but not in the issue ledger.
                </div>
                {/* DATA0153 was measured at 15,674 rows ALL inside a single
                    month. It is a rolling window, not a historical ledger, so
                    a job that ran before it shows nothing here while Paradigm's
                    own report still prints its material. Saying "no material
                    issued" would be flatly wrong in that case. */}
                No stock has been issued against it. Material appears here once it
                is issued to the floor, so a job that is released but not yet kitted
                shows nothing. The transaction history itself goes back to 2006, so
                age is not the reason.
              </div>
            )}

            {diagnostics?.reason === 'not-found' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                No work order matching this number exists in Paradigm. Check the
                number on the General tab.
              </div>
            )}

            {diagnostics?.reason === 'related-only' && !!diagnostics.spellings?.length && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="mb-1">
                  Nothing under this number, but the ledger has related jobs:
                </div>
                <ul className="font-mono text-xs space-y-0.5">
                  {diagnostics.spellings.slice(0, 10).map((sp: any) => (
                    <li key={sp.tranSource}>
                      {sp.tranSource} · {sp.rows} row{sp.rows === 1 ? '' : 's'} · {fmtDate(sp.lastTran)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* A ledger that starts after the job ran is a data boundary, not a
                missing job, and it is the difference between "look harder" and
                "this data is not here". */}
            {diagnostics?.ledgerCoverage && (
              <p className="text-xs text-slate-500 text-center">
                Transaction history holds{' '}
                {diagnostics.ledgerCoverage.totalRows?.toLocaleString()} issue rows,{' '}
                {fmtDate(diagnostics.ledgerCoverage.oldest)} to{' '}
                {fmtDate(diagnostics.ledgerCoverage.newest)}.
              </p>
            )}
          </div>
        )
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {!concise && <Th k="level" label="Lvl" {...{ toggleSort, SortIcon }} />}
                {!concise && <Th k="issuedToWorkOrder" label="Work Order" {...{ toggleSort, SortIcon }} />}
                <Th k="partNumber" label="Part Number" {...{ toggleSort, SortIcon }} />
                <Th k="description" label="Description" {...{ toggleSort, SortIcon }} />
                {!concise && <th className="px-3 py-2">P/M</th>}
                <Th k="batchSerial" label="Lot / Batch" {...{ toggleSort, SortIcon }} />
                <Th k="quantity"
                  label={concise && maxWorkOrdersPerRow > 1 ? `Qty Issued (all ${maxWorkOrdersPerRow} WOs)` : 'Qty Issued'}
                  {...{ toggleSort, SortIcon }} right />
                <Th k="poNumber" label="RO/P.O." {...{ toggleSort, SortIcon }} />
                <Th k="supplierName" label="Supplier" {...{ toggleSort, SortIcon }} />
                <th className="px-3 py-2">Cert</th>
                <Th k="locationCode" label="Location" {...{ toggleSort, SortIcon }} />
                <Th k="countryOfOrigin" label="C of O" {...{ toggleSort, SortIcon }} />
                <Th k="expDate" label="Exp Date" {...{ toggleSort, SortIcon }} />
                <Th k="issueDate" label={concise ? 'Last Issue' : 'Issue Date'} {...{ toggleSort, SortIcon }} />
                {concise && <th className="px-3 py-2 text-right">Issues</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((m, i) => (
                <tr key={m.issueRkey ?? `${m.partNumber}|${m.batchSerial}|${m.poNumber}|${i}`}
                  className="hover:bg-slate-50">
                  {!concise && <td className="px-3 py-2 text-slate-500">{m.level}</td>}
                  {!concise && <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{m.issuedToWorkOrder}</td>}
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{m.partNumber}</td>
                  <td className="px-3 py-2 max-w-xs truncate" title={m.description}>{m.description}</td>
                  {!concise && (
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        m.purchasedOrMade === 'P' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {m.purchasedOrMade || '—'}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{m.batchSerial}</td>
                  <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{fmtQty(m.quantity)}</td>
                  {/* A blank would read as "never purchased". When a PO
                      pointer exists but doesn't resolve, say so. */}
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                    {m.poNumber
                      ? <span title={m.poNumberSource === 'cert-archive'
                          ? 'From the certificate archive — Paradigm does not resolve this PO'
                          : 'From Paradigm'}>
                          {m.poNumber}
                          {m.poNumberSource === 'cert-archive' &&
                            <span className="ml-1 text-blue-500" aria-hidden>*</span>}
                        </span>
                      : (m.poPtr || m.roPtr)
                        ? <span className="text-amber-700" title="A purchase/repair order is referenced but could not be resolved">
                            ref {m.poPtr || m.roPtr} <span className="text-amber-500">(unresolved)</span>
                          </span>
                        : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 max-w-[14rem] truncate" title={m.supplierName}>
                    {m.supplierName || <span className="text-slate-300">—</span>}
                  </td>
                  {/* The point of the whole exercise: the certificate itself,
                      one click from the material that needs it. */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    {m.certs?.length ? (
                      <span className="inline-flex items-center gap-1.5">
                        <a href={getApiUrl(`/api/operations/inspections/material-certs/download?path=${encodeURIComponent(m.certs[0].filePath)}`)}
                          target="_blank" rel="noreferrer"
                          title={m.certs[0].fileName}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
                          <FileText size={14} /> View
                        </a>
                        <a href={getApiUrl(`/api/operations/inspections/material-certs/download?path=${encodeURIComponent(m.certs[0].filePath)}&download=true`)}
                          title={`Download ${m.certs[0].fileName}`}
                          className="text-slate-400 hover:text-slate-700">
                          <Download size={14} />
                        </a>
                        {m.certs.length > 1 &&
                          <span className="text-xs text-slate-400" title={`${m.certs.length} certs for this lot`}>
                            +{m.certs.length - 1}
                          </span>}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  {/* Paradigm prints location as code + name, e.g.
                      "NASKT N ASSY KIT". Matching that makes the two reports
                      comparable line for line. */}
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {m.locationCode
                      ? <><span className="font-mono">{m.locationCode}</span>{' '}
                          <span className="text-slate-500">{m.locationName}</span></>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                    {m.countryOfOrigin
                      ? <span title={m.countryOfOriginSource === 'lot'
                          ? 'Recorded against this specific lot'
                          : "The part's default origin — not lot-specific"}>
                          {m.countryOfOrigin}
                          {m.countryOfOriginSource === 'part' &&
                            <span className="ml-1 text-slate-400" aria-hidden>†</span>}
                        </span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(m.expDate)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(concise ? m.lastIssueDate : m.issueDate)}</td>
                  {concise && <td className="px-3 py-2 text-right text-slate-500">{m.issueCount ?? ''}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lot-level origin is the stronger claim; part-level is the part's
          default and may not reflect what this particular lot shipped as. A
          quality submission should know which one it is citing, so the two
          are marked rather than blended. */}
      {/* TRAN_TP 14 reverses an issue with a negative quantity, so a lot that
          was issued and then returned nets to zero. Showing it as consumed
          would overstate the material in the product. */}
      {!!sorted.length && sorted.some(m => (m.quantity ?? 0) <= 0) && (
        <p className="mt-2 text-xs text-amber-700">
          Rows with a zero or negative quantity were issued and then returned.
          They touched the job but were not consumed — exclude them from a
          certificate pack unless you mean to show the reversal.
        </p>
      )}

      {!!sorted.length && sorted.some(m => m.countryOfOriginSource === 'part') && (
        <p className="mt-2 text-xs text-slate-500">
          † Country of origin shown from the part's default record, not from this
          lot. Lot-specific origin is recorded for only some lots; where it exists
          it is used and shown without a mark.
        </p>
      )}

      {!!sorted.length && includeSubLevels && (
        <p className="mt-2 text-xs text-slate-500">
          Traversed {deepestLevel + 1} level{deepestLevel ? 's' : ''} of sub-assembly jobs.
        </p>
      )}
    </div>
  )
}

function Th({ k, label, toggleSort, SortIcon, right }: any) {
  return (
    <th className={`px-3 py-2 ${right ? 'text-right' : ''}`}>
      <button onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-slate-700 ${right ? 'flex-row-reverse' : ''}`}>
        {label} <SortIcon k={k} />
      </button>
    </th>
  )
}
