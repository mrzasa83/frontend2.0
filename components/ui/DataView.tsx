'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, FolderOpen, ChevronUp, ChevronDown } from 'lucide-react'

/**
 * Column metadata definition
 */
export type ColumnMetadata = {
  [columnName: string]: {
    hidden?: boolean      // Don't display at all
    system?: boolean      // Available to system but not visible to users
    readonly?: boolean    // Display but don't allow editing
    required?: boolean    // Must have value in forms
    label?: string        // Custom display label
    type?: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'folderLink' | 'percent'
    options?: string[]    // For select type
    width?: string        // Custom column width for tables
    sortable?: boolean    // Enable sorting (default true for tables)
    wrap?: boolean        // Allow text wrapping in table cells
  }
}

/**
 * Convert Linux path to Windows file:// URL for opening in Explorer
 * /mnt/jdrive/path/to/folder -> file:///J:/path/to/folder
 */
function linuxPathToWindowsUrl(linuxPath: string): string {
  if (!linuxPath) return ''
  
  // Convert /mnt/jdrive/ to J:/
  let windowsPath = linuxPath.replace(/^\/mnt\/jdrive\/?/i, 'J:/')
  
  // If it didn't start with /mnt/jdrive, check if it's already Windows format
  if (windowsPath === linuxPath && !linuxPath.startsWith('J:')) {
    // Convert forward slashes aren't needed for Windows URLs
    windowsPath = linuxPath
  }
  
  // Ensure forward slashes for URL
  windowsPath = windowsPath.replace(/\\/g, '/')
  
  return `file:///${windowsPath}`
}

/**
 * Convert Linux path to display as Windows path
 * /mnt/jdrive/path/to/folder -> J:\path\to\folder
 */
function linuxPathToWindowsDisplay(linuxPath: string): string {
  if (!linuxPath) return ''
  
  // Convert /mnt/jdrive/ to J:\
  let windowsPath = linuxPath.replace(/^\/mnt\/jdrive\/?/i, 'J:\\')
  
  // Convert forward slashes to backslashes for display
  windowsPath = windowsPath.replace(/\//g, '\\')
  
  return windowsPath
}

/**
 * Format a date value for display
 */
function formatDateValue(value: any): string {
  if (!value) return ''
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return String(value)
  }
}

export type DataViewProps = {
  data: any[]
  metadata?: ColumnMetadata
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  title?: string
  subtitle?: string
  mode?: 'auto' | 'form' | 'table'  // auto = switch based on row count
  editable?: boolean
  onSave?: (data: any) => void
  onChange?: (field: string, value: any) => void
  formData?: any  // For controlled form mode
  sortable?: boolean  // Enable sorting for table mode (default true)
  frozenColumns?: number  // Number of columns to freeze from the left (default 0)
}

export default function DataView({
  data = [],
  metadata = {},
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  title,
  subtitle,
  mode = 'auto',
  editable = false,
  onSave,
  onChange,
  formData,
  sortable = true,
  frozenColumns = 0
}: DataViewProps) {
  const [editedData, setEditedData] = useState<Record<string, any>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  // Get visible columns based on metadata
  const getVisibleColumns = (row: any) => {
    return Object.keys(row).filter((key) => {
      const meta = metadata[key]
      return !meta?.hidden && !meta?.system
    })
  }

  const getColumnLabel = (key: string) => {
    return metadata[key]?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const isReadOnly = (key: string) => {
    return !editable || metadata[key]?.readonly
  }

  const copyToClipboard = async (text: string, fieldKey: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for HTTP (non-HTTPS) contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedField(fieldKey)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      // Show the text in a prompt as last resort
      window.prompt('Copy this path:', text)
    }
  }

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortable) return data
    
    return [...data].sort((a, b) => {
      let valA = a[sortKey]
      let valB = b[sortKey]
      
      // Handle nulls
      if (valA === null || valA === undefined) valA = ''
      if (valB === null || valB === undefined) valB = ''
      
      // Check if it's a date column
      const colType = metadata[sortKey]?.type
      if (colType === 'date') {
        const dateA = new Date(valA).getTime() || 0
        const dateB = new Date(valB).getTime() || 0
        return sortAsc ? dateA - dateB : dateB - dateA
      }
      
      // Check if it's numeric or percent
      if (colType === 'number' || colType === 'percent' || (!isNaN(Number(valA)) && !isNaN(Number(valB)) && valA !== '' && valB !== '')) {
        const numA = Number(valA) || 0
        const numB = Number(valB) || 0
        return sortAsc ? numA - numB : numB - numA
      }
      
      // String comparison
      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      return sortAsc 
        ? strA.localeCompare(strB, undefined, { numeric: true })
        : strB.localeCompare(strA, undefined, { numeric: true })
    })
  }, [data, sortKey, sortAsc, metadata, sortable])

  const handleSort = (key: string) => {
    if (!sortable) return
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  // Format cell value for display
  const formatCellValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return ''
    
    const colType = metadata[key]?.type
    if (colType === 'date') {
      return formatDateValue(value)
    }
    
    if (colType === 'percent') {
      const num = Number(value)
      if (!isNaN(num)) {
        return num.toFixed(3) + '%'
      }
    }
    
    return String(value)
  }

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        {title && <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded w-4/6"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-semibold">Error loading data</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        {title && (
          <div className="mb-4">
            <h4 className="font-semibold text-slate-800">{title}</h4>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
        )}
        <p>{emptyMessage}</p>
      </div>
    )
  }

  // Determine display mode
  const displayMode = mode === 'auto' 
    ? (data.length === 1 ? 'form' : 'table')
    : mode

  // Get the data to work with (for form mode, merge original with edits)
  const mergedData = displayMode === 'form' 
    ? { ...data[0], ...editedData, ...(formData || {}) }
    : data[0]

  const handleFieldChange = (field: string, value: any) => {
    if (onChange) {
      onChange(field, value)
    } else {
      setEditedData((prev: Record<string, any>) => ({ ...prev, [field]: value }))
    }
  }

  const inputClassName = `
    w-full px-3 py-2 border border-slate-300 rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
    disabled:bg-slate-100 disabled:cursor-not-allowed
  `

  // FORM MODE (Single Row)
  if (displayMode === 'form') {
    const visibleColumns = getVisibleColumns(mergedData)

    return (
      <div className="space-y-4">
        {title && (
          <div className="mb-4">
            <h4 className="font-semibold text-slate-800">{title}</h4>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {visibleColumns.map((key) => {
            const meta = metadata[key]
            const value = mergedData[key]
            const readonly = isReadOnly(key)
            const isTextarea = meta?.type === 'textarea'
            const isSelect = meta?.type === 'select'
            const isFolderLink = meta?.type === 'folderLink'

            return (
              <div key={key} className={isTextarea || isFolderLink ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {getColumnLabel(key)}
                  {meta?.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {isFolderLink ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {readonly ? (
                        /* Read-only: show as clickable link */
                        <a
                          href={value ? linuxPathToWindowsUrl(value) : '#'}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors text-sm truncate flex items-center gap-2"
                          title={value ? `Click to open: ${linuxPathToWindowsDisplay(value)}` : 'No path set'}
                        >
                          <FolderOpen size={16} className="flex-shrink-0" />
                          <span className="truncate">{value ? linuxPathToWindowsDisplay(value) : '(empty)'}</span>
                        </a>
                      ) : (
                        /* Editable: show input field */
                        <input
                          type="text"
                          value={value || ''}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          className={`${inputClassName} flex-1`}
                          placeholder="/mnt/jdrive/..."
                        />
                      )}
                      {value && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(linuxPathToWindowsDisplay(value), key)}
                          className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-sm flex items-center gap-1 whitespace-nowrap"
                          title="Copy Windows path to clipboard"
                        >
                          {copiedField === key ? (
                            <>
                              <Check size={16} className="text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              Copy
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ) : isTextarea ? (
                  <textarea
                    value={value || ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    disabled={readonly}
                    className={`${inputClassName} min-h-[100px]`}
                    rows={4}
                  />
                ) : isSelect && meta?.options ? (
                  <select
                    value={value || ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    disabled={readonly}
                    className={inputClassName}
                  >
                    <option value="">Select...</option>
                    {meta.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : meta?.type === 'number' ? (
                  <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    disabled={readonly}
                    className={inputClassName}
                  />
                ) : meta?.type === 'date' ? (
                  <input
                    type="date"
                    value={value ? new Date(value).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    disabled={readonly}
                    className={inputClassName}
                  />
                ) : (
                  <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    disabled={readonly}
                    className={inputClassName}
                  />
                )}
              </div>
            )
          })}
        </div>

        {editable && onSave && Object.keys(editedData).length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => {
                onSave({ ...data[0], ...editedData })
                setEditedData({})
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    )
  }

  // TABLE MODE (Multiple Rows)
  if (sortedData.length > 0) {
    const visibleColumns = getVisibleColumns(sortedData[0])

    return (
      <div>
        {title && (
          <div className="mb-4">
            <h4 className="font-semibold text-slate-800">
              {title} ({sortedData.length})
            </h4>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
        )}

        <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-96 relative">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-20">
              <tr>
                {visibleColumns.map((key, colIndex) => {
                  const isFrozen = colIndex < frozenColumns
                  // Calculate left position for frozen columns
                  let leftPos = 0
                  if (isFrozen) {
                    for (let i = 0; i < colIndex; i++) {
                      const prevKey = visibleColumns[i]
                      const prevWidth = metadata[prevKey]?.width
                      leftPos += prevWidth ? parseInt(prevWidth) : 120
                    }
                  }
                  
                  return (
                    <th
                      key={key}
                      className={`px-4 py-2 text-left font-medium text-slate-700 whitespace-nowrap ${
                        sortable ? 'cursor-pointer hover:bg-slate-200 transition-colors select-none' : ''
                      } ${isFrozen ? 'sticky bg-slate-100 z-10' : ''}`}
                      style={{ 
                        width: metadata[key]?.width,
                        minWidth: metadata[key]?.width,
                        left: isFrozen ? `${leftPos}px` : undefined,
                        boxShadow: isFrozen && colIndex === frozenColumns - 1 ? '2px 0 4px -2px rgba(0,0,0,0.15)' : undefined
                      }}
                      onClick={() => handleSort(key)}
                    >
                      <div className="flex items-center gap-1">
                        {getColumnLabel(key)}
                        {sortable && sortKey === key && (
                          sortAsc 
                            ? <ChevronUp size={14} className="text-blue-600" />
                            : <ChevronDown size={14} className="text-blue-600" />
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => (
                <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                  {visibleColumns.map((key, colIndex) => {
                    const value = row[key]
                    const formattedValue = formatCellValue(value, key)
                    const isFrozen = colIndex < frozenColumns
                    // Calculate left position for frozen columns
                    let leftPos = 0
                    if (isFrozen) {
                      for (let i = 0; i < colIndex; i++) {
                        const prevKey = visibleColumns[i]
                        const prevWidth = metadata[prevKey]?.width
                        leftPos += prevWidth ? parseInt(prevWidth) : 120
                      }
                    }
                    
                    const shouldWrap = metadata[key]?.wrap
                    
                    return (
                      <td 
                        key={key} 
                        className={`px-4 py-2 text-slate-600 ${
                          shouldWrap ? 'whitespace-normal' : 'whitespace-nowrap'
                        } ${
                          isFrozen ? 'sticky bg-white z-10' : ''
                        }`}
                        style={{
                          left: isFrozen ? `${leftPos}px` : undefined,
                          boxShadow: isFrozen && colIndex === frozenColumns - 1 ? '2px 0 4px -2px rgba(0,0,0,0.15)' : undefined,
                          maxWidth: shouldWrap ? metadata[key]?.width : undefined
                        }}
                      >
                        {value === null ? (
                          <span className="text-slate-400 italic">null</span>
                        ) : (
                          formattedValue
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return null
}
