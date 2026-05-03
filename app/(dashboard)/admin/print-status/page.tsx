'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  RefreshCw, Search, CheckSquare, Square, Download,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type SortDir = 'asc' | 'desc'
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={14} className="text-slate-300" />
  return dir === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
}

// ═══════════════════════════════════════════════════════════════
// TAB 1 — OPEN BACKLOG
// ═══════════════════════════════════════════════════════════════
function BacklogTab({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [updating, setUpdating] = useState(false)
  const [sortKey, setSortKey] = useState('customerPartNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [stats, setStats] = useState({ totalBacklog: 0, totalAttachments: 0 })

  const fetchData = async () => {
    setLoading(true); setError(''); setSelected(new Set())
    try {
      const res = await fetch(getApiUrl('/api/admin/print-status?tab=backlog'))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setData(r.data || [])
      setStats({ totalBacklog: r.totalBacklog, totalAttachments: r.totalAttachments })
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const handleUpdate = async () => {
    if (!selected.size) return; setUpdating(true)
    try {
      const res = await fetch(getApiUrl('/api/admin/print-status'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePrintOnTraveller', rkeys: [...selected] }),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      alert(`Updated ${r.updated} attachment(s)`)
      await fetchData()
    } catch (e: any) { setError(e.message) } finally { setUpdating(false) }
  }

  const filtered = useMemo(() => {
    let rows = data
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r: any) => Object.values(r).some(v => String(v || '').toLowerCase().includes(q)))
    }
    return [...rows].sort((a: any, b: any) => {
      const cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''), undefined, { numeric: true })
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [data, search, sortKey, sortDir])

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3 flex-shrink-0 flex-wrap">
        <button onClick={fetchData} disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {data.length === 0 ? 'Load Backlog' : 'Refresh'}
        </button>
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <span className="text-sm text-slate-500">Rows: {filtered.length} · Selected: {selected.size}</span>
        <div className="flex-1" />
        {isAdmin && selected.size > 0 && (
          <button onClick={handleUpdate} disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
            {updating ? 'Updating...' : `Update Selected (${selected.size})`}
          </button>
        )}
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-3">{error}</div>}
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 overflow-y-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup><col style={{ width: '4%' }} /><col style={{ width: '24%' }} /><col style={{ width: '20%' }} /><col style={{ width: '20%' }} /><col style={{ width: '12%' }} /><col style={{ width: '20%' }} /></colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-2 py-3 text-center"><button onClick={() => { selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map((r: any) => r.attachmentRkey))) }} className="text-slate-500 hover:text-blue-600">{selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}</button></th>
              {[['customerPartNumber','Cust Part #'],['workOrder','Work Order'],['invPartNumber','Item'],['attachmentRkey','RKEY'],['documentPath','Document Path']].map(([k,l]) => (
                <th key={k} className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort(k)}>
                  <div className="flex items-center gap-1">{l} <SortIcon active={sortKey===k} dir={sortDir} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">{data.length===0?'Click Load Backlog':'No matches'}</td></tr>
            ) : filtered.map((row: any) => (
              <tr key={row.attachmentRkey} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer" onClick={() => { const n = new Set(selected); n.has(row.attachmentRkey)?n.delete(row.attachmentRkey):n.add(row.attachmentRkey); setSelected(n) }}>
                <td className="px-2 py-2 text-center">{selected.has(row.attachmentRkey)?<CheckSquare size={16} className="text-blue-600 mx-auto"/>:<Square size={16} className="text-slate-300 mx-auto"/>}</td>
                <td className="px-3 py-2 font-mono text-slate-800 truncate">{row.customerPartNumber}</td>
                <td className="px-3 py-2 text-slate-700 truncate">{row.workOrder}</td>
                <td className="px-3 py-2 text-slate-700 truncate">{row.invPartNumber}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{row.attachmentRkey}</td>
                <td className="px-3 py-2 text-slate-500 text-xs truncate" title={row.documentPath}>{row.documentPath}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 2 — OPEN ATTACHMENTS
// ═══════════════════════════════════════════════════════════════
function AttachmentsTab({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [updating, setUpdating] = useState(false)
  const [sortKey, setSortKey] = useState('item')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const fetchData = async () => {
    setLoading(true); setError(''); setSelected(new Set())
    try {
      const res = await fetch(getApiUrl('/api/admin/print-status?tab=attachments'))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setData(r.data || [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const handleUpdate = async () => {
    if (!selected.size) return; setUpdating(true)
    try {
      const res = await fetch(getApiUrl('/api/admin/print-status'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePrintOnTraveller', rkeys: [...selected] }),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      alert(`Updated ${(await res.json()).updated || selected.size} attachment(s)`)
      await fetchData()
    } catch (e: any) { setError(e.message) } finally { setUpdating(false) }
  }

  const downloadExcel = useCallback(async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(filtered.map((r: any) => ({
      Item: r.item, Description: r.description, 'Document Path': r.documentPath,
      RKEY: r.attachmentRkey, POT: r.printOnTraveller, Type: r.sourceType, Ptr: r.sourcePtr,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attachments')
    XLSX.writeFile(wb, 'paradigm_attachments.xlsx')
  }, [data, search, sortKey, sortDir])

  const filtered = useMemo(() => {
    let rows = data
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r: any) => [r.item,r.description,r.documentPath].some(v => (v||'').toLowerCase().includes(q)))
    }
    return [...rows].sort((a: any, b: any) => {
      const cmp = String(a[sortKey]||'').localeCompare(String(b[sortKey]||''), undefined, { numeric: true })
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [data, search, sortKey, sortDir])

  const toggleSort = (key: string) => { sortKey===key ? setSortDir(d=>d==='asc'?'desc':'asc') : (setSortKey(key), setSortDir('asc')) }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3 flex-shrink-0 flex-wrap">
        <button onClick={fetchData} disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {data.length===0?'Load Attachments':'Refresh'}
        </button>
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search item, description, path..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <span className="text-sm text-slate-500">Rows: {filtered.length} · Selected: {selected.size}</span>
        <div className="flex-1" />
        <button onClick={downloadExcel} disabled={!filtered.length} className="px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"><Download size={15} /> Excel</button>
        {isAdmin && selected.size > 0 && (
          <button onClick={handleUpdate} disabled={updating} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
            Update Selected ({selected.size})
          </button>
        )}
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-3">{error}</div>}
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 overflow-y-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup><col style={{width:'4%'}}/><col style={{width:'14%'}}/><col style={{width:'20%'}}/><col style={{width:'30%'}}/><col style={{width:'10%'}}/><col style={{width:'8%'}}/><col style={{width:'7%'}}/><col style={{width:'7%'}}/></colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-2 py-3 text-center"><button onClick={()=>{selected.size===filtered.length?setSelected(new Set()):setSelected(new Set(filtered.map((r:any)=>r.attachmentRkey)))}} className="text-slate-500 hover:text-blue-600">{selected.size===filtered.length&&filtered.length>0?<CheckSquare size={16}/>:<Square size={16}/>}</button></th>
              {[['item','Item'],['description','Description'],['documentPath','Document Path'],['attachmentRkey','RKEY'],['printOnTraveller','POT'],['sourceType','Type'],['sourcePtr','Ptr']].map(([k,l])=>(
                <th key={k} className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100" onClick={()=>toggleSort(k)}>
                  <div className="flex items-center gap-1">{l} <SortIcon active={sortKey===k} dir={sortDir}/></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0?(
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">{data.length===0?'Click Load Attachments':'No matches'}</td></tr>
            ):filtered.map((r:any)=>(
              <tr key={r.attachmentRkey} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer" onClick={()=>{const n=new Set(selected);n.has(r.attachmentRkey)?n.delete(r.attachmentRkey):n.add(r.attachmentRkey);setSelected(n)}}>
                <td className="px-2 py-2 text-center">{selected.has(r.attachmentRkey)?<CheckSquare size={16} className="text-blue-600 mx-auto"/>:<Square size={16} className="text-slate-300 mx-auto"/>}</td>
                <td className="px-3 py-2 font-mono text-slate-800 truncate">{r.item}</td>
                <td className="px-3 py-2 text-slate-700 text-xs truncate">{r.description}</td>
                <td className="px-3 py-2 text-slate-600 text-xs truncate" title={r.documentPath}>{r.documentPath}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{r.attachmentRkey}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{r.printOnTraveller}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{r.sourceType}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{r.sourcePtr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 3 — FIX PATHS
// ═══════════════════════════════════════════════════════════════
function FixPathsTab({ isAdmin }: { isAdmin: boolean }) {
  const [prefixes, setPrefixes] = useState<{prefix:string;count:number}[]>([])
  const [selectedPrefix, setSelectedPrefix] = useState('')
  const [fromPrefix, setFromPrefix] = useState('')
  const [toPrefix, setToPrefix] = useState('\\\\APCFS04\\SHARED2\\AttDocs\\')
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPrefixes, setLoadingPrefixes] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [updating, setUpdating] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [finding, setFinding] = useState(false)
  const [findResults, setFindResults] = useState<Record<number, string[]>>({})

  const handleFindFiles = async () => {
    if (!selected.size) return
    setFinding(true); setError('')
    const items = filtered
      .filter((r: any) => selected.has(r.rkey))
      .map((r: any) => ({ rkey: r.rkey, documentPath: r.documentPath }))
    try {
      const res = await fetch(getApiUrl('/api/admin/print-status'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'findFiles', items }),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Find failed')
      const r = await res.json()
      setFindResults(prev => ({ ...prev, ...r.results }))
    } catch (e: any) { setError(e.message) } finally { setFinding(false) }
  }

  const loadPrefixes = async () => {
    setLoadingPrefixes(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/admin/print-status?tab=prefixes'))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setPrefixes(r.prefixes || [])
    } catch (e: any) { setError(e.message) } finally { setLoadingPrefixes(false) }
  }

  const loadPaths = async () => {
    if (!selectedPrefix) return
    setLoading(true); setError(''); setSelected(new Set())
    try {
      const params = new URLSearchParams({
        tab: 'fixpaths',
        prefix: selectedPrefix,
        fromPrefix,
        toPrefix,
      })
      const res = await fetch(getApiUrl(`/api/admin/print-status?${params}`))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setData(r.data || [])
      setSummary(r.summary || null)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const handlePrefixSelect = (prefix: string) => {
    setSelectedPrefix(prefix)
    setFromPrefix(prefix)
  }

  const filtered = useMemo(() => {
    let rows = data
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r: any) => [r.item,r.description,r.documentPath,r.newPath].some((v: string) => (v||'').toLowerCase().includes(q)))
    }
    if (filterStatus) {
      rows = rows.filter((r: any) => {
        if (filterStatus === 'old-found') return r.oldStatus === 'found'
        if (filterStatus === 'old-missing') return r.oldStatus === 'missing'
        if (filterStatus === 'new-found') return r.newStatus === 'found'
        if (filterStatus === 'new-missing') return r.newStatus === 'missing'
        if (filterStatus === 'unmapped') return r.oldStatus === 'unmapped'
        return true
      })
    }
    return rows
  }, [data, search, filterStatus])

  const handleUpdate = async () => {
    if (!selected.size) return; setUpdating(true)
    const updates = filtered
      .filter((r: any) => selected.has(r.rkey) && r.changed)
      .map((r: any) => ({ rkey: r.rkey, newPath: r.newPath }))
    if (updates.length === 0) { alert('No changed paths in selection'); setUpdating(false); return }
    try {
      const res = await fetch(getApiUrl('/api/admin/print-status'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePaths', updates }),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      alert(`Updated ${r.updated} path(s)`)
      await loadPaths()
    } catch (e: any) { setError(e.message) } finally { setUpdating(false) }
  }

  // Status dot component
  const StatusDot = ({ status }: { status: string | null }) => {
    if (!status) return <span className="text-slate-300">—</span>
    const colors: Record<string, string> = {
      found: 'bg-green-500',
      missing: 'bg-red-500',
      unmapped: 'bg-yellow-500',
    }
    const labels: Record<string, string> = {
      found: 'File exists',
      missing: 'Not found',
      unmapped: 'Cannot verify',
    }
    return (
      <span className="flex items-center gap-1" title={labels[status] || status}>
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-slate-300'}`} />
        <span className="text-xs text-slate-500">{status}</span>
      </span>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Prefix selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={loadPrefixes} disabled={loadingPrefixes}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2">
            <RefreshCw size={14} className={loadingPrefixes?'animate-spin':''} /> Load Prefixes
          </button>
          <select value={selectedPrefix} onChange={e => handlePrefixSelect(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[300px]">
            <option value="">Select a prefix...</option>
            {prefixes.map(p => <option key={p.prefix} value={p.prefix}>{p.prefix} ({p.count})</option>)}
          </select>
        </div>
        {prefixes.length > 0 && (
          <div className="max-h-32 overflow-y-auto border border-slate-100 rounded text-xs">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0"><tr><th className="px-3 py-1 text-left font-medium text-slate-600">Prefix</th><th className="px-3 py-1 text-right font-medium text-slate-600 w-20">Count</th></tr></thead>
              <tbody>{prefixes.map(p => (
                <tr key={p.prefix} className={`border-t border-slate-100 cursor-pointer hover:bg-blue-50 ${selectedPrefix===p.prefix?'bg-blue-50':''}`}
                  onClick={() => handlePrefixSelect(p.prefix)}>
                  <td className="px-3 py-1 font-mono">{p.prefix}</td>
                  <td className="px-3 py-1 text-right">{p.count}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Replacement rules + Validate */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex-shrink-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Replacement Rules</p>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-500">From prefix:</label>
            <input type="text" value={fromPrefix} onChange={e => setFromPrefix(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500">To prefix:</label>
            <input type="text" value={toPrefix} onChange={e => setToPrefix(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={loadPaths} disabled={loading || !selectedPrefix}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-sm font-medium flex items-center gap-2 whitespace-nowrap">
            <RefreshCw size={14} className={loading?'animate-spin':''} />
            {data.length === 0 ? 'Load & Validate' : 'Re-validate'}
          </button>
        </div>
      </div>

      {/* Validation summary */}
      {summary && (
        <div className="flex items-center gap-4 text-xs flex-shrink-0 bg-white rounded-lg border border-slate-200 px-4 py-2">
          <span className="font-medium text-slate-600">Validation:</span>
          <button onClick={() => setFilterStatus(filterStatus === 'old-found' ? '' : 'old-found')}
            className={`flex items-center gap-1 px-2 py-1 rounded ${filterStatus==='old-found'?'bg-green-100':'hover:bg-slate-50'}`}>
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Current OK: {summary.oldFound}
          </button>
          <button onClick={() => setFilterStatus(filterStatus === 'old-missing' ? '' : 'old-missing')}
            className={`flex items-center gap-1 px-2 py-1 rounded ${filterStatus==='old-missing'?'bg-red-100':'hover:bg-slate-50'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Current Missing: {summary.oldMissing}
          </button>
          <span className="text-slate-300">|</span>
          <button onClick={() => setFilterStatus(filterStatus === 'new-found' ? '' : 'new-found')}
            className={`flex items-center gap-1 px-2 py-1 rounded ${filterStatus==='new-found'?'bg-green-100':'hover:bg-slate-50'}`}>
            <span className="w-2 h-2 rounded-full bg-green-500" />
            New OK: {summary.newFound}
          </button>
          <button onClick={() => setFilterStatus(filterStatus === 'new-missing' ? '' : 'new-missing')}
            className={`flex items-center gap-1 px-2 py-1 rounded ${filterStatus==='new-missing'?'bg-red-100':'hover:bg-slate-50'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            New Missing: {summary.newMissing}
          </button>
          <button onClick={() => setFilterStatus(filterStatus === 'unmapped' ? '' : 'unmapped')}
            className={`flex items-center gap-1 px-2 py-1 rounded ${filterStatus==='unmapped'?'bg-yellow-100':'hover:bg-slate-50'}`}>
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Unmapped: {summary.oldUnmapped}
          </button>
          {filterStatus && (
            <button onClick={() => setFilterStatus('')} className="text-blue-600 hover:text-blue-800 ml-2">Clear filter</button>
          )}
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <span className="text-sm text-slate-500">Rows: {filtered.length} · Selected: {selected.size}</span>
        <div className="flex-1" />
        {selected.size > 0 && (
          <button onClick={handleFindFiles} disabled={finding}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
            <Search size={14} className={finding ? 'animate-spin' : ''} />
            {finding ? 'Searching...' : `Find File (${selected.size})`}
          </button>
        )}
        {isAdmin && selected.size > 0 && (
          <button onClick={handleUpdate} disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
            Apply to Selected ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 overflow-y-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{width:'3%'}}/>
            <col style={{width:'6%'}}/>
            <col style={{width:'9%'}}/>
            <col style={{width:'12%'}}/>
            <col style={{width:'24%'}}/>
            <col style={{width:'5%'}}/>
            <col style={{width:'24%'}}/>
            <col style={{width:'5%'}}/>
            <col style={{width:'6%'}}/>
            <col style={{width:'6%'}}/>
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-1 py-3 text-center"><button onClick={()=>{selected.size===filtered.length?setSelected(new Set()):setSelected(new Set(filtered.map((r:any)=>r.rkey)))}} className="text-slate-500 hover:text-blue-600">{selected.size===filtered.length&&filtered.length>0?<CheckSquare size={16}/>:<Square size={16}/>}</button></th>
              <th className="px-2 py-3 text-left font-medium text-slate-600 text-xs">RKEY</th>
              <th className="px-2 py-3 text-left font-medium text-slate-600 text-xs">Item</th>
              <th className="px-2 py-3 text-left font-medium text-slate-600 text-xs">Description</th>
              <th className="px-2 py-3 text-left font-medium text-slate-600 text-xs">Current Path</th>
              <th className="px-2 py-3 text-center font-medium text-slate-600 text-xs">Status</th>
              <th className="px-2 py-3 text-left font-medium text-slate-600 text-xs">New Path</th>
              <th className="px-2 py-3 text-center font-medium text-slate-600 text-xs">Status</th>
              <th className="px-2 py-3 text-left font-medium text-slate-600 text-xs">Type</th>
              <th className="px-2 py-3 text-left font-medium text-slate-600 text-xs">Ptr</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">{data.length===0?'Select a prefix, set rules, and click Load & Validate':'No matches'}</td></tr>
            ) : filtered.map((r: any) => (
              <React.Fragment key={r.rkey}>
                <tr
                  className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50`}
                  onClick={() => { const n = new Set(selected); n.has(r.rkey)?n.delete(r.rkey):n.add(r.rkey); setSelected(n) }}>
                  <td className="px-1 py-2 text-center">{selected.has(r.rkey)?<CheckSquare size={16} className="text-blue-600 mx-auto"/>:<Square size={16} className="text-slate-300 mx-auto"/>}</td>
                  <td className="px-2 py-2 text-slate-500 text-xs">{r.rkey}</td>
                  <td className="px-2 py-2 font-mono text-slate-800 text-xs truncate">{r.item}</td>
                  <td className="px-2 py-2 text-slate-700 text-xs truncate">{r.description}</td>
                  <td className="px-2 py-2 text-slate-600 text-xs break-all whitespace-pre-wrap leading-tight">{r.documentPath}</td>
                  <td className="px-2 py-2 text-center"><StatusDot status={r.oldStatus} /></td>
                  <td className="px-2 py-2 text-xs break-all whitespace-pre-wrap leading-tight" style={{color: r.changed ? '#16a34a' : '#94a3b8'}}>{r.newPath}</td>
                  <td className="px-2 py-2 text-center"><StatusDot status={r.newStatus} /></td>
                  <td className="px-2 py-2 text-slate-500 text-xs">{r.sourceType}</td>
                  <td className="px-2 py-2 text-slate-500 text-xs">{r.sourcePtr}</td>
                </tr>
                {findResults[r.rkey] && findResults[r.rkey].length > 0 && (
                  <tr className="bg-blue-50 border-b border-blue-100">
                    <td className="px-1 py-1" />
                    <td colSpan={9} className="px-2 py-2">
                      <p className="text-xs font-medium text-blue-700 mb-1">Found {findResults[r.rkey].length} match(es) on /mnt/sdrive:</p>
                      {findResults[r.rkey].map((path: string, i: number) => (
                        <p key={i} className="text-xs font-mono text-blue-600 pl-2">{path}</p>
                      ))}
                    </td>
                  </tr>
                )}
                {findResults[r.rkey] && findResults[r.rkey].length === 0 && (
                  <tr className="bg-red-50 border-b border-red-100">
                    <td className="px-1 py-1" />
                    <td colSpan={9} className="px-2 py-2 text-xs text-red-600">
                      No matches found on /mnt/sdrive
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function PrintStatusPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('backlog')
  const isAdmin = session?.user?.roles?.some((r: string) => r === 'Admin') || false

  const tabs = [
    { id: 'backlog', label: 'Open Backlog' },
    { id: 'attachments', label: 'Open Attachments' },
    { id: 'fixpaths', label: 'Fix Paths' },
  ]

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Paradigm File Status</h1>
        <p className="text-sm text-slate-600">Manage attachment print settings in Paradigm ERP</p>
      </div>
      <div className="border-b border-slate-200 mb-4 flex-shrink-0">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {activeTab === 'backlog' && <BacklogTab isAdmin={isAdmin} />}
        {activeTab === 'attachments' && <AttachmentsTab isAdmin={isAdmin} />}
        {activeTab === 'fixpaths' && <FixPathsTab isAdmin={isAdmin} />}
      </div>
    </div>
  )
}
