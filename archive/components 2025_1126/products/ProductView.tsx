'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Tabs from '@/components/ui/Tabs'
import DataView, { ColumnMetadata } from '@/components/ui/DataView'

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

type ProductionData = {
  [key: string]: any
}

type ERPData = {
  [key: string]: any
}

type EngineeringData = {
  [key: string]: any
}

type Props = {
  product: Product
  onClose: () => void
}

export default function ProductView({ product, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('base')
  
  // Production data state
  const [productionData, setProductionData] = useState<ProductionData[]>([])
  const [loadingProduction, setLoadingProduction] = useState(false)
  const [productionError, setProductionError] = useState<string | null>(null)

  // ERP data state
  const [erpData, setErpData] = useState<ERPData[]>([])
  const [loadingErp, setLoadingErp] = useState(false)
  const [erpError, setErpError] = useState<string | null>(null)

  // Engineering data state
  const [engineeringData, setEngineeringData] = useState<EngineeringData[]>([])
  const [loadingEngineering, setLoadingEngineering] = useState(false)
  const [engineeringError, setEngineeringError] = useState<string | null>(null)

  useEffect(() => {
    fetchProductionData()
    fetchERPData()
    fetchEngineeringData()
  }, [product.apcPN])

  const fetchProductionData = async () => {
    setLoadingProduction(true)
    setProductionError(null)

    try {
      const res = await fetch('/api/products/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: product.apcPN })
      })

      if (!res.ok) throw new Error('Failed to fetch production data')

      const data = await res.json()
      setProductionData(data.results || [])
    } catch (error) {
      console.error('Error fetching production data:', error)
      setProductionError(error instanceof Error ? error.message : 'Failed to load production data')
    } finally {
      setLoadingProduction(false)
    }
  }

  const fetchERPData = async () => {
    setLoadingErp(true)
    setErpError(null)

    try {
      const res = await fetch('/api/products/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: product.apcPN })
      })

      if (!res.ok) throw new Error('Failed to fetch ERP data')

      const data = await res.json()
      setErpData(data.results || [])
    } catch (error) {
      console.error('Error fetching ERP data:', error)
      setErpError(error instanceof Error ? error.message : 'Failed to load ERP data')
    } finally {
      setLoadingErp(false)
    }
  }

  const fetchEngineeringData = async () => {
    setLoadingEngineering(true)
    setEngineeringError(null)

    try {
      const res = await fetch('/api/products/engineering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: product.apcPN })
      })

      if (!res.ok) throw new Error('Failed to fetch engineering data')

      const data = await res.json()
      setEngineeringData(data.results || [])
    } catch (error) {
      console.error('Error fetching engineering data:', error)
      setEngineeringError(error instanceof Error ? error.message : 'Failed to load engineering data')
    } finally {
      setLoadingEngineering(false)
    }
  }

  // Metadata definitions for each data source
  const baseMetadata: ColumnMetadata = {
    id: { hidden: true },
    item_type_id: { hidden: true },
    apcPN: { label: 'APC Part Number', readonly: true },
    item_type_name: { label: 'Type', readonly: true },
    customer: { label: 'Customer' },
    customerPN: { label: 'Customer Part Number' },
    currentRev: { label: 'Part Revision' },
    buildRev: { label: 'Build Revision' },
    description: { label: 'Description', type: 'textarea' },
    fullPath: { label: 'Full Path' },
    createdAt: { label: 'Created At', readonly: true }
  }

  const productionMetadata: ColumnMetadata = {
    // Example: Hide internal IDs, show important fields
    internal_id: { system: true },
    record_id: { hidden: true },
    part_number: { label: 'Part Number', width: '150px' },
    quantity: { label: 'Qty', type: 'number', width: '80px' },
    work_order: { label: 'Work Order', width: '120px' },
    status: { label: 'Status', width: '100px' },
    created_date: { label: 'Created', width: '120px' },
    // Add more fields based on your actual production table structure
  }

  const erpMetadata: ColumnMetadata = {
    // Example ERP metadata
    item_id: { hidden: true },
    part_number: { label: 'Part Number', width: '150px' },
    description: { label: 'Description', width: '200px' },
    unit_price: { label: 'Unit Price', type: 'number', width: '100px' },
    stock_qty: { label: 'In Stock', type: 'number', width: '80px' },
    location: { label: 'Location', width: '120px' },
    // Add more fields based on your ERP structure
  }

  const engineeringMetadata: ColumnMetadata = {
    // Example engineering metadata
    drawing_id: { hidden: true },
    revision: { label: 'Revision', width: '80px' },
    drawing_number: { label: 'Drawing Number', width: '150px' },
    title: { label: 'Title', width: '200px' },
    engineer: { label: 'Engineer', width: '120px' },
    release_date: { label: 'Released', width: '120px' },
    // Add more fields based on your engineering database structure
  }

  // Base Information Tab (using DataView in form mode)
  const baseInfoTab = (
    <DataView
      data={[product]}
      metadata={baseMetadata}
      mode="form"
      editable={false}
    />
  )

  // Production Information Tab (auto-switches between form/table)
  const productionTab = (
    <DataView
      data={productionData}
      metadata={productionMetadata}
      loading={loadingProduction}
      error={productionError}
      emptyMessage={`No production data found for part ${product.apcPN}`}
      title="Production Records"
      subtitle="Data from data0050 table (read-only)"
      editable={false}
    />
  )

  // ERP Tab (auto-switches between form/table)
  const erpTab = (
    <DataView
      data={erpData}
      metadata={erpMetadata}
      loading={loadingErp}
      error={erpError}
      emptyMessage={`No ERP data found for part ${product.apcPN}`}
      title="ERP Information"
      subtitle="Data from ERP system (read-only)"
      editable={false}
    />
  )

  // Engineering Tab (auto-switches between form/table)
  const engineeringTab = (
    <DataView
      data={engineeringData}
      metadata={engineeringMetadata}
      loading={loadingEngineering}
      error={engineeringError}
      emptyMessage={`No engineering data found for part ${product.apcPN}`}
      title="Engineering Reference"
      subtitle="Data from engineering database (read-only)"
      editable={false}
    />
  )

  const tabs = [
    { id: 'base', label: 'Base Information', content: baseInfoTab, closeable: false },
    { id: 'production', label: 'Production', content: productionTab, closeable: false },
    { id: 'erp', label: 'ERP Data', content: erpTab, closeable: false },
    { id: 'engineering', label: 'Engineering', content: engineeringTab, closeable: false }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">View Product: {product.apcPN}</h2>
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