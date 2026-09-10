'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  RefreshCw, Download, Search, ArrowUpDown, ArrowUp, ArrowDown, FileText, X,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Material = {
  part_number: string
  description: string
  manufacturer: string
  level: number
  quantity: number | null
  qty_per_parent: number | null
  occurrences: number
  family_id: number | null
  family_name: string
  notepad: string
  parent_part: string
}

type Props = {
  partNumber: string
  /** The customer's own part number, if the caller already has it. */
  customerPN?: string | null
}

type SortKey = 'part_number' | 'description' | 'manufacturer' | 'level' | 'quantity' | 'family_name'

/**
 * Quantities come back as extended figures (per-parent × parent count) and can
 * be fractional for materials issued by area or weight, so they are formatted
 * rather than printed raw — but without inventing precision that isn't there.
 */
const fmtQty = (q: number | null) => {
  if (q === null || q === undefined) return ''
  if (Number.isInteger(q)) return String(q)
  return String(Number(q.toFixed(4)))
}

export default function BuyMaterialTab({ partNumber, customerPN }: Props) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [apcPart, setApcPart] = useState('')
  const [customerPart, setCustomerPart] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('level')
  const [sortAsc, setSortAsc] = useState(true)
  const [noteOpen, setNoteOpen] = useState<Material | null>(null)
  const [exporting, setExporting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(getApiUrl(`/api/products/buy-material?part=${encodeURIComponent(partNumber)}`))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setMaterials(data.materials || [])
      setApcPart(data.apc_part || partNumber)
      setCustomerPart(data.customer_part || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (partNumber) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partNumber])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return materials
    return materials.filter(m =>
      [m.part_number, m.description, m.manufacturer, m.family_name, m.notepad]
        .some(v => (v || '').toLowerCase().includes(term))
    )
  }, [materials, search])

  const sorted = useMemo(() => {
    const rows = [...filtered]
    rows.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
      const as = String(av ?? '')
      const bs = String(bv ?? '')
      return sortAsc ? as.localeCompare(bs) : bs.localeCompare(as)
    })
    return rows
  }, [filtered, sortKey, sortAsc])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc(v => !v)
    else { setSortKey(k); setSortAsc(true) }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (k !== sortKey) return <ArrowUpDown className="w-3 h-3 opacity-40" />
    return sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
  }

  /**
   * Excel export. The sheet carries two columns the table doesn't: the customer
   * part number and its description, repeated on every row so the file stands
   * on its own once it leaves the app — a buyer opening it shouldn't have to be
   * told which product it belongs to.
   *
   * Exports what's on screen: a search or sort applied here carries through, so
   * the file matches what was reviewed.
   */
  const exportToExcel = async () => {
    if (!sorted.length) return
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const custPart = customerPart || customerPN || ''

      const headers = [
        'Customer_Part_Number', 'Description (customer part)', 'QTY',
        'Part Number', 'Description', 'Manufacturer', 'Level', 'Family', 'Notepad',
      ]
      const body = sorted.map(m => [
        apcPart || partNumber,
        custPart,
        fmtQty(m.quantity),
        m.part_number,
        m.description,
        m.manufacturer,
        m.level,
        m.family_name,
        // Full note, newlines intact — Excel keeps them in the cell.
        m.notepad,
      ])

      const ws = XLSX.utils.aoa_to_sheet([headers, ...body])
      // Widths sized to content, with the notepad column capped so one long
      // note doesn't push every other column off the screen.
      ws['!cols'] = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...body.map(r => String(r[i] ?? '').split('\n')[0].length)
        )
        return { wch: Math.min(maxLen + 2, i === headers.length - 1 ? 60 : 40) }
      })
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Buy Material')
      XLSX.writeFile(wb, `buy_material_${(apcPart || partNumber).replace(/[^\w.-]+/g, '_')}.xlsx`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="font-semibold text-slate-800">
            Buy Material ({sorted.length}{search ? ` of ${materials.length}` : ''})
          </h4>
          <p className="text-sm text-slate-600">
            Purchased components across the full BOM. Quantity is per unit of{' '}
            {apcPart || partNumber}, extended through sub-assemblies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToExcel}
            disabled={exporting || !sorted.length}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && materials.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-4">Loading the BOM…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-4">
          {search
            ? 'No purchased materials match that filter.'
            : `No purchased materials found on the BOM for ${partNumber}.`}
        </p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                {([
                  ['quantity', 'QTY'],
                  ['part_number', 'Part Number'],
                  ['description', 'Description'],
                  ['manufacturer', 'Manufacturer'],
                  ['level', 'Level'],
                  ['family_name', 'Family'],
                ] as [SortKey, string][]).map(([k, label]) => (
                  <th
                    key={k}
                    onClick={() => toggleSort(k)}
                    className="px-3 py-2 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1">{label} <SortIcon k={k} /></span>
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Notepad</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => (
                <tr
                  key={`${m.part_number}-${i}`}
                  className="border-t border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                    {fmtQty(m.quantity)}
                    {m.occurrences > 1 && (
                      <span
                        className="ml-1 text-[10px] text-slate-500"
                        title={`Appears in ${m.occurrences} BOM positions; quantity is the total`}
                      >
                        ×{m.occurrences}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs font-semibold whitespace-nowrap">
                    {m.part_number}
                  </td>
                  <td className="px-3 py-2">{m.description}</td>
                  <td className="px-3 py-2">{m.manufacturer}</td>
                  <td className="px-3 py-2 tabular-nums">{m.level}</td>
                  <td className="px-3 py-2">
                    {m.family_name
                      ? <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs">{m.family_name}</span>
                      : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2 max-w-xs">
                    {m.notepad ? (
                      <button
                        onClick={() => setNoteOpen(m)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-left"
                        title="Show the full note"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{m.notepad.split('\n')[0]}</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes run to many lines and Paradigm breaks them mid-word at 70
          characters, so the full text gets a modal rather than a cramped cell. */}
      {noteOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setNoteOpen(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div>
                <h5 className="font-semibold text-slate-800">{noteOpen.part_number}</h5>
                <p className="text-xs text-slate-600">{noteOpen.description}</p>
              </div>
              <button
                onClick={() => setNoteOpen(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <pre className="p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono overflow-auto">
              {noteOpen.notepad}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
