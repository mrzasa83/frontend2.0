import { Home, Package, Users, Settings, Cog, ClipboardCheck, AppWindow } from 'lucide-react'
import { canReadModule, canReadSubmodule } from './access'

export type SubModule = {
  id: string
  name: string
  path: string
  requiredRoles: string[] // Empty array = everyone can access
  adminOnly?: boolean // Deprecated - use requiredRoles instead
}

export type Module = {
  id: string
  name: string
  icon: any
  path?: string
  requiredRoles: string[] // Empty array = everyone can access
  subModules?: SubModule[]
}

// Define all available modules with their role requirements
export const MODULES: Module[] = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: Home, 
    path: '/dashboard',
    requiredRoles: [] // Everyone can see dashboard
  },
  {
    id: 'operations',
    name: 'Operation',
    icon: ClipboardCheck,
    requiredRoles: ['Admin', 'ProcessEng', 'ProductEng', 'NPIEng', 'Operations', 'Production Control', 'Quality Control'],
    subModules: [
      {
        id: 'operations-dashboard',
        name: 'Dashboard',
        path: '/operations',
        requiredRoles: ['Admin', 'ProcessEng', 'ProductEng', 'NPIEng', 'Operations', 'Production Control', 'Quality Control']
      },
      {
        id: 'inspections',
        name: 'Inspections',
        path: '/operations/inspections',
        requiredRoles: ['Admin', 'ProcessEng', 'ProductEng', 'NPIEng', 'Operations', 'Production Control', 'Quality Control']
      },
      {
        id: 'reworks',
        name: 'Reworks',
        path: '/operations/reworks',
        requiredRoles: ['Admin', 'ProcessEng', 'ProductEng', 'NPIEng', 'Operations', 'Production Control', 'Quality Control']
      },
      {
        id: 'audits',
        name: 'Audits',
        path: '/operations/audits',
        requiredRoles: ['Admin', 'ProcessEng', 'ProductEng', 'NPIEng', 'Operations']
      }
    ]
  },
  { 
    id: 'products', 
    name: 'Product', 
    icon: Package,
    requiredRoles: ['Admin', 'roUser', 'ProductEng', 'ProcessEng', 'NPIEng', 'Operations'],
    subModules: [
      { 
        id: 'products-list', 
        name: 'Products', 
        path: '/products',
        requiredRoles: ['Admin', 'roUser', 'ProductEng', 'ProcessEng', 'NPIEng', 'Operations']
      },
      { 
        id: 'documents', 
        name: 'Documents', 
        path: '/products/documents',
        requiredRoles: ['Admin', 'roUser', 'ProductEng', 'ProcessEng', 'NPIEng', 'Operations']
      },
      { 
        id: 'changes', 
        name: 'Changes', 
        path: '/products/changes',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng', 'NPIEng']
      }
    ]
  },
  { 
    id: 'process', 
    name: 'Process', 
    icon: Cog,
    requiredRoles: ['Admin', 'ProductEng', 'ProcessEng', 'NPIEng'],
    subModules: [
      { 
        id: 'scales', 
        name: 'Scales', 
        path: '/process/scales',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng', 'NPIEng']
      },
      { 
        id: 'drill-rout', 
        name: 'Drill/Rout', 
        path: '/process/drill-rout',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng', 'NPIEng']
      },
      { 
        id: 'classification', 
        name: 'Classification', 
        path: '/process/classification',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng', 'NPIEng']
      },
      { 
        id: 'scrap-charts', 
        name: 'Scrap Charts', 
        path: '/process/scrap-charts',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng', 'NPIEng', 'Operations']
      }
    ]
  },
  { 
    id: 'apps', 
    name: 'App', 
    icon: AppWindow,
    requiredRoles: [],
    subModules: [
      { 
        id: 'frontvue', 
        name: 'FrontVue', 
        path: '/apps/frontvue',
        requiredRoles: []
      },
      { 
        id: 'terminal', 
        name: 'Terminal', 
        path: '/apps/terminal',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng', 'NPIEng']
      }
    ]
  },
  { 
    id: 'users', 
    name: 'User', 
    icon: Users,
    requiredRoles: [], // Everyone can see user directory
    subModules: [
      { 
        id: 'users-list', 
        name: 'Users', 
        path: '/users',
        requiredRoles: [] // Everyone can see user directory (read-only)
      }
    ]
  },
  { 
    id: 'admin', 
    name: 'Admin', 
    icon: Settings,
    requiredRoles: ['Admin'], // Only Admin can see admin module
    subModules: [
      { 
        id: 'admin-dashboard', 
        name: 'Dashboard', 
        path: '/admin',
        requiredRoles: ['Admin']
      },
      { 
        id: 'user-management', 
        name: 'User Management', 
        path: '/admin/users',
        requiredRoles: ['Admin']
      },
      { 
        id: 'role-management', 
        name: 'Role Management', 
        path: '/admin/roles',
        requiredRoles: ['Admin']
      },
      {
        id: 'access-matrix',
        name: 'Access Matrix',
        path: '/admin/access',
        requiredRoles: ['Admin']
      },
      { 
        id: 'import-parts', 
        name: 'Import Parts', 
        path: '/admin/import-parts',
        requiredRoles: ['Admin']
      },
      { 
        id: 'sync-parts', 
        name: 'Sync Parts', 
        path: '/admin/sync-parts',
        requiredRoles: ['Admin']
      },
      { 
        id: 'sql-query', 
        name: 'SQL Query', 
        path: '/admin/sql-query',
        requiredRoles: ['Admin']
      },
      { 
        id: 'dept-groupings', 
        name: 'Scrap Disciplines', 
        path: '/admin/scrap-disciplines',
        requiredRoles: ['Admin']
      },
      { 
        id: 'print-status', 
        name: 'Paradigm File Status', 
        path: '/admin/print-status',
        requiredRoles: ['Admin']
      },
      { 
        id: 'work-centers', 
        name: 'Work Centers', 
        path: '/admin/work-centers',
        requiredRoles: ['Admin']
      }
    ]
  }
]

/**
 * Check if user has permission to access a module (now matrix-driven by id).
 * The legacy requiredRoles arrays remain on the config for reference but the
 * access matrix in access.ts is the source of truth.
 */
export function hasModuleAccess(
  userRoles: string[] | undefined,
  requiredRoles: string[]
): boolean {
  if (requiredRoles.length === 0) return true
  if (!userRoles || userRoles.length === 0) return false
  if (userRoles.includes('Admin')) return true
  return requiredRoles.some(role => userRoles.includes(role))
}

/**
 * Filter modules based on user's roles, using the access matrix by id.
 */
export function getVisibleModules(userRoles: string[] | undefined): Module[] {
  return MODULES
    .filter(module => canReadModule(userRoles, module.id))
    .map(module => {
      if (module.subModules) {
        const visibleSubModules = module.subModules.filter(sub =>
          canReadSubmodule(userRoles, module.id, sub.id)
        )
        if (visibleSubModules.length > 0 || module.path) {
          return { ...module, subModules: visibleSubModules }
        }
        return null
      }
      return module
    })
    .filter((module): module is Module => module !== null)
}

/**
 * Check if user can access a specific path (matrix-driven).
 */
export function canAccessPath(
  userRoles: string[] | undefined,
  path: string
): boolean {
  for (const module of MODULES) {
    if (module.path === path) {
      return canReadModule(userRoles, module.id)
    }
    if (module.subModules) {
      for (const subModule of module.subModules) {
        if (subModule.path === path || path.startsWith(subModule.path)) {
          return canReadSubmodule(userRoles, module.id, subModule.id)
        }
      }
    }
  }
  
  // If path not found in config, deny by default
  return false
}