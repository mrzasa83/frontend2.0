'use client'


import { useState, useEffect } from 'react'
import { 
  FileText, FolderOpen, ChevronDown, ChevronRight, 
  Download, ExternalLink, File, FileImage, FileSpreadsheet,
  Package, ClipboardList, Truck, RefreshCw, Copy, Check, Database,
  TrendingUp, Route as RouteIcon, Archive, AlertTriangle, History
} from 'lucide-react'
import DataView from '@/components/ui/DataView'
import BOMTreeNavigator from '@/components/ui/BOMTreeNavigator'
import { 
import { getApiUrl } from '@/lib/api'
  productionGeneralMetadata,
  yieldMetadata,
  routeMetadata,
  workOrdersMetadata,
  inventoryMetadata,
  discrepancyMetadata,
  changesMetadata
} from '@/lib/metadata/columnMetadata'

type FileInfo = {
  name: string
  path: string
  size: number
  modified: string
  extension: string
  isDirectory: boolean
  serveUrl?: string
  matchedPartNumber?: string
}

type LocationFiles = {
  location: string
  basePath: string
  files: FileInfo[]
  error?: string
  hasFiles?: boolean
}

type ProductionData = {
  [key: string]: any
}

type Props = {
  partNumber: string
  onStatusChange?: (status: string) => void
  onBuildLocationChange?: (location: string) => void
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
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function ReleasedFilesTab({ partNumber, onStatusChange, onBuildLocationChange }: Props) {
  const [activeSubTab, setActiveSubTab] = useState('general')
  
  // ========================================
  // PRODUCTION DATA STATES
  // ========================================
  const [productionGeneralData, setProductionGeneralData] = useState<ProductionData[]>([])
  const [loadingProdGeneral, setLoadingProdGeneral] = useState(false)
  const [prodGeneralError, setProdGeneralError] = useState<string | null>(null)

  const [yieldData, setYieldData] = useState<ProductionData[]>([])
  const [loadingYield, setLoadingYield] = useState(false)
  const [yieldError, setYieldError] = useState<string | null>(null)
  const [yieldFilterMode, setYieldFilterMode] = useState<'startsWith' | 'contains'>('startsWith')
  const [yieldInvPartFilter, setYieldInvPartFilter] = useState('')

  const [routeData, setRouteData] = useState<ProductionData[]>([])
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)

  const [workOrdersData, setWorkOrdersData] = useState<ProductionData[]>([])
  const [workOrdersAllData, setWorkOrdersAllData] = useState<ProductionData[]>([]) // Includes completed
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false)
  const [workOrdersError, setWorkOrdersError] = useState<string | null>(null)
  const [showOpenOrdersOnly, setShowOpenOrdersOnly] = useState(true) // Default to open only

  const [inventoryData, setInventoryData] = useState<ProductionData[]>([])
  const [inventoryAllData, setInventoryAllData] = useState<ProductionData[]>([]) // Includes zero qty
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [showZeroInventory, setShowZeroInventory] = useState(false)

  const [discrepancyData, setDiscrepancyData] = useState<ProductionData[]>([])
  const [loadingDiscrepancy, setLoadingDiscrepancy] = useState(false)
  const [discrepancyError, setDiscrepancyError] = useState<string | null>(null)

  const [changesData, setChangesData] = useState<ProductionData[]>([])
  const [changesAllData, setChangesAllData] = useState<ProductionData[]>([])
  const [loadingChanges, setLoadingChanges] = useState(false)
  const [changesError, setChangesError] = useState<string | null>(null)
  const [showAcceptedOnly, setShowAcceptedOnly] = useState(true) // Default to accepted only

  // ========================================
  // RELEASED FILES STATES
  // ========================================
  // Final Inspection data
  const [fiData, setFiData] = useState<LocationFiles[]>([])
  const [fiLoading, setFiLoading] = useState(false)
  const [fiError, setFiError] = useState<string | null>(null)
  const [fiExpanded, setFiExpanded] = useState<Set<string>>(new Set())
  
  // Build Drawings data
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

  // Clipboard state
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  // ========================================
  // FETCH FUNCTIONS - PRODUCTION
  // ========================================
  const fetchProductionGeneralData = async () => {
    if (loadingProdGeneral || productionGeneralData.length > 0) return
    setLoadingProdGeneral(true)
    setProdGeneralError(null)
    try {
      const res = await fetch(getApiUrl('/api/products/production'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: partNumber })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProductionGeneralData(data.data || [])
      
      // Notify parent of status
      if (onStatusChange && data.status) {
        onStatusChange(data.status)
      }
    } catch (err) {
      setProdGeneralError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoadingProdGeneral(false)
    }
  }

  const fetchYieldData = async () => {
    if (loadingYield || yieldData.length > 0) return
    setLoadingYield(true)
    setYieldError(null)
    try {
      const res = await fetch(getApiUrl('/api/products/yield'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: partNumber })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setYieldData(data.data || [])
    } catch (err) {
      setYieldError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoadingYield(false)
    }
  }

  const fetchRouteData = async () => {
    if (loadingRoute || routeData.length > 0) return
    setLoadingRoute(true)
    setRouteError(null)
    try {
      const res = await fetch(getApiUrl('/api/products/route'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: partNumber })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRouteData(data.data || [])
      
      // Notify parent of build location
      if (onBuildLocationChange && data.buildLocation) {
        onBuildLocationChange(data.buildLocation)
      }
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoadingRoute(false)
    }
  }

  const fetchWorkOrdersData = async () => {
    if (loadingWorkOrders || workOrdersData.length > 0 || workOrdersAllData.length > 0) return
    setLoadingWorkOrders(true)
    setWorkOrdersError(null)
    try {
      const res = await fetch(getApiUrl('/api/products/work-orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: partNumber })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setWorkOrdersData(data.data || [])
      setWorkOrdersAllData(data.allData || [])
    } catch (err) {
      setWorkOrdersError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoadingWorkOrders(false)
    }
  }

  const fetchInventoryData = async () => {
    if (loadingInventory || inventoryData.length > 0 || inventoryAllData.length > 0) return
    setLoadingInventory(true)
    setInventoryError(null)
    try {
      const res = await fetch(getApiUrl('/api/products/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: partNumber })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setInventoryData(data.data || [])
      setInventoryAllData(data.allData || [])
    } catch (err) {
      setInventoryError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoadingInventory(false)
    }
  }

  const fetchDiscrepancyData = async () => {
    if (loadingDiscrepancy || discrepancyData.length > 0) return
    setLoadingDiscrepancy(true)
    setDiscrepancyError(null)
    try {
      const res = await fetch(getApiUrl('/api/products/discrepancy'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: partNumber })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setDiscrepancyData(data.data || [])
    } catch (err) {
      setDiscrepancyError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoadingDiscrepancy(false)
    }
  }

  const fetchChangesData = async () => {
    if (loadingChanges || changesData.length > 0 || changesAllData.length > 0) return
    setLoadingChanges(true)
    setChangesError(null)
    try {
      const res = await fetch(getApiUrl('/api/products/changes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: partNumber })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setChangesData(data.data || [])
      setChangesAllData(data.allData || [])
    } catch (err) {
      setChangesError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoadingChanges(false)
    }
  }

  // ========================================
  // FETCH FUNCTIONS - RELEASED FILES
  // ========================================
  const fetchFinalInspection = async () => {
    setFiLoading(true)
    setFiError(null)
    try {
      const res = await fetch(getApiUrl('/api/products/released-files'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber, fileType: 'finalInspection' })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const results = data.results || []
      setFiData(results)
      
      const locationsWithFiles = new Set<string>(
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
      const res = await fetch(getApiUrl('/api/products/released-files'), {
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
      const res = await fetch(getApiUrl('/api/products/released-files'), {
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

  // ========================================
  // EFFECTS - Load data when tab changes
  // ========================================
  useEffect(() => {
    switch (activeSubTab) {
      case 'general':
        fetchProductionGeneralData()
        break
      case 'yield':
        fetchYieldData()
        break
      case 'route':
        fetchRouteData()
        break
      case 'work-orders':
        fetchWorkOrdersData()
        break
      case 'inventory':
        fetchInventoryData()
        break
      case 'discrepancy':
        fetchDiscrepancyData()
        break
      case 'final-inspection':
        if (fiData.length === 0) fetchFinalInspection()
        break
      case 'build-drawings':
        if (bdNetworkFiles.length === 0 && bdParadigmFiles.length === 0 && !bdLoading) fetchBuildDrawings()
        break
      case 'pack-ship':
        if (psData.length === 0) fetchPackShip()
        break
      case 'changes':
        fetchChangesData()
        break
    }
  }, [activeSubTab, partNumber])

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  const toggleLocation = (location: string) => {
    const newExpanded = new Set(fiExpanded)
    if (newExpanded.has(location)) {
      newExpanded.delete(location)
    } else {
      newExpanded.add(location)
    }
    setFiExpanded(newExpanded)
  }

  const copyPath = async (path: string) => {
    const windowsPath = toWindowsPath(path)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(windowsPath)
      } else {
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

  const openFile = (file: FileInfo) => {
    if (file.serveUrl) {
      window.open(file.serveUrl, '_blank')
    } else {
      const serveUrl = getApiUrl(`/api/files/serve?path=${encodeURIComponent(file.path)}`))
      window.open(serveUrl, '_blank')
    }
  }

  const downloadFile = (file: FileInfo) => {
    const downloadUrl = file.serveUrl 
      ? `${file.serveUrl}&download=true`
      : getApiUrl(`/api/files/serve?path=${encodeURIComponent(file.path)}&download=true`))
    window.open(downloadUrl, '_blank')
  }

  // Export data to Excel using SheetJS (client-side)
  const exportToExcel = async (data: any[], metadata: any, filename: string) => {
    if (!data || data.length === 0) return

    // Dynamically import SheetJS
    const XLSX = await import('xlsx')

    // Get visible columns based on metadata
    const columns = Object.keys(data[0]).filter(key => {
      const meta = metadata[key]
      return !meta?.hidden && !meta?.system
    })

    // Get column labels
    const headers = columns.map(key => metadata[key]?.label || key)

    // Format cell values
    const formatValue = (value: any, key: string) => {
      if (value === null || value === undefined) return ''
      const colType = metadata[key]?.type
      if (colType === 'date' && value) {
        try {
          const date = new Date(value)
          if (!isNaN(date.getTime()) {
            return date.toLocaleDateString('en-US')
          }
        } catch { }
      }
      if (colType === 'percent' && !isNaN(Number(value)) {
        return Number(value).toFixed(3) + '%'
      }
      return String(value)
    }

    // Build worksheet data
    const wsData = [
      headers,
      ...data.map(row => columns.map(col => formatValue(row[col], col))
    ]

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')

    // Auto-size columns
    const colWidths = columns.map((col, idx) => {
      const maxLen = Math.max(
        headers[idx].length,
        ...data.map(row => String(formatValue(row[col], col)).length)
      )
      return { wch: Math.min(maxLen + 2, 50) }
    })
    ws['!cols'] = colWidths

    // Download
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  // ========================================
  // SUB-TAB DEFINITIONS
  // ========================================
  const subTabs = [
    { id: 'general', label: 'General', icon: ClipboardList },
    { id: 'bom', label: 'BOM', icon: Package },
    { id: 'yield', label: 'Yield', icon: TrendingUp },
    { id: 'route', label: 'Route', icon: RouteIcon },
    { id: 'work-orders', label: 'Work Orders', icon: ClipboardList },
    { id: 'inventory', label: 'Inventory', icon: Archive },
    { id: 'discrepancy', label: 'Discrepancy', icon: AlertTriangle },
    { id: 'final-inspection', label: 'Final Inspection', icon: ClipboardList },
    { id: 'build-drawings', label: 'Build Drawings', icon: FileText },
    { id: 'pack-ship', label: 'Pack & Ship', icon: Truck },
    { id: 'changes', label: 'Changes', icon: History },
  ]

  // ========================================
  // RENDER HELPERS
  // ========================================
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
              {file.size > 0 && (
                <p className="text-xs text-slate-400">
                  {formatSize(file.size)} • {formatDate(file.modified)}
                </p>
              )}
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

    if (!hasAnyFiles && data.length > 0) {
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

  // ========================================
  // MAIN RENDER
  // ========================================
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
        {/* PRODUCTION TABS */}
        {activeSubTab === 'general' && (
          <DataView
            data={productionGeneralData}
            metadata={productionGeneralMetadata}
            loading={loadingProdGeneral}
            error={prodGeneralError}
            emptyMessage={`No production data found for part ${partNumber}`}
            title="Production General"
            subtitle="Data from Paradigm (read-only)"
            editable={false}
          />
        )}

        {activeSubTab === 'bom' && (
          <BOMTreeNavigator
            rootPartNumber={partNumber}
            onPartClick={(pn) => console.log('Clicked part:', pn)}
          />
        )}

        {activeSubTab === 'yield' && (
          <div>
            {(() => {
              // Client-side filter on INV_PART_NUMBER
              const filteredYieldData = yieldInvPartFilter
                ? yieldData.filter(row => {
                    const invPart = String(row.INV_PART_NUMBER || '').toUpperCase()
                    const filterText = yieldInvPartFilter.toUpperCase()
                    return yieldFilterMode === 'startsWith'
                      ? invPart.startsWith(filterText)
                      : invPart.includes(filterText)
                  })
                : yieldData

              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        Yield ({filteredYieldData.length}{yieldInvPartFilter ? ` of ${yieldData.length}` : ''})
                      </h4>
                      <p className="text-sm text-slate-600">Work order yield history (read-only)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Inv Part:</label>
                        <select
                          value={yieldFilterMode}
                          onChange={(e) => setYieldFilterMode(e.target.value as 'startsWith' | 'contains')}
                          className="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="startsWith">Starts with</option>
                          <option value="contains">Contains</option>
                        </select>
                        <input
                          type="text"
                          value={yieldInvPartFilter}
                          onChange={(e) => setYieldInvPartFilter(e.target.value)}
                          placeholder="e.g. S-"
                          className="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24"
                        />
                        {yieldInvPartFilter && (
                          <button
                            onClick={() => setYieldInvPartFilter('')}
                            className="text-slate-400 hover:text-slate-600"
                            title="Clear filter"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => exportToExcel(filteredYieldData, yieldMetadata, `${partNumber}_Yield`)}
                        disabled={filteredYieldData.length === 0}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={16} />
                        Export to Excel
                      </button>
                    </div>
                  </div>
                  <DataView
                    data={filteredYieldData}
                    metadata={yieldMetadata}
                    loading={loadingYield}
                    error={yieldError}
                    emptyMessage={`No yield data found${yieldInvPartFilter ? ` matching "${yieldInvPartFilter}"` : ` for part ${partNumber}`}`}
                    editable={false}
                    mode="table"
                    frozenColumns={2}
                  />
                </>
              )
            })()}
          </div>
        )}

        {activeSubTab === 'route' && (
          <DataView
            data={routeData}
            metadata={routeMetadata}
            loading={loadingRoute}
            error={routeError}
            emptyMessage={`No route data found for part ${partNumber}`}
            title="Route"
            subtitle="Manufacturing route (read-only)"
            editable={false}
          />
        )}

        {activeSubTab === 'work-orders' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-800">
                  Work Orders ({showOpenOrdersOnly ? workOrdersData.length : workOrdersAllData.length})
                </h4>
                <p className="text-sm text-slate-600">Work order history (read-only)</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => exportToExcel(
                    showOpenOrdersOnly ? workOrdersData : workOrdersAllData, 
                    workOrdersMetadata, 
                    `${partNumber}_WorkOrders${showOpenOrdersOnly ? '_Open' : '_All'}`
                  )}
                  disabled={(showOpenOrdersOnly ? workOrdersData.length : workOrdersAllData.length) === 0}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  Export to Excel
                </button>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-slate-600">Open orders only</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showOpenOrdersOnly}
                      onChange={(e) => setShowOpenOrdersOnly(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${showOpenOrdersOnly ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showOpenOrdersOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <DataView
              data={showOpenOrdersOnly ? workOrdersData : workOrdersAllData}
              metadata={workOrdersMetadata}
              loading={loadingWorkOrders}
              error={workOrdersError}
              emptyMessage={`No ${showOpenOrdersOnly ? 'open ' : ''}work orders found for part ${partNumber}`}
              editable={false}
              mode="table"
            />
          </div>
        )}

        {activeSubTab === 'inventory' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-800">
                  Inventory ({showZeroInventory ? inventoryAllData.length : inventoryData.length})
                </h4>
                <p className="text-sm text-slate-600">Inventory levels (read-only)</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-slate-600">Show zero qty</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showZeroInventory}
                    onChange={(e) => setShowZeroInventory(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${showZeroInventory ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showZeroInventory ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </label>
            </div>
            <DataView
              data={showZeroInventory ? inventoryAllData : inventoryData}
              metadata={inventoryMetadata}
              loading={loadingInventory}
              error={inventoryError}
              emptyMessage={`No inventory data found for part ${partNumber}`}
              editable={false}
              mode="table"
            />
          </div>
        )}

        {activeSubTab === 'discrepancy' && (
          <DataView
            data={discrepancyData}
            metadata={discrepancyMetadata}
            loading={loadingDiscrepancy}
            error={discrepancyError}
            emptyMessage={`No discrepancy notes found for part ${partNumber}`}
            title="Discrepancy"
            subtitle="Discrepancy notes from Paradigm (read-only)"
            editable={false}
          />
        )}

        {/* RELEASED FILES TABS */}
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
                        Documents linked in Paradigm
                      </p>
                      {bdParadigmFiles.length > 0 ? (
                        <div className="overflow-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-slate-700">Part Level</th>
                                <th className="px-3 py-2 text-left font-medium text-slate-700">File</th>
                                <th className="px-3 py-2 text-right font-medium text-slate-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {bdParadigmFiles.map((file, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 group">
                                  <td className="px-3 py-2 text-slate-600 font-mono">
                                    {file.matchedPartNumber || '-'}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      {getFileIcon(file.extension)}
                                      <span className="text-slate-800">{file.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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

        {activeSubTab === 'changes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-800">
                  Changes ({showAcceptedOnly ? changesData.length : changesAllData.length})
                </h4>
                <p className="text-sm text-slate-600">MCN change history (read-only)</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-slate-600">Accepted only</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showAcceptedOnly}
                    onChange={(e) => setShowAcceptedOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${showAcceptedOnly ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showAcceptedOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </label>
            </div>
            <DataView
              data={showAcceptedOnly ? changesData : changesAllData}
              metadata={changesMetadata}
              loading={loadingChanges}
              error={changesError}
              emptyMessage={`No ${showAcceptedOnly ? 'accepted ' : ''}change history found for part ${partNumber}`}
              editable={false}
              mode="table"
            />
          </div>
        )}
      </div>
    </div>
  )
}
