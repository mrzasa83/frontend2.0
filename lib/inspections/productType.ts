/**
 * PCB or assembly, from the inventory part number.
 *
 * The old rule tested the LEADING DIGIT — 7 meant PCB, 1 meant assembly — and
 * was handed the inventory part number, which starts with a letter:
 * C-75862-01/26, A-12792-ASM. Neither branch ever matched, so every
 * inspection fell through to the 'PCB' default. That is why the list reads
 * PCB for everything, assemblies included.
 *
 * The prefix is what actually says which it is:
 *
 *   A-   assembly
 *   C-   } the board itself and its layers: core, stiffener,
 *   S-   } lamination, bond ply. All of these are a PCB inspection.
 *   L-   }
 *   B-   }
 *
 * The digit rule is kept as a FALLBACK, not removed: the customer part number
 * (75862, 12792) carries no prefix, and it is what gets used when a work order
 * has no inventory part on it.
 */

export type ProductType = 'PCB' | 'ASM'

/** Prefixes that mean an assembly. */
const ASSEMBLY_PREFIXES = ['A']
/** Prefixes that mean the board itself. */
const PCB_PREFIXES = ['C', 'S', 'L', 'B']

/**
 * Returns null when the part says nothing either way, so a caller can tell
 * "this is a PCB" apart from "nothing matched, defaulting to PCB". The UI uses
 * that to mark its guess as a guess.
 */
export function productTypeFromPartOrNull(part: string): ProductType | null {
  const p = String(part ?? '').trim().toUpperCase()
  if (!p) return null

  // PREFIX-… — the inventory part number.
  const prefix = p.match(/^([A-Z]+)\s*-/)?.[1]
  if (prefix) {
    if (ASSEMBLY_PREFIXES.includes(prefix)) return 'ASM'
    if (PCB_PREFIXES.includes(prefix)) return 'PCB'
    // A letter prefix we do not know is NOT forced to PCB here; falling
    // through lets the caller show it as a default rather than as a reading.
    return null
  }

  // No prefix — the customer part number. 7xxxx is a board, 1xxxx an assembly.
  if (p.startsWith('7')) return 'PCB'
  if (p.startsWith('1')) return 'ASM'
  return null
}

/** The same, with the default applied. Use where a value is required. */
export function productTypeFromPart(part: string): ProductType {
  return productTypeFromPartOrNull(part) ?? 'PCB'
}

/**
 * The best read across the two numbers a work order carries, preferring the
 * inventory part because it has the prefix.
 */
export function productTypeForWorkOrder(
  invPartNumber?: string | null,
  customerPart?: string | null
): { type: ProductType; inferred: boolean } {
  const fromInv = productTypeFromPartOrNull(invPartNumber || '')
  if (fromInv) return { type: fromInv, inferred: true }
  const fromCust = productTypeFromPartOrNull(customerPart || '')
  if (fromCust) return { type: fromCust, inferred: true }
  return { type: 'PCB', inferred: false }
}

export const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'PCB', label: 'PCB' },
  { value: 'ASM', label: 'Assembly' },
]
