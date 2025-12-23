'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, FolderOpen, ChevronDown, ChevronRight, 
  Download, ExternalLink, File, FileImage, FileSpreadsheet,
  Package, ClipboardCheck, Truck, RefreshCw, Copy, Check, Database
} from 'lucide-react'

type FileInfo = {
  name: string
  path: string
  size: number
  modified: string
  extension: string
  isDirectory: boolean
  serveUrl?: string  // URL to serve file through API
}

type LocationFiles = {
  location: string
  basePath: string
  files: FileInfo[]
  error?: string
  hasFiles?: boolean  // Whether files were found (for auto-expand)
}

type Props = {
  partNumber: string
}

// Convert Linux path to Windows path for display
function toWindowsPath(linuxPath: string): string {
  if (!linuxPath) return ''
  return linuxPath
    .replace(/^\/mnt\/sdrive\/?/i, 'S:\\')
    .replace(/^\/mnt\/jdrive\/?/i, 'J:\\')
    .replace(/^\/mnt\/tdrive\/?/i, 'T:\\')
    .replace(/\//g, '\\')
}

// Get icon based on file extension
function getFileIcon(extension: string) {
  switch (extension.toLowerCase()) {
    case 'pdf':
      return <FileText size={18} className="text-red-500" />
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return <FileImage size={18} className="text-blue-500" />
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FileSpreadsheet size={18} className="text-green-600" />
    case 'doc':
    case 'docx':
      return <FileText size={18} className="text-blue-600" />
    default:
      return <File size={18} className="text-slate-400" />
  }
}

// Format file size
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Format date
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function ReleasedFilesTab({ partNumber }: Props) {
  const [activeSubTab, setActiveSubTab] = useState('final-inspection')
  
  // Final Inspection data
  const [fiData, setFiData] = useState<LocationFiles[]>([])
  const [fiLoading, setFiLoading] = useState(false)
  const [fiError, setFiError] = useState<string | null>(null)
  const [fiExpanded, setFiExpanded] = useState<Set<string>>(new Set()) // Auto-set after fetch
  
  // Build Drawings data - now with separate network and paradigm files
  const [bdNetworkFiles, setBdNetworkFiles] = useState<FileInfo[]>([])
  const [bdParadigmFiles, setBdParadigmFiles] = useState<FileInfo[]>([])
  const [bdBasePath, setBdBasePath] = useState<string>('')
  const [bdLoading, setBdLoading] = useState(false)
  const [bdError, setBdError] = useState<string | null>(null)
  const [bdExpanded, setBdExpanded] = useState<Set<string>>(new Set(['Network Files', 'Paradigm Attachments']))
  
  // Pack & Ship data
  const [psData, setPsData] = useState<LocationFiles[]>([])
  const [psLoading, setPsLoading] = useState(false)
  const [psError, setPsError] = useState<string | null>(null)

  useEffect(() => {
    if (activeSubTab === 'final-inspection' && fiData.length === 0) {
      fetchFinalInspection()
    } else if (activeSubTab === 'build-drawings' && bdNetworkFiles.length === 0 && bdParadigmFiles.length === 0 && !bdLoading) {
      fetchBuildDrawings()
    } else if (activeSubTab === 'pack-ship' && psData.length === 0) {
      fetchPackShip()
    }
  }, [activeSubTab, partNumber])

  const fetchFinalInspection = async () => {
    setFiLoading(true)
    setFiError(null)
    try {
      const res = await fetch('/api/products/released-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber, fileType: 'finalInspection' })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const results = data.results || []
      setFiData(results)
      
      // Auto-expand only locations that have files
      const locationsWithFiles = new Set(
        results
          .filter((loc: LocationFiles) => loc.hasFiles || loc.files?.length > 0)
          .map((loc: LocationFiles) => loc.location)
      )
      setFiExpanded(locationsWithFiles)
    } catch (err) {
      setFiError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setFiLoading(false)
    }
  }

  const fetchBuildDrawings = async () => {
    setBdLoading(true)
    setBdError(null)
    try {
      const res = await fetch('/api/products/released-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber, fileType: 'buildDrawings' })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      
      if (data.buildDrawings) {
        setBdNetworkFiles(data.buildDrawings.networkFiles || [])
        setBdParadigmFiles(data.buildDrawings.paradigmAttachments || [])
        setBdBasePath(data.buildDrawings.basePath || '')
        if (data.buildDrawings.error) {
          setBdError(data.buildDrawings.error)
        }
        
        // Auto-expand sections that have files
        const expanded = new Set<string>()
        if (data.buildDrawings.hasNetworkFiles) expanded.add('Network Files')
        if (data.buildDrawings.hasParadigmFiles) expanded.add('Paradigm Attachments')
        setBdExpanded(expanded)
      }
    } catch (err) {
      setBdError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setBdLoading(false)
    }
  }

  const fetchPackShip = async () => {
    setPsLoading(true)
    setPsError(null)
    try {
      const res = await fetch('/api/products/released-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber, fileType: 'packShip' })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPsData(data.results || [])
    } catch (err) {
      setPsError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setPsLoading(false)
    }
  }

  const toggleLocation = (location: string) => {
    const newExpanded = new Set(fiExpanded)
    if (newExpanded.has(location)) {
      newExpanded.delete(location)
    } else {
      newExpanded.add(location)
    }
    setFiExpanded(newExpanded)
  }

  // Track copied state
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  // Copy path to clipboard
  const copyPath = async (path: string) => {
    const windowsPath = toWindowsPath(path)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(windowsPath)
      } else {
        // Fallback for non-HTTPS
        const textArea = document.createElement('textarea')
        textArea.value = windowsPath
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedPath(path)
      setTimeout(() => setCopiedPath(null), 2000)
    } catch (err) {
      window.prompt('Copy this path:', windowsPath)
    }
  }

  // Open file through API server (works for PDFs, images, etc.)
  const openFile = (file: FileInfo) => {
    if (file.serveUrl) {
      // Use the serve API URL - works in browser!
      window.open(file.serveUrl, '_blank')
    } else {
      // Fallback to constructing the URL
      const serveUrl = `/api/files/serve?path=${encodeURIComponent(file.path)}`
      window.open(serveUrl, '_blank')
    }
  }

  // Download file
  const downloadFile = (file: FileInfo) => {
    const downloadUrl = file.serveUrl 
      ? `${file.serveUrl}&download=true`
      : `/api/files/serve?path=${encodeURIComponent(file.path)}&download=true`
    window.open(downloadUrl, '_blank')
  }

  const subTabs = [
    { id: 'final-inspection', label: 'Final Inspection', icon: ClipboardCheck },
    { id: 'build-drawings', label: 'Build Drawings', icon: FileText },
    { id: 'pack-ship', label: 'Pack & Ship', icon: Truck },
  ]

  const renderFileList = (files: FileInfo[], showPath: boolean = false) => {
    if (files.length === 0) {
      return (
        <p className="text-sm text-slate-500 italic py-2">No files found</p>
      )
    }

    return (
      <div className="space-y-1">
        {files.map((file, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group"
          >
            {getFileIcon(file.extension)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {file.name}
              </p>
              {showPath && (
                <p className="text-xs text-slate-500 truncate">
                  {toWindowsPath(file.path)}
                </p>
              )}
              <p className="text-xs text-slate-400">
                {formatSize(file.size)} • {formatDate(file.modified)}
              </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => copyPath(file.path)}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                title="Copy path"
              >
                {copiedPath === file.path ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
              <button
                onClick={() => openFile(file)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                title="Open file"
              >
                <ExternalLink size={16} />
              </button>
              <button
                onClick={() => downloadFile(file)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                title="Download file"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderLocationAccordion = (data: LocationFiles[], loading: boolean, error: string | null, onRefresh: () => void) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <RefreshCw size={24} className="animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600">Scanning folders...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={onRefresh}
            className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )
    }

    const hasAnyFiles = data.some(loc => loc.files.length > 0)

    if (!hasAnyFiles) {
      return (
        <div className="text-center py-8 text-slate-500">
          <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
          <p>No files found for {partNumber}</p>
          <button
            onClick={onRefresh}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {data.map((loc) => {
          const isExpanded = fiExpanded.has(loc.location)
          const fileCount = loc.files.length

          return (
            <div key={loc.location} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleLocation(loc.location)}
                className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                  fileCount > 0 ? 'hover:bg-slate-50' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="font-medium text-slate-800">{loc.location}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    fileCount > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {fileCount} file{fileCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {loc.error && (
                  <span className="text-xs text-amber-600">{loc.error}</span>
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t border-slate-200 p-3 bg-white">
                  <p className="text-xs text-slate-500 mb-2">
                    Path: {toWindowsPath(loc.basePath)}
                  </p>
                  {renderFileList(loc.files)}
                </div>
              )}
            </div>
          )
        })}
        
        <div className="flex justify-end pt-2">
          <button
            onClick={onRefresh}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>
    )
  }

  const renderSimpleFileList = (data: LocationFiles[], loading: boolean, error: string | null, onRefresh: () => void) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <RefreshCw size={24} className="animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600">Scanning folders...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={onRefresh}
            className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )
    }

    const allFiles = data.flatMap(loc => loc.files)
    const basePath = data[0]?.basePath || ''

    if (allFiles.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
          <p>No files found for {partNumber}</p>
          <p className="text-xs mt-1">Searched in: {toWindowsPath(basePath)}</p>
          <button
            onClick={onRefresh}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      )
    }

    return (
      <div>
        <p className="text-xs text-slate-500 mb-3">
          Path: {toWindowsPath(basePath)}
        </p>
        {renderFileList(allFiles, true)}
        <div className="flex justify-end pt-2 border-t mt-3">
          <button
            onClick={onRefresh}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-6">
      {/* Left Sidebar - Vertical Sub-tabs */}
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSubTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0">
        {activeSubTab === 'final-inspection' && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Final Inspection</h3>
            <p className="text-sm text-slate-600 mb-4">
              QC documents from Nashua, Nogales, and Mesa facilities
            </p>
            {renderLocationAccordion(fiData, fiLoading, fiError, fetchFinalInspection)}
          </div>
        )}

        {activeSubTab === 'build-drawings' && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Build Drawings</h3>
            <p className="text-sm text-slate-600 mb-4">
              Manufacturing drawings and documentation
            </p>
            
            {bdLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Loading files...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Network Files Accordion */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(bdExpanded)
                      if (newExpanded.has('Network Files')) {
                        newExpanded.delete('Network Files')
                      } else {
                        newExpanded.add('Network Files')
                      }
                      setBdExpanded(newExpanded)
                    }}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {bdExpanded.has('Network Files') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <FolderOpen size={18} className="text-blue-600" />
                      <span className="font-medium text-slate-800">Network Files</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        bdNetworkFiles.length > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {bdNetworkFiles.length} file{bdNetworkFiles.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                  
                  {bdExpanded.has('Network Files') && (
                    <div className="border-t border-slate-200 p-3 bg-white">
                      {bdBasePath && (
                        <p className="text-xs text-slate-500 mb-2">
                          Path: {toWindowsPath(bdBasePath)}
                        </p>
                      )}
                      {bdNetworkFiles.length > 0 ? (
                        renderFileList(bdNetworkFiles, false)
                      ) : (
                        <p className="text-sm text-slate-500 italic py-2">No network files found</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Paradigm Attachments Accordion */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(bdExpanded)
                      if (newExpanded.has('Paradigm Attachments')) {
                        newExpanded.delete('Paradigm Attachments')
                      } else {
                        newExpanded.add('Paradigm Attachments')
                      }
                      setBdExpanded(newExpanded)
                    }}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {bdExpanded.has('Paradigm Attachments') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <Database size={18} className="text-purple-600" />
                      <span className="font-medium text-slate-800">Paradigm Attachments</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        bdParadigmFiles.length > 0 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {bdParadigmFiles.length} file{bdParadigmFiles.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                  
                  {bdExpanded.has('Paradigm Attachments') && (
                    <div className="border-t border-slate-200 p-3 bg-white">
                      <p className="text-xs text-slate-500 mb-2">
                        Documents from Paradigm database (DATA0433)
                      </p>
                      {bdParadigmFiles.length > 0 ? (
                        renderFileList(bdParadigmFiles, true)
                      ) : (
                        <p className="text-sm text-slate-500 italic py-2">No Paradigm attachments found</p>
                      )}
                    </div>
                  )}
                </div>

                {bdError && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
                    {bdError}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={fetchBuildDrawings}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'pack-ship' && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Pack & Ship</h3>
            <p className="text-sm text-slate-600 mb-4">
              Packaging and shipping documentation
            </p>
            {renderSimpleFileList(psData, psLoading, psError, fetchPackShip)}
          </div>
        )}
      </div>
    </div>
  )
}
