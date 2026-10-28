/**
 * Open sales order lines from Paradigm.
 *
 * DATA0060 is the sales-order line; STATUS < 3 is what Paradigm treats as
 * open. STATUS is carried through as a column rather than left in the WHERE
 * clause, because "which of these are actually still live" is the first thing
 * anyone asks of the list.
 *
 * Customer part and customer name are LEFT JOINed: a line can outlive the
 * record it points at, and dropping those rows would quietly understate what
 * is owed.
 */

import { queryMSSQL } from '@/lib/db/mssql'
import { prodPartNumExpr } from '@/lib/products/partSearch'

export type SalesOrderRow = {
  salesOrder: string
  itemNbr: string
  /** The APC production part number — what Products is keyed on. */
  apcPart: string
  /** The customer's own number, off the sales row. */
  customerPart: string
  /** How the customer number was found, for when it looks wrong. */
  partSource: string
  customerName: string
  status: number | null
  partsOrdered: number
  partsShipped: number
  qtyOwed: number
  partPrice: number
  /**
   * Qty owed x PART_PRICE. NOT shown in the UI: PART_PRICE reads as a unit
   * price on volume lines ($0.99 on 12,800 pieces) and as something else
   * entirely on low-quantity ones ($38,718 against a single part), so a total
   * built on it would be authoritative-looking and wrong. Kept on the row so
   * it can be turned on once the field's meaning is settled.
   */
  valueOwed: number
  schDate: string | null
  promiseDate: string | null
  /** Promise date is in the past and parts are still owed. */
  late: boolean
}

export const SALES_ORDER_SQL = `
  SELECT
      SO.SALES_ORDER,
      SO.ITEM_NBR,
      SO.STATUS,

      -- The APC part number, off the PRODUCTION row, derived exactly as the
      -- product search derives it so the two agree about what "76542" is.
      ${prodPartNumExpr('PP.CUSTOMER_PART_NUMBER')} AS APC_PART,

      -- The customer's own number. First choice is the pointed-at row when it
      -- is already a sales row; then the sales row belonging to THIS order's
      -- customer; then any sales row under the same production part.
      COALESCE(
          CASE WHEN CP.RKEY <> CP.PRODUCTION_PART_PTR
               THEN CP.CUSTOMER_PART_NUMBER END,
          SPC.CUSTOMER_PART_NUMBER,
          SPA.CUSTOMER_PART_NUMBER
      ) AS CUSTOMER_PART_NUMBER,

      CASE
          WHEN CP.RKEY <> CP.PRODUCTION_PART_PTR THEN 'pointer'
          WHEN SPC.CUSTOMER_PART_NUMBER IS NOT NULL THEN 'customer-match'
          WHEN SPA.CUSTOMER_PART_NUMBER IS NOT NULL THEN 'any-sales-row'
          ELSE 'none'
      END AS PART_SOURCE,

      CUST.CUSTOMER_NAME,
      SO.PARTS_ORDERED,
      SO.PARTS_SHIPPED,
      SO.PARTS_ORDERED - SO.PARTS_SHIPPED AS QTY_OWED,
      SO.PART_PRICE,
      SO.SCH_DATE,
      SO.MFG_ORDER_DATE AS PROMISE_DATE
  FROM DATA0060 SO WITH (NOLOCK)
  LEFT JOIN DATA0050 CP WITH (NOLOCK)
      ON CP.RKEY = SO.CUST_PART_PTR

  -- The production row, from either side: a production row points at itself,
  -- so following PRODUCTION_PART_PTR lands on it whether CUST_PART_PTR hit
  -- the sales row or the production row.
  LEFT JOIN DATA0050 PP WITH (NOLOCK)
      ON PP.RKEY = CP.PRODUCTION_PART_PTR

  -- A production part can carry several sales parts, one per customer, so the
  -- order's own customer decides which number is the right one to show.
  OUTER APPLY (
      SELECT TOP 1 sp.CUSTOMER_PART_NUMBER
      FROM DATA0050 sp WITH (NOLOCK)
      WHERE sp.PRODUCTION_PART_PTR = PP.RKEY
        AND sp.RKEY <> PP.RKEY
        AND sp.CUSTOMER_PTR = SO.CUSTOMER_PTR
      ORDER BY sp.RKEY DESC
  ) SPC
  OUTER APPLY (
      SELECT TOP 1 sp.CUSTOMER_PART_NUMBER
      FROM DATA0050 sp WITH (NOLOCK)
      WHERE sp.PRODUCTION_PART_PTR = PP.RKEY
        AND sp.RKEY <> PP.RKEY
      ORDER BY sp.RKEY DESC
  ) SPA

  LEFT JOIN DATA0010 CUST WITH (NOLOCK)
      ON CUST.RKEY = SO.CUSTOMER_PTR
  WHERE SO.STATUS < 3
  ORDER BY APC_PART, SO.SALES_ORDER, SO.ITEM_NBR`

/**
 * Paradigm status codes on an open line.
 *
 * Only 0-2 can appear here, since the query filters STATUS < 3. The labels
 * follow the sales-order screen; an unmapped code renders as its number
 * rather than being hidden, so a new code shows up instead of silently
 * reading as "Open".
 */
export const SO_STATUS: Record<number, { label: string; tone: string }> = {
  0: { label: 'Quote', tone: 'bg-slate-100 text-slate-700' },
  1: { label: 'Open', tone: 'bg-blue-100 text-blue-700' },
  2: { label: 'In Process', tone: 'bg-emerald-100 text-emerald-700' },
}

export const statusLabel = (s: number | null): string =>
  s == null ? '' : (SO_STATUS[s]?.label ?? `Status ${s}`)

const text = (v: any) => String(v ?? '').trim()
const num = (v: any) => {
  const n = Number(v)
  return isFinite(n) ? n : 0
}
const iso = (v: any): string | null => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export function toRow(r: any): SalesOrderRow {
  const partsOrdered = num(r.PARTS_ORDERED)
  const partsShipped = num(r.PARTS_SHIPPED)
  const qtyOwed = num(r.QTY_OWED)
  const partPrice = num(r.PART_PRICE)
  const promiseDate = iso(r.PROMISE_DATE)
  const statusRaw = r.STATUS
  return {
    salesOrder: text(r.SALES_ORDER),
    itemNbr: text(r.ITEM_NBR),
    apcPart: text(r.APC_PART),
    customerPart: text(r.CUSTOMER_PART_NUMBER),
    partSource: text(r.PART_SOURCE),
    customerName: text(r.CUSTOMER_NAME),
    status: statusRaw == null ? null : num(statusRaw),
    partsOrdered,
    partsShipped,
    qtyOwed,
    partPrice,
    valueOwed: Number((qtyOwed * partPrice).toFixed(2)),
    schDate: iso(r.SCH_DATE),
    promiseDate,
    // Past promise date with parts still owed. A line that shipped complete is
    // never late however old the date is.
    late: !!promiseDate && qtyOwed > 0 && new Date(promiseDate).getTime() < Date.now(),
  }
}

export type SalesOrderTotals = {
  lines: number
  parts: number
  partsOrdered: number
  partsShipped: number
  qtyOwed: number
  late: number
}

/** Totals over whatever set is on screen — the filtered rows, not the whole file. */
export function totalsFor(rows: SalesOrderRow[]): SalesOrderTotals {
  const t: SalesOrderTotals = {
    lines: rows.length, parts: 0,
    partsOrdered: 0, partsShipped: 0, qtyOwed: 0, late: 0,
  }
  const parts = new Set<string>()
  for (const r of rows) {
    t.partsOrdered += r.partsOrdered
    t.partsShipped += r.partsShipped
    t.qtyOwed += r.qtyOwed
    if (r.late) t.late++
    // Counted on the APC number: it is present on every line, whereas the
    // customer number is missing wherever no sales row could be found.
    if (r.apcPart) parts.add(r.apcPart)
  }
  t.parts = parts.size
  return t
}

/**
 * Open lines, cached briefly.
 *
 * The whole open book is a couple of thousand rows, and both the Contract
 * table and the per-part tab under Products read it. Fetching once and
 * filtering in memory keeps the per-part tab instant and spares Paradigm a
 * query per keystroke, exactly as the EHS parts cache does.
 */
const TTL_MS = 2 * 60 * 1000
let cache: { rows: SalesOrderRow[]; at: number } | null = null
let inFlight: Promise<SalesOrderRow[]> | null = null

export function salesOrderCacheAge(): number | null {
  return cache ? Date.now() - cache.at : null
}

export async function getOpenSalesOrders(force = false): Promise<SalesOrderRow[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.rows
  if (!inFlight) {
    inFlight = queryMSSQL<any[]>('1', SALES_ORDER_SQL)
      .then(rows => (rows || []).map(toRow))
      .then(rows => { cache = { rows, at: Date.now() }; return rows })
      .finally(() => { inFlight = null })
  }
  return inFlight
}

/**
 * Open lines for one part, matched on EITHER number.
 *
 * Products ▸ Released knows its APC number for certain and its customer number
 * only sometimes, while the order line carries both. Matching either way means
 * the tab works from whichever the caller has, and a product whose customer
 * number has drifted still finds its orders through the APC number.
 */
export async function openForPart(
  part: string, customerPart?: string | null,
): Promise<SalesOrderRow[]> {
  const a = text(part).toUpperCase()
  const b = text(customerPart).toUpperCase()
  if (!a && !b) return []
  const all = await getOpenSalesOrders()
  return all
    .filter(r =>
      (!!a && (r.apcPart.toUpperCase() === a || r.customerPart.toUpperCase() === a))
      || (!!b && r.customerPart.toUpperCase() === b))
    .sort((x, y) => String(x.promiseDate ?? '').localeCompare(String(y.promiseDate ?? '')))
}
