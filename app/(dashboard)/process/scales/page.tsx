'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type ScaleRecord = {
  Date: string
  Note: string
  PartNumber: string
  Version: string
  User: string
}

type SortKey = 'PartNumber' | 'Version' | 'Date' | 'User'
type SortDir = 'asc' | 'desc'

function parseScaleDate(dateStr: string): number {
  try {
    const cleaned = dateStr.replace(/\b[A-Z]{3,4}\b(?=\s+\d{4})/, '').trim()
    return new Date(cleaned).getTime() || 0
  } catch { return 0 }
}

export default function ScalesPage() {
  const [data, setData] = useState<ScaleRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('PartNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(getApiUrl('/api/process/scales'))
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || 'Failed to fetch')
      }
      const result = await res.json()
      setData(result.data)
      setTotalRecords(result.totalRecords)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scale data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.trim().toLowerCase()
    return data.filter(r => r.PartNumber.toLowerCase().includes(q))
  }, [data, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'PartNumber':
          cmp = a.PartNumber.localeCompare(b.PartNumber, undefined, { numeric: true })
          if (cmp === 0) cmp = (parseInt(b.Version) || 0) - (parseInt(a.Version) || 0)
          break
        case 'Version':
          cmp = (parseInt(a.Version) || 0) - (parseInt(b.Version) || 0)
          break
        case 'Date':
          cmp = parseScaleDate(a.Date) - parseScaleDate(b.Date)
          break
        case 'User':
          cmp = a.User.localeCompare(b.User)
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'Version' ? 'desc' : 'asc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={14} className="text-slate-300" />
    return sortDir === 'asc'
      ? <ArrowUp size={14} className="text-blue-600" />
      : <ArrowDown size={14} className="text-blue-600" />
  }

  // Excel download
  const downloadExcel = useCallback(async () => {
    const XLSX = await import('xlsx')
    const rows = sorted.map(r => ({
      'Part Number': r.PartNumber,
      'Version': r.Version,
      'Date': r.Date,
      'User': r.User,
      'Note': r.Note,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Scale History')

    // Auto-size columns
    ws['!cols'] = [
      { wch: 14 }, { wch: 10 }, { wch: 32 }, { wch: 16 }, { wch: 60 },
    ]

    const fileName = search
      ? `scale_history_${search.trim()}.xlsx`
      : 'scale_history.xlsx'
    XLSX.writeFile(wb, fileName)
  }, [sorted, search])

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Scales</h1>
        <p className="text-sm text-slate-600 mt-1">
          {totalRecords.toLocaleString()} total scale records
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by part number..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {search && (
          <span className="text-sm text-slate-500">
            {filtered.length.toLocaleString()} matching
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={downloadExcel}
          disabled={sorted.length === 0}
          className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
          title="Download as Excel"
        >
          <Download size={15} />
          Excel
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4 flex-shrink-0">
          {error}
        </div>
      )}

      {/* Scrollable table */}
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-200">
              {([
                ['PartNumber', 'Part Number', ''],
                ['Version', 'Version', 'w-24'],
                ['Date', 'Date', 'w-56'],
                ['User', 'User', 'w-32'],
              ] as [SortKey, string, string][]).map(([key, label, width]) => (
                <th
                  key={key}
                  className={`px-4 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none ${width}`}
                  onClick={() => toggleSort(key)}
                >
                  <div className="flex items-center gap-1">{label} <SortIcon col={key} /></div>
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium text-slate-600">Note</th>
            </tr>
          </thead>
        </table>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    Loading scale data...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    {search ? `No records matching "${search}"` : 'No scale records found'}
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => (
                  <tr
                    key={`${row.PartNumber}-${row.Version}-${i}`}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2 font-mono font-medium text-slate-800">{row.PartNumber}</td>
                    <td className="px-4 py-2 w-24 text-center">
                      <span className="inline-block bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-xs">
                        v{row.Version}
                      </span>
                    </td>
                    <td className="px-4 py-2 w-56 text-slate-600 text-xs">{row.Date}</td>
                    <td className="px-4 py-2 w-32 text-slate-600">{row.User}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">
                      {row.Note ? (
                        <span title={row.Note}>
                          {row.Note.length > 100 ? row.Note.slice(0, 97) + '...' : row.Note}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
