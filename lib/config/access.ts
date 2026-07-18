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

export const ALL_MODULES = ['dashboard', 'operations', 'products', 'process', 'apps', 'users', 'admin'] as const

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
  { name: 'Program', description: 'View Operation, Product, App, User' },
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

  ProcessEng:  { read: ['operations', 'products', 'process', 'apps', 'users'], write: ['process'] },
  ProductEng:  { read: ['operations', 'products', 'process', 'apps', 'users'], write: ['products'] },

  Program:     { read: ['operations', 'products', 'apps', 'users'], write: [] },
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

const has = (roles: string[] | undefined, name: string) => !!roles && roles.includes(name)
const isAdmin = (roles: string[] | undefined) => has(roles, 'Admin')

/** Can any of the user's roles VIEW this top-level module? */
export function canReadModule(roles: string[] | undefined, moduleId: string): boolean {
  if (moduleId === 'dashboard') return true
  if (isAdmin(roles)) return true
  if (!roles?.length) return false
  return roles.some(r => {
    const a = ROLE_ACCESS[r]
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
    const a = ROLE_ACCESS[r]
    if (!a) return false
    if (a.write.includes('*')) return true
    // exact submodule grant, or a module-level grant covering this scope
    return a.write.some(w => w === scope || w === moduleOfScope)
  })
}

/** Resolve the effective read/write for a single role (for the Admin viewer). */
export function effectiveAccess(role: string): RoleAccess {
  return ROLE_ACCESS[role] || { read: [], write: [] }
}
