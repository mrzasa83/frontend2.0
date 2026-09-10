/**
 * CAS Registry Number handling.
 *
 * CAS numbers arrive from SDS data in every shape imaginable — hyphenated,
 * unhyphenated, zero-padded, with stray whitespace or a trailing footnote
 * marker. Matching an ingredient against a regulated-substance list is a string
 * comparison, so everything is normalised to the canonical form first:
 *
 *     NNNNNNN-NN-N       e.g. 7439-92-1 (lead), 7440-31-5 (tin)
 *
 * A CAS number carries a check digit, which is worth verifying: a transposed
 * digit that happens to land on another registered substance would otherwise
 * silently screen the wrong chemical.
 */

/** Canonical form, or '' if the input can't be read as a CAS number. */
export function normalizeCas(input: string | null | undefined): string {
  const digits = String(input ?? '').replace(/[^0-9]/g, '')
  // 2-7 digits, then 2, then the check digit: 5 to 10 total.
  if (digits.length < 5 || digits.length > 10) return ''
  const check = digits.slice(-1)
  const middle = digits.slice(-3, -1)
  const first = digits.slice(0, -3).replace(/^0+/, '')
  if (!first) return ''
  return `${first}-${middle}-${check}`
}

/**
 * Verify the check digit. The last digit equals, mod 10, the sum of every
 * other digit multiplied by its position counting from the right.
 *
 *   7439-92-1 -> 1*2 + 2*9 + 3*9 + 4*3 + 5*4 + 6*7 = 121 -> 121 % 10 = 1 ✓
 */
export function isValidCas(input: string | null | undefined): boolean {
  const cas = normalizeCas(input)
  if (!cas) return false
  const digits = cas.replace(/-/g, '')
  const check = Number(digits.slice(-1))
  const body = digits.slice(0, -1)
  let sum = 0
  for (let i = 0; i < body.length; i++) {
    // Rightmost body digit has weight 1, next 2, and so on.
    sum += Number(body[body.length - 1 - i]) * (i + 1)
  }
  return sum % 10 === check
}

/**
 * Parse a stated percentage into a [min, max] pair.
 *
 * SDS ingredient tables state concentrations as ranges, and HSI surfaces both
 * the range string and separate min/max columns. This handles the string form
 * for the cases where only that came back:
 *
 *   "59 - 64%"   -> { min: 59,   max: 64   }
 *   "36-41%"     -> { min: 36,   max: 41   }
 *   "< 0.1%"     -> { min: 0,    max: 0.1  }
 *   ">= 25 %"    -> { min: 25,   max: 100  }
 *   "5"          -> { min: 5,    max: 5    }
 *   "trace"      -> { min: null, max: null }
 *
 * max is what threshold tests use — the conservative reading. An unbounded
 * lower bound (">= 25%") tops out at 100 rather than null, because "at least
 * 25%" is certainly over any 0.1% limit and should screen as such.
 */
export function parsePercentRange(stated: string | null | undefined): {
  min: number | null
  max: number | null
} {
  const s = String(stated ?? '').trim()
  if (!s) return { min: null, max: null }

  const nums = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number)
  if (nums.length === 0) return { min: null, max: null }

  if (nums.length >= 2) {
    const [a, b] = nums
    return { min: Math.min(a, b), max: Math.max(a, b) }
  }

  const n = nums[0]
  if (/[<≤]/.test(s)) return { min: 0, max: n }
  if (/[>≥]/.test(s)) return { min: n, max: 100 }
  return { min: n, max: n }
}
