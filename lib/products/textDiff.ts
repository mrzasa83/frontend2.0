/**
 * A small line-and-word diff, for the side-by-side compare.
 *
 * Hand-rolled rather than pulling in a diff package: the project already
 * avoids a dependency for the cert ZIP writer, and what an editor-style
 * compare needs is only two things — an alignment of the two line lists, and
 * word-level highlighting inside the lines that changed.
 *
 * The alignment is a standard LCS. The matrix is O(n*m), which is fine for a
 * route (tens of steps, a few hundred lines) and guarded by MAX_LCS below so
 * an unexpectedly huge input degrades to a plain block diff instead of
 * allocating gigabytes.
 */

export type LineOp = 'equal' | 'modified' | 'added' | 'removed'

export type DiffLine = {
  op: LineOp
  /** 1-based line number on each side; null where that side has no line. */
  leftNo: number | null
  rightNo: number | null
  left: string | null
  right: string | null
  /** Word-level runs, only on 'modified' rows. */
  leftWords?: WordRun[]
  rightWords?: WordRun[]
}

export type WordRun = { text: string; changed: boolean }

export type DiffResult = {
  lines: DiffLine[]
  added: number
  removed: number
  modified: number
  /** added + removed + modified — the headline "how different is this". */
  changes: number
}

/** Above this the LCS matrix is not worth allocating; see diffLines(). */
const MAX_LCS = 1200

/**
 * How alike must two lines be to read as a change rather than as one line
 * removed and an unrelated one added? Below this they are shown separately,
 * because word-highlighting two unrelated sentences highlights all of both and
 * tells the reader nothing.
 */
const MODIFY_THRESHOLD = 0.4

export function diffLines(leftText: string[], rightText: string[]): DiffResult {
  const a = leftText
  const b = rightText

  const raw: DiffLine[] = (a.length > MAX_LCS || b.length > MAX_LCS)
    ? blockDiff(a, b)
    : lcsDiff(a, b)

  // Pair an adjacent removed/added run into 'modified' rows, which is what
  // makes a side-by-side read as "this line changed" rather than as two
  // separate events on opposite sides of the gutter.
  const lines = pairRuns(raw)

  let added = 0, removed = 0, modified = 0
  for (const l of lines) {
    if (l.op === 'added') added++
    else if (l.op === 'removed') removed++
    else if (l.op === 'modified') modified++
  }
  return { lines, added, removed, modified, changes: added + removed + modified }
}

/* ────────────────────────────── alignment ────────────────────────────── */

function lcsDiff(a: string[], b: string[]): DiffLine[] {
  const n = a.length, m = b.length
  // Int32Array rather than nested arrays: one allocation, and the matrix for
  // a 1200x1200 worst case is ~5.8MB instead of 1200 JS arrays.
  const w = m + 1
  const dp = new Int32Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] = a[i] === b[j]
        ? dp[(i + 1) * w + (j + 1)] + 1
        : Math.max(dp[(i + 1) * w + j], dp[i * w + (j + 1)])
    }
  }

  const out: DiffLine[] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ op: 'equal', leftNo: i + 1, rightNo: j + 1, left: a[i], right: b[j] })
      i++; j++
    } else if (dp[(i + 1) * w + j] >= dp[i * w + (j + 1)]) {
      out.push({ op: 'removed', leftNo: i + 1, rightNo: null, left: a[i], right: null })
      i++
    } else {
      out.push({ op: 'added', leftNo: null, rightNo: j + 1, left: null, right: b[j] })
      j++
    }
  }
  while (i < n) { out.push({ op: 'removed', leftNo: i + 1, rightNo: null, left: a[i], right: null }); i++ }
  while (j < m) { out.push({ op: 'added', leftNo: null, rightNo: j + 1, left: null, right: b[j] }); j++ }
  return out
}

/**
 * Fallback for inputs too large to align properly: trims the common head and
 * tail and calls everything between them changed. Crude, but honest — and it
 * never claims a pairing it did not compute.
 */
function blockDiff(a: string[], b: string[]): DiffLine[] {
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head++
  let tail = 0
  while (tail < a.length - head && tail < b.length - head
    && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++

  const out: DiffLine[] = []
  for (let k = 0; k < head; k++) {
    out.push({ op: 'equal', leftNo: k + 1, rightNo: k + 1, left: a[k], right: b[k] })
  }
  for (let k = head; k < a.length - tail; k++) {
    out.push({ op: 'removed', leftNo: k + 1, rightNo: null, left: a[k], right: null })
  }
  for (let k = head; k < b.length - tail; k++) {
    out.push({ op: 'added', leftNo: null, rightNo: k + 1, left: null, right: b[k] })
  }
  for (let k = 0; k < tail; k++) {
    const li = a.length - tail + k, ri = b.length - tail + k
    out.push({ op: 'equal', leftNo: li + 1, rightNo: ri + 1, left: a[li], right: b[ri] })
  }
  return out
}

/* ──────────────────────────── run pairing ──────────────────────────── */

function pairRuns(raw: DiffLine[]): DiffLine[] {
  const out: DiffLine[] = []
  let k = 0
  while (k < raw.length) {
    if (raw[k].op !== 'removed') { out.push(raw[k]); k++; continue }

    // Collect this removed run and the added run that follows it.
    const rem: DiffLine[] = []
    while (k < raw.length && raw[k].op === 'removed') { rem.push(raw[k]); k++ }
    const add: DiffLine[] = []
    while (k < raw.length && raw[k].op === 'added') { add.push(raw[k]); k++ }

    const pairs = Math.min(rem.length, add.length)
    for (let p = 0; p < pairs; p++) {
      const L = rem[p].left ?? '', R = add[p].right ?? ''
      if (similarity(L, R) >= MODIFY_THRESHOLD) {
        const [lw, rw] = diffWords(L, R)
        out.push({
          op: 'modified',
          leftNo: rem[p].leftNo, rightNo: add[p].rightNo,
          left: L, right: R, leftWords: lw, rightWords: rw,
        })
      } else {
        // Too unalike to call one a modification of the other — but they still
        // occupy the same row, so the two panes stay lined up.
        out.push({
          op: 'modified',
          leftNo: rem[p].leftNo, rightNo: add[p].rightNo,
          left: L, right: R,
          leftWords: [{ text: L, changed: true }],
          rightWords: [{ text: R, changed: true }],
        })
      }
    }
    for (let p = pairs; p < rem.length; p++) out.push(rem[p])
    for (let p = pairs; p < add.length; p++) out.push(add[p])
  }
  return out
}

/** Dice coefficient over word bags — cheap and good enough to decide whether
 *  two lines are versions of each other. */
function similarity(a: string, b: string): number {
  const wa = tokenize(a).filter(t => t.trim())
  const wb = tokenize(b).filter(t => t.trim())
  if (!wa.length && !wb.length) return 1
  if (!wa.length || !wb.length) return 0
  const bag = new Map<string, number>()
  for (const t of wa) bag.set(t, (bag.get(t) || 0) + 1)
  let hit = 0
  for (const t of wb) {
    const c = bag.get(t) || 0
    if (c > 0) { bag.set(t, c - 1); hit++ }
  }
  return (2 * hit) / (wa.length + wb.length)
}

/** Split keeping separators, so highlighting lands on words and the spacing
 *  and punctuation between them survives intact. */
function tokenize(s: string): string[] {
  return s.split(/(\s+|[.,;:/()[\]{}=<>"'|+\-*&%#@!?])/).filter(t => t !== '')
}

/* ──────────────────────────── word diff ──────────────────────────── */

const MAX_WORD_LCS = 400

/** Word-level LCS inside one changed line pair. */
export function diffWords(left: string, right: string): [WordRun[], WordRun[]] {
  const a = tokenize(left), b = tokenize(right)
  if (a.length > MAX_WORD_LCS || b.length > MAX_WORD_LCS) {
    return [[{ text: left, changed: true }], [{ text: right, changed: true }]]
  }

  const n = a.length, m = b.length, w = m + 1
  const dp = new Int32Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] = a[i] === b[j]
        ? dp[(i + 1) * w + (j + 1)] + 1
        : Math.max(dp[(i + 1) * w + j], dp[i * w + (j + 1)])
    }
  }

  const lw: WordRun[] = [], rw: WordRun[] = []
  const push = (runs: WordRun[], text: string, changed: boolean) => {
    const last = runs[runs.length - 1]
    if (last && last.changed === changed) last.text += text
    else runs.push({ text, changed })
  }

  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push(lw, a[i], false); push(rw, b[j], false); i++; j++
    } else if (dp[(i + 1) * w + j] >= dp[i * w + (j + 1)]) {
      push(lw, a[i], true); i++
    } else {
      push(rw, b[j], true); j++
    }
  }
  while (i < n) { push(lw, a[i], true); i++ }
  while (j < m) { push(rw, b[j], true); j++ }
  return [lw, rw]
}
