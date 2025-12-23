'use client'

import { useState, useEffect } from 'react'
import { Save, X, FileText, Package, GitBranch, Route as RouteIcon, ClipboardList, Archive, AlertTriangle, Factory } from 'lucide-react'
import Tabs from '@/components/ui/Tabs'
import DataView from '@/components/ui/DataView'
import BOMTreeNavigator from '@/components/ui/BOMTreeNavigator'
import { 
  productionGeneralMetadata,
  whereUsedMetadata,
  routeMetadata,
  workOrdersMetadata,
  inventoryMetadata,
  discrepancyMetadata
} from '@/lib/metadata/columnMetadata'

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

type ProductionData = {
  [key: string]: any
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
  const [activeProductionTab, setActiveProductionTab] = useState('prod-general')

  // Production data states
  const [productionGeneralData, setProductionGeneralData] = useState<ProductionData[]>([])
  const [loadingProdGeneral, setLoadingProdGeneral] = useState(false)
  const [prodGeneralError, setProdGeneralError] = useState<string | null>(null)

  // Where Used data states
  const [whereUsedData, setWhereUsedData] = useState<ProductionData[]>([])
  const [loadingWhereUsed, setLoadingWhereUsed] = useState(false)
  const [whereUsedError, setWhereUsedError] = useState<string | null>(null)

  // Route data states
  const [routeData, setRouteData] = useState<ProductionData[]>([])
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)

  // Work Orders data states
  const [workOrdersData, setWorkOrdersData] = useState<ProductionData[]>([])
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false)
  const [workOrdersError, setWorkOrdersError] = useState<string | null>(null)

  // Inventory data states
  const [inventoryData, setInventoryData] = useState<ProductionData[]>([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)

  // Discrepancy data states
  const [discrepancyData, setDiscrepancyData] = useState<ProductionData[]>([])
  const [loadingDiscrepancy, setLoadingDiscrepancy] = useState(false)
  const [discrepancyError, setDiscrepancyError] = useState<string | null>(null)

  useEffect(() => {
    // Load production data when Production tab is active
    if (activeTab === 'production') {
      if (activeProductionTab === 'prod-general') {
        fetchProductionGeneralData()
      } else if (activeProductionTab === 'prod-whereused') {
        fetchWhereUsedData()
      }
      // Add other fetch calls as needed when those tabs are clicked
    }
  }, [activeTab, activeProductionTab, product.apcPN])

  const fetchProductionGeneralData = async () => {
    setLoadingProdGeneral(true)
    setProdGeneralError(null)

    try {
      const res = await fetch('/api/products/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: product.apcPN })
      })

      if (!res.ok) throw new Error('Failed to fetch production data')

      const data = await res.json()
      setProductionGeneralData(data.results || [])
    } catch (error) {
      console.error('Error fetching production data:', error)
      setProdGeneralError(error instanceof Error ? error.message : 'Failed to load production data')
    } finally {
      setLoadingProdGeneral(false)
    }
  }

  const fetchWhereUsedData = async () => {
    setLoadingWhereUsed(true)
    setWhereUsedError(null)

    try {
      const res = await fetch('/api/products/where-used', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber: product.apcPN })
      })

      if (!res.ok) throw new Error('Failed to fetch where-used data')

      const data = await res.json()
      setWhereUsedData(data.results || [])
    } catch (error) {
      console.error('Error fetching where-used data:', error)
      setWhereUsedError(error instanceof Error ? error.message : 'Failed to load where-used data')
    } finally {
      setLoadingWhereUsed(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(formData)
    setHasChanges(false)
  }

  // Metadata for base (editable) fields
  const baseMetadata = {
    id: { hidden: true },
    item_type_id: { hidden: true },
    apcPN: { label: 'APC Part Number', readonly: true },
    item_type_name: { label: 'Type', readonly: true },
    customer: { label: 'Customer', required: false },
    customerPN: { label: 'Customer Part Number' },
    currentRev: { label: 'Part Revision' },
    buildRev: { label: 'Build Revision' },
    description: { label: 'Description', type: 'textarea' as const },
    fullPath: { label: 'Full Path' },
    createdAt: { hidden: true }
  }

  // ========================================
  // TAB 1: GENERAL (Editable)
  // ========================================
  const generalTab = (
    <div className="space-y-4">
      <DataView
        data={[product]}
        metadata={baseMetadata}
        mode="form"
        editable={true}
        onChange={handleChange}
        formData={formData}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> General information is editable. Production and Engineering data are read-only.
        </p>
      </div>
    </div>
  )

  // ========================================
  // TAB 2: PRODUCTION (with vertical sub-tabs)
  // ========================================
  const productionTab = (
    <div className="flex h-full gap-6">
      {/* Left Sidebar - Vertical Production Sub-tabs */}
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {[
            { id: 'prod-general', label: 'General', icon: ClipboardList },
            { id: 'prod-bom', label: 'BOM', icon: Package },
            { id: 'prod-whereused', label: 'Where Used', icon: GitBranch },
            { id: 'prod-route', label: 'Route', icon: RouteIcon },
            { id: 'prod-workorders', label: 'Work Orders', icon: ClipboardList },
            { id: 'prod-inventory', label: 'Inventory', icon: Archive },
            { id: 'prod-discrepancy', label: 'Discrepancy', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeProductionTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveProductionTab(tab.id)}
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

      {/* Right Content Area - Production Data */}
      <div className="flex-1 min-w-0">
        {activeProductionTab === 'prod-general' && (
          <DataView
            data={productionGeneralData}
            metadata={productionGeneralMetadata}
            loading={loadingProdGeneral}
            error={prodGeneralError}
            emptyMessage={`No production data found for part ${formData.apcPN}`}
            title="Production General"
            subtitle="Data from data0050 table (read-only)"
            editable={false}
          />
        )}

        {activeProductionTab === 'prod-bom' && (
          <BOMTreeNavigator
            rootPartNumber={formData.apcPN}
            onPartClick={(partNumber) => {
              console.log('Clicked part:', partNumber)
              // TODO: Navigate to that part or show details
            }}
          />
        )}

        {activeProductionTab === 'prod-whereused' && (
          <DataView
            data={whereUsedData}
            metadata={whereUsedMetadata}
            loading={loadingWhereUsed}
            error={whereUsedError}
            emptyMessage={`No where-used data found for part ${formData.apcPN}`}
            title="Where Used"
            subtitle="Parent assemblies (read-only)"
            editable={false}
          />
        )}

        {activeProductionTab === 'prod-route' && (
          <DataView
            data={routeData}
            metadata={routeMetadata}
            loading={loadingRoute}
            error={routeError}
            emptyMessage={`No route data found for part ${formData.apcPN}`}
            title="Route"
            subtitle="Manufacturing route (read-only)"
            editable={false}
          />
        )}

        {activeProductionTab === 'prod-workorders' && (
          <DataView
            data={workOrdersData}
            metadata={workOrdersMetadata}
            loading={loadingWorkOrders}
            error={workOrdersError}
            emptyMessage={`No work orders found for part ${formData.apcPN}`}
            title="Work Orders"
            subtitle="Work order history (read-only)"
            editable={false}
          />
        )}

        {activeProductionTab === 'prod-inventory' && (
          <DataView
            data={inventoryData}
            metadata={inventoryMetadata}
            loading={loadingInventory}
            error={inventoryError}
            emptyMessage={`No inventory data found for part ${formData.apcPN}`}
            title="Inventory"
            subtitle="Inventory levels (read-only)"
            editable={false}
          />
        )}

        {activeProductionTab === 'prod-discrepancy' && (
          <DataView
            data={discrepancyData}
            metadata={discrepancyMetadata}
            loading={loadingDiscrepancy}
            error={discrepancyError}
            emptyMessage={`No discrepancies found for part ${formData.apcPN}`}
            title="Discrepancy"
            subtitle="Discrepancy reports (read-only)"
            editable={false}
          />
        )}
      </div>
    </div>
  )

  // ========================================
  // TAB 3: ENGINEERING (Coming Soon)
  // ========================================
  const engineeringTab = (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Factory size={64} className="mb-4 opacity-50" />
      <h3 className="text-xl font-semibold mb-2">Engineering Data</h3>
      <p className="text-sm">Coming soon - provide database details</p>
    </div>
  )

  // Top-level horizontal tabs
  const topLevelTabs = [
    { id: 'general', label: 'General', content: generalTab, closeable: false },
    { id: 'production', label: 'Production', content: productionTab, closeable: false },
    { id: 'engineering', label: 'Engineering', content: engineeringTab, closeable: false }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Editing: {formData.apcPN}
          </h3>
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