'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { RefreshCw, Search, Plus, Trash2, CheckSquare, Square, ArrowRight } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type ParadigmDept = { code: string; name: string }
type Mapping = {
  id: number; escf_department: string
  paradigm_dept_code: string; paradigm_dept_name: string
  created_by: string; created_at: string
}

export default function WorkCentersPage() {
  const { data: session } = useSession()
  const [escfDepts, setEscfDepts] = useState<string[]>([])
  const [paradigmDepts, setParadigmDepts] = useState<ParadigmDept[]>([])
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [deptSearch, setDeptSearch] = useState('')
  const [paradigmSearch, setParadigmSearch] = useState('')
  const [selectedParadigm, setSelectedParadigm] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const isAdmin = session?.user?.roles?.some((r: string) => r === 'Admin') || false

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/admin/work-centers'))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setEscfDepts(r.escfDepartments || [])
      setParadigmDepts(r.paradigmDepartments || [])
      setMappings(r.mappings || [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // Mappings for the selected department
  const currentMappings = useMemo(() => {
    if (!selectedDept) return []
    return mappings.filter(m => m.escf_department === selectedDept)
  }, [mappings, selectedDept])

  const mappedCodes = useMemo(() => new Set(currentMappings.map(m => m.paradigm_dept_code)), [currentMappings])

  // Filtered lists
  const filteredEscf = useMemo(() => {
    if (!deptSearch.trim()) return escfDepts
    const q = deptSearch.toLowerCase()
    return escfDepts.filter(d => d.toLowerCase().includes(q))
  }, [escfDepts, deptSearch])

  const filteredParadigm = useMemo(() => {
    let list = paradigmDepts
    if (paradigmSearch.trim()) {
      const q = paradigmSearch.toLowerCase()
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
    }
    return list
  }, [paradigmDepts, paradigmSearch])

  // Count mappings per ESCF department
  const mappingCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    mappings.forEach(m => { counts[m.escf_department] = (counts[m.escf_department] || 0) + 1 })
    return counts
  }, [mappings])

  const toggleParadigm = (code: string) => {
    setSelectedParadigm(prev => {
      const n = new Set(prev)
      n.has(code) ? n.delete(code) : n.add(code)
      return n
    })
  }

  const handleAddMappings = async () => {
    if (!selectedDept || selectedParadigm.size === 0) return
    setSaving(true)
    const depts = [...selectedParadigm].map(code => {
      const p = paradigmDepts.find(d => d.code === code)
      return { code, name: p?.name || '' }
    })
    try {
      const res = await fetch(getApiUrl('/api/admin/work-centers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escfDepartment: selectedDept, paradigmDepts: depts }),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      setSelectedParadigm(new Set())
      await fetchData()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const handleRemoveMapping = async (id: number) => {
    try {
      await fetch(getApiUrl(`/api/admin/work-centers?id=${id}`), { method: 'DELETE' })
      await fetchData()
    } catch (e: any) { setError(e.message) }
  }

  if (loading) {
    return <div className="p-6 flex items-center gap-3"><RefreshCw size={20} className="animate-spin text-blue-600" /> Loading...</div>
  }

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Work Center Management</h1>
          <p className="text-sm text-slate-600">Map ESCF work centers to Paradigm departments</p>
        </div>
        <button onClick={fetchData} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4 flex-shrink-0">{error}</div>}

      <div className="flex-1 min-h-0 flex gap-4">
        {/* Left: ESCF Departments */}
        <div className="w-64 flex flex-col bg-white rounded-lg border border-slate-200 flex-shrink-0">
          <div className="p-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">ESCF Departments ({escfDepts.length})</h3>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input type="text" value={deptSearch} onChange={e => setDeptSearch(e.target.value)}
                placeholder="Filter..."
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredEscf.map(dept => (
              <button key={dept} onClick={() => { setSelectedDept(dept); setSelectedParadigm(new Set()) }}
                className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-100 transition-colors flex items-center justify-between ${
                  selectedDept === dept ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}>
                <span className="truncate">{dept}</span>
                {mappingCounts[dept] && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2">
                    {mappingCounts[dept]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Paradigm departments + current mappings */}
        <div className="flex-1 flex flex-col gap-4">
          {!selectedDept ? (
            <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-slate-200">
              <p className="text-slate-400">Select an ESCF department from the left</p>
            </div>
          ) : (
            <>
              {/* Current mappings */}
              <div className="bg-white rounded-lg border border-slate-200 flex-shrink-0">
                <div className="p-3 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Mapped to: <span className="text-blue-600">{selectedDept}</span>
                    <span className="font-normal text-slate-400 ml-2">({currentMappings.length} departments)</span>
                  </h3>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {currentMappings.length === 0 ? (
                    <p className="p-3 text-sm text-slate-400 italic">No Paradigm departments mapped yet</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Code</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Department Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Added By</th>
                          <th className="px-3 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {currentMappings.map(m => (
                          <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono text-slate-800">{m.paradigm_dept_code}</td>
                            <td className="px-3 py-2 text-slate-700">{m.paradigm_dept_name}</td>
                            <td className="px-3 py-2 text-slate-500 text-xs">{m.created_by}</td>
                            <td className="px-3 py-2">
                              {isAdmin && (
                                <button onClick={() => handleRemoveMapping(m.id)}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Available Paradigm departments */}
              <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 flex flex-col">
                <div className="p-3 border-b border-slate-200 flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex-shrink-0">
                    Paradigm Departments ({paradigmDepts.length})
                  </h3>
                  <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input type="text" value={paradigmSearch} onChange={e => setParadigmSearch(e.target.value)}
                      placeholder="Search code or name..."
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  {isAdmin && selectedParadigm.size > 0 && (
                    <button onClick={handleAddMappings} disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 flex-shrink-0">
                      <Plus size={14} />
                      {saving ? 'Adding...' : `Add ${selectedParadigm.size} to ${selectedDept}`}
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        {isAdmin && <th className="px-2 py-2 w-8" />}
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Department Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParadigm.map(dept => {
                        const isMapped = mappedCodes.has(dept.code)
                        const isSelected = selectedParadigm.has(dept.code)
                        return (
                          <tr key={dept.code}
                            className={`border-t border-slate-100 ${isMapped ? 'bg-green-50' : isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'} ${isAdmin && !isMapped ? 'cursor-pointer' : ''}`}
                            onClick={() => { if (isAdmin && !isMapped) toggleParadigm(dept.code) }}>
                            {isAdmin && (
                              <td className="px-2 py-2 text-center">
                                {isMapped ? (
                                  <CheckSquare size={16} className="text-green-500 mx-auto" />
                                ) : isSelected ? (
                                  <CheckSquare size={16} className="text-blue-600 mx-auto" />
                                ) : (
                                  <Square size={16} className="text-slate-300 mx-auto" />
                                )}
                              </td>
                            )}
                            <td className="px-3 py-2 font-mono text-slate-800">{dept.code}</td>
                            <td className="px-3 py-2 text-slate-700">{dept.name}</td>
                            <td className="px-3 py-2">
                              {isMapped && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Mapped</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
