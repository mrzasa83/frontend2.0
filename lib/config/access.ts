/**
 * Central access matrix — single source of truth for role-based access.
 *
 * Two dimensions per role:
 *   read  — top-level module ids the role can VIEW
 *   write — scopes the role can EDIT (module id, or "module/submodule", or '*')
 *
 * Module ids: dashboard, operations, products, process, apps, users, admin
 * Write scopes: '*', a module id (e.g. 'process' = Process->*), or a
 * submodule path (e.g. 'operations/inspections').
 *
 * Legacy role names (Operations, Production Control, Quality Control, NPIEng)
 * are kept so existing user assignments keep working until they are migrated
 * to the new role names via Role Management.
 */

export type RoleAccess = { read: string[]; write: string[] }

export const ALL_MODULES = ['dashboard', 'contract', 'ehs', 'operations', 'products', 'process', 'apps', 'users', 'admin'] as const

// Roles in display order, with a short description for the Admin viewer.
export const ROLE_DEFS: { name: string; description: string; legacy?: boolean }[] = [
  { name: 'Admin', description: 'All modules, write to anything' },
  { name: 'CADadmin', description: 'View Operation, Product, Process' },
  { name: 'CADContrib', description: 'View Operation, Product, Process' },
  { name: 'CADro', description: 'View Operation, Product, Process' },
  { name: 'NPIeng', description: 'NPI module (separate app); write NPI' },
  { name: 'OpsRo', description: 'View Operation, Product, Process' },
  { name: 'OpsCreate', description: 'View Op/Prod/Process; write Operation→Inspections' },
  { name: 'ProcessEng', description: 'View Op/Prod/Process/App/User; write Process→*' },
  { name: 'ProductEng', description: 'View Op/Prod/Process/App/User; write Product→*' },
  { name: 'Program', description: 'View Operation, Product, App, User, Contract, EHS' },
  { name: 'EHSadmin', description: 'View EHS; write EHS→* (families, classifications, documents)' },
  { name: 'roUser', description: 'View Operation, Product, App (read-only)' },
  { name: 'FAIadmin', description: 'View Operations; delete First Article Inspections' },
  // Legacy aliases (kept for backward compatibility)
  { name: 'Operations', description: 'Legacy → like OpsCreate', legacy: true },
  { name: 'Production Control', description: 'Legacy → like OpsCreate', legacy: true },
  { name: 'Quality Control', description: 'Legacy → like OpsCreate', legacy: true },
  { name: 'NPIEng', description: 'Legacy → like NPIeng', legacy: true },
]

export const ROLE_ACCESS: Record<string, RoleAccess> = {
  Admin:       { read: ['*'], write: ['*'] },

  CADadmin:    { read: ['operations', 'products', 'process'], write: [] },
  CADContrib:  { read: ['operations', 'products', 'process'], write: [] },
  CADro:       { read: ['operations', 'products', 'process'], write: [] },

  NPIeng:      { read: ['operations', 'products', 'process'], write: ['npi'] },

  OpsRo:       { read: ['operations', 'products', 'process'], write: [] },
  // OpsCreate writes the Operation creation apps (Inspections per the table,
  // plus Reworks which post-dates the table — adjust here if needed).
  OpsCreate:   { read: ['operations', 'products', 'process'], write: ['operations/inspections', 'operations/reworks'] },

  ProcessEng:  { read: ['operations', 'products', 'process', 'apps', 'users', 'ehs'], write: ['process'] },
  ProductEng:  { read: ['operations', 'products', 'process', 'apps', 'users', 'ehs'], write: ['products'] },

  Program:     { read: ['operations', 'products', 'apps', 'users', 'contract', 'ehs'], write: [] },

  // EHS Admin — the only non-Admin role that may modify EHS data
  // (families, criteria, classifications and supporting documents).
  EHSadmin:    { read: ['operations', 'products', 'process', 'apps', 'ehs'], write: ['ehs'] },
  roUser:      { read: ['operations', 'products', 'apps'], write: [] },

  // FAI Admin — can view Operations and delete First Article Inspections
  // (delete is enforced by role in the delete API, confirmed with own password).
  FAIadmin:    { read: ['operations', 'products', 'process'], write: [] },

  // ── Legacy aliases ──
  Operations:           { read: ['operations', 'products', 'process'], write: ['operations'] },
  'Production Control':  { read: ['operations', 'products', 'process'], write: ['operations'] },
  'Quality Control':     { read: ['operations', 'products', 'process'], write: ['operations'] },
  NPIEng:               { read: ['operations', 'products', 'process'], write: ['npi'] },
}

/**
 * Finer per-submodule READ overrides that the coarse module matrix can't
 * express. If a submodule id appears here, these roles (plus Admin) gate it.
 */
export const SUBMODULE_READ_OVERRIDES: Record<string, string[]> = {
  changes: ['ProductEng', 'ProcessEng', 'NPIeng', 'NPIEng'],
  audits: ['ProcessEng', 'ProductEng', 'NPIeng', 'NPIEng', 'Operations', 'OpsRo', 'OpsCreate'],
}

const has = (roles: string[] | undefined, name: string) =>
  !!roles && roles.some(r => String(r).toLowerCase() === name.toLowerCase())
const isAdmin = (roles: string[] | undefined) => has(roles, 'Admin')

/** Can any of the user's roles VIEW this top-level module? */
/**
 * Role names are compared case-insensitively.
 *
 * Roles are typed by hand when they're assigned, so the same role turns up as
 * "EHSadmin", "ehsAdmin" or "EHSAdmin". An exact-match lookup silently grants
 * nothing in that case — the user sees a read-only page and no error, which is
 * a miserable thing to debug. Matching loosely is the safer failure mode here:
 * the alternative isn't stricter security, it's an admin who can't do their job.
 */
export function hasRole(roles: string[] | undefined, ...names: string[]): boolean {
  if (!roles?.length) return false
  const want = names.map(n => n.toLowerCase())
  return roles.some(r => want.includes(String(r).toLowerCase()))
}

/** The ROLE_ACCESS entry for a role name, matched case-insensitively. */
function accessFor(role: string) {
  const direct = ROLE_ACCESS[role]
  if (direct) return direct
  const key = Object.keys(ROLE_ACCESS).find(k => k.toLowerCase() === String(role).toLowerCase())
  return key ? ROLE_ACCESS[key] : undefined
}

export function canReadModule(roles: string[] | undefined, moduleId: string): boolean {
  if (moduleId === 'dashboard') return true
  if (isAdmin(roles)) return true
  if (!roles?.length) return false
  return roles.some(r => {
    const a = accessFor(r)
    return a && (a.read.includes('*') || a.read.includes(moduleId))
  })
}

/** Can any of the user's roles VIEW this submodule? */
export function canReadSubmodule(roles: string[] | undefined, moduleId: string, submoduleId: string): boolean {
  if (isAdmin(roles)) return true
  const override = SUBMODULE_READ_OVERRIDES[submoduleId]
  if (override) return !!roles && roles.some(r => override.includes(r))
  return canReadModule(roles, moduleId)
}

/**
 * Can the user WRITE to a given scope? Scope is a module id ('process') or a
 * submodule path ('operations/inspections'). A module-level write grant covers
 * its submodules (writing 'process' covers 'process/scales').
 */
export function canWriteScope(roles: string[] | undefined, scope: string): boolean {
  if (isAdmin(roles)) return true
  if (!roles?.length) return false
  const moduleOfScope = scope.split('/')[0]
  return roles.some(r => {
    const a = accessFor(r)
    if (!a) return false
    if (a.write.includes('*')) return true
    // exact submodule grant, or a module-level grant covering this scope
    return a.write.some(w => w === scope || w === moduleOfScope)
  })
}

/** Resolve the effective read/write for a single role (for the Admin viewer). */
export function effectiveAccess(role: string): RoleAccess {
  return accessFor(role) || { read: [], write: [] }
}
