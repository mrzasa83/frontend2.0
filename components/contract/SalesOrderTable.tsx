'use client'

import { ArrowUp, ArrowDown, ArrowUpDown, Star, AlertTriangle } from 'lucide-react'

export type SalesOrderRow = {
  salesOrder: string
  itemNbr: string
  apcPart: string
  customerPart: string
  partSource: string
  salesRowCount: number
  customerName: string
  status: number | null
  partsOrdered: number
  partsShipped: number
  qtyOwed: number
  partPrice: number
  valueOwed: number
  schDate: string | null
  promiseDate: string | null
  late: boolean
}

export type SalesOrderTotals = {
  lines: number; parts: number
  partsOrdered: number; partsShipped: number
  qtyOwed: number; late: number
}

/** Paradigm status codes, badged the way the rest of the app badges status. */
export const SO_STATUS: Record<number, { label: string; tone: string }> = {
  0: { label: 'Quote', tone: 'bg-slate-100 text-slate-700' },
  1: { label: 'Open', tone: 'bg-blue-100 text-blue-700' },
  2: { label: 'In Process', tone: 'bg-emerald-100 text-emerald-700' },
}

export const n = (v: number) => v.toLocaleString()
export const money = (v: number) =>
  v ? v.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : ''
/**
 * Dates come from Paradigm as midnight UTC. Formatting them in local time
 * would show the day before all afternoon, so the UTC parts are read directly.
 */
export const day = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`
}

export function StatusBadge({ status }: { status: number | null }) {
  if (status == null) return null
  const s = SO_STATUS[status]
  return (
    <span className={`text-[11px] px-1.5 py-0.5 rounded ${s?.tone || 'bg-slate-100 text-slate-600'}`}>
      {s?.label || `Status ${status}`}
    </span>
  )
}

export type Col = { key: keyof SalesOrderRow | 'watch'; label: string; w?: number; align?: 'r' }

export const SO_COLS: Col[] = [
  { key: 'apcPart', label: 'APC Part', w: 120 },
  { key: 'customerPart', label: 'Customer Part', w: 150 },
  { key: 'customerName', label: 'Customer', w: 190 },
  { key: 'salesOrder', label: 'Sales Order', w: 120 },
  { key: 'itemNbr', label: 'Item', w: 64 },
  { key: 'status', label: 'Status', w: 100 },
  { key: 'partsOrdered', label: 'Ordered', w: 86, align: 'r' },
  { key: 'partsShipped', label: 'Shipped', w: 86, align: 'r' },
  { key: 'qtyOwed', label: 'Owed', w: 86, align: 'r' },
  { key: 'partPrice', label: 'Price', w: 92, align: 'r' },
  { key: 'schDate', label: 'Sch Date', w: 100 },
  { key: 'promiseDate', label: 'Promise', w: 100 },
]

/**
 * The open-order table, shared by Contract ▸ Sales Orders and the per-part tab
 * under Products ▸ Released. One component so the two can never drift — the
 * per-part view is the same table with the watch column and sorting off.
 */
export default function SalesOrderTable({
  rows, sort, onSort, onOpenPart,
  watched, onToggleWatch, showWatch = false, maxHeight = 'calc(100vh-420px)',
}: {
  rows: SalesOrderRow[]
  sort?: { key: string; dir: 'asc' | 'desc' }
  onSort?: (key: string) => void
  onOpenPart?: (part: string) => void
  watched?: Set<string>
  onToggleWatch?: (part: string) => void
  showWatch?: boolean
  maxHeight?: string
}) {
  const cols = showWatch
    ? ([{ key: 'watch', label: '', w: 36 }] as Col[]).concat(SO_COLS)
    : SO_COLS

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-auto"
      style={{ maxHeight }}>
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            {cols.map(c => {
              const active = sort?.key === c.key
              const sortable = !!onSort && c.key !== 'watch'
              return (
                <th key={String(c.key)} style={{ width: c.w }}
                  className={`px-3 py-2 font-medium text-slate-600 border-b border-slate-200 ${
                    c.align === 'r' ? 'text-right' : 'text-left'}`}>
                  {sortable ? (
                    <button onClick={() => onSort!(String(c.key))}
                      className={`flex items-center gap-1 hover:text-slate-900 ${
                        c.align === 'r' ? 'ml-auto' : ''}`}>
                      {c.label}
                      {active
                        ? (sort!.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
                        : <ArrowUpDown size={10} className="text-slate-300" />}
                    </button>
                  ) : c.label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={`${r.salesOrder}|${r.itemNbr}|${i}`}
              className={r.late ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}>
              {showWatch && (
                <td className="px-2 py-1.5">
                  <button onClick={() => onToggleWatch?.(r.customerPart)}
                    title={watched?.has(r.customerPart)
                      ? 'Stop following this part' : 'Follow this part'}
                    className="p-0.5 rounded hover:bg-slate-200">
                    <Star size={14}
                      className={watched?.has(r.customerPart)
                        ? 'text-amber-500 fill-amber-400' : 'text-slate-300'} />
                  </button>
                </td>
              )}
              <td className="px-3 py-1.5 font-mono">
                {onOpenPart && r.apcPart ? (
                  <button onClick={() => onOpenPart(r.apcPart)}
                    className="text-blue-600 hover:underline font-medium"
                    title="Open this product">
                    {r.apcPart}
                  </button>
                ) : <span className="text-slate-800">{r.apcPart}</span>}
              </td>
              <td className="px-3 py-1.5 font-mono text-slate-700">
                {r.customerPart || <span className="text-slate-300">—</span>}
                {/* No sales row carried a customer number for this line. */}
                {!r.customerPart && r.partSource === 'none' && (
                  <span className="ml-1 text-[10px] text-amber-600"
                    title="No sales part row under this production part">?</span>
                )}
                {/* Several sales rows for this customer: the number shown was
                    chosen from them, so say so rather than imply certainty. */}
                {r.salesRowCount > 1 && (
                  <span className="ml-1 text-[10px] text-amber-600 cursor-help"
                    title={`This customer has ${r.salesRowCount} part numbers on this product — the retired (DNU) ones are skipped, but check it against Paradigm`}>
                    ±
                  </span>
                )}
              </td>
              <td className="px-3 py-1.5 text-slate-600 truncate">{r.customerName}</td>
              <td className="px-3 py-1.5 font-mono text-slate-700">{r.salesOrder}</td>
              <td className="px-3 py-1.5 text-slate-500">{r.itemNbr}</td>
              <td className="px-3 py-1.5"><StatusBadge status={r.status} /></td>
              <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{n(r.partsOrdered)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{n(r.partsShipped)}</td>
              <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${
                r.qtyOwed > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{n(r.qtyOwed)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{money(r.partPrice)}</td>
              <td className="px-3 py-1.5 text-slate-600 tabular-nums">{day(r.schDate)}</td>
              <td className="px-3 py-1.5 tabular-nums">
                <span className={r.late ? 'text-red-700 font-medium' : 'text-slate-600'}>
                  {day(r.promiseDate)}
                </span>
                {r.late && <AlertTriangle size={11} className="inline ml-1 -mt-0.5 text-red-600" />}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan={cols.length} className="px-3 py-10 text-center text-slate-500">
              No open sales order lines.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** The filtered-set totals strip. */
export function SalesOrderTotalsBar({ totals }: { totals: SalesOrderTotals }) {
  const cells: [string, string, string?][] = [
    ['Lines', n(totals.lines)],
    ['Parts', n(totals.parts)],
    ['Ordered', n(totals.partsOrdered)],
    ['Shipped', n(totals.partsShipped)],
    ['Owed', n(totals.qtyOwed), 'text-slate-900 font-semibold'],
    ['Late', n(totals.late), totals.late ? 'text-red-700 font-semibold' : ''],
  ]
  return (
    <div className="flex items-stretch gap-0 flex-wrap border border-slate-200 rounded-lg overflow-hidden mb-3">
      {cells.map(([label, value, tone], i) => (
        <div key={label}
          className={`px-4 py-2 flex-1 min-w-[110px] ${i ? 'border-l border-slate-200' : ''}`}>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
          <div className={`text-base tabular-nums ${tone || 'text-slate-700'}`}>{value}</div>
        </div>
      ))}
    </div>
  )
}
