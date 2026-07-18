'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { RefreshCw, Search, Plus, Trash2, CheckSquare, Square, FolderTree, AlertTriangle } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type ParadigmCustomer = { rkey: number; abbr: string; name: string }
type Mapping = {
  id: number; paradigm_customer: string; paradigm_rkey: number | null
  po_folder: string; created_by: string; created_at: string
}

export default function PoFoldersPage() {
  const { data: session } = useSession()
  const [customers, setCustomers] = useState<ParadigmCustomer[]>([])
  const [poFolders, setPoFolders] = useState<string[]>([])
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [poRoot, setPoRoot] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCust, setSelectedCust] = useState<ParadigmCustomer | null>(null)
  const [custSearch, setCustSearch] = useState('')
  const [folderSearch, setFolderSearch] = useState('')
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const isAdmin = session?.user?.roles?.some((r: string) => r === 'Admin') || false

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/admin/po-folders'))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setCustomers(r.paradigmCustomers || [])
      setPoFolders(r.poFolders || [])
      setMappings(r.mappings || [])
      setPoRoot(r.poRoot || '')
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const currentMappings = useMemo(() => {
    if (!selectedCust) return []
    return mappings.filter(m => m.paradigm_customer === selectedCust.abbr)
  }, [mappings, selectedCust])

  const mappedFolders = useMemo(() => new Set(currentMappings.map(m => m.po_folder)), [currentMappings])

  const mappingCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    mappings.forEach(m => { counts[m.paradigm_customer] = (counts[m.paradigm_customer] || 0) + 1 })
    return counts
  }, [mappings])

  const filteredCustomers = useMemo(() => {
    if (!custSearch.trim()) return customers
    const q = custSearch.toLowerCase()
    return customers.filter(c => c.abbr.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
  }, [customers, custSearch])

  const filteredFolders = useMemo(() => {
    let list = poFolders
    if (folderSearch.trim()) {
      const q = folderSearch.toLowerCase()
      list = list.filter(f => f.toLowerCase().includes(q))
    }
    return list
  }, [poFolders, folderSearch])

  const toggleFolder = (folder: string) => {
    setSelectedFolders(prev => { const n = new Set(prev); n.has(folder) ? n.delete(folder) : n.add(folder); return n })
  }

  const handleAdd = async () => {
    if (!selectedCust || selectedFolders.size === 0) return
    setSaving(true)
    try {
      const res = await fetch(getApiUrl('/api/admin/po-folders'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paradigmCustomer: selectedCust.abbr,
          paradigmRkey: selectedCust.rkey,
          poFolders: [...selectedFolders],
        }),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      setSelectedFolders(new Set())
      await fetchData()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const handleRemove = async (id: number) => {
    try {
      await fetch(getApiUrl(`/api/admin/po-folders?id=${id}`), { method: 'DELETE' })
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
          <h1 className="text-2xl font-bold text-slate-800">PO Folder Mapping</h1>
          <p className="text-sm text-slate-600">
            Map Paradigm customers to Purchase Order folders under{' '}
            <span className="font-mono text-slate-500">{poRoot || 'S:\\Quality\\QCDept\\PO'}</span>
          </p>
        </div>
        <button onClick={fetchData} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4 flex-shrink-0">{error}</div>}
      {poFolders.length === 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm mb-4 flex items-center gap-2 flex-shrink-0">
          <AlertTriangle size={16} /> No PO folders found on disk. Confirm the S: drive is mounted and the PO path is correct.
        </div>
      )}

      <div className="flex-1 min-h-0 flex gap-4">
        {/* Left: Paradigm customers */}
        <div className="w-72 flex flex-col bg-white rounded-lg border border-slate-200 flex-shrink-0">
          <div className="p-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Paradigm Customers ({customers.length})</h3>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input type="text" value={custSearch} onChange={e => setCustSearch(e.target.value)}
                placeholder="Filter abbreviation or name..."
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredCustomers.map(cust => (
              <button key={`${cust.rkey}-${cust.abbr}`} onClick={() => { setSelectedCust(cust); setSelectedFolders(new Set()) }}
                className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-100 transition-colors flex items-center justify-between ${
                  selectedCust?.abbr === cust.abbr ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}>
                <span className="truncate">
                  <span className="font-mono">{cust.abbr}</span>
                  {cust.name && <span className="text-slate-400 ml-2 text-xs">{cust.name}</span>}
                </span>
                {mappingCounts[cust.abbr] && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2">
                    {mappingCounts[cust.abbr]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col gap-4">
          {!selectedCust ? (
            <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-slate-200">
              <p className="text-slate-400">Select a Paradigm customer from the left</p>
            </div>
          ) : (
            <>
              {/* Current mappings */}
              <div className="bg-white rounded-lg border border-slate-200 flex-shrink-0">
                <div className="p-3 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Folders mapped to: <span className="text-blue-600 font-mono">{selectedCust.abbr}</span>
                    <span className="font-normal text-slate-400 ml-2">({currentMappings.length})</span>
                  </h3>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {currentMappings.length === 0 ? (
                    <p className="p-3 text-sm text-slate-400 italic">No PO folders mapped yet</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">PO Folder</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Added By</th>
                          <th className="px-3 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {currentMappings.map(m => (
                          <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-800 flex items-center gap-2">
                              <FolderTree size={14} className="text-amber-500" /> {m.po_folder}
                            </td>
                            <td className="px-3 py-2 text-slate-500 text-xs">{m.created_by}</td>
                            <td className="px-3 py-2">
                              {isAdmin && (
                                <button onClick={() => handleRemove(m.id)}
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

              {/* Available PO folders */}
              <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 flex flex-col">
                <div className="p-3 border-b border-slate-200 flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-700 flex-shrink-0">
                    PO Folders ({filteredFolders.length})
                  </h3>
                  <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input type="text" value={folderSearch} onChange={e => setFolderSearch(e.target.value)}
                      placeholder="Search folder..."
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  {isAdmin && selectedFolders.size > 0 && (
                    <button onClick={handleAdd} disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 flex-shrink-0 ml-auto">
                      <Plus size={14} />
                      {saving ? 'Adding...' : `Map ${selectedFolders.size} to ${selectedCust.abbr}`}
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        {isAdmin && <th className="px-2 py-2 w-8" />}
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Folder Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFolders.map(folder => {
                        const isMapped = mappedFolders.has(folder)
                        const isSelected = selectedFolders.has(folder)
                        return (
                          <tr key={folder}
                            className={`border-t border-slate-100 ${isMapped ? 'bg-green-50' : isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'} ${isAdmin && !isMapped ? 'cursor-pointer' : ''}`}
                            onClick={() => { if (isAdmin && !isMapped) toggleFolder(folder) }}>
                            {isAdmin && (
                              <td className="px-2 py-2 text-center">
                                {isMapped ? <CheckSquare size={16} className="text-green-500 mx-auto" />
                                  : isSelected ? <CheckSquare size={16} className="text-blue-600 mx-auto" />
                                  : <Square size={16} className="text-slate-300 mx-auto" />}
                              </td>
                            )}
                            <td className="px-3 py-2 text-slate-800 flex items-center gap-2">
                              <FolderTree size={14} className="text-amber-400" /> {folder}
                            </td>
                            <td className="px-3 py-2">
                              {isMapped && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Mapped</span>}
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
