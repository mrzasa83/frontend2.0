'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import { getVisibleModules } from '@/lib/config/modules'

export default function SideNav({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(['products', 'users', 'admin', 'process', 'operations'])
  )

  // Get user's roles
  const userRoles = session?.user?.roles || []

  // Filter modules based on user's roles
  const visibleModules = useMemo(() => {
    return getVisibleModules(userRoles)
  }, [userRoles])

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  return (
    <div
      className={`bg-slate-900 text-white transition-all duration-300 flex-shrink-0 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex flex-col h-full">
        <button
          onClick={onToggle}
          className="p-4 hover:bg-slate-800 transition-colors flex items-center justify-center"
        >
          {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        <nav className="flex-1 p-2 overflow-y-auto">
          {visibleModules.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-4">
              {isOpen ? 'No modules available' : ''}
            </div>
          ) : (
            <ul className="space-y-1">
              {visibleModules.map((module) => {
                const Icon = module.icon
                const hasSubModules = module.subModules && module.subModules.length > 0
                const isExpanded = expandedModules.has(module.id)
                const isActive = module.path 
                  ? pathname.startsWith(module.path)
                  : module.subModules?.some(sub => pathname.startsWith(sub.path))
                
                return (
                  <li key={module.id}>
                    {/* Main Module */}
                    {hasSubModules ? (
                      <button
                        onClick={() => toggleModule(module.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                        title={!isOpen ? module.name : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={20} className="flex-shrink-0" />
                          {isOpen && <span>{module.name}</span>}
                        </div>
                        {isOpen && (
                          isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                        )}
                      </button>
                    ) : (
                      <Link
                        href={module.path!}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                        title={!isOpen ? module.name : undefined}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        {isOpen && <span>{module.name}</span>}
                      </Link>
                    )}

                    {/* Sub Modules */}
                    {hasSubModules && isExpanded && isOpen && module.subModules && module.subModules.length > 0 && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {module.subModules.map((subModule) => {
                          const isSubActive = pathname === subModule.path || pathname.startsWith(subModule.path + '/')
                          return (
                            <li key={subModule.id}>
                              <Link
                                href={subModule.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                                  isSubActive
                                    ? 'bg-blue-500 text-white'
                                    : 'hover:bg-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="w-1 h-1 rounded-full bg-current" />
                                {subModule.name}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </nav>
      </div>
    </div>
  )
}