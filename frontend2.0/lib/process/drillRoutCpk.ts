/**
 * Drill/Rout Cpk — parsing and statistics.
 *
 * INPUT FORMAT (CMM export, "Sheet1"):
 *   Header row: Feature | Coef | Actual | Nominal | Low Tol | High Tol | Bonus | Result | Deviation
 *   Each feature ("Circle 6", ...) spans several rows, one per Coef:
 *     X  -> Actual/Nominal for the X axis
 *     Y  -> Actual/Nominal for the Y axis
 *     R, D -> radius / diameter (not used here)
 *     TP -> the CMM's own true-position value; its High Tol is the tolerance (USL)
 *   The Feature cell is only populated on the first row of each group.
 *
 * MATH (mirrors the "Analysis" worksheet):
 *   X Delta = X Nominal - X Actual      (Analysis col I)
 *   Y Delta = Y Nominal - Y Actual      (Analysis col J)
 *   TP      = SQRT(XDelta^2 + YDelta^2) (Analysis col K)
 *
 *   X and Y are simply the measured location of the point; TP is the vector
 *   formed by their two deviations.
 */

export type FeatureRow = {
  feature: string
  xActual: number
  xNominal: number
  yActual: number
  yNominal: number
  xDelta: number
  yDelta: number
  tp: number          // vector of the X and Y deviations
  cmmTp: number | null // the CMM's own TP value, when present
}

export type ParseResult = {
  ok: boolean
  error?: string
  rows: FeatureRow[]
  uslFromFile: number | null
  skipped: number
}

export type Stats = {
  n: number
  mean: number
  sd: number
  min: number
  max: number
  range: number
  lsl: number
  usl: number
  cpk: number | null
  cp: number | null
  cpu: number | null
  cpl: number | null
  sigmaLevel: number | null
  outOfSpec: number
  belowLsl: number
  aboveUsl: number
  meanX: number
  meanY: number
  sdX: number
  sdY: number
}

const asNum = (v: any): number | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return isFinite(v) ? v : null
  const s = String(v).trim()
  if (!s) return null
  const n = Number(s)
  return isFinite(n) ? n : null
}
const asStr = (v: any) => (v === null || v === undefined ? '' : String(v).trim())

/** The vector of the X and Y deviations: sqrt(dx^2 + dy^2). */
export function tpFrom(xDelta: number, yDelta: number): number {
  return Math.sqrt(xDelta * xDelta + yDelta * yDelta)
}

/** True when the column actually holds X/Y axis markers. */
function columnLooksLikeCoef(aoa: any[][], headerIdx: number, idx: number): boolean {
  if (idx < 0) return false
  let x = 0, y = 0
  for (let i = headerIdx + 1; i < Math.min(aoa.length, headerIdx + 60); i++) {
    const v = String((aoa[i] || [])[idx] ?? '').trim().toUpperCase()
    if (v === 'X') x++
    else if (v === 'Y') y++
  }
  return x > 0 && y > 0
}

/** Find the coefficient column by content when the header isn't recognisable. */
function detectCoefColumn(aoa: any[][], headerIdx: number): number {
  const width = Math.max(...aoa.slice(0, 50).map(r => (r || []).length), 0)
  let best = -1, bestScore = 0
  for (let c = 0; c < width; c++) {
    let score = 0, sawX = false, sawY = false
    for (let i = headerIdx + 1; i < Math.min(aoa.length, headerIdx + 60); i++) {
      const v = String((aoa[i] || [])[c] ?? '').trim().toUpperCase()
      if (v === 'X') { score++; sawX = true }
      else if (v === 'Y') { score++; sawY = true }
      else if (v === 'TP' || v === 'R' || v === 'D') score++
    }
    if (sawX && sawY && score > bestScore) { bestScore = score; best = c }
  }
  return best
}

/**
 * Parse the CMM sheet (array-of-arrays, first row = header) into feature rows.
 * Tolerant of the Feature column only being set on the group's first row.
 */
export function parseCmmSheet(aoa: any[][]): ParseResult {
  if (!aoa || aoa.length < 2) {
    return { ok: false, error: 'The sheet is empty.', rows: [], uslFromFile: null, skipped: 0 }
  }

  // Locate the header row (usually row 0). Columns are found BY NAME, never by
  // position, so the coefficient column can sit in B, C or anywhere else.
  // Export vintages differ: newer files label it "Coef" with tolerance
  // "High Tol"; older ones use "Tol" and "Tol+".
  const COEF_NAMES = ['coef', 'coeff', 'coefficient', 'tol', 'axis', 'char', 'characteristic']
  let headerIdx = -1
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const cells = (aoa[i] || []).map(c => asStr(c).toLowerCase())
    if (cells.includes('feature') && cells.includes('actual')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) {
    return {
      ok: false,
      error: 'Unrecognized format — expected a header row with Feature, Coef (or Tol), Actual and Nominal columns.',
      rows: [], uslFromFile: null, skipped: 0,
    }
  }
  const header = (aoa[headerIdx] || []).map(c => asStr(c).toLowerCase())
  const col = (...names: string[]) => {
    for (const n of names) { const i = header.indexOf(n); if (i >= 0) return i }
    return -1
  }
  const cFeature = col('feature'), cActual = col('actual')
  const cNominal = col('nominal'), cHighTol = col('high tol', 'tol+')

  // The coefficient column: prefer a recognised header, otherwise find the
  // column whose values actually carry the X / Y / TP markers. This keeps the
  // parser working when the column is unlabelled or named something new.
  let cCoef = col(...COEF_NAMES)
  if (cCoef < 0 || !columnLooksLikeCoef(aoa, headerIdx, cCoef)) {
    const detected = detectCoefColumn(aoa, headerIdx)
    if (detected >= 0) cCoef = detected
  }

  if (cFeature < 0 || cCoef < 0 || cActual < 0 || cNominal < 0) {
    return {
      ok: false,
      error: 'Missing a required column. Expected Feature, a coefficient column holding the X/Y markers, Actual and Nominal.',
      rows: [], uslFromFile: null, skipped: 0,
    }
  }

  type Acc = {
    feature: string
    xActual?: number; xNominal?: number
    yActual?: number; yNominal?: number
    cmmTp?: number; usl?: number
  }
  const groups: Acc[] = []
  let cur: Acc | null = null

  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const r = aoa[i] || []
    const feat = asStr(r[cFeature])
    const coef = asStr(r[cCoef]).toUpperCase()
    if (feat) { cur = { feature: feat }; groups.push(cur) }
    if (!cur) continue

    const actual = asNum(r[cActual])
    const nominal = asNum(r[cNominal])
    if (coef === 'X') { if (actual !== null) cur.xActual = actual; if (nominal !== null) cur.xNominal = nominal }
    else if (coef === 'Y') { if (actual !== null) cur.yActual = actual; if (nominal !== null) cur.yNominal = nominal }
    else if (coef === 'TP') {
      if (actual !== null) cur.cmmTp = actual
    }
    // Tolerance: newer files carry it on the labelled TP row; older exports leave
    // the TP row's coef blank, so take the last tolerance seen in the group (the
    // TP row is always the group's final row).
    if (cHighTol >= 0 && coef !== 'X' && coef !== 'Y') {
      const ht = asNum(r[cHighTol])
      if (ht !== null) { cur.usl = ht; if (coef !== 'TP' && actual !== null) cur.cmmTp = actual }
    }
  }

  const rows: FeatureRow[] = []
  let skipped = 0
  let uslFromFile: number | null = null
  for (const g of groups) {
    if (g.usl !== undefined && uslFromFile === null) uslFromFile = g.usl
    if (g.xActual === undefined || g.xNominal === undefined ||
        g.yActual === undefined || g.yNominal === undefined) { skipped++; continue }
    const xDelta = g.xNominal - g.xActual
    const yDelta = g.yNominal - g.yActual
    rows.push({
      feature: g.feature,
      xActual: g.xActual, xNominal: g.xNominal,
      yActual: g.yActual, yNominal: g.yNominal,
      xDelta, yDelta,
      tp: tpFrom(xDelta, yDelta),
      cmmTp: g.cmmTp ?? null,
    })
  }

  if (!rows.length) {
    return {
      ok: false,
      error: 'No complete X/Y feature pairs were found in this file.',
      rows: [], uslFromFile, skipped,
    }
  }
  return { ok: true, rows, uslFromFile, skipped }
}

/**
 * Process statistics for true position.
 * TP is a one-sided characteristic bounded at zero, so Cpk = Cpu = (USL - mean)/(3s).
 * Cp is reported on the same one-sided basis for reference.
 */
export function computeStats(rows: FeatureRow[], usl: number, lsl = 0): Stats {
  const n = rows.length
  const tps = rows.map(r => r.tp)
  const mean = tps.reduce((a, b) => a + b, 0) / n
  const variance = n > 1 ? tps.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0
  const sd = Math.sqrt(variance)

  const xs = rows.map(r => r.xDelta)
  const ys = rows.map(r => r.yDelta)
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  const sdX = Math.sqrt(n > 1 ? xs.reduce((a, b) => a + (b - meanX) ** 2, 0) / (n - 1) : 0)
  const sdY = Math.sqrt(n > 1 ? ys.reduce((a, b) => a + (b - meanY) ** 2, 0) / (n - 1) : 0)

  // Two-sided capability against the user's spec limits.
  //   Cpu = (USL - mean) / 3s     Cpl = (mean - LSL) / 3s
  //   Cpk = min(Cpu, Cpl)         Cp  = (USL - LSL) / 6s
  const cpu = sd > 0 ? (usl - mean) / (3 * sd) : null
  const cpl = sd > 0 ? (mean - lsl) / (3 * sd) : null
  const cpk = cpu !== null && cpl !== null ? Math.min(cpu, cpl) : (cpu ?? cpl)
  const cp = sd > 0 ? (usl - lsl) / (6 * sd) : null

  const belowLsl = tps.filter(t => t < lsl).length
  const aboveUsl = tps.filter(t => t > usl).length
  return {
    n, mean, sd,
    min: Math.min(...tps), max: Math.max(...tps),
    range: Math.max(...tps) - Math.min(...tps),
    lsl, usl,
    cpk, cp, cpu, cpl,
    sigmaLevel: cpk !== null ? cpk * 3 : null,
    outOfSpec: belowLsl + aboveUsl,
    belowLsl, aboveUsl,
    meanX, meanY, sdX, sdY,
  }
}

/**
 * Histogram bins over the TP values.
 * Bins are built from the DATA range and the bucket count only — spec limits do
 * not widen them, so the bars keep their natural width and shape. The chart
 * widens its axis separately so LSL/USL still appear.
 */
export function histogram(rows: FeatureRow[], binCount = 12) {
  const tps = rows.map(r => r.tp)
  const min = Math.min(...tps)
  const max = Math.max(...tps)
  const span = max - min || 1
  const width = span / binCount
  const bins = Array.from({ length: binCount }, (_, i) => {
    const start = min + i * width
    const end = start + width
    return { start, end, mid: (start + end) / 2, label: start.toFixed(5), count: 0 }
  })
  for (const t of tps) {
    let idx = Math.floor((t - min) / width)
    if (idx >= binCount) idx = binCount - 1
    if (idx < 0) idx = 0
    bins[idx].count++
  }
  return bins
}

/**
 * Points for a normal curve fitted to the data, scaled to the histogram's counts
 * so the two can share one axis. Height = pdf(x) * n * binWidth.
 */
export function normalCurve(
  mean: number, sd: number, n: number, binWidth: number,
  from: number, to: number, points = 80,
) {
  if (!(sd > 0) || !isFinite(sd)) return []
  const step = (to - from) / (points - 1)
  const out: { x: number; curve: number }[] = []
  for (let i = 0; i < points; i++) {
    const x = from + i * step
    const z = (x - mean) / sd
    const pdf = Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI))
    out.push({ x, curve: pdf * n * binWidth })
  }
  return out
}
