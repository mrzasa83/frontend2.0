/**
 * Network / ERP username.
 *
 * The batch card printout shows the operator's ERP login (DATA0005.ABBR_NAME),
 * which doesn't match the app login: michael.rzasa signs in here but is mrzasa
 * in Paradigm. The rule is first initial + surname, so it can be derived rather
 * than typed for everyone — but it doesn't hold universally (duplicates,
 * hyphenated names, people who predate the convention), so an admin can
 * override it and the stored value always wins.
 */

/** michael.rzasa -> mrzasa;  todd.woodbury -> twoodbury */
export function deriveNetworkUsername(username: string): string {
  const u = String(username ?? '').trim().toLowerCase()
  if (!u) return ''
  const dot = u.indexOf('.')
  if (dot <= 0) return u                       // no dot — nothing to derive from
  const first = u.slice(0, dot)
  const rest = u.slice(dot + 1).replace(/\./g, '')
  if (!rest) return first
  return `${first.charAt(0)}${rest}`
}

/** The stored override when set, otherwise the derived value. */
export function networkUsernameFor(
  username: string, stored?: string | null,
): string {
  const s = String(stored ?? '').trim()
  return s || deriveNetworkUsername(username)
}
