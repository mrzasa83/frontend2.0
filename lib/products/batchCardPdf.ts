import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { CardData } from './batchCardData'

/**
 * Render one batch card, following the Paradigm "Customer Part Details"
 * printout: header block, bill of material, then the route steps with their
 * instructions and parameters and the IN/DTE · IN/OUT · SCRP/IR boxes the
 * operator fills in.
 */

const PAGE = { w: 612, h: 792 }        // US Letter, portrait
const M = 36                           // margin

export async function renderBatchCard(card: CardData, operator: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([PAGE.w, PAGE.h])
  let y = PAGE.h - M

  const line = (text: string, x: number, size = 9, f = font, color = rgb(0.1, 0.1, 0.15)) => {
    page.drawText(text ?? '', { x, y, size, font: f, color })
  }
  const need = (h: number) => {
    if (y - h < M) { page = doc.addPage([PAGE.w, PAGE.h]); y = PAGE.h - M }
  }
  const rule = (color = rgb(0.8, 0.84, 0.9)) => {
    page.drawLine({ start: { x: M, y }, end: { x: PAGE.w - M, y }, thickness: 0.7, color })
  }
  // pdf-lib throws on characters the standard fonts can't encode.
  const safe = (s: string) => String(s ?? '').replace(/[^\x20-\x7E]/g, ' ')

  // ---- Header ----
  line('Amphenol Printed Circuits, Inc.', M, 11, bold)
  line(safe(operator), PAGE.w - M - 120, 9)
  y -= 13
  line('BATCH CARD', M, 10, bold)
  line(new Date().toLocaleString(), PAGE.w - M - 120, 8, font, rgb(0.4, 0.45, 0.5))
  y -= 14
  rule(); y -= 12

  const field = (label: string, value: string, x: number) => {
    page.drawText(label, { x, y, size: 7.5, font: bold, color: rgb(0.42, 0.46, 0.52) })
    page.drawText(safe(value) || '-', { x, y: y - 10, size: 9.5, font })
  }
  field('CUSTOMER', `${card.customerCode} ${card.customerName}`, M)
  field('PART NUMBER', card.partNumber, M + 250)
  field('REVISION', card.revision, M + 430)
  y -= 26
  field('DESCRIPTION', card.description, M)
  field('BOM NUMBER', card.bomNumber, M + 250)
  field('ROUTE', card.routeName, M + 430)
  y -= 26
  rule(); y -= 14

  // ---- Bill of material ----
  if (card.bom.length) {
    line('Bill of Material', M, 9.5, bold, rgb(0.15, 0.35, 0.65)); y -= 12
    line('Part Number', M, 7.5, bold, rgb(0.42, 0.46, 0.52))
    line('Description', M + 120, 7.5, bold, rgb(0.42, 0.46, 0.52))
    line('Unit', M + 300, 7.5, bold, rgb(0.42, 0.46, 0.52))
    line('Required/BOM', M + 350, 7.5, bold, rgb(0.42, 0.46, 0.52))
    line('Qty Required', M + 450, 7.5, bold, rgb(0.42, 0.46, 0.52))
    y -= 11
    for (const b of card.bom) {
      need(14)
      line(safe(b.partNumber), M, 8.5)
      line(safe(b.description).slice(0, 30), M + 120, 8.5)
      line(safe(b.unit), M + 300, 8.5)
      line(b.requiredPer, M + 350, 8.5)
      line(b.qtyRequired, M + 450, 8.5)
      y -= 12
    }
    y -= 6
  }

  // ---- Route ----
  for (const s of card.route) {
    need(34)
    rule(rgb(0.88, 0.9, 0.94)); y -= 12
    line(`Step : ${s.step}`, M, 9.5, bold)
    line(safe(s.dept), M + 80, 9.5, bold)
    line(safe(s.deptCode), M + 320, 9.5, bold)
    // The boxes the operator signs off in.
    const bx = PAGE.w - M - 168
    for (let i = 0; i < 3; i++) {
      const label = ['IN/DTE', 'IN/OUT', 'SCRP/IR'][i]
      page.drawText(label, { x: bx + i * 56, y: y + 11, size: 6, font: bold, color: rgb(0.42, 0.46, 0.52) })
      page.drawRectangle({
        x: bx + i * 56, y: y - 4, width: 52, height: 14,
        borderColor: rgb(0.6, 0.65, 0.72), borderWidth: 0.7,
      })
    }
    y -= 16
    for (const i of s.instructions) {
      need(11)
      line(safe(i).slice(0, 110), M + 12, 8, font, rgb(0.25, 0.3, 0.36))
      y -= 10
    }
    if (s.params.length) {
      need(11)
      const text = s.params.map(p => `${safe(p.name)}: ${safe(p.value)}`).join('   ')
      line(text.slice(0, 110), M + 12, 8, font, rgb(0.3, 0.35, 0.42))
      y -= 10
    }
  }

  // ---- Notes ----
  if (card.notes.length) {
    need(24)
    y -= 6; rule(); y -= 12
    line('Discrepancy Sheet', M, 9.5, bold, rgb(0.15, 0.35, 0.65)); y -= 12
    for (const n of card.notes) {
      need(11)
      line(safe(n).slice(0, 115), M, 8, font, rgb(0.25, 0.3, 0.36))
      y -= 10
    }
  }

  return await doc.save()
}
