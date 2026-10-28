'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, Download } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import SalesOrderTable, {
  SalesOrderTotalsBar, type SalesOrderRow, type SalesOrderTotals,
} from '@/components/contract/SalesOrderTable'

/**
 * Open sales order lines for one part, under Products ▸ Released.
 *
 * Keyed on the CUSTOMER part number, because that is what the sales order
 * carries — Paradigm's DATA0060 points at DATA0050, not at our APC number.
 * A product with no customer number on it therefore has nothing to look up,
 * and says so rather than showing an empty table that reads as "no orders".
 */
export default function OpenSalesOrdersTab({
  partNumber, customerPN,
}: { partNumber: string; customerPN?: string | null }) {
  const part = String(customerPN || '').trim()
  const [rows, setRows] = useState<SalesOrderRow[]>([])
  const [totals, setTotals] = useState<SalesOrderTotals | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!part) return
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(
        `/api/contract/sales-orders?part=${encodeURIComponent(part)}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || d.details || 'Failed to load')
      setRows(d.rows || []); setTotals(d.totals || null)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [part])
  useEffect(() => { load() }, [load])

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
      'Customer Part': r.customerPart, Customer: r.customerName,
      'Sales Order': r.salesOrder, Item: r.itemNbr, Status: r.status,
      Ordered: r.partsOrdered, Shipped: r.partsShipped, 'Qty Owed': r.qtyOwed,
      'Part Price': r.partPrice,
      'Sch Date': r.schDate ? r.schDate.slice(0, 10) : '',
      Promise: r.promiseDate ? r.promiseDate.slice(0, 10) : '',
      Late: r.late ? 'Yes' : '',
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Open Orders')
    XLSX.writeFile(wb, `open-sales-orders_${partNumber}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (!part) {
    return (
      <div className="p-4 text-sm text-slate-600">
        <p className="mb-1">No customer part number is recorded on {partNumber}.</p>
        <p className="text-slate-500">
          Sales order lines are keyed on the customer&apos;s number, so there is nothing
          to match against until one is set on the product.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <p className="text-sm text-slate-600">
          Open lines for customer part <span className="font-mono text-slate-900">{part}</span>
        </p>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} disabled={!rows.length}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200 disabled:opacity-50">
            <Download size={14} /> Excel
          </button>
          <button onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /><div>{error}</div>
        </div>
      )}

      {totals && <SalesOrderTotalsBar totals={totals} />}

      {loading && !rows.length
        ? <div className="flex items-center gap-2 py-12 justify-center text-slate-500">
            <RefreshCw size={18} className="animate-spin" /> Reading Paradigm…
          </div>
        : <SalesOrderTable rows={rows} maxHeight="520px" />}
    </div>
  )
}
