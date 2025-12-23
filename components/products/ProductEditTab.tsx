'use client'

import { useState } from 'react'
import { Save, X, Copy, Check } from 'lucide-react'

/**
 * Convert Linux path to Windows path for display
 */
function toWindowsPath(linuxPath: string): string {
  if (!linuxPath) return ''
  return linuxPath
    .replace(/^\/mnt\/jdrive\/?/i, 'J:\\')
    .replace(/\//g, '\\')
}

type Product = {
  id: number
  apcPN: string
  customer: string | null
  customerPN: string | null
  currentRev: string | null
  buildRev: string | null
  description: string | null
  fullPath: string | null
  item_type_name: string | null
  item_type_id: number
  createdAt: string
}

type Props = {
  product: Product
  onSave: (product: Product) => void
  onCancel: () => void
}

export default function ProductEditTab({ product, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState(product)
  const [hasChanges, setHasChanges] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(formData)
    setHasChanges(false)
  }

  const copyToClipboard = async (text: string) => {
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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Show the text in a prompt as last resort
      window.prompt('Copy this path:', text)
    }
  }

  const inputClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
  const readOnlyClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Editing: {formData.apcPN}
          </h3>
          {hasChanges && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠ You have unsaved changes
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              APC Part Number
            </label>
            <input
              type="text"
              value={formData.apcPN}
              readOnly
              className={readOnlyClassName}
              title="Part number cannot be changed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>
            <input
              type="text"
              value={formData.item_type_name || 'Unknown'}
              readOnly
              className={readOnlyClassName}
              title="Item type cannot be changed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer
            </label>
            <input
              type="text"
              value={formData.customer || ''}
              onChange={(e) => handleChange('customer', e.target.value)}
              className={inputClassName}
              placeholder="Enter customer part number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer Part Number
            </label>
            <input
              type="text"
              value={formData.customerPN || ''}
              onChange={(e) => handleChange('customerPN', e.target.value)}
              className={inputClassName}
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Part Revision
            </label>
            <input
              type="text"
              value={formData.currentRev || ''}
              onChange={(e) => handleChange('currentRev', e.target.value)}
              className={inputClassName}
              placeholder="e.g., A, B-1, Rev C"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Build Revision
            </label>
            <input
              type="text"
              value={formData.buildRev || ''}
              onChange={(e) => handleChange('buildRev', e.target.value)}
              className={inputClassName}
              placeholder="latest MCN ID"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={inputClassName}
              placeholder="Enter product description (free-form)"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.fullPath || ''}
                onChange={(e) => handleChange('fullPath', e.target.value)}
                className={`${inputClassName} flex-1`}
                placeholder="/mnt/jdrive/APC EngJobs/..."
              />
              {formData.fullPath && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(toWindowsPath(formData.fullPath!))}
                  className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-sm flex items-center gap-1 whitespace-nowrap"
                  title="Copy Windows path to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Path
                    </>
                  )}
                </button>
              )}
            </div>
            {formData.fullPath && (
              <p className="text-xs text-slate-500 mt-1">
                Windows path: {toWindowsPath(formData.fullPath)}
              </p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Additional product information from other data sources (MS SQL, secondary MySQL, documents) will be displayed in separate tabs as we integrate them.
          </p>
        </div>
      </div>
    </div>
  )
}