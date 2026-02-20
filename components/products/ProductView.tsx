'use client'


import { useState, useEffect } from 'react'
import { X, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react'
import Tabs from '@/components/ui/Tabs'
import DataView, { ColumnMetadata } from '@/components/ui/DataView'
import ReleasedFilesTab from '@/components/products/ReleasedFilesTab'
import { getApiUrl } from '@/lib/api'

type Product = {
  id: number
  apcPN: string
  customer: string | null
  customerPN: string | null
  buildRev: string | null
  currentRev: string | null
  description: string | null
  fullPath: string | null
  item_type_name: string | null
  item_type_code?: string | null
  item_type_id: number
  createdAt: string
}

type Props = {
  product: Product
  onClose: () => void
}

export default function ProductView({ product, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('base')
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

  // Base Information metadata
  const baseMetadata: ColumnMetadata = {
    apcPN: { label: 'APC Part Number', type: 'text' },
    customer: { label: 'Customer', type: 'text' },
    customerPN: { label: 'Customer PN', type: 'text' },
    currentRev: { label: 'Current Rev', type: 'text' },
    buildRev: { label: 'Build Rev', type: 'text' },
    description: { label: 'Description', type: 'text' },
    fullPath: { label: 'Full Path', type: 'folderLink' },
    item_type_name: { label: 'Item Type', type: 'text' },
    createdAt: { label: 'Created', type: 'date' },
  }

  // Base Information Tab
  const baseInfoTab = (
    <DataView
      data={[product]}
      metadata={baseMetadata}
      loading={false}
      error={null}
      emptyMessage=""
      title="Base Information"
      subtitle="Core product details (read-only)"
      editable={false}
    />
  )

  // Released Tab (now contains production data + files)
  const releasedTab = (
    <ReleasedFilesTab 
      partNumber={product.apcPN} 
      onStatusChange={handleStatusChange}
      onBuildLocationChange={handleBuildLocationChange}
    />
  )

  // Tabs: General, Released
  const tabs = [
    { id: 'base', label: 'General', content: baseInfoTab, closeable: false },
    { id: 'released', label: 'Released', content: releasedTab, closeable: false }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">View Product: {product.apcPN}</h2>
              {getStatusBadge()}
              {getBuildLocationBadge()}
            </div>
            <p className="text-sm text-slate-600 mt-1">Product information (read-only)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content with Tabs */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
