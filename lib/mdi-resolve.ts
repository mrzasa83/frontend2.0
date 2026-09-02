import { queryMSSQL } from '@/lib/mssql'
import { querySecondaryMySQL } from '@/lib/mysql-secondary'
import {
  parseCuThickness, panelTypeFromPart, serializationFromParam, toGbr,
  MdiWorkOrder, MdiLayer,
} from '@/lib/mdi-xml'

export interface ResolveInput {
  workOrder: string
  invPart?: string
  customerPart?: string
  // Route step layers (from the selected step's file params), in order:
  // first = top, second = bottom. Each layerName is the value after the colon
  // (e.g. "LYR 02: 2" -> "2"), so the file is <job_num>_<layerName>.gbr.
  stepLayers?: { layerNum: number | null; layerName: string }[]
  // Selected step's dept code (e.g. "I-PRP-D") — used for step-specific rules
  // like the material-prep UV MARKER fiducial override.
  stepDeptCode?: string
  // Operator fields preserved through resolution (not overwritten):
  filmType?: string
  panelThickness?: string
  panelCount?: string
  serialization?: string
}

// Job number = 5 chars after the first 2 of the part (e.g. "S-75064-..." -> "75064").
export function jobFromPart(part: string): string {
  const raw = (part || '').trim()
  if (raw.length >= 7) {
    const mid = raw.substring(2, 7)
    if (/^\d{4,5}$/.test(mid)) return mid
  }
  const m = raw.match(/(\d{4,5})/)
  return m ? m[1] : ''
}

/**
 * Resolve one work order into a full MdiWorkOrder, pulling fiducial/polarity
 * from amph_cc and cu_thickness from Paradigm. Operator-supplied fields on the
 * input (filmType, panelThickness, panelCount, serialization) are carried
 * through untouched — resolution never clobbers operator edits.
 *
 * Returns { row, warnings }.
 */
export async function resolveWorkOrder(inp: ResolveInput): Promise<{ row: MdiWorkOrder; warnings: string[] }> {
  const warnings: string[] = []
  const workOrder = inp.workOrder || ''
  let invPart = inp.invPart
  let customerPart = inp.customerPart

  // The inventory part (e.g. "C-01606-01/04") carries the layer spec and the
  // job number, so we need it specifically. Look it up from Paradigm by work
  // order whenever it's missing — even if a customer part was provided (the
  // dept/search flow supplies only the customer part like "01606", which has
  // no layer spec). Restored-from-backlog rows have neither and get both here.
  if (!invPart && workOrder) {
    try {
      const escapeLike = (s: string) => s.replace(/[[%_]/g, (c) => `[${c}]`)
      const woMatch = `%${escapeLike(workOrder.trim())}`
      const partRows = await queryMSSQL<any>(`
        SELECT TOP 1
          RTRIM(ISNULL(d17.INV_PART_NUMBER, '')) AS invPart,
          RTRIM(ISNULL(d50.CUSTOMER_PART_NUMBER, '')) AS customerPart
        FROM DATA0006 wo WITH (NOLOCK)
        LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON wo.INVENTORY_PTR = d17.RKEY
        LEFT JOIN DATA0050 d50 WITH (NOLOCK) ON wo.CUST_PART_PTR = d50.RKEY
        WHERE wo.WORK_ORDER_NUMBER COLLATE DATABASE_DEFAULT LIKE @wo
      `, { wo: woMatch })
      invPart = partRows?.[0]?.invPart || invPart || undefined
      customerPart = customerPart || partRows?.[0]?.customerPart || undefined
    } catch (e) {
      warnings.push(`${workOrder}: part lookup failed (${String(e)})`)
    }
  }

  // Job number + panel type derive from the inventory part when present (it has
  // the full "X-NNNNN-.." form); otherwise fall back to the customer part.
  const part = invPart || customerPart || ''
  const jobNum = jobFromPart(part)
  const panelType = panelTypeFromPart(part)
  if (!jobNum) {
    warnings.push(`${workOrder}: could not derive job number from part '${part}'`)
  }

  // --- Determine top/bottom layer suffixes FIRST ---
  // From the selected route step's params (preferred): each layer's value after
  // the colon is the suffix (e.g. "LYR 02: 2" -> "2"). First = top, second =
  // bottom. If the step has no params, fall back to the inventory part's
  // trailing layer spec ("L-76300-02/04" -> 2 and 4).
  let topSuffix = '', bottomSuffix = ''
  const stepLayers = inp.stepLayers || []
  const normSuffix = (raw: string): string => {
    const n = parseInt(raw, 10)
    return isNaN(n) ? raw.trim() : String(n)
  }
  if (stepLayers.length >= 1 && stepLayers[0]?.layerName) {
    topSuffix = normSuffix(stepLayers[0].layerName)
    if (stepLayers.length >= 2 && stepLayers[1]?.layerName) bottomSuffix = normSuffix(stepLayers[1].layerName)
  } else {
    // The layer spec lives on the INVENTORY part (e.g. "C-01606-01/04" -> 1/4).
    // The customer part ("01606") has no spec, so use invPart specifically.
    const spec = (invPart || '').match(/-(\d{1,3})\/(\d{1,3})\s*$/)
    if (spec) { topSuffix = String(parseInt(spec[1], 10)); bottomSuffix = String(parseInt(spec[2], 10)) }
    else warnings.push(`${workOrder}: no step file params and no layer spec on part '${invPart || customerPart}'`)
  }

  // --- Fiducial/polarity from amph_cc (Control Center), per layer ---
  // Mirrors the operator's query: filter on job.name AND layer_name = <suffix>.
  // Run once per layer so each file gets its own values.
  // NOTE: the XML <fiducial_type> is populated from the fiducialName column
  // (fdetails.fid_name — e.g. "UV Marker", "5x5", "multi dot"), NOT the
  // ldetails.fiducial_type column.
  interface FidResult { fiducialType: string; regType: string; polarity: string; layerName: string }
  const fidForLayer = async (suffix: string): Promise<FidResult | null> => {
    if (!jobNum || !suffix) return null
    try {
      const rows = await querySecondaryMySQL<any>(`
        SELECT
          CONCAT(ldetails.layer_name, '.gbr') AS layerName,
          fdetails.fid_name AS fiducialName,
          ldetails.fiducial_type AS fiducialTypeCol,
          ldetails.polarity AS polarity
        FROM job j
        JOIN umr_ldi_fiducial_id ldetails ON j.id = ldetails.job_id
        JOIN umr_fiducial_details fdetails ON ldetails.global_fiducial_id = fdetails.fid_id
        WHERE j.name = ? AND ldetails.layer_name = ?
        LIMIT 1
      `, [jobNum, suffix])
      const r = rows?.[0]
      // fiducialType (XML <fiducial_type>) <- fiducialName column, per spec.
      // regType (XML <reg_type>) <- the ldetails.fiducial_type column (Global/Local).
      return r ? {
        fiducialType: r.fiducialName || '',
        regType: r.fiducialTypeCol || '',
        polarity: r.polarity || '',
        layerName: r.layerName || '',
      } : null
    } catch (e) {
      warnings.push(`${workOrder}: fiducial query (layer ${suffix}) failed (${String(e)})`)
      return null
    }
  }
  const topFid = await fidForLayer(topSuffix)
  const bottomFid = await fidForLayer(bottomSuffix)

  // --- Cu thickness from Paradigm DATA0045.PROD_SPEC_01 ---
  let cuTop = '', cuBottom = ''
  try {
    let specRows: any[] = []
    if (invPart) {
      specRows = await queryMSSQL(`
        SELECT TOP 1 D45.PROD_SPEC_01 AS spec
        FROM DATA0045 D45 WITH (NOLOCK)
        JOIN DATA0017 D17 WITH (NOLOCK) ON D45.SOURCE_PTR = D17.RKEY
        WHERE D17.INV_PART_NUMBER COLLATE DATABASE_DEFAULT = @part AND D45.SOURCE_TYPE = 1
      `, { part: invPart })
    } else if (customerPart) {
      specRows = await queryMSSQL(`
        SELECT TOP 1 D45.PROD_SPEC_01 AS spec
        FROM DATA0045 D45 WITH (NOLOCK)
        JOIN DATA0050 D50 WITH (NOLOCK) ON D45.SOURCE_PTR = D50.RKEY
        WHERE D50.CUSTOMER_PART_NUMBER COLLATE DATABASE_DEFAULT = @part AND D45.SOURCE_TYPE = 2
      `, { part: customerPart })
    }
    const cu = parseCuThickness(specRows?.[0]?.spec)
    cuTop = cu.top
    cuBottom = cu.bottom
  } catch (e) {
    warnings.push(`${workOrder}: cu_thickness query failed (${String(e)})`)
  }

  // reg_type comes from the top layer's fiducial_type column (Global/Local).
  const regType = topFid?.regType || bottomFid?.regType || ''
  const serialization = serializationFromParam(inp.serialization)

  // file_name = <job_num>_<suffix>.gbr (suffixes computed above).
  const fileForSuffix = (suffix: string): string =>
    suffix && jobNum ? `${jobNum}_${suffix}.gbr` : ''

  // Material-prep layer rule: when the part being imaged is a LAYER (part number
  // starts with "L-") AND the selected step is material prep ("I-PRP-D"), the
  // fiducial_type is hardcoded to "UV MARKER" rather than the amph_cc fid_name.
  const isLayerPart = (invPart || '').trim().toUpperCase().startsWith('L-')
  const isMatPrepStep = (inp.stepDeptCode || '').trim().toUpperCase() === 'I-PRP-D'
  const uvMarkerOverride = isLayerPart && isMatPrepStep
  const fiducialTypeFor = (fid: { fiducialType: string } | null): string =>
    uvMarkerOverride ? 'UV MARKER' : (fid?.fiducialType || '')

  const row: MdiWorkOrder = {
    wo: workOrder,
    job_num: jobNum,
    film_type: inp.filmType || '',
    panel_type: panelType,
    reg_type: regType,
    panel_thickness: inp.panelThickness || undefined,
    panel_count: inp.panelCount || undefined,
    top_layer: {
      file_name: fileForSuffix(topSuffix),
      fiducial_type: fiducialTypeFor(topFid),
      polarity: topFid?.polarity || '',
      cu_thickness: cuTop,
      serialization,
    },
    bottom_layer: {
      file_name: fileForSuffix(bottomSuffix),
      fiducial_type: fiducialTypeFor(bottomFid),
      polarity: bottomFid?.polarity || '',
      cu_thickness: cuBottom,
      serialization,
    },
  }

  return { row, warnings }
}
