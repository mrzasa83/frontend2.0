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
 * TP CONVENTION — important:
 *   The Analysis sheet uses the RADIAL vector above. The CMM's own TP column
 *   reports the DIAMETRIC value, which is exactly 2x the radial figure, and it
 *   is that diametric number the tolerance (e.g. 0.003) is written against.
 *   Because Cpk depends on which one you use, the mode is selectable.
 */

export type TPMode = 'radial' | 'diametric'

export type FeatureRow = {
  feature: string
  xActual: number
  xNominal: number
  yActual: number
  yNominal: number
  xDelta: number
  yDelta: number
  tp: number          // per selected mode
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
  usl: number
  cpk: number | null
  cp: number | null
  cpu: number | null
  sigmaLevel: number | null
  outOfSpec: number
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

/** Compute TP from deltas for the chosen convention. */
export function tpFrom(xDelta: number, yDelta: number, mode: TPMode): number {
  const radial = Math.sqrt(xDelta * xDelta + yDelta * yDelta)
  return mode === 'diametric' ? radial * 2 : radial
}

/**
 * Parse the CMM sheet (array-of-arrays, first row = header) into feature rows.
 * Tolerant of the Feature column only being set on the group's first row.
 */
export function parseCmmSheet(aoa: any[][], mode: TPMode): ParseResult {
  if (!aoa || aoa.length < 2) {
    return { ok: false, error: 'The sheet is empty.', rows: [], uslFromFile: null, skipped: 0 }
  }

  // Locate the header row (usually row 0) and the columns we need by name.
  // Two export vintages exist: newer files label column B "Coef" and the
  // tolerance "High Tol"; older ones use "Tol" and "Tol+".
  let headerIdx = -1
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const cells = (aoa[i] || []).map(c => asStr(c).toLowerCase())
    const hasCoef = cells.includes('coef') || cells.includes('tol')
    if (cells.includes('feature') && hasCoef && cells.includes('actual')) {
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
  const cFeature = col('feature'), cCoef = col('coef', 'tol'), cActual = col('actual')
  const cNominal = col('nominal'), cHighTol = col('high tol', 'tol+')
  if (cFeature < 0 || cCoef < 0 || cActual < 0 || cNominal < 0) {
    return {
      ok: false,
      error: 'Missing one of the required columns: Feature, Coef (or Tol), Actual, Nominal.',
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
      tp: tpFrom(xDelta, yDelta, mode),
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
export function computeStats(rows: FeatureRow[], usl: number): Stats {
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

  const cpu = sd > 0 ? (usl - mean) / (3 * sd) : null
  return {
    n, mean, sd,
    min: Math.min(...tps), max: Math.max(...tps),
    range: Math.max(...tps) - Math.min(...tps),
    usl,
    cpk: cpu, cp: cpu, cpu,
    sigmaLevel: cpu !== null ? cpu * 3 : null,
    outOfSpec: tps.filter(t => t > usl).length,
    meanX, meanY, sdX, sdY,
  }
}

/** Histogram bins over the TP values. */
export function histogram(rows: FeatureRow[], binCount = 12) {
  const tps = rows.map(r => r.tp)
  const min = Math.min(...tps)
  const max = Math.max(...tps)
  const span = max - min || 1
  const width = span / binCount
  const bins = Array.from({ length: binCount }, (_, i) => ({
    start: min + i * width,
    end: min + (i + 1) * width,
    label: (min + i * width).toFixed(5),
    count: 0,
  }))
  for (const t of tps) {
    let idx = Math.floor((t - min) / width)
    if (idx >= binCount) idx = binCount - 1
    if (idx < 0) idx = 0
    bins[idx].count++
  }
  return bins
}
