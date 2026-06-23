'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Check, Pencil, Eye, RefreshCw } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type ModuleCell = { id: string; label: string; read: boolean; write: boolean }
type Row = { role: string; description: string; legacy: boolean; modules: ModuleCell[]; writeScopes: string[] }

export default function AccessMatrixPage() {
  const [modules, setModules] = useState<{ id: string; label: string }[]>([])
  const [matrix, setMatrix] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(getApiUrl('/api/admin/access'))
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
        const d = await res.json()
        setModules(d.modules || [])
        setMatrix(d.matrix || [])
      } catch (e: any) { setError(e.message) }
      finally { setLoading(false) }
    })()
  }, [])

  const Cell = ({ c }: { c: ModuleCell }) => {
    if (c.write) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700" title="Read + Write"><Pencil size={11} /> RW</span>
    if (c.read) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="Read only"><Eye size={11} /> R</span>
    return <span className="text-slate-300 text-xs">—</span>
  }

  return (
    <div className="p-6 max-w-[1200px]">
      <div className="flex items-center gap-3 mb-1">
        <ShieldCheck size={22} className="text-blue-600" />
        <h1 className="text-xl font-bold text-slate-800">Access Matrix</h1>
      </div>
      <p className="text-sm text-slate-500 mb-5">Which roles can view and write to each module. Read-only view of the current access configuration.</p>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-10 justify-center"><RefreshCw size={18} className="animate-spin" /> Loading…</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 sticky left-0 bg-slate-50">Role</th>
                  {modules.map(m => (
                    <th key={m.id} className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">{m.label}</th>
                  ))}
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Write Scopes</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map(row => (
                  <tr key={row.role} className={`border-t border-slate-100 ${row.legacy ? 'bg-slate-50/60' : ''}`}>
                    <td className="px-3 py-2.5 sticky left-0 bg-inherit">
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        {row.role}
                        {row.legacy && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">legacy</span>}
                      </div>
                      <div className="text-xs text-slate-400">{row.description}</div>
                    </td>
                    {row.modules.map(c => (
                      <td key={c.id} className="px-3 py-2.5 text-center"><Cell c={c} /></td>
                    ))}
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {row.writeScopes.length === 0 ? <span className="text-slate-400">None</span> : row.writeScopes.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><span className="px-2 py-0.5 rounded bg-green-100 text-green-700 inline-flex items-center gap-1"><Eye size={11} /> R</span> view</span>
            <span className="inline-flex items-center gap-1"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 inline-flex items-center gap-1"><Pencil size={11} /> RW</span> view + write</span>
            <span>— no access</span>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Defined in <code>lib/config/access.ts</code>. Module visibility is enforced from this matrix; per-action write enforcement is being migrated to use it.
          </p>
        </>
      )}
    </div>
  )
}
