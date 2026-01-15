'use client'

import { getApiUrl } from '@/lib/api'

import { useState, useEffect } from 'react'
import { Save, X, Factory, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react'
import Tabs from '@/components/ui/Tabs'
import DataView, { ColumnMetadata } from '@/components/ui/DataView'
import ReleasedFilesTab from '@/components/products/ReleasedFilesTab'

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

export default function ProductEdit({ product, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState(product)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [productStatus, setProductStatus] = useState<string>('Loading...')
  const [buildLocation, setBuildLocation] = useState<string | null>(null)

  // Fetch status and build location on mount
  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        // Fetch production data for status
        const prodRes = await fetch(getApiUrl('/api/products/production'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apcPN: product.apcPN })
        })
        if (prodRes.ok) {
          const prodData = await prodRes.json()
          if (prodData.status) {
            setProductStatus(prodData.status)
          }
        }

        // Fetch route data for build location
        const routeRes = await fetch(getApiUrl('/api/products/route'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apcPN: product.apcPN })
        })
        if (routeRes.ok) {
          const routeData = await routeRes.json()
          if (routeData.buildLocation) {
            setBuildLocation(routeData.buildLocation)
          }
        }
      } catch (error) {
        console.error('Error fetching header data:', error)
      }
    }

    fetchHeaderData()
  }, [product.apcPN])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(formData)
    setHasChanges(false)
  }

  const handleStatusChange = (status: string) => {
    setProductStatus(status)
  }

  const handleBuildLocationChange = (location: string) => {
    setBuildLocation(location)
  }

  // Get status badge
  const getStatusBadge = () => {
    if (productStatus === 'Loading...') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
          <Clock size={14} />
          {productStatus}
        </span>
      )
    }
    if (productStatus === 'Released') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
          <CheckCircle size={14} />
          {productStatus}
        </span>
      )
    }
    if (productStatus === 'Obsolete') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
          <XCircle size={14} />
          {productStatus}
        </span>
      )
    }
    // Other statuses (in-progress, etc.)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
        <Clock size={14} />
        {productStatus}
      </span>
    )
  }

  // Get build location badge
  const getBuildLocationBadge = () => {
    if (!buildLocation) return null
    
    const colorMap: Record<string, string> = {
      'Nashua': 'bg-blue-100 text-blue-700',
      'Nogales': 'bg-purple-100 text-purple-700',
      'Mesa': 'bg-orange-100 text-orange-700'
    }
    
    const colorClass = colorMap[buildLocation] || 'bg-slate-100 text-slate-700'
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 ${colorClass} rounded-full text-sm`}>
        <MapPin size={14} />
        Build: {buildLocation}
      </span>
    )
  }

  // General tab metadata
  const generalMetadata: ColumnMetadata = {
    apcPN: { label: 'APC Part Number', type: 'text' },
    customer: { label: 'Customer', type: 'text' },
    customerPN: { label: 'Customer PN', type: 'text' },
    currentRev: { label: 'Current Rev', type: 'text' },
    buildRev: { label: 'Build Rev', type: 'text' },
    description: { label: 'Description', type: 'text' },
    fullPath: { label: 'Full Path', type: 'folderLink' },
    item_type_name: { label: 'Item Type', type: 'text' },
  }

  // TAB 1: GENERAL (Editable)
  const generalTab = (
    <div className="space-y-4">
      <DataView
        data={[formData]}
        metadata={generalMetadata}
        loading={false}
        error={null}
        emptyMessage=""
        title="General Information"
        subtitle="Edit basic product information"
        editable={true}
        onChange={handleChange}
      />
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> General information is editable. Production and file data are read-only.
        </p>
      </div>
    </div>
  )

  // TAB 2: ENGINEERING (Coming Soon)
  const engineeringTab = (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Factory size={64} className="mb-4 opacity-50" />
      <h3 className="text-xl font-semibold mb-2">Engineering Data</h3>
      <p className="text-sm">Coming soon - provide database details</p>
    </div>
  )

  // TAB 3: RELEASED (Production + Files)
  const releasedTab = (
    <ReleasedFilesTab 
      partNumber={formData.apcPN} 
      onStatusChange={handleStatusChange}
      onBuildLocationChange={handleBuildLocationChange}
    />
  )

  // Top-level horizontal tabs - General, Engineering, Released
  const topLevelTabs = [
    { id: 'general', label: 'General', content: generalTab, closeable: false },
    { id: 'engineering', label: 'Engineering', content: engineeringTab, closeable: false },
    { id: 'released', label: 'Released', content: releasedTab, closeable: false }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-800">
              Editing: {formData.apcPN}
            </h3>
            {getStatusBadge()}
            {getBuildLocationBadge()}
          </div>
          {hasChanges && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠️ You have unsaved changes
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

      {/* Main Content with Tabs */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <Tabs tabs={topLevelTabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}
