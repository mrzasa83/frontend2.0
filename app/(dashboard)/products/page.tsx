'use client'

import { useState, useEffect } from 'react'
import Tabs from '@/components/ui/Tabs'
import ProductTable, { TableState, DEFAULT_TYPE_FILTER, DEFAULT_SORT_KEY, DEFAULT_SORT_ASC } from '@/components/products/ProductTable'
import ProductEdit from '@/components/products/ProductEdit'
import { Plus, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
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
  partSource?: string       // 'engineering' | 'customer' | 'inventory'
  prodPartRkey?: number     // For customer parts — Paradigm RKEY
  status?: string           // For customer/inventory parts
  program?: string          // For customer parts
  custCode?: string         // For customer parts
}

type PartTypeFilter = 'all' | 'engineering' | 'customer' | 'inventory'

export default function ProductsPage() {
  const { data: session } = useSession()
  const [engProducts, setEngProducts] = useState<Product[]>([])
  const [custProducts, setCustProducts] = useState<Product[]>([])
  const [invProducts, setInvProducts] = useState<Product[]>([])
  const [custLoaded, setCustLoaded] = useState(false)
  const [invLoaded, setInvLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingCust, setLoadingCust] = useState(false)
  const [loadingInv, setLoadingInv] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openProducts, setOpenProducts] = useState<{ product: Product; editing: boolean }[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [partType, setPartType] = useState<PartTypeFilter>('engineering')
  
  // Read saved default type from settings
  const [tableState, setTableState] = useState<TableState>({
    search: '',
    sortKey: DEFAULT_SORT_KEY,
    sortAsc: DEFAULT_SORT_ASC,
    pageSize: 25,
    page: 0,
    typeFilter: DEFAULT_TYPE_FILTER
  })

  useEffect(() => {
    const savedType = localStorage.getItem('defaultProductType')
    if (savedType) {
      setTableState(prev => ({ ...prev, typeFilter: savedType, page: 0 }))
    }
  }, [])

  // Check roles
  const canEdit = session?.user?.roles?.some(
    (r: string) => ['Admin', 'ProductEng', 'ProcessEng'].includes(r)
  ) || false

  useEffect(() => { fetchEngProducts() }, [])

  // Lazy load customer/inventory when filter changes
  useEffect(() => {
    if ((partType === 'customer' || partType === 'all') && !custLoaded && !loadingCust) {
      fetchCustProducts()
    }
    if ((partType === 'inventory' || partType === 'all') && !invLoaded && !loadingInv) {
      fetchInvProducts()
    }
  }, [partType])

  const fetchEngProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(getApiUrl('/api/products'))
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const data = await res.json()
      setEngProducts(data.map((p: Product) => ({ ...p, partSource: 'engineering' })))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustProducts = async () => {
    setLoadingCust(true)
    try {
      const res = await fetch(getApiUrl('/api/products/paradigm?type=customer'))
      if (!res.ok) throw new Error(`Failed to fetch customer parts: ${res.status}`)
      const result = await res.json()
      setCustProducts(result.data || [])
      setCustLoaded(true)
    } catch (error) {
      console.error('Error fetching customer parts:', error)
    } finally {
      setLoadingCust(false)
    }
  }

  const fetchInvProducts = async () => {
    setLoadingInv(true)
    try {
      const res = await fetch(getApiUrl('/api/products/paradigm?type=inventory'))
      if (!res.ok) throw new Error(`Failed to fetch inventory parts: ${res.status}`)
      const result = await res.json()
      setInvProducts(result.data || [])
      setInvLoaded(true)
    } catch (error) {
      console.error('Error fetching inventory parts:', error)
    } finally {
      setLoadingInv(false)
    }
  }

  // Blended product list based on part type filter
  const products = (() => {
    switch (partType) {
      case 'engineering': return engProducts
      case 'customer': return custProducts
      case 'inventory': return invProducts
      case 'all': return [...engProducts, ...custProducts, ...invProducts]
    }
  })()

  const isLoading = loading || (partType === 'customer' && loadingCust) || 
                    (partType === 'inventory' && loadingInv) || 
                    (partType === 'all' && (loadingCust || loadingInv))

  // Row click — open in read-only view tab
  const handleRowClick = (product: Product) => {
    const existing = openProducts.find(p => p.product.id === product.id)
    if (!existing) {
      setOpenProducts(prev => [...prev, { product, editing: false }])
    }
    setActiveTab(`product-${product.id}`)
  }

  // Pencil click — open in edit mode
  const handleEdit = (product: Product) => {
    const existing = openProducts.find(p => p.product.id === product.id)
    if (existing) {
      // Switch to edit mode
      setOpenProducts(prev => prev.map(p => 
        p.product.id === product.id ? { ...p, editing: true } : p
      ))
    } else {
      setOpenProducts(prev => [...prev, { product, editing: true }])
    }
    setActiveTab(`product-${product.id}`)
  }

  // Switch from view to edit mode within a tab
  const handleSwitchToEdit = (productId: number) => {
    setOpenProducts(prev => prev.map(p => 
      p.product.id === productId ? { ...p, editing: true } : p
    ))
  }

  const handleCloseTab = (productId: number) => {
    setOpenProducts(prev => prev.filter(p => p.product.id !== productId))
    setActiveTab('all')
  }

  const handleSave = async (product: Product) => {
    try {
      const res = await fetch(getApiUrl(`/api/products/${product.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      if (!res.ok) {
        const responseData = await res.json()
        throw new Error(responseData.error || 'Failed to save product')
      }
      await fetchEngProducts()
      // Switch back to view mode after save
      setOpenProducts(prev => prev.map(p => 
        p.product.id === product.id ? { ...p, editing: false } : p
      ))
    } catch (error) {
      console.error('Error saving product:', error)
      alert(`Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleInlineSave = async (product: Product) => {
    try {
      const res = await fetch(getApiUrl(`/api/products/${product.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      if (!res.ok) {
        const responseData = await res.json()
        throw new Error(responseData.error || 'Failed to save product')
      }
      await fetchEngProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      alert(`Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  if (loading && engProducts.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error loading products</p>
          <p className="text-sm">{error}</p>
          <button onClick={fetchEngProducts} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Retry</button>
        </div>
      </div>
    )
  }

  const productListTab = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          {partType === 'all' ? 'All' : partType === 'engineering' ? 'Engineering' : partType === 'customer' ? 'Customer' : 'Inventory'} Parts ({products.length})
        </h3>
        {canEdit && partType === 'engineering' && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus size={18} />
            Add Product
          </button>
        )}
      </div>
      <ProductTable 
        products={products} 
        onRowClick={handleRowClick} 
        onEdit={handleEdit}
        onSave={handleInlineSave}
        tableState={tableState}
        onTableStateChange={setTableState}
        canEdit={canEdit && partType === 'engineering'}
      />
    </div>
  )

  const tabs = [
    { 
      id: 'all', 
      label: 'All Products', 
      content: productListTab,
      closeable: false
    },
    ...openProducts.map(({ product, editing }) => ({
      id: `product-${product.id}`,
      label: product.apcPN,
      content: (
        <ProductEdit
          key={`product-${product.id}-${editing ? 'edit' : 'view'}`}
          product={product}
          onSave={handleSave}
          onCancel={() => handleCloseTab(product.id)}
          readOnly={!editing}
          canEdit={canEdit}
          onEditMode={() => handleSwitchToEdit(product.id)}
        />
      ),
      closeable: true,
      onClose: () => handleCloseTab(product.id)
    }))
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Products</h2>
          <p className="text-slate-600">Manage product catalog and specifications</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Part Type:</label>
          <select
            value={partType}
            onChange={e => setPartType(e.target.value as PartTypeFilter)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none min-w-[180px]"
          >
            <option value="all">All</option>
            <option value="engineering">Engineering Part</option>
            <option value="customer">Customer Part</option>
            <option value="inventory">Inventory Part</option>
          </select>
          {isLoading && (
            <RefreshCw size={16} className="animate-spin text-blue-600" />
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} preserveState={true} />
        </div>
      </div>
    </div>
  )
}
