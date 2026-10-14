import { queryPrimary } from '@/lib/db/mysql-primary'
import { queryMSSQL, clampMSSQLTimeout } from '@/lib/db/mssql'

/**
 * Product Changes — reason-for-change analysis.
 *
 * Twelve months of CLOSED MCNs grouped by the legacy "Reason Change Needed"
 * field, set against Paradigm's poor-methodizing rejects on the same parts.
 *
 * WHAT THE DATA SURVEY ESTABLISHED (sql/diag_mcn_reason_analysis.sql)
 *
 *   chngreason is clean. 3,268 closed records in the window, one reason each,
 *   no multi-value, and the twelve values are exactly the legacy form's radio
 *   options. The counts add up to the population exactly, so a ranking over
 *   this field is sound.
 *
 *   partnum is the join key, not toolnum. They differ on 857 of the 3,268
 *   records, and against DATA0050 a sample matched 10/10 on partnum and 8/10
 *   on toolnum.
 *
 *   Poor methodizing is EIGHTEEN reject codes, not one: nine descriptions,
 *   each existing with a D and an R prefix. A keyword hunt for '%METHOD%'
 *   finds almost none of them, because the description is abbreviated
 *   "METHDZNG" — matching on the description prefix is what works, and the
 *   code is carried through so any match can be audited.
 *
 *   The reject side is THIN: 91 transactions in twelve months, 0.54% of all
 *   rejects, against 16,757 total. The quantity is more substantial — 3,636
 *   pieces — so the overlap is reported as an exact list of parts rather than
 *   as a rate, and no causal claim is made from it.
 */

/* ───────────────────────────── taxonomy ───────────────────────────── */

export type ReasonKind =
  | 'error'          // somebody got something wrong
  | 'rework'         // manufacturing had to redo it
  | 'change'         // a deliberate change to what the part is
  | 'improvement'    // a better way of making it
  | 'external'       // the customer asked
  | 'unclassified'   // "Other" — a reason was given, just not a useful one
  | 'unrecorded'     // left blank

export type ReasonMeta = { team: string; kind: ReasonKind }

/**
 * Reason -> owning team and what kind of event it is.
 *
 * THE SPLIT MATTERS MORE THAN THE RANKING. Only four of the twelve reasons
 * describe an error, and together they are 467 of 3,268 records — 14%. The
 * largest single reason, Process Enhancement at 1,501, is a deliberate
 * improvement and attributing it to a team as a fault would be a
 * misreading of the data. So the report ranks errors separately and never
 * presents one league table over the whole population.
 *
 * Edit this map rather than the queries: the team names are a business
 * judgement and will be argued about, and nothing downstream hardcodes them.
 */
export const REASON_TAXONOMY: Record<string, ReasonMeta> = {
  'PPE Error':            { team: 'PPE',                  kind: 'error' },
  'CAM Error':            { team: 'CAM',                  kind: 'error' },
  'Paradigm Input Error': { team: 'Paradigm Data Entry',  kind: 'error' },
  'P&S Template':         { team: 'Packaging & Shipping', kind: 'error' },
  'MFG Rework':           { team: 'Manufacturing',        kind: 'rework' },
  'BOM Change':           { team: 'Engineering',          kind: 'change' },
  'Process Enhancement':  { team: 'Process Engineering',  kind: 'improvement' },
  'Process Guidelines':   { team: 'Process Engineering',  kind: 'improvement' },
  'New Process':          { team: 'Process Engineering',  kind: 'improvement' },
  'Customer':             { team: 'Customer',             kind: 'external' },
  'Other':                { team: '',                     kind: 'unclassified' },
}

export const UNRECORDED: ReasonMeta = { team: '', kind: 'unrecorded' }

export function metaFor(reason: string): ReasonMeta {
  const r = (reason || '').trim()
  if (!r) return UNRECORDED
  return REASON_TAXONOMY[r] || { team: '', kind: 'unclassified' }
}

/* ───────────────────────────── MCN side ───────────────────────────── */

/**
 * closeddate is a STRING like '14Oct2026', so every date comparison goes
 * through STR_TO_DATE. 67 closed records out of 65,212 fail to parse and are
 * excluded — reported in the output rather than silently dropped.
 *
 * MIN/MAX are taken on the PARSED date, not the raw column: the survey's own
 * first/last columns came back nonsense ("last" earlier than "first") because
 * MIN on '01Apr2026' against '31Oct2025' sorts alphabetically.
 */
const MCN_SQL = `
  SELECT
    id, request, toolnum, partnum, customer, pe, ppe, closedby,
    TRIM(COALESCE(chngreason, ''))  AS chngreason,
    TRIM(COALESCE(chngeffect, ''))  AS chngeffect,
    TRIM(COALESCE(software, ''))    AS software,
    TRIM(COALESCE(wip, ''))         AS wip,
    TRIM(COALESCE(\`change\`, ''))   AS change_text,
    TRIM(COALESCE(reason, ''))      AS reason_text,
    closeddate,
    STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') AS closed_on
  FROM mcn
  WHERE mcn_status = 1
    AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') <= CURDATE()
  ORDER BY closed_on DESC`

/** Closed records whose date could not be parsed — excluded from everything
 *  above, counted so the population is honest about what it left out. */
const UNPARSEABLE_SQL = `
  SELECT COUNT(*) AS n FROM mcn
  WHERE mcn_status = 1 AND STR_TO_DATE(NULLIF(closeddate,''), '%d%b%Y') IS NULL`

/* ─────────────────────────── Paradigm side ─────────────────────────── */

/**
 * Poor-methodizing rejects, by DESCRIPTION PREFIX rather than a code list.
 *
 * The family is eighteen codes — nine descriptions each existing as D and R —
 * and new ones get added over the years. Matching 'POOR METHDZNG,%' catches
 * the family including any added since; the code comes back on every row so a
 * reader can see exactly which one matched.
 *
 * The join chain is the one the Rejects tab already uses:
 *   DATA0058 -> DATA0056 -> DATA0006 -> DATA0050 (customer part)
 */
const REJECT_SQL = `
  SELECT
      LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) AS CustomerPart,
      LTRIM(RTRIM(d6.WORK_ORDER_NUMBER))     AS WorkOrder,
      LTRIM(RTRIM(d39.REJ_CODE))             AS RejCode,
      LTRIM(RTRIM(d39.REJECT_DESCRIPTION))   AS RejDescription,
      LTRIM(RTRIM(d39.REJECT_DEFECT_FLAG))   AS DefectFlag,
      d58.TDATE                              AS RejectDate,
      d58.QTY_REJECT                         AS Quantity
  FROM DATA0058 d58 WITH (NOLOCK)
  LEFT JOIN DATA0056 d56 WITH (NOLOCK) ON d56.RKEY = d58.TPUT_PTR
  LEFT JOIN DATA0006 d6  WITH (NOLOCK) ON d6.RKEY  = d56.WO_PTR
  LEFT JOIN DATA0050 d50 WITH (NOLOCK) ON d50.RKEY = d6.CUST_PART_PTR
  JOIN      DATA0039 d39 WITH (NOLOCK) ON d39.RKEY = d58.REJECT_PTR
  WHERE d58.TDATE >= DATEADD(MONTH, -@months, CAST(GETDATE() AS DATE))
    AND d39.REJECT_DESCRIPTION LIKE 'POOR METHDZNG,%'
  ORDER BY d58.TDATE DESC`

/* ───────────────────────────── assembly ───────────────────────────── */

const norm = (s: any) => String(s ?? '').trim().toUpperCase()

export type AnalysisOptions = { months?: number; timeoutMs?: number }

export async function buildChangeAnalysis(opts: AnalysisOptions = {}) {
  const months = Math.min(Math.max(Number(opts.months) || 12, 1), 60)

  const [mcnRows, unparseable, rejectRows] = await Promise.all([
    queryPrimary<any[]>(MCN_SQL, [months]),
    queryPrimary<any[]>(UNPARSEABLE_SQL),
    queryMSSQL<any[]>('1', REJECT_SQL, { months }, clampMSSQLTimeout(opts.timeoutMs))
      // Paradigm being unreachable must not lose the MCN half of the report,
      // which stands on its own.
      .catch(() => null),
  ])

  const mcns = mcnRows || []

  /* Reasons, ranked, with the kind that decides how they may be read. */
  const byReason = new Map<string, { reason: string; meta: ReasonMeta; count: number }>()
  for (const m of mcns) {
    const reason = String(m.chngreason || '').trim() || '(not recorded)'
    const key = reason
    const cur = byReason.get(key)
    if (cur) cur.count++
    else byReason.set(key, { reason, meta: metaFor(m.chngreason), count: 1 })
  }
  const reasons = Array.from(byReason.values()).sort((a, b) => b.count - a.count)

  /* Teams, but only over the reasons that describe something going wrong. */
  const errorKinds = new Set<ReasonKind>(['error', 'rework'])
  const byTeam = new Map<string, { team: string; count: number; reasons: Record<string, number> }>()
  for (const r of reasons) {
    if (!errorKinds.has(r.meta.kind) || !r.meta.team) continue
    const t = byTeam.get(r.meta.team) || { team: r.meta.team, count: 0, reasons: {} }
    t.count += r.count
    t.reasons[r.reason] = (t.reasons[r.reason] || 0) + r.count
    byTeam.set(r.meta.team, t)
  }
  const teams = Array.from(byTeam.values()).sort((a, b) => b.count - a.count)

  /* Kind totals — the framing the ranking has to be read against. */
  const byKind = new Map<ReasonKind, number>()
  for (const r of reasons) byKind.set(r.meta.kind, (byKind.get(r.meta.kind) || 0) + r.count)

  /* Month by month, on the PARSED date. */
  const byMonth = new Map<string, number>()
  for (const m of mcns) {
    const d = m.closed_on ? new Date(m.closed_on) : null
    if (!d || isNaN(d.getTime())) continue
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    byMonth.set(k, (byMonth.get(k) || 0) + 1)
  }
  const months_ = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }))

  /* The overlap: parts carrying BOTH a closed MCN and a poor-methodizing
     reject. Joined in JS because the two live on different servers. */
  const mcnByPart = new Map<string, any[]>()
  for (const m of mcns) {
    const p = norm(m.partnum)
    if (!p) continue
    ;(mcnByPart.get(p) || mcnByPart.set(p, []).get(p)!).push(m)
  }

  const rejects = rejectRows || []
  const overlap = new Map<string, any>()
  for (const r of rejects) {
    const p = norm(r.CustomerPart)
    const related = p ? mcnByPart.get(p) : null
    if (!related?.length) continue
    const row = overlap.get(p) || {
      part: String(r.CustomerPart || '').trim(),
      rejectTransactions: 0,
      rejectQuantity: 0,
      rejectCodes: new Set<string>(),
      mcns: related.map((m: any) => ({
        request: m.request, reason: m.chngreason || '(not recorded)',
        closedOn: m.closed_on, pe: m.pe, team: metaFor(m.chngreason).team,
      })),
    }
    row.rejectTransactions++
    row.rejectQuantity += Number(r.Quantity || 0)
    row.rejectCodes.add(`${r.RejCode} ${r.RejDescription}`)
    overlap.set(p, row)
  }
  const overlapRows = Array.from(overlap.values())
    .map(r => ({ ...r, rejectCodes: Array.from(r.rejectCodes).sort() }))
    .sort((a, b) => b.rejectQuantity - a.rejectQuantity)

  return {
    generatedAt: new Date().toISOString(),
    months,
    population: {
      closedInWindow: mcns.length,
      excludedUnparseableDate: Number(unparseable?.[0]?.n) || 0,
      withPartNumber: mcnByPart.size,
    },
    reasons,
    teams,
    kinds: Array.from(byKind.entries()).map(([kind, count]) => ({ kind, count })),
    byMonth: months_,
    rejects: rejectRows === null
      ? { available: false as const, transactions: 0, quantity: 0, parts: 0 }
      : {
          available: true as const,
          transactions: rejects.length,
          quantity: rejects.reduce((n: number, r: any) => n + Number(r.Quantity || 0), 0),
          parts: new Set(rejects.map((r: any) => norm(r.CustomerPart)).filter(Boolean)).size,
        },
    overlap: overlapRows,
  }
}
