import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'
import {
  buildTraceabilityQuery, buildEmptyResultProbes, normalizeWorkOrder,
} from '@/lib/inspections/rawMaterialTraceability'
import { findCertsForLots, normalizePoNumber } from '@/lib/inspections/certLookup'

const READ_CONN = '1'

/**
 * Raw Material Traceability — what was actually issued to a work order.
 *
 * Replaces the BOM-walk in ../material-certs/route.ts, which joined lots on
 * the inventory pointer alone and so returned every lot ever received for
 * every BOM part rather than the ones issued to the job. The SQL and the
 * reasoning behind it live in lib/inspections/rawMaterialTraceability.ts.
 *
 * Query params, all optional except workOrder:
 *   workOrder        base or split work order, e.g. -354516-01-000
 *   includeSubLevels 0/1, default 1 — follow made lots into their own jobs
 *   concise          0/1, default 1 — purchased leaves only, deduped
 *   exactWorkOrder   0/1, default 0 — pin one split instead of base + all
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workOrder = (searchParams.get('workOrder') || '').trim()
  if (!workOrder) {
    return NextResponse.json({ error: 'workOrder required' }, { status: 400 })
  }

  // A switch is only off when it says so. An absent param keeps the default
  // the Paradigm dialog opens with, so a caller that passes nothing gets the
  // same answer as a user who hasn't touched the switches.
  const flag = (name: string, dflt: boolean) => {
    const v = searchParams.get(name)
    return v === null ? dflt : v === '1' || v === 'true'
  }

  const opts = {
    workOrder,
    includeSubLevels: flag('includeSubLevels', true),
    concise: flag('concise', true),
    exactWorkOrder: flag('exactWorkOrder', false),
  }

  try {
    const { sql, params } = buildTraceabilityQuery(opts)
    const rows = await queryMSSQL<any[]>(READ_CONN, sql, params)

    const str = (v: any) => (v == null ? '' : String(v).trim())
    const num = (v: any) => (v == null ? null : Number(v))

    const materials = (rows || []).map((r: any) => ({
      level: num(r.Lvl) ?? 0,
      issuedFrom: str(r.IssuedFrom),
      issuedToWorkOrder: str(r.IssuedToWorkOrder),
      partNumber: str(r.InventoryPart),
      description: str(r.Description),
      // 'P' purchased, 'M' made. Concise is purchased-only by definition, so
      // the column isn't selected there — label it rather than leave a blank.
      purchasedOrMade: str(r.PurchasedOrMade) || (opts.concise ? 'P' : ''),
      batchSerial: str(r.BatchSerial),
      quantity: num(r.Quantity),
      issueDate: r.IssueDate ?? r.LastIssueDate ?? null,
      firstIssueDate: r.FirstIssueDate ?? null,
      lastIssueDate: r.LastIssueDate ?? null,
      issueCount: num(r.IssueCount),
      poNumber: str(r.PONumber),
      supplierName: str(r.SupplierName),
      supplierCode: str(r.SupplierCode),
      expDate: r.ExpDate ?? null,
      whsePtr: num(r.WhsePtr),
      locPtr: num(r.LocPtr),
      issueRkey: num(r.IssueRkey),
      // Raw pointers, so the UI can tell "no purchase order" from "a
      // purchase order we failed to resolve". Lot G011595160 carries
      // PO_PTR 174187 and DATA0070 has no such RKEY, so PO_PTR is not a
      // DATA0070 key; until that is settled a blank would read as "this
      // material was never purchased", which is the opposite of the truth.
      poPtr: num(r.PoPtr),
      roPtr: num(r.RoPtr),
      // Resolved round 5: DATA0016 (location), DATA0015 (warehouse),
      // DATA9432 -> DATA0250 (country of origin per lot). These are three of
      // the printed report's own columns.
      locationCode: str(r.LocationCode),
      locationName: str(r.LocationName),
      warehouseCode: str(r.WarehouseCode),
      countryOfOrigin: str(r.CountryOfOrigin),
      // Concise only: how many work orders the summed quantity spans.
      workOrderCount: num(r.WorkOrderCount),
      firstWorkOrder: str(r.FirstWorkOrder),
      lastWorkOrder: str(r.LastWorkOrder),
    }))

    /**
     * Tie each row to the certificate archive.
     *
     * This does two jobs at once. It supplies the PO number, which Paradigm's
     * own tables could not (DATA0070's RKEY range stops well short of the
     * PO_PTR values on real lots), and it supplies the certificate PDF, which
     * is what a reviewer is actually after. The archive is keyed by lot, so
     * the lots we already have are the whole input.
     *
     * Failure here is not failure of the report: findCertsForLots swallows
     * its own errors and returns what it has, so an unreachable archive costs
     * the cert links and nothing else.
     */
    const partsByLot: Record<string, string[]> = {}
    for (const m of materials) {
      if (!m.batchSerial) continue
      ;(partsByLot[m.batchSerial] ||= []).push(m.partNumber)
    }
    const certsByLot = await findCertsForLots(Object.keys(partsByLot), partsByLot)

    for (const m of materials as any[]) {
      const certs = certsByLot[m.batchSerial] || []
      m.certs = certs
      // Paradigm's PO never resolves today, so the archive is the only source
      // of a PO number. Flagged rather than silently substituted: a reviewer
      // should know the number came from the cert file, not from the ERP.
      if (!m.poNumber && certs.length) {
        const fromCert = certs.find(c => c.poNumber)
        if (fromCert) {
          m.poNumber = fromCert.poNumber
          m.poNumberSource = 'cert-archive'
        }
      } else if (m.poNumber) {
        m.poNumberSource = 'paradigm'
      }
      m.poNumberNormalized = normalizePoNumber(m.poNumber || '')
    }

    /**
     * Splits present in the result. The printed Paradigm report for
     * -354516-01-000 carries S3's quantities while its header shows the base
     * number, so which split a row belongs to is load-bearing information,
     * not a detail. Surfacing the list lets the UI say so plainly instead of
     * presenting one split's quantity as the job's.
     */
    const splits = Array.from(
      new Set(
        materials
          // Concise does not project the per-issue work order, so fall back
          // to the first/last the GROUP BY kept. Without this the splits
          // warning silently vanished in the default mode.
          .flatMap(m => [m.issuedToWorkOrder, m.firstWorkOrder, m.lastWorkOrder])
          .filter(Boolean)
      )
    ).sort()

    /**
     * The largest number of work orders any single summed row spans. Concise
     * sums across splits, and splits are apportionments of one issue rather
     * than separate consumption, so this is what tells the UI whether its
     * quantity column can be compared to a Paradigm page run for one split.
     */
    const maxWorkOrdersPerRow = materials.reduce(
      (n, m) => Math.max(n, m.workOrderCount ?? 1), 1
    )

    /**
     * An empty result has four very different causes — a different spelling
     * in the ledger, a job with nothing issued against it, a bad number, or a
     * ledger that does not reach back that far — and "no material issues
     * recorded" distinguishes none of them. Probe only on empty, so the
     * normal path costs nothing.
     *
     * Each probe is independent: one failing must not turn a legitimately
     * empty report into a 500, because empty is a valid answer.
     */
    let diagnostics: any = null
    if (!materials.length) {
      const probes = buildEmptyResultProbes(workOrder)
      const run = async (q: { sql: string; params: Record<string, unknown> }) => {
        try { return await queryMSSQL<any[]>(READ_CONN, q.sql, q.params) }
        catch { return null }
      }
      const [ledger, header, coverage] = await Promise.all([
        run(probes.ledger), run(probes.header), run(probes.coverage),
      ])

      const spellings = (ledger || []).map((r: any) => ({
        tranSource: str(r.TranSource),
        tranType: str(r.TranType),
        rows: num(r.Rows),
        firstTran: r.FirstTran ?? null,
        lastTran: r.LastTran ?? null,
      }))
      const headers = (header || []).map((r: any) => str(r.WorkOrderNumber)).filter(Boolean)
      const cov = coverage?.[0] || null

      // The one spelling worth offering as a retry: same normalised job
      // number, different text. That is a search problem we can fix with a
      // click rather than a data problem.
      const wantNorm = normalizeWorkOrder(workOrder)
      const sameJob = spellings.filter(sp => normalizeWorkOrder(sp.tranSource) === wantNorm)

      diagnostics = {
        reason: sameJob.length
          ? 'spelling'
          : spellings.length
            ? 'related-only'
            : headers.length
              ? 'job-exists-no-issues'
              : 'not-found',
        spellings,
        sameJobSpellings: sameJob.map(sp => sp.tranSource),
        workOrderHeaders: headers,
        ledgerCoverage: cov && {
          totalRows: num(cov.TotalRows),
          oldest: cov.Oldest ?? null,
          newest: cov.Newest ?? null,
        },
      }
    }

    return NextResponse.json({
      success: true,
      workOrder,
      options: opts,
      splits,
      maxWorkOrdersPerRow,
      certsFound: materials.reduce((n, m: any) => n + (m.certs?.length ? 1 : 0), 0),
      deepestLevel: materials.reduce((d, m) => Math.max(d, m.level), 0),
      diagnostics,
      materials,
    })
  } catch (error) {
    console.error('Error fetching raw material traceability:', error)
    return NextResponse.json({
      error: 'Failed to fetch raw material traceability',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
