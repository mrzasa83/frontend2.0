'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, FolderSearch, Database, CheckCircle, AlertCircle } from 'lucide-react'

type ScanResult = {
  scanned: number
  inserted: number
  errors: string[]
  samples: string[]
}

type RangeRecord = {
  id: number
  site: string
  file_type: string
  range_start: number
  range_end: number
  folder_name: string
  base_path: string
}

export default function FolderRangesPage() {
  const [scanning, setScanning] = useState(false)
  const [scanResults, setScanResults] = useState<Record<string, ScanResult> | null>(null)
  const [ranges, setRanges] = useState<RangeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    fetchRanges()
  }, [])

  const fetchRanges = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/products/folder-ranges')
      if (!res.ok) throw new Error('Failed to fetch ranges')
      const data = await res.json()
      setRanges(data.ranges || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const runScan = async (fileType?: string) => {
    setScanning(true)
    setScanResults(null)
    setError(null)
    try {
      const res = await fetch('/api/products/folder-ranges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileType ? { fileType } : {})
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Scan failed')
      }
      const data = await res.json()
      setScanResults(data.results)
      // Refresh the ranges list
      await fetchRanges()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const fileTypes = ['finalInspection', 'buildDrawings', 'packShip']
  
  // Group ranges by file_type and site
  const groupedRanges = ranges.reduce((acc, r) => {
    const key = `${r.file_type}/${r.site}`
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {} as Record<string, RangeRecord[]>)

  const filteredGroups = selectedType === 'all' 
    ? groupedRanges 
    : Object.fromEntries(
        Object.entries(groupedRanges).filter(([key]) => key.startsWith(selectedType))
      )

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Folder Ranges</h2>
      <p className="text-slate-600 mb-6">
        Catalog folder ranges for fast lookup of Final Inspection and Build Drawings files
      </p>

      {/* Scan Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FolderSearch size={20} />
          Scan Network Folders
        </h3>
        
        <p className="text-sm text-slate-600 mb-4">
          Scan the network folders to catalog all range folders (e.g., &quot;12700_DWG-12799_DWG&quot;). 
          This allows fast lookup of files without scanning entire directories.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => runScan()}
            disabled={scanning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {scanning ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
            Scan All
          </button>
          
          {fileTypes.map(type => (
            <button
              key={type}
              onClick={() => runScan(type)}
              disabled={scanning}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
            >
              Scan {type}
            </button>
          ))}
        </div>

        {/* Scan Results */}
        {scanResults && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-800 mb-2">Scan Results</h4>
            {Object.entries(scanResults).map(([key, result]) => (
              <div key={key} className="mb-3 p-3 bg-white rounded border">
                <div className="flex items-center gap-2 mb-1">
                  {result.inserted > 0 ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-500" />
                  )}
                  <span className="font-medium">{key}</span>
                </div>
                <p className="text-sm text-slate-600">
                  Scanned: {result.scanned} folders, Inserted: {result.inserted}
                </p>
                {result.samples.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Samples: {result.samples.join(', ')}
                  </p>
                )}
                {result.errors.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Errors: {result.errors.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Current Ranges */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Database size={20} />
            Cataloged Ranges ({ranges.length})
          </h3>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              {fileTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <button
              onClick={fetchRanges}
              disabled={loading}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw size={24} className="animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-slate-600">Loading ranges...</p>
          </div>
        ) : Object.keys(filteredGroups).length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Database size={48} className="mx-auto mb-2 opacity-50" />
            <p>No ranges cataloged yet. Run a scan to populate.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(filteredGroups).map(([key, records]) => (
              <div key={key} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 font-medium text-slate-800 flex items-center justify-between">
                  <span>{key}</span>
                  <span className="text-sm text-slate-500">{records.length} ranges</span>
                </div>
                <div className="max-h-48 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Range</th>
                        <th className="px-4 py-2 text-left">Folder Name</th>
                        <th className="px-4 py-2 text-left">Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r.id} className="border-t hover:bg-slate-50">
                          <td className="px-4 py-2">{r.range_start} - {r.range_end}</td>
                          <td className="px-4 py-2 font-mono text-xs">{r.folder_name}</td>
                          <td className="px-4 py-2 text-xs text-slate-500 truncate max-w-xs" title={r.base_path}>
                            {r.base_path}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
