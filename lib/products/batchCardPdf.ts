import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { promises as fs } from 'fs'
import path from 'path'
import type { CardData } from './batchCardData'

/**
 * Batch card, laid out to match the Paradigm "CUSTOMER PART DETAILS" printout.
 *
 * The header block repeats on every page — only the page number changes —
 * because a card gets separated in the shop and any loose sheet has to identify
 * itself.
 */

const PAGE = { w: 612, h: 792 }   // US Letter portrait
const M = 40
const INK = rgb(0.05, 0.05, 0.08)
const MUTED = rgb(0.42, 0.46, 0.52)
const RULE = rgb(0.75, 0.79, 0.85)
const BAND = rgb(0.85, 0.91, 0.97)

/**
 * DejaVu Sans — metrically close to Verdana and freely licensed, which avoids
 * shipping a Microsoft font in the image. Embedded from the repo rather than
 * relying on a system font, since the runner image carries no font packages.
 * Falls back to Helvetica if the files are missing so a card still renders.
 */
async function loadFonts(doc: PDFDocument): Promise<{
  regular: PDFFont; bold: PDFFont; mono: PDFFont; monoBold: PDFFont
}> {
  doc.registerFontkit(fontkit)
  const dir = path.join(process.cwd(), 'assets', 'fonts')
  try {
    const [r, b, m, mb] = await Promise.all([
      fs.readFile(path.join(dir, 'DejaVuSans.ttf')),
      fs.readFile(path.join(dir, 'DejaVuSans-Bold.ttf')),
      fs.readFile(path.join(dir, 'DejaVuSansMono.ttf')),
      fs.readFile(path.join(dir, 'DejaVuSansMono-Bold.ttf')),
    ])
    return {
      regular: await doc.embedFont(r, { subset: true }),
      bold: await doc.embedFont(b, { subset: true }),
      mono: await doc.embedFont(m, { subset: true }),
      monoBold: await doc.embedFont(mb, { subset: true }),
    }
  } catch {
    const h = await doc.embedFont(StandardFonts.Helvetica)
    const hb = await doc.embedFont(StandardFonts.HelveticaBold)
    return { regular: h, bold: hb, mono: h, monoBold: hb }
  }
}

export type CardMeta = {
  /** DATA0005.EMPL_CODE for the person generating — shown as ID, top right. */
  employeeId: string
  operator: string
}

export async function renderBatchCard(card: CardData, meta: CardMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const { regular, bold, mono, monoBold } = await loadFonts(doc)

  const pages: PDFPage[] = []
  let page!: PDFPage
  let y = 0

  const text = (s: string, x: number, size: number, f: PDFFont = regular, color = INK) => {
    // Verdana covers far more than the standard fonts, but a stray control
    // character would still throw and lose the whole card.
    page.drawText(String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, ' '), {
      x, y, size, font: f, color,
    })
  }
  const rule = (color = RULE) =>
    page.drawLine({ start: { x: M, y }, end: { x: PAGE.w - M, y }, thickness: 0.7, color })

  const label = (s: string, x: number, yy: number) =>
    page.drawText(s, { x, y: yy, size: 7, font: bold, color: MUTED })

  /**
   * The block that repeats on every page — only the page number changes, since
   * a card gets separated in the shop and any loose sheet has to identify
   * itself. Returns the y to continue from.
   *
   * The right-hand column has its COLONS aligned, matching the Paradigm
   * printout: labels are right-aligned to a colon column, values start after it.
   */
  const drawHeader = () => {
    let hy = PAGE.h - M

    const centre = (str: string, size: number, f: PDFFont, yy: number) => {
      const w = f.widthOfTextAtSize(str, size)
      page.drawText(str, { x: (PAGE.w - w) / 2, y: yy, size, font: f, color: INK })
    }
    // Right column with a fixed colon position.
    const COLON_X = PAGE.w - M - 52
    const rightPair = (lbl: string, val: string, yy: number) => {
      const w = mono.widthOfTextAtSize(lbl, 8)
      page.drawText(lbl, { x: COLON_X - 4 - w, y: yy, size: 8, font: mono, color: INK })
      page.drawText(':', { x: COLON_X, y: yy, size: 8, font: mono, color: INK })
      page.drawText(String(val ?? ''), { x: COLON_X + 8, y: yy, size: 8, font: mono, color: INK })
    }

    centre('Amphenol Printed Circuits, Inc.', 10, monoBold, hy)
    rightPair('ID', meta.employeeId || '-', hy)
    hy -= 11
    centre('4.0 Live', 8, mono, hy)
    rightPair('Page', String(pages.length), hy)
    hy -= 11
    centre(card.kind === 'manufactured' ? 'MANUFACTURED PART DETAILS' : 'CUSTOMER PART DETAILS',
           10, monoBold, hy)
    page.drawText(new Date().toLocaleString(), {
      x: COLON_X - 4 - mono.widthOfTextAtSize(new Date().toLocaleString(), 8) + 60,
      y: hy, size: 8, font: mono, color: INK,
    })
    hy -= 16

    // Left field block: labels right-aligned to a colon column.
    const L_COLON = 150
    const row = (
      lbl: string, val: string, lblBold = true,
      lbl2?: string, val2?: string, lbl2Bold = true,
    ) => {
      const f = lblBold ? monoBold : mono
      const w = f.widthOfTextAtSize(lbl, 8)
      page.drawText(lbl, { x: L_COLON - 4 - w, y: hy, size: 8, font: f, color: INK })
      page.drawText(':', { x: L_COLON, y: hy, size: 8, font: f, color: INK })
      page.drawText(String(val ?? ''), { x: L_COLON + 8, y: hy, size: 8, font: mono, color: INK })
      if (lbl2) {
        const f2 = lbl2Bold ? monoBold : mono
        const w2 = f2.widthOfTextAtSize(lbl2, 8)
        page.drawText(lbl2, { x: 470 - w2, y: hy, size: 8, font: f2, color: INK })
        page.drawText(':', { x: 474, y: hy, size: 8, font: f2, color: INK })
        page.drawText(String(val2 ?? ''), { x: 482, y: hy, size: 8, font: mono, color: INK })
      }
      hy -= 11
    }

    // A manufactured part has no customer or sales identity — its header is
    // just the BOM it represents, which is what the printout shows.
    if (card.kind === 'customer') {
      row('Customer', `${card.customerCode}   ${card.customerName}`)
      row('Part Number', card.partNumber, true, 'Part Revision', card.revision)
      row('Part Description', card.description)
    }
    row('BOM Number', card.bomNumber, true, 'BOM Revision', card.revision || '-')
    row('BOM Description', card.bomDescription)

    // Everything below appears on page 1 only — continuation pages carry just
    // enough to identify the card, as on the original printout.
    const firstPage = pages.length <= 1
    if (firstPage) {
    // Route and Product Code are NOT bold on the original printout.
    if (card.routeCode || card.routeName) {
      row('Route', `${card.routeCode}      ${card.routeName}`.trim(), false,
          undefined, undefined)
    }
    if (card.productCode || card.productName) {
      if (card.kind === 'manufactured') {
        // Manufactured cards put Catalog Number on its own line, right-aligned.
        row('Product Code', `${card.productCode}   ${card.productName}`.trim(), false)
        if (card.catalogNumber) {
          const lbl = 'Catalog Number'
          const lw = mono.widthOfTextAtSize(lbl, 8)
          const vx = PAGE.w - M - 8 - mono.widthOfTextAtSize(card.catalogNumber, 8)
          page.drawText(lbl, { x: vx - 6 - lw, y: hy, size: 8, font: mono, color: INK })
          page.drawText(':', { x: vx - 4, y: hy, size: 8, font: mono, color: INK })
          page.drawText(card.catalogNumber, { x: vx + 2, y: hy, size: 8, font: mono, color: INK })
          hy -= 11
        }
      } else {
        // Catalog Number sits in the right column on this line; neither label is
        // bold on the original.
        row('Product Code', `${card.productCode}   ${card.productName}`.trim(), false,
            card.catalogNumber ? 'Catalog Number' : undefined, card.catalogNumber, false)
      }
    }

    if (card.enteredBy || card.enteredDate) {
      row('Entered By', card.enteredBy, true, 'Entered Date', card.enteredDate)
    }
    if (card.modifiedBy || card.modifiedDate) {
      row('Last Modified By', card.modifiedBy, true, 'Modified Date', card.modifiedDate)
    }
    }

    hy -= 4
    page.drawLine({ start: { x: M, y: hy }, end: { x: PAGE.w - M, y: hy }, thickness: 1, color: INK })
    return hy - 14
  }

  const newPage = () => {
    page = doc.addPage([PAGE.w, PAGE.h])
    pages.push(page)
    y = drawHeader()
  }
  const need = (h: number) => { if (y - h < M) newPage() }

  newPage()

  /**
   * Section band, and a border drawn around whatever the body puts below it.
   *
   * The border is only drawn when the body fits on one page — a rectangle can't
   * span a page break, and a box that runs off the bottom edge looks worse than
   * no box at all.
   */
  const section = (title: string, body: () => void, minHeight = 0) => {
    need(30 + minHeight)
    const startPage = page
    page.drawRectangle({
      x: M, y: y - 3, width: PAGE.w - 2 * M, height: 14,
      color: BAND, borderColor: RULE, borderWidth: 0.7,
    })
    const w = bold.widthOfTextAtSize(title, 8.5)
    text(title, (PAGE.w - w) / 2, 8.5, bold)
    y -= 17
    const contentTop = y + 11
    body()
    if (minHeight && contentTop - y < minHeight) y = contentTop - minHeight
    if (page === startPage) {
      startPage.drawRectangle({
        x: M, y: y + 6, width: PAGE.w - 2 * M, height: contentTop - y - 6,
        borderColor: RULE, borderWidth: 0.7,
      })
    }
    y -= 10
  }

  // Single column, as on the original printout: label, then value.
  const pairs = (list: { name: string; value: string }[]) => {
    for (const p of list) {
      need(11)
      text(p.name, M + 6, 7.5, mono, MUTED)
      text(p.value, M + 170, 7.5, mono)
      y -= 10
    }
    y -= 4
  }

  // Always present, blank or not — the printout reserves the box whether or
  // not anything was written in it.
  section('Part Data Comments', () => {
    for (const line of card.comments) {
      need(11)
      text(line.slice(0, 120), M + 6, 7.5, mono, rgb(0.2, 0.24, 0.3))
      y -= 10
    }
  }, 26)

  if (card.parameters.length) section('Production Part Parameters', () => pairs(card.parameters))
  if (card.specs.length) section('Customer Part Specifications', () => pairs(card.specs))
  if (card.units.length) {
    section('Unit Loading Factors', () => {
      label('Unit Name', M + 6, y); label('Unit Code', M + 250, y)
      label('Part Loading Factor', M + 360, y)
      y -= 3; rule(); y -= 10
      for (const u of card.units) {
        need(11)
        text(u.description, M + 6, 7.5, mono)
        text(u.code, M + 250, 7.5, mono)
        text(u.value, M + 360, 7.5, mono)
        y -= 10
      }
    })
  }

  /** The bill of material, drawn as a bordered table. */
  const drawBom = () => {
    if (!card.bom.length) return
    section('Bill of Material', () => {
      label('Part Number', M + 6, y); label('Part Description', M + 120, y)
      label('Unit', M + 290, y); label('Required/BOM', M + 330, y)
      label('Qty Required', M + 430, y)
      y -= 3; rule(); y -= 10
      for (const b of card.bom) {
        need(12)
        text(b.partNumber, M + 6, 8, mono)
        text(b.description.slice(0, 26), M + 120, 8, mono)
        text(b.unit, M + 290, 8, mono)
        text(b.requiredPer, M + 330, 8, mono)
        text(b.qtyRequired, M + 430, 8, mono)
        y -= 11
      }
    })
  }

  // ---- Route steps ----
  // The BOM belongs to the kit step: on the printout it sits directly beneath
  // "Step : 1 ASSEMBLY KIT", because that's the step where the material is
  // pulled. Rendered after the first step rather than as its own block.
  let bomDrawn = false
  for (const [idx, st] of card.route.entries()) {
    need(34)
    // Sign-off boxes first, so their labels sit above the step line.
    const bx = PAGE.w - M - 180
    ;['IN/DTE', 'IN/OUT', 'SCRP/IR'].forEach((l, i) => {
      page.drawText(l, { x: bx + i * 62 + 12, y: y + 13, size: 6, font: bold, color: MUTED })
      page.drawRectangle({
        x: bx + i * 62, y: y - 6, width: 58, height: 17,
        borderColor: RULE, borderWidth: 0.7,
      })
    })
    // U+270E lower-left pencil — the closest match in DejaVu to the nib icon
    // on the printout, and the font carries it so no extra asset is needed.
    text('✎', M + 4, 9, regular, rgb(0.25, 0.3, 0.36))
    text(`Step : ${st.step}`, M + 18, 9, bold)

    /**
     * The department code is RIGHT-ALIGNED against the sign-off boxes and the
     * name is clipped to whatever space is left. Fixed columns kept letting a
     * long code run under the IN/DTE box; measuring makes overlap impossible
     * whatever the code length.
     */
    const codeSize = 9
    const codeW = bold.widthOfTextAtSize(st.deptCode || '', codeSize)
    const codeX = bx - 12 - codeW
    const nameX = M + 84
    const nameRoom = codeX - nameX - 8
    let name = st.dept || ''
    while (name && bold.widthOfTextAtSize(name, codeSize) > nameRoom) {
      name = name.slice(0, -1)
    }
    text(name, nameX, codeSize, bold)
    text(st.deptCode, codeX, codeSize, bold)
    y -= 22

    if (st.params.length) {
      section('Route Step Parameters', () => {
        for (const p of st.params) {
          need(11)
          text(`${p.name} : ${p.value}`, M + 20, 7.5, mono, rgb(0.2, 0.24, 0.3))
          y -= 10
        }
      })
    }
    for (const i of st.instructions) {
      need(11)
      text(i.slice(0, 120), M + 20, 7.5, mono, rgb(0.2, 0.24, 0.3))
      y -= 10
    }

    if (idx === 0 && !bomDrawn) { drawBom(); bomDrawn = true }
  }
  // A part with no route still needs its BOM shown.
  if (!bomDrawn) drawBom()

  // ---- Discrepancy sheet ----
  if (card.notes.length) {
    section('Discrepancy Sheet', () => {
      for (const n of card.notes) {
        need(11)
        text(n.slice(0, 125), M + 6, 7.5, mono, rgb(0.2, 0.24, 0.3))
        y -= 10
      }
    })
  }

  // ---- Sales part details ----
  if (card.salesPart) {
    section('Sales Part Details', () => {
      label('Part Number', M + 6, y); label('Description', M + 180, y)
      label('Revision', M + 430, y)
      y -= 3; rule(); y -= 10
      need(12)
      text(card.salesPart!.partNumber, M + 6, 8, mono)
      text(card.salesPart!.description.slice(0, 40), M + 180, 8, mono)
      text(card.salesPart!.revision, M + 430, 8, mono)
      y -= 11
    })
  }

  // Footer on every page, with the final page count known only now.
  pages.forEach((p, i) => {
    p.drawText('Copyright © 1988 - 2026 Aptean', { x: M, y: 24, size: 7, font: regular, color: MUTED })
    const right = `Paradigm® Version 4.0`
    p.drawText(right, {
      x: PAGE.w - M - regular.widthOfTextAtSize(right, 7), y: 24, size: 7, font: regular, color: MUTED,
    })
  })

  return await doc.save()
}
