import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Reason for Change Analysis, as a real PDF.
 *
 * Built with pdf-lib rather than printing the page, for the reason the switch
 * was asked for: the browser's print dialogue decides margins, scale, headers
 * and page breaks, and every reader's is set differently. Generating the
 * document means the table that must not split does not split, and the file
 * looks the same wherever it is opened.
 *
 * Landscape, because the widest table — a part, its counts, its reject codes
 * and every change against it — does not fit portrait without the text
 * becoming unreadable.
 *
 * pdf-lib is already a dependency here (the batch card uses it). A headless
 * browser would render the page more faithfully but would put Chromium in the
 * image for one report.
 */

const PAGE = { w: 792, h: 612 }   // US Letter, landscape
const M = 36

const INK = rgb(0.06, 0.09, 0.16)
const MUTED = rgb(0.42, 0.46, 0.52)
const FAINT = rgb(0.58, 0.62, 0.68)
const RULE = rgb(0.80, 0.84, 0.89)
const HEAD_BG = rgb(0.96, 0.97, 0.98)
const RED = rgb(0.72, 0.11, 0.11)
const RED_BG = rgb(0.996, 0.95, 0.95)
const AMBER = rgb(0.69, 0.42, 0.05)
const GREEN = rgb(0.09, 0.50, 0.30)
const BLUE = rgb(0.15, 0.39, 0.74)
const VIOLET = rgb(0.42, 0.25, 0.70)

const KIND_LABEL: Record<string, string> = {
  error: 'Errors', rework: 'Rework', change: 'Deliberate change',
  improvement: 'Process improvement', external: 'Customer-driven',
  unclassified: 'Other / unclassified', unrecorded: 'No reason recorded',
}
const KIND_INK: Record<string, ReturnType<typeof rgb>> = {
  error: RED, rework: AMBER, change: BLUE, improvement: GREEN,
  external: VIOLET, unclassified: MUTED, unrecorded: MUTED,
}

async function loadFonts(doc: PDFDocument) {
  doc.registerFontkit(fontkit)
  const dir = path.join(process.cwd(), 'assets', 'fonts')
  try {
    const [r, b, m] = await Promise.all([
      fs.readFile(path.join(dir, 'DejaVuSans.ttf')),
      fs.readFile(path.join(dir, 'DejaVuSans-Bold.ttf')),
      fs.readFile(path.join(dir, 'DejaVuSansMono.ttf')),
    ])
    return {
      regular: await doc.embedFont(r, { subset: true }),
      bold: await doc.embedFont(b, { subset: true }),
      mono: await doc.embedFont(m, { subset: true }),
    }
  } catch {
    // The runner image carries no font packages; Helvetica keeps the report
    // readable rather than failing over a missing file.
    const h = await doc.embedFont(StandardFonts.Helvetica)
    const hb = await doc.embedFont(StandardFonts.HelveticaBold)
    return { regular: h, bold: hb, mono: h }
  }
}

const clean = (s: any) => String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ')
const pct = (n: number, d: number) => d ? `${(n / d * 100).toFixed(1)}%` : '—'
const fmtDate = (v: any) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-US')
}

export async function renderChangeAnalysisPdf(data: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const { regular, bold, mono } = await loadFonts(doc)

  doc.setTitle('Reason for Change Analysis')
  doc.setSubject(`Closed Manufacturing Change Notices, last ${data.months} months`)
  doc.setProducer('Amphenol Printed Circuits — frontend2.0')

  let page!: PDFPage
  let y = 0
  let pageNo = 0
  const pages: PDFPage[] = []

  const width = (s: string, size: number, f: PDFFont) => f.widthOfTextAtSize(clean(s), size)

  const text = (s: string, x: number, size: number, f: PDFFont = regular, color = INK) => {
    page.drawText(clean(s), { x, y, size, font: f, color })
  }
  const textAt = (s: string, x: number, yy: number, size: number, f: PDFFont = regular, color = INK) => {
    page.drawText(clean(s), { x, y: yy, size, font: f, color })
  }
  /** Right-aligned, for every number column. */
  const textR = (s: string, right: number, size: number, f: PDFFont = regular, color = INK) => {
    page.drawText(clean(s), { x: right - width(s, size, f), y, size, font: f, color })
  }
  /** Truncate to fit a column rather than letting it run into the next one. */
  const fit = (s: string, max: number, size: number, f: PDFFont = regular) => {
    let t = clean(s)
    if (width(t, size, f) <= max) return t
    while (t.length > 1 && width(t + '…', size, f) > max) t = t.slice(0, -1)
    return t + '…'
  }

  /**
   * Break text onto as many lines as it needs, up to a cap.
   *
   * The change and reason text is the point of the bottom table, and
   * truncating it to one line loses the sentence that explains the row. The
   * cap stops one verbose record from taking a page to itself; when it bites,
   * the last line ends in an ellipsis so the reader knows there is more.
   */
  const wrap = (s: string, max: number, size: number, f: PDFFont, maxLines: number): string[] => {
    const words = clean(s).split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let line = ''
    for (const w of words) {
      const next = line ? `${line} ${w}` : w
      if (width(next, size, f) <= max) { line = next; continue }
      if (line) lines.push(line)
      line = w
      if (lines.length === maxLines) break
    }
    if (line && lines.length < maxLines) lines.push(line)
    if (lines.length === maxLines) {
      // Did anything not fit? If so, mark the last line.
      const used = lines.join(' ')
      if (used.length < clean(s).trim().length) {
        let last = lines[maxLines - 1]
        while (last.length > 1 && width(last + '…', size, f) > max) last = last.slice(0, -1)
        lines[maxLines - 1] = last + '…'
      }
    }
    return lines
  }

  const newPage = () => {
    page = doc.addPage([PAGE.w, PAGE.h])
    pages.push(page)
    pageNo++
    y = PAGE.h - M
    // Running header from page 2 on: a loose sheet should say what it is.
    if (pageNo > 1) {
      textAt('Reason for Change Analysis', M, y, 8, bold, MUTED)
      const t = `Last ${data.months} months`
      textAt(t, PAGE.w - M - width(t, 8, regular), y, 8, regular, FAINT)
      y -= 14
    }
  }
  /** Start a new page when the next block would not fit whole. */
  const need = (h: number) => { if (y - h < M + 18) newPage() }

  newPage()

  /* ─────────────────────────── title ─────────────────────────── */
  text('Reason for Change Analysis', M, 18, bold)
  y -= 16
  text(`Closed Manufacturing Change Notices, last ${data.months} months, with poor-methodizing rejects on the same parts.`,
    M, 9, regular, MUTED)
  y -= 11
  text(`Amphenol Printed Circuits · generated ${new Date(data.generatedAt).toLocaleString('en-US')}`,
    M, 8, regular, FAINT)
  y -= 10
  page.drawRectangle({ x: M, y, width: PAGE.w - 2 * M, height: 1.4, color: INK })
  y -= 18

  const total = data.population.closedInWindow || 0
  const errorTotal = (data.kinds || [])
    .filter((k: any) => k.kind === 'error' || k.kind === 'rework')
    .reduce((n: number, k: any) => n + k.count, 0)

  /* ─────────────────────────── stat tiles ─────────────────────────── */
  {
    const tiles: [string, string][] = [
      ['Closed MCNs', total.toLocaleString()],
      ['Errors & rework', `${errorTotal.toLocaleString()} · ${pct(errorTotal, total)}`],
      ['Poor-methodizing rejects', data.rejects.available
        ? `${data.rejects.transactions} · ${data.rejects.quantity.toLocaleString()} pcs`
        : 'unavailable'],
      ['Parts in both', String(data.overlap.length)],
    ]
    const gap = 10
    const w = (PAGE.w - 2 * M - gap * (tiles.length - 1)) / tiles.length
    const h = 38
    need(h + 10)
    tiles.forEach(([label, value], i) => {
      const x = M + i * (w + gap)
      page.drawRectangle({ x, y: y - h, width: w, height: h, borderColor: RULE, borderWidth: 0.7 })
      textAt(label.toUpperCase(), x + 8, y - 13, 6.5, regular, MUTED)
      textAt(fit(value, w - 16, 13, bold), x + 8, y - 30, 13, bold)
    })
    y -= h + 14
  }

  if (data.population.excludedUnparseableDate) {
    text(`${data.population.excludedUnparseableDate} closed records carry a close date that does not parse and are excluded from every figure here.`,
      M, 7.5, regular, FAINT)
    y -= 14
  }

  /* ─────────────────────────── how to read ─────────────────────────── */
  {
    const h = 34
    need(h + 8)
    page.drawRectangle({ x: M, y: y - h, width: PAGE.w - 2 * M, height: h,
      color: HEAD_BG, borderColor: RULE, borderWidth: 0.7 })
    textAt('How to read this', M + 8, y - 12, 8.5, bold)
    textAt(`Most changes are not mistakes. Of ${total.toLocaleString()} closed notices, ${errorTotal.toLocaleString()} (${pct(errorTotal, total)}) record an error or rework; the rest are improvements, deliberate`,
      M + 8, y - 22, 7.5, regular, MUTED)
    textAt('changes or customer requests. Team attribution below covers only the error and rework reasons — ranking every reason together would read as blame for work that went right.',
      M + 8, y - 30, 7.5, regular, MUTED)
    y -= h + 14
  }

  /* ─────────────────────── generic table helper ─────────────────────── */
  type Col = {
    label: string
    w: number
    align?: 'l' | 'r'
    /** Cell text. */
    get: (r: any) => string
    font?: PDFFont
    ink?: (r: any) => ReturnType<typeof rgb>
  }

  const table = (title: string, note: string, cols: Col[], rows: any[],
                 opts: { rowH?: number; zebra?: (r: any) => boolean } = {}) => {
    const rowH = opts.rowH ?? 13
    need(34 + rowH * Math.min(rows.length, 3))
    text(title, M, 10.5, bold)
    y -= 11
    if (note) { text(note, M, 7.5, regular, MUTED); y -= 10 }

    const drawHead = () => {
      page.drawRectangle({ x: M, y: y - 13, width: PAGE.w - 2 * M, height: 13, color: HEAD_BG })
      let x = M
      for (const c of cols) {
        const s = c.label.toUpperCase()
        if (c.align === 'r') textAt(s, x + c.w - 6 - width(s, 6.5, bold), y - 9.5, 6.5, bold, MUTED)
        else textAt(s, x + 6, y - 9.5, 6.5, bold, MUTED)
        x += c.w
      }
      y -= 13
    }
    drawHead()

    for (const r of rows) {
      if (y - rowH < M + 18) { newPage(); drawHead() }
      if (opts.zebra?.(r)) {
        page.drawRectangle({ x: M, y: y - rowH, width: PAGE.w - 2 * M, height: rowH, color: RED_BG })
      }
      let x = M
      const base = y - rowH + 4
      for (const c of cols) {
        const f = c.font || regular
        const ink = c.ink ? c.ink(r) : INK
        const s = fit(c.get(r), c.w - 12, 7.5, f)
        if (c.align === 'r') textAt(s, x + c.w - 6 - width(s, 7.5, f), base, 7.5, f, ink)
        else textAt(s, x + 6, base, 7.5, f, ink)
        x += c.w
      }
      page.drawLine({ start: { x: M, y: y - rowH }, end: { x: PAGE.w - M, y: y - rowH },
        thickness: 0.4, color: RULE })
      y -= rowH
    }
    y -= 16
  }

  const W = PAGE.w - 2 * M

  /* ─────────────────────── what kind of change ─────────────────────── */
  table('What kind of change', '',
    [
      { label: 'Kind', w: W * 0.30, get: r => KIND_LABEL[r.kind] || r.kind,
        ink: r => KIND_INK[r.kind] || INK },
      { label: 'Notices', w: W * 0.12, align: 'r', get: r => r.count.toLocaleString() },
      { label: 'Share', w: W * 0.12, align: 'r', get: r => pct(r.count, total) },
      { label: '', w: W * 0.46, get: () => '' },
    ],
    [...data.kinds].sort((a: any, b: any) => b.count - a.count))

  // The share bars, drawn over the blank fourth column of the table above.
  // Done after the fact because the table helper draws text, not geometry.

  /* ─────────────────────── errors by team ─────────────────────── */
  table('Errors and rework by team',
    `${errorTotal.toLocaleString()} notices · ${pct(errorTotal, total)} of all closed changes.`,
    [
      { label: 'Team', w: W * 0.22, get: r => r.team, font: bold },
      { label: 'Reasons', w: W * 0.46,
        get: r => Object.entries(r.reasons).map(([k, n]) => `${k} (${n})`).join(', ') },
      { label: 'Notices', w: W * 0.16, align: 'r', get: r => String(r.count) },
      { label: 'Share of errors', w: W * 0.16, align: 'r', get: r => pct(r.count, errorTotal) },
    ],
    data.teams)

  /* ─────────────────────── every reason ─────────────────────── */
  table('Every reason, ranked', '',
    [
      { label: 'Reason', w: W * 0.26, get: r => r.reason },
      { label: 'Kind', w: W * 0.22, get: r => KIND_LABEL[r.meta.kind] || r.meta.kind,
        ink: r => KIND_INK[r.meta.kind] || INK },
      { label: 'Team', w: W * 0.26, get: r => r.meta.team || '—', ink: () => MUTED },
      { label: 'Notices', w: W * 0.13, align: 'r', get: r => r.count.toLocaleString() },
      { label: 'Share', w: W * 0.13, align: 'r', get: r => pct(r.count, total) },
    ],
    data.reasons)

  /* ─────────────────────── closed per month ─────────────────────── */
  if (data.byMonth?.length) {
    const h = 70
    need(h + 26)
    text('Closed per month', M, 10.5, bold)
    y -= 14
    const max = Math.max(...data.byMonth.map((m: any) => m.count), 1)
    const slot = W / data.byMonth.length
    const barW = Math.min(slot - 6, 26)
    const baseY = y - h
    for (let i = 0; i < data.byMonth.length; i++) {
      const m = data.byMonth[i]
      const bh = Math.max((m.count / max) * (h - 12), 1)
      const x = M + i * slot + (slot - barW) / 2
      page.drawRectangle({ x, y: baseY, width: barW, height: bh, color: BLUE })
      const lbl = String(m.count)
      textAt(lbl, x + barW / 2 - width(lbl, 6, regular) / 2, baseY + bh + 3, 6, regular, MUTED)
      const ml = m.month.slice(2).replace('-', '/')
      textAt(ml, x + barW / 2 - width(ml, 6, regular) / 2, baseY - 8, 6, regular, FAINT)
    }
    page.drawLine({ start: { x: M, y: baseY }, end: { x: PAGE.w - M, y: baseY },
      thickness: 0.6, color: RULE })
    y = baseY - 22
  }

  /* ─────────────────── poor methodizing rejects ─────────────────── */
  {
    need(50)
    text('Poor Methodizing Rejects', M, 10.5, bold)
    y -= 12
    const note = data.rejects.available
      ? `Parts carrying both a closed change and a poor-methodizing reject. Paradigm recorded ${data.rejects.transactions} such reject transactions across ${data.rejects.parts} parts in this window (${data.rejects.quantity.toLocaleString()} pieces).`
      : 'Paradigm could not be reached, so the reject half of this report is missing. Everything above is unaffected.'
    text(note, M, 7.5, regular, MUTED)
    y -= 9
    text('Listed in full rather than as a rate — the population is too small for a percentage to mean anything, and a part appearing here is not evidence the change caused the reject.',
      M, 7.5, regular, MUTED)
    y -= 12

    if (data.overlapTotals) {
      const t = `${data.overlapTotals.parts} parts · ${data.overlapTotals.changes} changes · ${data.overlapTotals.rejects} rejects · ${data.overlapTotals.quantity.toLocaleString()} pieces`
      text(t, M, 8, bold)
      if (data.overlapTotals.flagged) {
        textAt(`${data.overlapTotals.flagged} highlighted: a PPE Error closed on a part that also took a poor-methodizing reject`,
          M + width(t, 8, bold) + 14, y, 7.5, regular, RED)
      }
      y -= 14
    }

    const rows = data.overlap || []
    if (!rows.length) {
      text('No part carries both in this window.', M, 8, regular, MUTED)
      y -= 14
    } else {
      const cw = { part: W * 0.10, ch: W * 0.06, rj: W * 0.06, pcs: W * 0.07, code: W * 0.20, chg: W * 0.51 }
      const drawHead = () => {
        page.drawRectangle({ x: M, y: y - 13, width: W, height: 13, color: HEAD_BG })
        const h = (s: string, x: number, w: number, right = false) => {
          const t = s.toUpperCase()
          textAt(t, right ? x + w - 6 - width(t, 6.5, bold) : x + 6, y - 9.5, 6.5, bold, MUTED)
        }
        let x = M
        h('Part', x, cw.part);                x += cw.part
        h('Changes', x, cw.ch, true);         x += cw.ch
        h('Rejects', x, cw.rj, true);         x += cw.rj
        h('Pieces', x, cw.pcs, true);         x += cw.pcs
        h('Reject codes', x, cw.code);        x += cw.code
        h('Closed changes', x, cw.chg)
        y -= 13
      }
      drawHead()

      for (const o of rows) {
        /**
         * A row's height depends on how many changes it carries and how long
         * their text is, so it is measured before anything is drawn — a row
         * split across a page break would separate a change from its part.
         */
        const lines: { text: string; indent: number; size: number; f: PDFFont; ink: any }[] = []
        const bodyW = cw.chg - 12 - 6
        for (const m of o.mcns) {
          lines.push({
            text: `${m.request}   ${m.reasonCode}${m.team ? ' · ' + m.team : ''}${m.closedOn ? ' · ' + fmtDate(m.closedOn) : ''}`,
            indent: 0, size: 7, f: bold, ink: KIND_INK[m.kind] || INK,
          })
          // Wrapped, not truncated: these two sentences are what the row is for.
          for (const [label, body, ink, cap] of [
            ['Change: ', m.changeText, INK, 3],
            ['Reason: ', m.reasonText, MUTED, 3],
          ] as const) {
            if (!body) continue
            const ws = wrap(label + body, bodyW, 6.5, regular, cap)
            ws.forEach(t => lines.push({ text: t, indent: 6, size: 6.5, f: regular, ink }))
          }
        }
        const codeLines = o.rejectCodes.reduce((n: number, c: string) =>
          n + wrap(c, cw.code - 12, 6.5, regular, 2).length, 0)
        const rowH = Math.max(lines.length * 9 + 6, codeLines * 8 + 6, 18)

        if (y - rowH < M + 18) { newPage(); drawHead() }

        if (o.hasPpeError) {
          page.drawRectangle({ x: M, y: y - rowH, width: W, height: rowH, color: RED_BG })
        }

        let x = M
        const top = y - 9
        textAt(fit(o.part, cw.part - 12, 7.5, mono), x + 6, top, 7.5, mono,
          o.hasPpeError ? RED : INK); x += cw.part
        const num = (s: string, w: number) => {
          textAt(s, x + w - 6 - width(s, 7.5, regular), top, 7.5, regular); x += w
        }
        num(String(o.changeCount), cw.ch)
        num(String(o.rejectTransactions), cw.rj)
        num(o.rejectQuantity.toLocaleString(), cw.pcs)

        // Wrapped too — the code is the identifier, but the description is
        // what tells a reader which kind of methodizing failure it was.
        let cy = top
        for (const c of o.rejectCodes) {
          for (const l of wrap(c, cw.code - 12, 6.5, regular, 2)) {
            textAt(l, x + 6, cy, 6.5, regular, MUTED)
            cy -= 8
          }
        }
        x += cw.code

        let my = top
        for (const l of lines) {
          textAt(fit(l.text, cw.chg - 12 - l.indent, l.size, l.f), x + 6 + l.indent, my, l.size, l.f, l.ink)
          my -= 9
        }

        page.drawLine({ start: { x: M, y: y - rowH }, end: { x: PAGE.w - M, y: y - rowH },
          thickness: 0.4, color: RULE })
        y -= rowH
      }
      y -= 14
    }
  }

  /* ─────────────────────────── sources ─────────────────────────── */
  need(40)
  page.drawLine({ start: { x: M, y }, end: { x: PAGE.w - M, y }, thickness: 0.6, color: RULE })
  y -= 11
  text(`Sources: MCN (node_app, ${total.toLocaleString()} closed records) and Paradigm DATA0058/DATA0039 rejects matched on DATA0050 customer part number.`,
    M, 7, regular, FAINT)
  y -= 9
  text('Reject family matched on the description prefix "POOR METHDZNG," which covers all eighteen codes in that family. Team attribution is a mapping maintained in lib/changes/changeAnalysis.ts, not a field in either database.',
    M, 7, regular, FAINT)

  /* Page numbers, once the total is known. */
  pages.forEach((p, i) => {
    const s = `Page ${i + 1} of ${pages.length}`
    p.drawText(s, {
      x: PAGE.w - M - regular.widthOfTextAtSize(s, 7), y: M - 14,
      size: 7, font: regular, color: FAINT,
    })
  })

  return doc.save()
}
