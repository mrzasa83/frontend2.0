'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft, RefreshCw, ChevronRight, ChevronDown, Shield,
  CheckCircle, Search, Clock, AlertTriangle, ChevronsDown, ChevronsUp
} from 'lucide-react'
import Link from 'next/link'
import { getApiUrl } from '@/lib/api'

type USMLRecord = {
  id: number
  category: string
  parentId: number
  level: number
  cDescription: string
  SME: string | null
}

type TreeNode = USMLRecord & {
  children: TreeNode[]
}

function buildTree(flat: USMLRecord[]): TreeNode[] {
  const map = new Map<number, TreeNode>()
  const roots: TreeNode[] = []

  for (const r of flat) {
    map.set(r.id, { ...r, children: [] })
  }

  for (const node of map.values()) {
    if (node.parentId === 0) {
      roots.push(node)
    } else {
      const parent = map.get(node.parentId)
      if (parent) parent.children.push(node)
    }
  }

  return roots
}

// Format category label based on level
function categoryLabel(node: USMLRecord): string {
  if (node.level === 0) return `Category ${node.category}`
  if (node.level === 1) return `(${node.category})`
  if (node.level === 2) return `(${node.category})`
  return `(${node.category})`
}

// ─── Tree Row ────────────────────────────────────────────────────
function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
  selected,
  onSelect,
}: {
  node: TreeNode
  depth: number
  expanded: Set<number>
  onToggle: (id: number) => void
  selected: number | null
  onSelect: (node: TreeNode) => void
}) {
  const isExpanded = expanded.has(node.id)
  const hasChildren = node.children.length > 0
  const isSelected = selected === node.id
  const isCategory = node.level === 0

  return (
    <>
      <tr
        className={`border-b border-slate-100 cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
        } ${isCategory ? 'bg-slate-50/50' : ''}`}
        onClick={() => onSelect(node)}
      >
        {/* Category / Expand */}
        <td className="px-4 py-2.5" style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(node.id) }}
                className="p-0.5 text-slate-400 hover:text-slate-700"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span className={`font-mono text-xs ${
              isCategory ? 'font-bold text-blue-700 text-sm' : 'text-slate-500'
            }`}>
              {categoryLabel(node)}
            </span>
          </div>
        </td>

        {/* Description */}
        <td className={`px-4 py-2.5 text-sm ${
          isCategory ? 'font-semibold text-slate-800' : 'text-slate-700'
        }`}>
          <span className={isSelected ? 'text-blue-800' : ''}>
            {node.cDescription}
          </span>
        </td>

        {/* SME */}
        <td className="px-4 py-2.5 text-center w-16">
          {node.SME === 'YES' && (
            <CheckCircle size={16} className="text-green-600 mx-auto" />
          )}
        </td>
      </tr>

      {/* Children */}
      {isExpanded && node.children.map(child => (
        <TreeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

// ─── Main Page ───────────────────────────────────────────────────
export default function USMLPage() {
  const [data, setData] = useState<USMLRecord[]>([])
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [refreshMsg, setRefreshMsg] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(getApiUrl('/api/process/classification/usml'))
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setData(result.data || [])
      setMetadata(result.metadata)
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const refreshFromECFR = async () => {
    setRefreshing(true)
    setRefreshMsg('')
    setError('')
    try {
      const res = await fetch(getApiUrl('/api/process/classification/usml'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.details || result.error || 'Refresh failed')
      setRefreshMsg(`Refreshed ${result.count} records from eCFR`)
      setTimeout(() => setRefreshMsg(''), 5000)
      await fetchData()
    } catch (err: any) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const tree = useMemo(() => buildTree(data), [data])

  // Filter: when searching, show matching items and their ancestors
  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree
    const q = search.trim().toLowerCase()

    // Find all matching IDs and their ancestor chains
    const matchIds = new Set<number>()
    const parentMap = new Map<number, number>()
    for (const r of data) {
      parentMap.set(r.id, r.parentId)
      if (r.cDescription.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)) {
        // Add this and all ancestors
        let id: number | undefined = r.id
        while (id && id > 0) {
          matchIds.add(id)
          id = parentMap.get(id)
        }
      }
    }

    if (matchIds.size === 0) return []

    function filterNodes(nodes: TreeNode[]): TreeNode[] {
      return nodes
        .filter(n => matchIds.has(n.id))
        .map(n => ({ ...n, children: filterNodes(n.children) }))
    }

    return filterNodes(tree)
  }, [tree, data, search])

  // Auto-expand when searching
  useEffect(() => {
    if (search.trim()) {
      const allIds = data.filter(r => r.level <= 1).map(r => r.id)
      setExpanded(new Set(allIds))
    }
  }, [search, data])

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => {
    const allIds = data.filter(r => {
      // Expand any node that has children
      return data.some(child => child.parentId === r.id)
    }).map(r => r.id)
    setExpanded(new Set(allIds))
  }

  const collapseAll = () => {
    setExpanded(new Set())
  }

  const handleSelect = (node: TreeNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }

  const lastRefreshed = metadata?.last_refreshed
    ? new Date(metadata.last_refreshed).toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Never'

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/process/classification"
            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
          >
            <ArrowLeft size={20} />
          </Link>
          <Shield size={24} className="text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">USML Classification</h1>
            <p className="text-sm text-slate-600">
              22 CFR Part 121 — The United States Munitions List
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories and descriptions..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={expandAll}
          disabled={data.length === 0}
          className="px-2 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
          title="Expand all"
        >
          <ChevronsDown size={16} />
        </button>
        <button
          onClick={collapseAll}
          disabled={data.length === 0}
          className="px-2 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
          title="Collapse all"
        >
          <ChevronsUp size={16} />
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={14} />
          <span>Last refreshed: {lastRefreshed}</span>
          <span className="text-slate-300">·</span>
          <span>{data.length} records</span>
        </div>
        <button
          onClick={refreshFromECFR}
          disabled={refreshing}
          className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh from eCFR'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4 flex-shrink-0 flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {refreshMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm mb-4 flex-shrink-0">
          {refreshMsg}
        </div>
      )}

      {data.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center flex-shrink-0">
          <Shield size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 mb-2">No USML data loaded yet.</p>
          <p className="text-sm text-slate-500 mb-4">Click "Refresh from eCFR" to fetch the latest United States Munitions List.</p>
          <button
            onClick={refreshFromECFR}
            disabled={refreshing}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh from eCFR'}
          </button>
        </div>
      )}

      {/* Main content: tree table + detail panel */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Tree table */}
        <div className={`${selectedNode ? 'w-2/3' : 'w-full'} bg-white rounded-lg border border-slate-200 overflow-y-auto transition-all`}>
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: selectedNode ? '72%' : '76%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Description</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">SME</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : filteredTree.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                    {search ? `No items matching "${search}"` : 'No data'}
                  </td>
                </tr>
              ) : (
                filteredTree.map(node => (
                  <TreeRow
                    key={node.id}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    onToggle={toggleExpand}
                    selected={selectedNode?.id ?? null}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div className="w-1/3 bg-white rounded-lg border border-slate-200 overflow-y-auto flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  {selectedNode.level === 0 ? 'Category' : `Level ${selectedNode.level}`}
                </p>
                <p className="font-semibold text-slate-800">
                  {categoryLabel(selectedNode)}
                </p>
              </div>
              {selectedNode.SME === 'YES' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <CheckCircle size={12} />
                  SME
                </span>
              )}
            </div>
            <div className="p-4 flex-1">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedNode.cDescription}
              </div>

              {/* Show children summary if any */}
              {selectedNode.children.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Sub-items ({selectedNode.children.length})
                  </p>
                  <div className="space-y-1">
                    {selectedNode.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => {
                          setSelectedNode(child)
                          setExpanded(prev => new Set([...prev, selectedNode.id]))
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2"
                      >
                        <span className="font-mono text-xs text-slate-400 w-8 flex-shrink-0">
                          ({child.category})
                        </span>
                        <span className="text-slate-700 truncate">{child.cDescription}</span>
                        {child.SME === 'YES' && <CheckCircle size={12} className="text-green-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
