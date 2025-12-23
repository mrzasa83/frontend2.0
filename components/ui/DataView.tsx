'use client'

import { useState } from 'react'
import { Copy, Check, FolderOpen } from 'lucide-react'

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
    type?: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'folderLink'
    options?: string[]    // For select type
    width?: string        // Custom column width for tables
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
  formData
}: DataViewProps) {
  const [localFormData, setLocalFormData] = useState<any>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Copy to clipboard helper with fallback for non-HTTPS
  const copyToClipboard = async (text: string, fieldKey: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for non-secure contexts (HTTP)
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
      console.error('Failed to copy:', err)
      // Show the text in a prompt as last resort
      window.prompt('Copy this path:', text)
    }
  }

  // Determine display mode
  const displayMode = mode === 'auto' 
    ? (data.length === 1 ? 'form' : 'table')
    : mode

  // Get visible columns based on metadata
  const getVisibleColumns = (row: any) => {
    return Object.keys(row).filter(key => {
      const meta = metadata[key]
      return !meta?.hidden && !meta?.system
    })
  }

  // Get column label
  const getColumnLabel = (key: string) => {
    return metadata[key]?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Check if field is readonly
  const isReadOnly = (key: string) => {
    return !editable || metadata[key]?.readonly
  }

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    if (onChange) {
      onChange(field, value)
    } else {
      setLocalFormData((prev: any) => ({ ...prev, [field]: value }))
    }
  }

  // Get current form data (controlled or local)
  const currentFormData = formData || localFormData

  // Input styles
  const inputClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
  const readOnlyClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-8 text-slate-600">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2">Loading data...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="font-semibold">Error loading data</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  // FORM MODE (Single Row)
  if (displayMode === 'form') {
    const row = data[0]
    const mergedData = { ...row, ...currentFormData }
    const visibleColumns = getVisibleColumns(row)

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
                    {value && (
                      <p className="text-xs text-slate-500">
                        Windows path: {linuxPathToWindowsDisplay(value)}
                      </p>
                    )}
                  </div>
                ) : isTextarea ? (
                  <textarea
                    value={value || ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    readOnly={readonly}
                    rows={3}
                    className={readonly ? readOnlyClassName : inputClassName}
                  />
                ) : isSelect && meta?.options ? (
                  <select
                    value={value || ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    disabled={readonly}
                    className={readonly ? readOnlyClassName : inputClassName}
                  >
                    <option value="">Select...</option>
                    {meta.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={meta?.type || 'text'}
                    value={value === null ? '' : value}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    readOnly={readonly}
                    className={readonly ? readOnlyClassName : inputClassName}
                  />
                )}
              </div>
            )
          })}
        </div>

        {editable && onSave && (
          <div className="flex justify-end pt-4">
            <button
              onClick={() => onSave(mergedData)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    )
  }

  // TABLE MODE (Multiple Rows)
  if (data.length > 0) {
    const visibleColumns = getVisibleColumns(data[0])

    return (
      <div>
        {title && (
          <div className="mb-4">
            <h4 className="font-semibold text-slate-800">
              {title} ({data.length})
            </h4>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
        )}

        <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                {visibleColumns.map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-left font-medium text-slate-700 whitespace-nowrap"
                    style={{ width: metadata[key]?.width }}
                  >
                    {getColumnLabel(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                  {visibleColumns.map((key) => (
                    <td key={key} className="px-4 py-2 whitespace-nowrap text-slate-600">
                      {row[key] === null ? (
                        <span className="text-slate-400 italic">null</span>
                      ) : (
                        String(row[key])
                      )}
                    </td>
                  ))}
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