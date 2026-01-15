import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Package, Loader2, AlertCircle, Maximize2 } from 'lucide-react'

export type BOMItem = {
  id: string
  part_number: string
  description?: string
  quantity: number
  ref_des?: string
  unit?: string
  level: number
  has_children?: boolean
  children?: BOMItem[]
}

type Props = {
  rootPartNumber: string
  onPartClick?: (partNumber: string) => void
}

export default function BOMTreeNavigator({ rootPartNumber, onPartClick }: Props) {
  const [bomTree, setBomTree] = useState<BOMItem[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandingAll, setExpandingAll] = useState(false)

  useEffect(() => {
    fetchBOMRoot()
  }, [rootPartNumber])

  const fetchBOMRoot = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/products/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apcPN: rootPartNumber,
          level: 0,
          isInventoryPart: false  // Root is always a customer part
        })
      })

      if (!res.ok) throw new Error('Failed to fetch BOM data')

      const data = await res.json()
      setBomTree(data.results || [])
    } catch (error) {
      console.error('Error fetching BOM:', error)
      setError(error instanceof Error ? error.message : 'Failed to load BOM data')
    } finally {
      setLoading(false)
    }
  }

  const fetchBOMChildren = async (item: BOMItem) => {
    setLoadingNodes(prev => new Set(prev).add(item.id))

    try {
      const res = await fetch('/api/products/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apcPN: item.part_number,
          level: item.level + 1,
          isInventoryPart: true  // Children are always inventory parts
        })
      })

      if (!res.ok) throw new Error('Failed to fetch child BOM data')

      const data = await res.json()
      
      // Update the tree with children
      setBomTree(prevTree => updateTreeWithChildren(prevTree, item.id, data.results || []))
    } catch (error) {
      console.error('Error fetching BOM children:', error)
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }

  const updateTreeWithChildren = (tree: BOMItem[], nodeId: string, children: BOMItem[]): BOMItem[] => {
    return tree.map(item => {
      if (item.id === nodeId) {
        return { ...item, children }
      }
      if (item.children) {
        return { ...item, children: updateTreeWithChildren(item.children, nodeId, children) }
      }
      return item
    })
  }

  const toggleNode = async (item: BOMItem) => {
    const isExpanded = expandedNodes.has(item.id)

    if (isExpanded) {
      // Collapse
      setExpandedNodes(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    } else {
      // Expand
      setExpandedNodes(prev => new Set(prev).add(item.id))
      
      // Fetch children if not already loaded
      if (item.has_children && (!item.children || item.children.length === 0)) {
        await fetchBOMChildren(item)
      }
    }
  }

  // Expand All functionality (for future use)
  const expandAll = async () => {
    setExpandingAll(true)
    const nodesToExpand: BOMItem[] = []
    
    // Collect all expandable nodes
    const collectNodes = (items: BOMItem[]) => {
      items.forEach(item => {
        if (item.has_children) {
          nodesToExpand.push(item)
        }
        if (item.children) {
          collectNodes(item.children)
        }
      })
    }
    
    collectNodes(bomTree)
    
    // Expand all nodes
    for (const node of nodesToExpand) {
      if (!expandedNodes.has(node.id)) {
        setExpandedNodes(prev => new Set(prev).add(node.id))
        if (!node.children || node.children.length === 0) {
          await fetchBOMChildren(node)
        }
      }
    }
    
    setExpandingAll(false)
  }

  // Collapse All functionality
  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  const renderBOMItem = (item: BOMItem, depth: number = 0) => {
    const isExpanded = expandedNodes.has(item.id)
    const isLoading = loadingNodes.has(item.id)
    const hasChildren = item.has_children || (item.children && item.children.length > 0)

    return (
      <div key={item.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-slate-50 rounded cursor-pointer group"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => hasChildren && toggleNode(item)}
            className={`flex-shrink-0 ${hasChildren ? 'visible' : 'invisible'}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : isExpanded ? (
              <ChevronDown size={16} className="text-slate-600" />
            ) : (
              <ChevronRight size={16} className="text-slate-600" />
            )}
          </button>

          {/* Part Icon */}
          <Package size={16} className="text-blue-600 flex-shrink-0" />

          {/* Part Info */}
          <div 
            className="flex-1 flex items-center gap-4 min-w-0"
            onClick={() => onPartClick?.(item.part_number)}
          >
            <span className="font-mono text-sm font-medium text-slate-800">
              {item.part_number}
            </span>
            
            <span className="text-sm text-slate-600 truncate">
              {item.description || '-'}
            </span>

            <span className="text-xs text-slate-500 font-medium ml-auto flex-shrink-0">
              Qty: {item.quantity} {item.unit || ''}
            </span>

            {item.ref_des && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded flex-shrink-0">
                {item.ref_des}
              </span>
            )}
          </div>
        </div>

        {/* Render children */}
        {isExpanded && item.children && item.children.length > 0 && (
          <div>
            {item.children.map(child => renderBOMItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span className="text-slate-600">Loading BOM tree...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle size={20} />
        <div>
          <p className="font-semibold">Error loading BOM</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (bomTree.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Package size={48} className="mx-auto mb-3 opacity-50" />
        <p>No BOM data found for {rootPartNumber}</p>
      </div>
    )
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Bill of Materials</h3>
            <span className="text-sm text-slate-600">
              Root: <span className="font-mono font-medium">{rootPartNumber}</span>
            </span>
          </div>
          
          {/* Expand/Collapse All buttons (for future use) */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              disabled={expandingAll}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
              title="Expand all manufactured parts"
            >
              {expandingAll ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Expanding...
                </>
              ) : (
                <>
                  <Maximize2 size={14} />
                  Expand All
                </>
              )}
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
              title="Collapse all nodes"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="max-h-[600px] overflow-y-auto">
        {bomTree.map(item => renderBOMItem(item, 0))}
      </div>

      {/* Legend */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-600">
        💡 Click arrows to expand/collapse • Click part numbers to view details
      </div>
    </div>
  )
}