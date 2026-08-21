'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Download, Eye, RefreshCw, FileText } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import FilePreviewModal from '@/components/products/FilePreviewModal'

type FileInfo = { name: string; path: string; size: number; modified: string; extension: string }
type LocationFiles = { location: string; path?: string; files: FileInfo[]; error?: string }

// Reuses the Products released-files backend (search is on the customer part),
// rendering Final Inspection or Pack & Ship exactly like Product → Products.
export default function ReleasedFileSection({ partNumber, fileType, title }: {
  partNumber: string
  fileType: 'finalInspection' | 'packShip'
  title: string
}) {
  const [data, setData] = useState<LocationFiles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<{ files: FileInfo[]; index: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true); setError(null)
      try {
        const res = await fetch(getApiUrl('/api/products/released-files'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partNumber, fileType }),
        })
        const d = await res.json()
        if (!res.ok) throw new Error(d.error || 'Failed to load files')
        if (!cancelled) {
          const results: LocationFiles[] = d.results || []
          setData(results)
          setExpanded(new Set(results.filter(r => r.files?.length).map(r => r.location)))
        }
      } catch (e: any) { if (!cancelled) setError(e.message) }
      finally { if (!cancelled) setLoading(false) }
    }
    if (partNumber) run()
    return () => { cancelled = true }
  }, [partNumber, fileType])

  const fmtSize = (b: number) => b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1e3).toFixed(0)} KB`
  const toggle = (loc: string) => setExpanded(s => { const n = new Set(s); n.has(loc) ? n.delete(loc) : n.add(loc); return n })

  const download = (f: FileInfo) => {
    const url = getApiUrl(`/api/files/serve?path=${encodeURIComponent(f.path)}`)
    window.open(url, '_blank')
  }

  if (loading) return <div className="flex items-center gap-2 text-slate-500 py-8 justify-center"><RefreshCw size={16} className="animate-spin" /> Loading {title}…</div>
  if (error) return <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>

  const total = data.reduce((n, l) => n + (l.files?.length || 0), 0)

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 mb-3">QC documents from Nashua, Nogales, and Mesa facilities · searched on customer part {partNumber}</p>

      {total === 0 ? (
        <p className="text-sm text-slate-400 py-4">No files found for {partNumber}.</p>
      ) : (
        <div className="space-y-2">
          {data.filter(l => l.files?.length || l.error).map(loc => (
            <div key={loc.location} className="border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => toggle(loc.location)} className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 text-left">
                {expanded.has(loc.location) ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
                <span className="text-sm font-medium text-slate-700">{loc.location}</span>
                <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded">{loc.files?.length || 0} files</span>
              </button>
              {expanded.has(loc.location) && (
                <div className="divide-y divide-slate-100">
                  {loc.path && <p className="px-3 py-1.5 text-xs text-slate-400">Path: {loc.path}</p>}
                  {(loc.files || []).map((f, i) => (
                    <div key={i} onClick={() => setPreview({ files: loc.files, index: i })}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer group" title="Click to preview">
                      <FileText size={16} className="text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate">{f.name}</p>
                        <p className="text-xs text-slate-400">{fmtSize(f.size)} · {new Date(f.modified).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={e => { e.stopPropagation(); setPreview({ files: loc.files, index: i }) }} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Preview"><Eye size={15} /></button>
                        <button onClick={e => { e.stopPropagation(); download(f) }} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Download"><Download size={15} /></button>
                      </div>
                    </div>
                  ))}
                  {loc.error && <p className="px-3 py-2 text-xs text-amber-600">{loc.error}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {preview && (
        <FilePreviewModal files={preview.files} index={preview.index}
          onIndexChange={i => setPreview(p => p ? { ...p, index: i } : null)}
          onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
