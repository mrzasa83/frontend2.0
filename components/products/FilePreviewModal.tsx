'use client'

import React, { useState, useEffect } from 'react'
import { X, ExternalLink, Download, Maximize2, Minimize2, FileText, Loader2 } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type PreviewFile = { name: string; path: string; extension: string; serveUrl?: string }

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg']
const TEXT_EXT = ['txt', 'log', 'md', 'json', 'xml', 'yml', 'yaml', 'ini', 'cfg']
const SHEET_EXT = ['xlsx', 'xls', 'csv', 'tsv']
const OFFICE_EXT = ['doc', 'docx', 'ppt', 'pptx']
const CONVERT_EXT = ['doc', 'ppt', 'pptx']  // rendered to PDF by the backend (LibreOffice)

export default function FilePreviewModal({ file, onClose }: { file: PreviewFile; onClose: () => void }) {
  const [maximized, setMaximized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [textContent, setTextContent] = useState<string | null>(null)
  const [sheetHtml, setSheetHtml] = useState<string | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [workbook, setWorkbook] = useState<any>(null)
  const [docHtml, setDocHtml] = useState<string | null>(null)
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null)

  const ext = (file.extension || file.name.split('.').pop() || '').toLowerCase().replace(/^\./, '')
  const serveUrl = getApiUrl(`/api/files/serve?path=${encodeURIComponent(file.path)}`)
  const newTabUrl = serveUrl
  const downloadUrl = `${serveUrl}&download=true`

  const kind = IMAGE_EXT.includes(ext) ? 'image'
    : ext === 'pdf' ? 'pdf'
    : SHEET_EXT.includes(ext) ? 'sheet'
    : (TEXT_EXT.includes(ext) || ext === 'csv') ? 'text'
    : ext === 'docx' ? 'word'
    : CONVERT_EXT.includes(ext) ? 'convert'
    : OFFICE_EXT.includes(ext) ? 'office'
    : 'other'

  // Load text content
  useEffect(() => {
    if (kind !== 'text') return
    let cancelled = false
    setLoading(true); setError('')
    fetch(serveUrl)
      .then(r => { if (!r.ok) throw new Error('Could not load file'); return r.text() })
      .then(t => { if (!cancelled) setTextContent(t.slice(0, 500000)) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [serveUrl, kind])

  // Load + parse spreadsheet
  useEffect(() => {
    if (kind !== 'sheet') return
    let cancelled = false
    setLoading(true); setError('')
    ;(async () => {
      try {
        const XLSX = await import('xlsx')
        const res = await fetch(serveUrl)
        if (!res.ok) throw new Error('Could not load file')
        const buf = await res.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        if (cancelled) return
        setWorkbook(wb)
        setSheetNames(wb.SheetNames)
        setActiveSheet(0)
      } catch (e: any) { if (!cancelled) setError(e.message || 'Failed to parse spreadsheet') }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [serveUrl, kind])

  // Render the active sheet to HTML when sheet/workbook changes
  useEffect(() => {
    if (kind !== 'sheet' || !workbook || !sheetNames.length) return
    ;(async () => {
      const XLSX = await import('xlsx')
      const ws = workbook.Sheets[sheetNames[activeSheet]]
      setSheetHtml(XLSX.utils.sheet_to_html(ws, { editable: false }))
    })()
  }, [workbook, activeSheet, sheetNames, kind])

  // Load + convert Word (.docx) to HTML via mammoth
  useEffect(() => {
    if (kind !== 'word') return
    let cancelled = false
    setLoading(true); setError('')
    ;(async () => {
      try {
        const mod: any = await import('mammoth')
        const mammoth = mod.default || mod
        const res = await fetch(serveUrl)
        if (!res.ok) throw new Error('Could not load file')
        const arrayBuffer = await res.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        if (!cancelled) setDocHtml(result.value || '<p class="text-slate-400">(empty document)</p>')
      } catch (e: any) { if (!cancelled) setError(e.message || 'Failed to render document') }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [serveUrl, kind])

  // Convert Office files (doc/ppt/pptx) to PDF on the backend, view as blob
  useEffect(() => {
    if (kind !== 'convert') return
    let cancelled = false
    let objUrl: string | null = null
    setLoading(true); setError(''); setConvertedUrl(null)
    ;(async () => {
      try {
        const res = await fetch(getApiUrl(`/api/files/convert?path=${encodeURIComponent(file.path)}`))
        if (!res.ok) {
          let detail = 'Conversion failed'
          try { detail = (await res.json()).error || detail } catch { /* non-json */ }
          throw new Error(detail)
        }
        const blob = await res.blob()
        if (cancelled) return
        objUrl = URL.createObjectURL(blob)
        setConvertedUrl(objUrl)
      } catch (e: any) { if (!cancelled) setError(e.message || 'Conversion failed') }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true; if (objUrl) URL.revokeObjectURL(objUrl) }
  }, [file.path, kind])

  const body = () => {
    if (kind === 'pdf') {
      return <iframe src={serveUrl} title={file.name} className="flex-1 w-full" />
    }
    if (kind === 'image') {
      return (
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 p-4">
          <img src={serveUrl} alt={file.name} className="max-w-full max-h-full object-contain" />
        </div>
      )
    }
    if (loading) {
      return <div className="flex-1 flex items-center justify-center text-slate-500 gap-2">
        <Loader2 size={18} className="animate-spin" /> {kind === 'convert' ? 'Converting for preview…' : 'Loading preview…'}
      </div>
    }
    if (error) {
      return fallback(`Couldn't render a preview (${error}).`)
    }
    if (kind === 'text') {
      return (
        <pre className="flex-1 overflow-auto m-0 p-4 text-xs leading-relaxed text-slate-800 bg-slate-50 whitespace-pre-wrap break-words">{textContent}</pre>
      )
    }
    if (kind === 'sheet') {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          {sheetNames.length > 1 && (
            <div className="flex gap-1 px-3 py-2 border-b border-slate-200 overflow-x-auto flex-shrink-0">
              {sheetNames.map((n, i) => (
                <button key={n} onClick={() => setActiveSheet(i)}
                  className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${i === activeSheet ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {n}
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-auto p-2 sheet-preview" dangerouslySetInnerHTML={{ __html: sheetHtml || '' }} />
        </div>
      )
    }
    if (kind === 'word') {
      return (
        <div className="flex-1 overflow-auto bg-slate-100 p-6">
          <div className="docx-preview mx-auto max-w-3xl bg-white shadow-sm rounded-lg p-10"
            dangerouslySetInnerHTML={{ __html: docHtml || '' }} />
        </div>
      )
    }
    if (kind === 'convert') {
      return convertedUrl
        ? <iframe src={convertedUrl} title={file.name} className="flex-1 w-full" />
        : fallback('Could not convert this file for preview.')
    }
    // office + other: no inline preview
    return fallback(
      kind === 'office'
        ? `In-app preview isn't available for .${ext} files. Open it in a new tab (it'll open in the desktop app) or download it.`
        : `No preview available for .${ext || 'this'} files.`
    )
  }

  const fallback = (msg: string) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8 text-slate-500">
      <FileText size={40} className="text-slate-300" />
      <p className="text-sm max-w-sm">{msg}</p>
      <div className="flex gap-2 mt-1">
        <a href={newTabUrl} target="_blank" rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5"><ExternalLink size={14} /> Open in new tab</a>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-1.5"><Download size={14} /> Download</a>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-2xl flex flex-col transition-all duration-150 overflow-hidden ${maximized ? 'w-[98vw] h-[96vh]' : 'w-[80vw] h-[90vh]'}`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
          <h3 className="text-sm font-medium text-slate-700 truncate pr-4" title={file.name}>{file.name}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setMaximized(m => !m)} className="text-slate-500 hover:text-blue-600 p-1" title={maximized ? 'Restore size' : 'Maximize'}>
              {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-green-600 p-1" title="Download"><Download size={16} /></a>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1" title="Close"><X size={18} /></button>
          </div>
        </div>
        {body()}
      </div>
      <style jsx global>{`
        .sheet-preview table { border-collapse: collapse; font-size: 12px; }
        .sheet-preview td, .sheet-preview th { border: 1px solid #e2e8f0; padding: 3px 8px; white-space: nowrap; }
        .sheet-preview tr:first-child td { background: #f8fafc; font-weight: 600; }
        .docx-preview { color: #1e293b; font-size: 14px; line-height: 1.6; }
        .docx-preview h1 { font-size: 1.5rem; font-weight: 700; margin: 0.8em 0 0.4em; }
        .docx-preview h2 { font-size: 1.25rem; font-weight: 700; margin: 0.8em 0 0.4em; }
        .docx-preview h3 { font-size: 1.1rem; font-weight: 600; margin: 0.8em 0 0.4em; }
        .docx-preview p { margin: 0.5em 0; }
        .docx-preview ul, .docx-preview ol { margin: 0.5em 0; padding-left: 1.5em; }
        .docx-preview li { margin: 0.2em 0; }
        .docx-preview table { border-collapse: collapse; margin: 0.8em 0; width: 100%; }
        .docx-preview td, .docx-preview th { border: 1px solid #cbd5e1; padding: 4px 8px; font-size: 13px; }
        .docx-preview img { max-width: 100%; height: auto; }
        .docx-preview a { color: #2563eb; text-decoration: underline; }
      `}</style>
    </div>
  )
}
