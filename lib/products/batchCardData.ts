import { queryMSSQL } from '@/lib/db/mssql'

/**
 * The data behind a batch card set.
 *
 * One card is produced for the customer part and one for every manufactured
 * item beneath it, so the set runs highest level first. For each card we need
 * the header (customer, part, description, revision, BOM and route names) plus
 * the route steps with their instructions and parameters — the same shape the
 * Daily Plan renders, which is why the TTYPE handling matches it.
 *
 * TTYPE on DATA0038: 4 is the released customer-part route. Manufactured
 * components carry their own route against the inventory record.
 */

export type RouteStep = {
  step: number
  dept: string
  deptCode: string
  instructions: string[]
  params: { name: string; value: string }[]
}

export type BomLine = {
  partNumber: string
  description: string
  unit: string
  requiredPer: string
  qtyRequired: string
  isManufactured: boolean
}

export type CardData = {
  level: number
  /** Customer part number for the top card, INV_PART_NUMBER below it. */
  partNumber: string
  description: string
  revision: string
  customerCode: string
  customerName: string
  bomNumber: string
  bomDescription: string
  routeName: string
  productCode: string
  catalogNumber: string
  bom: BomLine[]
  route: RouteStep[]
  notes: string[]
}

const clean = (v: any) => String(v ?? '').trim()

/** Header for the top-level customer part. */
const HEADER_SQL = `
  SELECT TOP 1
    d50.CUSTOMER_PART_NUMBER, d50.CUSTOMER_PART_DESC, d50.CP_REV,
    d50.CATALOG_NUMBER, d50.BOM_PTR, d50.PROD_ROUTE_PTR,
    d10.CUST_CODE, d10.CUSTOMER_NAME,
    d25.BOM_NAME, d17.INV_PART_DESCRIPTION AS BOM_DESC,
    d37.ROUTE_NAME
  FROM DATA0050 d50 WITH (NOLOCK)
  LEFT JOIN DATA0010 d10 WITH (NOLOCK) ON d10.RKEY = d50.CUSTOMER_PTR
  LEFT JOIN DATA0025 d25 WITH (NOLOCK) ON d25.RKEY = d50.BOM_PTR
  LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d25.INVENTORY_PTR
  LEFT JOIN DATA0037 d37 WITH (NOLOCK) ON d37.RKEY = d50.PROD_ROUTE_PTR
  WHERE LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) = @part`

/** Components directly under a BOM header. */
const BOM_SQL = `
  SELECT
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS partNumber,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS description,
    LTRIM(RTRIM(d17.P_M))                  AS pm,
    d17.RKEY                                AS rkey,
    d26.QTY_BOM,
    LTRIM(RTRIM(d26.UNIT_OF_MEASURE))      AS unit
  FROM DATA0025 d25 WITH (NOLOCK)
  JOIN DATA0026 d26 WITH (NOLOCK) ON d26.PARENT_NODE_INVENT = d25.RKEY
  JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d26.INVENTORY_PTR
  WHERE d25.RKEY = @bomPtr
  ORDER BY d17.INV_PART_NUMBER`

/**
 * Route steps with instructions and parameters.
 * @sourcePtr is the DATA0050 RKEY for a customer part, or the DATA0017 RKEY for
 * a manufactured component; @ttype selects which route.
 */
const ROUTE_SQL = `
  SELECT
    d38.STEP_NUMBER,
    LTRIM(RTRIM(d34.DEPT_NAME)) AS deptName,
    LTRIM(RTRIM(d34.DEPT_CODE)) AS deptCode,
    d38.RKEY AS stepRkey
  FROM DATA0038 d38 WITH (NOLOCK)
  LEFT JOIN DATA0034 d34 WITH (NOLOCK) ON d34.RKEY = d38.DEPT_PTR
  WHERE d38.SOURCE_PTR = @sourcePtr AND d38.TTYPE = @ttype
  ORDER BY d38.STEP_NUMBER`

const INSTRUCTIONS_SQL = `
  SELECT d36.SOURCE_PTR AS stepRkey, LTRIM(RTRIM(d36.INSTRUCTION_TEXT)) AS text,
         d36.SEQUENCE_NUMBER
  FROM DATA0036 d36 WITH (NOLOCK)
  WHERE d36.SOURCE_PTR IN (SELECT d38.RKEY FROM DATA0038 d38 WITH (NOLOCK)
                           WHERE d38.SOURCE_PTR = @sourcePtr AND d38.TTYPE = @ttype)
  ORDER BY d36.SOURCE_PTR, d36.SEQUENCE_NUMBER`

const PARAMS_SQL = `
  SELECT d35.SOURCE_PTR AS stepRkey,
         LTRIM(RTRIM(d44.PARAM_NAME)) AS name,
         LTRIM(RTRIM(d35.PARAM_VALUE)) AS value
  FROM DATA0035 d35 WITH (NOLOCK)
  LEFT JOIN DATA0044 d44 WITH (NOLOCK) ON d44.RKEY = d35.PARAM_PTR
  WHERE d35.SOURCE_PTR IN (SELECT d38.RKEY FROM DATA0038 d38 WITH (NOLOCK)
                           WHERE d38.SOURCE_PTR = @sourcePtr AND d38.TTYPE = @ttype)
  ORDER BY d35.SOURCE_PTR`

/** Notepad / discrepancy text for a customer part. */
const NOTES_SQL = `
  SELECT LTRIM(RTRIM(d211.NOTEPAD_TEXT)) AS text
  FROM DATA0211 d211 WITH (NOLOCK)
  WHERE d211.SOURCE_POINTER = @rkey AND d211.SOURCE_TYPE = 1
  ORDER BY d211.SEQUENCE_NUMBER`

async function loadRoute(sourcePtr: number, ttype: number): Promise<RouteStep[]> {
  const [steps, instr, params] = await Promise.all([
    queryMSSQL<any[]>('1', ROUTE_SQL, { sourcePtr, ttype }).catch(() => []),
    queryMSSQL<any[]>('1', INSTRUCTIONS_SQL, { sourcePtr, ttype }).catch(() => []),
    queryMSSQL<any[]>('1', PARAMS_SQL, { sourcePtr, ttype }).catch(() => []),
  ])
  const byStep = new Map<number, RouteStep>()
  for (const s of steps || []) {
    byStep.set(Number(s.stepRkey), {
      step: Number(s.STEP_NUMBER) || 0,
      dept: clean(s.deptName),
      deptCode: clean(s.deptCode),
      instructions: [],
      params: [],
    })
  }
  for (const i of instr || []) {
    const st = byStep.get(Number(i.stepRkey))
    if (st && clean(i.text)) st.instructions.push(clean(i.text))
  }
  for (const p of params || []) {
    const st = byStep.get(Number(p.stepRkey))
    if (st && clean(p.name)) st.params.push({ name: clean(p.name), value: clean(p.value) })
  }
  return Array.from(byStep.values()).sort((a, b) => a.step - b.step)
}

/**
 * Build the full card set for a customer part: the part itself, then every
 * manufactured component beneath it, depth-first so the order runs highest
 * level to lowest. A visited set stops a self-referencing BOM looping.
 */
export async function buildCardSet(customerPart: string): Promise<CardData[]> {
  const head = await queryMSSQL<any[]>('1', HEADER_SQL, { part: customerPart })
  if (!head?.length) return []
  const h = head[0]

  const cards: CardData[] = []
  const visited = new Set<string>()

  const bomLines = async (bomPtr: number): Promise<{ lines: BomLine[]; children: any[] }> => {
    if (!bomPtr) return { lines: [], children: [] }
    const rows = await queryMSSQL<any[]>('1', BOM_SQL, { bomPtr }).catch(() => [])
    const lines: BomLine[] = []
    const children: any[] = []
    for (const r of rows || []) {
      const isM = clean(r.pm).toUpperCase() === 'M'
      lines.push({
        partNumber: clean(r.partNumber),
        description: clean(r.description),
        unit: clean(r.unit) || 'PART',
        requiredPer: `${Number(r.QTY_BOM ?? 0).toFixed(6)}/${clean(r.unit) || 'PART'}`,
        qtyRequired: Number(r.QTY_BOM ?? 0).toFixed(6),
        isManufactured: isM,
      })
      if (isM) children.push(r)
    }
    return { lines, children }
  }

  // Top card — the customer part.
  const topBom = await bomLines(Number(h.BOM_PTR))
  const notes = await queryMSSQL<any[]>('1', NOTES_SQL, { rkey: Number(h.RKEY ?? 0) }).catch(() => [])
  cards.push({
    level: 0,
    partNumber: clean(h.CUSTOMER_PART_NUMBER),
    description: clean(h.CUSTOMER_PART_DESC),
    revision: clean(h.CP_REV) || '-',
    customerCode: clean(h.CUST_CODE),
    customerName: clean(h.CUSTOMER_NAME),
    bomNumber: clean(h.BOM_NAME),
    bomDescription: clean(h.BOM_DESC),
    routeName: clean(h.ROUTE_NAME),
    productCode: '',
    catalogNumber: clean(h.CATALOG_NUMBER),
    bom: topBom.lines,
    route: await loadRoute(Number(h.RKEY ?? 0), 4),
    notes: (notes || []).map(n => clean(n.text)).filter(Boolean),
  })

  // Manufactured components, depth-first.
  const walk = async (rows: any[], level: number) => {
    if (level > 10) return
    for (const r of rows) {
      const pn = clean(r.partNumber)
      if (!pn || visited.has(pn)) continue
      visited.add(pn)

      // A manufactured item's BOM hangs off its inventory record.
      const own = await queryMSSQL<any[]>('1',
        `SELECT TOP 1 d25.RKEY AS bomPtr, LTRIM(RTRIM(d25.BOM_NAME)) AS bomName
         FROM DATA0025 d25 WITH (NOLOCK) WHERE d25.INVENTORY_PTR = @rkey`,
        { rkey: Number(r.rkey) }).catch(() => [])
      const bomPtr = Number(own?.[0]?.bomPtr ?? 0)
      const sub = await bomLines(bomPtr)

      cards.push({
        level,
        partNumber: pn,
        description: clean(r.description),
        revision: '-',
        customerCode: clean(h.CUST_CODE),
        customerName: clean(h.CUSTOMER_NAME),
        bomNumber: clean(own?.[0]?.bomName),
        bomDescription: clean(r.description),
        routeName: '',
        productCode: '',
        catalogNumber: clean(h.CATALOG_NUMBER),
        bom: sub.lines,
        route: await loadRoute(Number(r.rkey), 1),
        notes: [],
      })
      await walk(sub.children, level + 1)
    }
  }
  await walk(topBom.children, 1)

  return cards
}
