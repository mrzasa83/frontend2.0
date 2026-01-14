'use client'

import { useState, useEffect } from 'react'
import { Eye, Pencil, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react'

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

type TableState = {
  search: string
  sortKey: keyof Product
  sortAsc: boolean
  pageSize: number
  page: number
  typeFilter: string
}

type ProductInfo = {
  status: string
  buildLocation: string
}

type Props = {
  products: Product[]
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onSave?: (product: Product) => Promise<void>
  tableState: TableState
  onTableStateChange: (state: TableState) => void
  isAdmin?: boolean
}

// Default filter settings
const DEFAULT_TYPE_FILTER = 'Circuit Card Assembly'
const DEFAULT_SORT_KEY: keyof Product = 'apcPN'
const DEFAULT_SORT_ASC = false // false = descending (biggest to smallest)

export default function ProductTable({ products, onView, onEdit, onSave, tableState, onTableStateChange, isAdmin }: Props) {
  const { search, sortKey, sortAsc, pageSize, page, typeFilter } = tableState
  const [productInfo, setProductInfo] = useState<Record<string, ProductInfo>>({})
  const [loadingInfo, setLoadingInfo] = useState(false)

  const updateState = (updates: Partial<TableState>) => {
    onTableStateChange({ ...tableState, ...updates })
  }

  // Get unique product types for filter
  const productTypes = Array.from(
    new Set(products.map(p => p.item_type_name).filter((t): t is string => t !== null && t !== undefined))
  ).sort()

  const filtered = products.filter((p) => {
    const matchesSearch = 
      p.apcPN.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.toLowerCase().includes(search.toLowerCase()) ||
      p.customerPN?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = !typeFilter || typeFilter === 'all' || p.item_type_name === typeFilter
    
    return matchesSearch && matchesType
  })

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortKey] || ''
    const valB = b[sortKey] || ''
    
    // For part numbers, do a natural sort (so 12034 comes before 12035)
    if (sortKey === 'apcPN') {
      return sortAsc
        ? String(valA).localeCompare(String(valB), undefined, { numeric: true })
        : String(valB).localeCompare(String(valA), undefined, { numeric: true })
    }
    
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
  })

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  // Fetch product info for current page
  useEffect(() => {
    const fetchProductInfo = async () => {
      const partNumbers = paginated.map(p => p.apcPN)
      const missingParts = partNumbers.filter(pn => !productInfo[pn])
      
      if (missingParts.length === 0) return
      
      setLoadingInfo(true)
      try {
        const res = await fetch('/api/products/batch-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partNumbers: missingParts })
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data.data) {
            setProductInfo(prev => ({ ...prev, ...data.data }))
          }
        }
      } catch (error) {
        console.error('Error fetching product info:', error)
      } finally {
        setLoadingInfo(false)
      }
    }

    fetchProductInfo()
  }, [paginated.map(p => p.apcPN).join(',')])

  // Status badge component
  const StatusBadge = ({ status }: { status?: string }) => {
    if (!status || status === 'Loading...') {
      return <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">...</span>
    }
    if (status === 'Released') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
          <CheckCircle size={10} />
          Rel
        </span>
      )
    }
    if (status === 'Obsolete') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">
          <XCircle size={10} />
          Obs
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
        <Clock size={10} />
        {status.substring(0, 3)}
      </span>
    )
  }

  // Build location badge component
  const LocationBadge = ({ location }: { location?: string }) => {
    if (!location) return null
    
    const colorMap: Record<string, string> = {
      'Nashua': 'bg-blue-100 text-blue-700',
      'Nogales': 'bg-purple-100 text-purple-700',
      'Mesa': 'bg-orange-100 text-orange-700'
    }
    
    const shortMap: Record<string, string> = {
      'Nashua': 'NH',
      'Nogales': 'NG',
      'Mesa': 'MZ'
    }
    
    const colorClass = colorMap[location] || 'bg-slate-100 text-slate-700'
    const shortName = shortMap[location] || location.substring(0, 2)
    
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 ${colorClass} rounded text-xs`} title={`Build: ${location}`}>
        <MapPin size={10} />
        {shortName}
      </span>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => updateState({ search: e.target.value, page: 0 })}
          className="border border-slate-300 px-3 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        
        <select
          value={typeFilter || 'all'}
          onChange={(e) => updateState({ typeFilter: e.target.value, page: 0 })}
          className="border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="all">All Types</option>
          {productTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          value={pageSize}
          onChange={(e) => updateState({ pageSize: Number(e.target.value), page: 0 })}
          className="border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {[25, 50, 100, 250].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              {[
                { key: 'apcPN', label: 'Part Number' },
                { key: 'item_type_name', label: 'Type' },
                { key: 'customer', label: 'Customer' },
                { key: 'customerPN', label: 'Customer PN' },
                { key: 'currentRev', label: 'Rev' }
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors font-medium text-sm text-slate-700"
                  onClick={() =>
                    key === sortKey 
                      ? updateState({ sortAsc: !sortAsc }) 
                      : updateState({ sortKey: key as keyof Product })
                  }
                >
                  {label}
                  {sortKey === key && (
                    <span className="ml-1">{sortAsc ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((product) => {
              const info = productInfo[product.apcPN]
              return (
                <tr key={product.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm font-semibold">{product.apcPN}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {product.item_type_name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{product.customer || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono max-w-xs truncate">{product.customerPN || '-'}</td>
                  <td className="px-4 py-3 text-sm">{product.currentRev || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <StatusBadge status={info?.status} />
                      <LocationBadge location={info?.buildLocation} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onView(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Product"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Edit Product"
                      >
                        <Pencil size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-slate-500">
          Showing {paginated.length} of {filtered.length} products
          {typeFilter && typeFilter !== 'all' && ` (filtered by ${typeFilter})`}
          {loadingInfo && ' • Loading status...'}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => updateState({ page: Math.max(0, page - 1) })}
            disabled={page === 0}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pageNum = page < 3 ? i : page - 2 + i
            if (pageNum >= totalPages) return null
            return (
              <button
                key={pageNum}
                onClick={() => updateState({ page: pageNum })}
                className={`px-3 py-1 rounded text-sm ${
                  pageNum === page
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
              >
                {pageNum + 1}
              </button>
            )
          })}
          <button
            onClick={() => updateState({ page: Math.min(totalPages - 1, page + 1) })}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

// Export defaults for parent component to use
export { DEFAULT_TYPE_FILTER, DEFAULT_SORT_KEY, DEFAULT_SORT_ASC }
export type { TableState }
