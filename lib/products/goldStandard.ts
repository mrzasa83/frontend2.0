import { queryPrimary } from '@/lib/db/mysql-primary'
import { buildCardSet, type CardData } from '@/lib/products/batchCardData'

/**
 * Gold Standard — capture and read.
 *
 * A gold standard is a frozen copy of everything that goes into a batch card
 * for one customer part, stored so other parts can be compared against it.
 *
 * WHY A SNAPSHOT RATHER THAN A LIVE VIEW
 *
 * buildCardSet() reads Paradigm live. If a gold standard did the same, "the
 * standard" would change whenever someone edited the ERP, and a comparison
 * would be against a moving target. Capturing freezes it, and captured_at
 * says exactly when — which is what makes a comparison from last quarter
 * reproducible this quarter.
 *
 * The capture reuses buildCardSet() rather than re-querying Paradigm its own
 * way. A second implementation would drift from the batch card generator, and
 * a "gold standard" that does not match the card it is standardising is worse
 * than not having one.
 */

export type GoldStandardRow = {
  id: number
  technologyId: number | null
  technology: string
  apcPartNumber: string
  customerPartNumber: string
  program: string
  customerCode: string
  customerName: string
  revision: string
  status: string
  title: string
  notes: string
  capturedAt: string | null
  capturedBy: string
  cardCount: number
  likePartCount: number
  createdAt: string | null
  createdBy: string
  updatedAt: string | null
}

/** Trim and clamp, so an over-long ERP value can't overflow its column. */
const fit = (v: any, max: number) => String(v ?? '').trim().slice(0, max)

/**
 * The list behind Products -> Gold Standard.
 *
 * likePartCount is counted here rather than denormalised onto gold_standards.
 * It changes whenever a part is attached or removed, and a cached count that
 * drifts would quietly misreport how much of a technology has actually been
 * reviewed — which is the number someone would act on.
 */
export async function listGoldStandards(): Promise<GoldStandardRow[]> {
  const rows = await queryPrimary<any[]>(
    `SELECT gs.*,
            COALESCE(t.name, '')                AS technology_name,
            (SELECT COUNT(*) FROM gold_standard_like_parts lp
              WHERE lp.gold_standard_id = gs.id) AS like_part_count
       FROM gold_standards gs
       LEFT JOIN npi_technologies t ON t.id = gs.technology_id
      ORDER BY technology_name, gs.apc_part_number`
  )
  return (rows || []).map(mapStandard)
}

function mapStandard(r: any): GoldStandardRow {
  return {
    id: Number(r.id),
    technologyId: r.technology_id == null ? null : Number(r.technology_id),
    technology: String(r.technology_name || ''),
    apcPartNumber: String(r.apc_part_number || ''),
    customerPartNumber: String(r.customer_part_number || ''),
    program: String(r.program || ''),
    customerCode: String(r.customer_code || ''),
    customerName: String(r.customer_name || ''),
    revision: String(r.revision || ''),
    status: String(r.status || 'draft'),
    title: String(r.title || ''),
    notes: String(r.notes || ''),
    capturedAt: r.captured_at ?? null,
    capturedBy: String(r.captured_by || ''),
    cardCount: Number(r.card_count || 0),
    likePartCount: Number(r.like_part_count || 0),
    createdAt: r.created_at ?? null,
    createdBy: String(r.created_by || ''),
    updatedAt: r.updated_at ?? null,
  }
}

/**
 * Writes one CardData[] into the normalised tables under an existing gold
 * standard, replacing whatever was there.
 *
 * NOT transactional, because queryPrimary runs each statement on its own
 * pooled connection and this codebase has no transaction helper. The delete
 * is therefore ordered so a failure part-way leaves a short capture rather
 * than a mixed one: cards go first and every child cascades with them, so the
 * worst case is a gold standard with fewer levels than it should have, which
 * the card_count check below surfaces. A half-written card with another
 * card's BOM attached is the outcome worth designing against.
 */
export async function storeCards(
  goldStandardId: number,
  cards: CardData[]
): Promise<number> {
  // Cascades through bom, route, instructions, params and attributes.
  await queryPrimary(
    'DELETE FROM gold_standard_cards WHERE gold_standard_id = ?',
    [goldStandardId]
  )

  let written = 0
  const failed: { part: string; reason: string }[] = []
  // buildCardSet walks depth-first, so the parent of a card at level N is the
  // most recent card written at level N-1. Tracked per level rather than
  // inferred later, because the flat CardData[] does not carry the link and
  // re-deriving it from BOM membership would be guesswork once a part appears
  // under two parents.
  const lastAtLevel = new Map<number, number>()
  const seqAtLevel = new Map<number, number>()

  for (const c of cards) {
   const level = Number(c.level) || 0
   const seq = seqAtLevel.get(level) ?? 0
   seqAtLevel.set(level, seq + 1)
   const parentId = level > 0 ? (lastAtLevel.get(level - 1) ?? null) : null

   // Per-card, so one bad card costs that card and not the rest of the
   // capture. The previous version let the first failure abort the loop,
   // which is how a 2-of-8 capture looked like a finished one.
   try {
    const res: any = await queryPrimary(
      `INSERT INTO gold_standard_cards
         (gold_standard_id, level, seq, parent_card_id, kind, source_rkey,
          part_number, description, revision, catalog_number,
          customer_code, customer_name,
          bom_number, bom_description, route_code, route_name,
          product_code, product_name,
          sales_part_number, sales_part_desc, sales_part_rev,
          modified_by, modified_date, entered_by, entered_date)
       VALUES (?,?,?,?,?,?, ?,?,?,?, ?,?, ?,?,?,?, ?,?, ?,?,?, ?,?,?,?)`,
      [
        goldStandardId, level, seq, parentId,
        c.kind === 'customer' ? 'customer' : 'manufactured',
        Number(c.sourceRkey) || 0,
        fit(c.partNumber, 191), fit(c.description, 500), fit(c.revision, 30), fit(c.catalogNumber, 100),
        fit(c.customerCode, 60), fit(c.customerName, 191),
        fit(c.bomNumber, 191), fit(c.bomDescription, 500), fit(c.routeCode, 100), fit(c.routeName, 255),
        fit(c.productCode, 100), fit(c.productName, 255),
        fit(c.salesPart?.partNumber, 191), fit(c.salesPart?.description, 500), fit(c.salesPart?.revision, 30),
        fit(c.modifiedBy, 191), fit(c.modifiedDate, 50), fit(c.enteredBy, 191), fit(c.enteredDate, 50),
      ]
    )
    const cardId = Number(res?.insertId)
    if (!cardId) { failed.push({ part: c.partNumber, reason: 'no insert id' }); continue }
    written++
    lastAtLevel.set(level, cardId)

    for (let i = 0; i < (c.bom || []).length; i++) {
      const b = c.bom[i]
      await queryPrimary(
        `INSERT INTO gold_standard_bom
           (card_id, seq, part_number, description, unit,
            required_per, qty_required, is_manufactured)
         VALUES (?,?,?,?,?,?,?,?)`,
        [cardId, i, fit(b.partNumber, 191), fit(b.description, 500), fit(b.unit, 50),
         fit(b.requiredPer, 100), fit(b.qtyRequired, 100), b.isManufactured ? 1 : 0]
      )
    }

    for (const step of c.route || []) {
      const rr: any = await queryPrimary(
        `INSERT INTO gold_standard_route
           (card_id, step, dept, dept_code, instruction_codes)
         VALUES (?,?,?,?,?)`,
        [cardId, Number(step.step) || 0, fit(step.dept, 191),
         fit(step.deptCode, 60), fit(step.instructionCodes, 255)]
      )
      const routeId = Number(rr?.insertId)
      if (!routeId) continue

      for (let i = 0; i < (step.instructions || []).length; i++) {
        await queryPrimary(
          'INSERT INTO gold_standard_route_instructions (route_id, seq, text) VALUES (?,?,?)',
          [routeId, i, String(step.instructions[i] ?? '')]
        )
      }
      for (let i = 0; i < (step.params || []).length; i++) {
        const prm = step.params[i]
        await queryPrimary(
          'INSERT INTO gold_standard_route_params (route_id, seq, name, value) VALUES (?,?,?,?)',
          [routeId, i, fit(prm.name, 191), fit(prm.value, 500)]
        )
      }
    }

    // The five flat lists share one table; see the schema comment.
    const attrs: [string, string, string, string][] = []
    ;(c.notes || []).forEach((v, i) => attrs.push(['note', String(i), '', String(v ?? '')]))
    ;(c.comments || []).forEach((v, i) => attrs.push(['comment', String(i), '', String(v ?? '')]))
    ;(c.parameters || []).forEach((p, i) => attrs.push(['parameter', String(i), p.name, p.value]))
    ;(c.specs || []).forEach((p, i) => attrs.push(['spec', String(i), p.name, p.value]))
    for (const [kind, seq, name, value] of attrs) {
      await queryPrimary(
        'INSERT INTO gold_standard_attributes (card_id, kind, seq, name, value) VALUES (?,?,?,?,?)',
        [cardId, kind, Number(seq), fit(name, 191), String(value ?? '')]
      )
    }
    // Units carry a third field, so they are written separately rather than
    // bent into the name/value shape above.
    for (let i = 0; i < (c.units || []).length; i++) {
      const u = c.units[i]
      await queryPrimary(
        `INSERT INTO gold_standard_attributes (card_id, kind, seq, name, value, extra)
         VALUES (?,?,?,?,?,?)`,
        [cardId, 'unit', i, fit(u.code, 191), String(u.value ?? ''), fit(u.description, 500)]
      )
    }
   } catch (e) {
    failed.push({ part: c.partNumber, reason: e instanceof Error ? e.message : String(e) })
   }
  }

  await queryPrimary(
    'UPDATE gold_standards SET card_count = ? WHERE id = ?',
    [written, goldStandardId]
  )
  if (failed.length) {
    // Recorded rather than thrown: the capture that DID land is worth keeping,
    // and the detail view needs to be able to say which cards are missing.
    await logHistory(goldStandardId, 'captured', 'system', {
      detail: `${failed.length} card(s) failed: ` +
        failed.map(f => `${f.part} (${f.reason})`).join('; ').slice(0, 2000),
    })
  }
  return written
}

/**
 * Captures (or re-captures) a gold standard from Paradigm.
 *
 * Returns the number of card levels written. A caller that gets back fewer
 * levels than buildCardSet produced has a partial capture and should say so
 * rather than treat it as done.
 */
export async function captureGoldStandard(
  goldStandardId: number,
  customerPart: string,
  user: string
): Promise<{ cards: number; expected: number }> {
  const cards = await buildCardSet(customerPart)
  const written = await storeCards(goldStandardId, cards)

  await queryPrimary(
    `UPDATE gold_standards
        SET captured_at = NOW(), captured_by = ?, updated_by = ?
      WHERE id = ?`,
    [user.slice(0, 100), user.slice(0, 100), goldStandardId]
  )
  await logHistory(goldStandardId, 'captured', user, {
    detail: `Captured ${written} of ${cards.length} card level(s) from ${customerPart}`,
  })
  return { cards: written, expected: cards.length }
}

export async function logHistory(
  goldStandardId: number,
  action: string,
  user: string,
  opts: { target?: string; targetId?: number | null; field?: string;
          oldValue?: string; newValue?: string; detail?: string } = {}
): Promise<void> {
  try {
    await queryPrimary(
      `INSERT INTO gold_standard_history
         (gold_standard_id, action, target, target_id, field, old_value, new_value, detail, changed_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [goldStandardId, action.slice(0, 40), (opts.target || '').slice(0, 100),
       opts.targetId ?? null, (opts.field || '').slice(0, 191),
       opts.oldValue ?? null, opts.newValue ?? null, opts.detail ?? null,
       user.slice(0, 100)]
    )
  } catch {
    // History is a record, not a gate. Losing an audit line is worth noting
    // but not worth failing the edit the user actually asked for.
  }
}

/** One gold standard with its cards and everything hanging off them. */
export async function getGoldStandard(id: number): Promise<any | null> {
  const rows = await queryPrimary<any[]>(
    `SELECT gs.*, COALESCE(t.name, '') AS technology_name,
            (SELECT COUNT(*) FROM gold_standard_like_parts lp
              WHERE lp.gold_standard_id = gs.id) AS like_part_count
       FROM gold_standards gs
       LEFT JOIN npi_technologies t ON t.id = gs.technology_id
      WHERE gs.id = ?`, [id]
  )
  if (!rows?.length) return null
  const standard = mapStandard(rows[0])

  const cards = await queryPrimary<any[]>(
    'SELECT * FROM gold_standard_cards WHERE gold_standard_id = ? ORDER BY level, seq, id', [id]
  )
  const cardIds = (cards || []).map(c => Number(c.id))

  // Fetched per collection rather than per card: a 28-layer board is 28 cards,
  // and five round trips each would be 140 queries to draw one page.
  const inList = cardIds.length ? cardIds.map(() => '?').join(',') : null
  const bom = inList ? await queryPrimary<any[]>(
    `SELECT * FROM gold_standard_bom WHERE card_id IN (${inList}) ORDER BY card_id, seq`, cardIds) : []
  const route = inList ? await queryPrimary<any[]>(
    `SELECT * FROM gold_standard_route WHERE card_id IN (${inList}) ORDER BY card_id, step`, cardIds) : []
  const attrs = inList ? await queryPrimary<any[]>(
    `SELECT * FROM gold_standard_attributes WHERE card_id IN (${inList}) ORDER BY card_id, kind, seq`, cardIds) : []

  const routeIds = (route || []).map(r => Number(r.id))
  const rIn = routeIds.length ? routeIds.map(() => '?').join(',') : null
  const instr = rIn ? await queryPrimary<any[]>(
    `SELECT * FROM gold_standard_route_instructions WHERE route_id IN (${rIn}) ORDER BY route_id, seq`, routeIds) : []
  const params = rIn ? await queryPrimary<any[]>(
    `SELECT * FROM gold_standard_route_params WHERE route_id IN (${rIn}) ORDER BY route_id, seq`, routeIds) : []

  const likeParts = await queryPrimary<any[]>(
    'SELECT * FROM gold_standard_like_parts WHERE gold_standard_id = ? ORDER BY customer_part_number', [id]
  )
  const history = await queryPrimary<any[]>(
    'SELECT * FROM gold_standard_history WHERE gold_standard_id = ? ORDER BY changed_at DESC LIMIT 200', [id]
  )

  const byCard = <T extends { card_id: number }>(list: T[], cardId: number) =>
    (list || []).filter(x => Number(x.card_id) === cardId)

  return {
    standard,
    cards: (cards || []).map((c: any) => {
      const cid = Number(c.id)
      const steps = byCard(route as any, cid).map((r: any) => ({
        id: Number(r.id),
        step: Number(r.step),
        dept: String(r.dept || ''),
        deptCode: String(r.dept_code || ''),
        instructionCodes: String(r.instruction_codes || ''),
        instructions: (instr || []).filter((x: any) => Number(x.route_id) === Number(r.id))
          .map((x: any) => String(x.text || '')),
        params: (params || []).filter((x: any) => Number(x.route_id) === Number(r.id))
          .map((x: any) => ({ id: Number(x.id), name: String(x.name || ''), value: String(x.value || '') })),
      }))
      const attrsOf = (kind: string) =>
        byCard(attrs as any, cid).filter((a: any) => a.kind === kind)
      return {
        id: cid,
        level: Number(c.level),
        seq: Number(c.seq || 0),
        parentCardId: c.parent_card_id == null ? null : Number(c.parent_card_id),
        kind: String(c.kind || 'manufactured'),
        sourceRkey: Number(c.source_rkey || 0),
        partNumber: String(c.part_number || ''),
        description: String(c.description || ''),
        revision: String(c.revision || ''),
        catalogNumber: String(c.catalog_number || ''),
        customerCode: String(c.customer_code || ''),
        customerName: String(c.customer_name || ''),
        bomNumber: String(c.bom_number || ''),
        bomDescription: String(c.bom_description || ''),
        routeCode: String(c.route_code || ''),
        routeName: String(c.route_name || ''),
        productCode: String(c.product_code || ''),
        productName: String(c.product_name || ''),
        salesPartNumber: String(c.sales_part_number || ''),
        salesPartDesc: String(c.sales_part_desc || ''),
        salesPartRev: String(c.sales_part_rev || ''),
        modifiedBy: String(c.modified_by || ''),
        modifiedDate: String(c.modified_date || ''),
        enteredBy: String(c.entered_by || ''),
        enteredDate: String(c.entered_date || ''),
        isEdited: !!Number(c.is_edited),
        bom: byCard(bom as any, cid).map((b: any) => ({
          id: Number(b.id), seq: Number(b.seq),
          partNumber: String(b.part_number || ''), description: String(b.description || ''),
          unit: String(b.unit || ''), requiredPer: String(b.required_per || ''),
          qtyRequired: String(b.qty_required || ''), isManufactured: !!Number(b.is_manufactured),
        })),
        route: steps,
        notes: attrsOf('note').map((a: any) => String(a.value || '')),
        comments: attrsOf('comment').map((a: any) => String(a.value || '')),
        parameters: attrsOf('parameter').map((a: any) => ({ id: Number(a.id), name: String(a.name || ''), value: String(a.value || '') })),
        specs: attrsOf('spec').map((a: any) => ({ id: Number(a.id), name: String(a.name || ''), value: String(a.value || '') })),
        units: attrsOf('unit').map((a: any) => ({ id: Number(a.id), code: String(a.name || ''), value: String(a.value || ''), description: String(a.extra || '') })),
      }
    }),
    likeParts: (likeParts || []).map((p: any) => ({
      id: Number(p.id),
      apcPartNumber: String(p.apc_part_number || ''),
      customerPartNumber: String(p.customer_part_number || ''),
      program: String(p.program || ''),
      customerName: String(p.customer_name || ''),
      description: String(p.description || ''),
      lastComparedAt: p.last_compared_at ?? null,
      lastComparedBy: String(p.last_compared_by || ''),
      diffCount: p.diff_count == null ? null : Number(p.diff_count),
      notes: String(p.notes || ''),
      addedAt: p.added_at ?? null,
      addedBy: String(p.added_by || ''),
    })),
    history: (history || []).map((h: any) => ({
      id: Number(h.id), action: String(h.action || ''), target: String(h.target || ''),
      field: String(h.field || ''), oldValue: h.old_value, newValue: h.new_value,
      detail: h.detail, changedAt: h.changed_at, changedBy: String(h.changed_by || ''),
    })),
  }
}
