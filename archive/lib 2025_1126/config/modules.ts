import { Home, Package, Users, Settings, Cog } from 'lucide-react'

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
    id: 'products', 
    name: 'Product', 
    icon: Package,
    requiredRoles: ['Admin', 'roUser', 'ProductEng', 'ProcessEng', 'Operations'],
    subModules: [
      { 
        id: 'products-list', 
        name: 'Products', 
        path: '/products',
        requiredRoles: ['Admin', 'roUser', 'ProductEng', 'ProcessEng', 'Operations']
      },
      { 
        id: 'documents', 
        name: 'Documents', 
        path: '/products/documents',
        requiredRoles: ['Admin', 'roUser', 'ProductEng', 'ProcessEng', 'Operations']
      },
      { 
        id: 'changes', 
        name: 'Changes', 
        path: '/products/changes',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng']
      }
    ]
  },
  { 
    id: 'process', 
    name: 'Process', 
    icon: Cog,
    requiredRoles: ['Admin', 'ProductEng', 'ProcessEng'],
    subModules: [
      { 
        id: 'process-list', 
        name: 'Processes', 
        path: '/process',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng']
      },
      { 
        id: 'department-list', 
        name: 'Department', 
        path: '/process/department-list',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng']
      },
      { 
        id: 'processsequence-list', 
        name: 'Process Sequences', 
        path: '/process/sequence-list',
        requiredRoles: ['Admin', 'ProductEng', 'ProcessEng']
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
      }
    ]
  }
]

/**
 * Check if user has permission to access a module
 */
export function hasModuleAccess(
  userRoles: string[] | undefined, 
  requiredRoles: string[]
): boolean {
  // If no roles required, everyone can access
  if (requiredRoles.length === 0) {
    return true
  }

  // If user has no roles, they can't access
  if (!userRoles || userRoles.length === 0) {
    return false
  }

  // Admin can access everything
  if (userRoles.includes('Admin')) {
    return true
  }

  // Check if user has at least one of the required roles
  return requiredRoles.some(role => userRoles.includes(role))
}

/**
 * Filter modules based on user's roles
 */
export function getVisibleModules(userRoles: string[] | undefined): Module[] {
  return MODULES
    .filter(module => hasModuleAccess(userRoles, module.requiredRoles))
    .map(module => {
      // Filter sub-modules based on roles
      if (module.subModules) {
        const visibleSubModules = module.subModules.filter(sub => 
          hasModuleAccess(userRoles, sub.requiredRoles)
        )
        
        // Only return module if it has visible sub-modules or a direct path
        if (visibleSubModules.length > 0 || module.path) {
          return {
            ...module,
            subModules: visibleSubModules
          }
        }
        return null
      }
      return module
    })
    .filter((module): module is Module => module !== null)
}

/**
 * Check if user can access a specific path
 */
export function canAccessPath(
  userRoles: string[] | undefined,
  path: string
): boolean {
  // Find the module/sub-module that matches this path
  for (const module of MODULES) {
    if (module.path === path) {
      return hasModuleAccess(userRoles, module.requiredRoles)
    }
    
    if (module.subModules) {
      for (const subModule of module.subModules) {
        if (subModule.path === path || path.startsWith(subModule.path)) {
          return hasModuleAccess(userRoles, subModule.requiredRoles)
        }
      }
    }
  }
  
  // If path not found in config, deny by default
  return false
}