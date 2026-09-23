/**
 * First Article inspection phases — the single source of truth.
 *
 * These were previously repeated in five places (two page components, the
 * signoff tab, the signoff API, and the database ENUM), which is why changing
 * them meant editing five files and a migration. Everything now imports from
 * here; only the database needs a migration when the list changes, and
 * `sql/alter_inspections_phase_varchar.sql` removes even that.
 */

/** Every selectable phase, in the order the dropdown shows them. */
export const PHASES = [
  'Setup',
  'In Plan',
  'Ballooned',
  'Certs',
  'Measurements',
  'Verify',
  'Review',
  'Rejected',
  'Complete',
  'Hold',
] as const

export type Phase = (typeof PHASES)[number]

/**
 * The phases an inspection moves through in order, for the signoff pipeline.
 *
 * Rejected and Hold are deliberately excluded: they are states an inspection
 * can land in from anywhere rather than steps on the way to Complete, exactly
 * as Rework and Canceled were before. Including them would put "sign off on
 * Hold" between Review and Complete.
 */
export const PIPELINE: readonly string[] = [
  'Setup',
  'In Plan',
  'Ballooned',
  'Certs',
  'Measurements',
  'Verify',
  'Review',
  'Complete',
]

/** Phases where the inspection is finished and no further signoff applies. */
export const TERMINAL_PHASES: readonly string[] = ['Complete', 'Rejected']

export const PHASE_COLORS: Record<string, string> = {
  Setup: 'bg-slate-100 text-slate-600',
  'In Plan': 'bg-sky-100 text-sky-700',
  Ballooned: 'bg-cyan-100 text-cyan-700',
  Certs: 'bg-teal-100 text-teal-700',
  Measurements: 'bg-blue-100 text-blue-700',
  Verify: 'bg-indigo-100 text-indigo-700',
  Review: 'bg-yellow-100 text-yellow-700',
  Rejected: 'bg-red-100 text-red-700',
  Complete: 'bg-green-100 text-green-700',
  Hold: 'bg-orange-100 text-orange-700',
}

export const CHART_COLORS: Record<string, string> = {
  Setup: '#94a3b8',
  'In Plan': '#0ea5e9',
  Ballooned: '#06b6d4',
  Certs: '#14b8a6',
  Measurements: '#3b82f6',
  Verify: '#6366f1',
  Review: '#eab308',
  Rejected: '#ef4444',
  Complete: '#22c55e',
  Hold: '#f97316',
}

/**
 * Legacy phase names, mapped to their replacements.
 *
 * Kept in the app as well as in the migration so an inspection whose row was
 * not migrated still renders with a sensible label and colour instead of
 * falling through to an unstyled badge. Reading is forgiving; writing only
 * ever uses PHASES.
 */
export const LEGACY_PHASES: Record<string, string> = {
  Measurement: 'Measurements',
  Submitted: 'Review',
  Rework: 'Rejected',
  Completed: 'Complete',
  Canceled: 'Hold',
}

/** Display name for a stored phase, tolerating pre-migration values. */
export const displayPhase = (p: string): string => LEGACY_PHASES[p] || p || 'Setup'
