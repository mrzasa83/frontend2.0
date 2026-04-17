'use client'

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown,
  X, ChevronLeft, ChevronRight, MessageSquare, Send, Filter
} from 'lucide-react'
import Link from 'next/link'
import { getApiUrl } from '@/lib/api'

type MCNRecord = {
  id: number
  initiator: string | null
  subDate: string | null
  toolnum: string | null
  partnum: string | null
  change: string | null
  reason: string | null
  chngeffect: string | null
  [key: string]: any
}

type SortKey = 'subDate' | 'partnum' | 'toolnum' | 'initiator'
type SortDir = 'asc' | 'desc'

function formatDate(d: string | null): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch { return String(d) }
}

// ─── PostOp Comment Inline Editor ────────────────────────────────
function PostOpInline({ mcnId, current, canEdit, onSaved }: {
  mcnId: number; current: string; canEdit: boolean; onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!value.trim()) return
    setSaving(true)
    try {
      await fetch(getApiUrl('/api/process/drill-rout/postop-comments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcnId, comment: value }),
      })
      setEditing(false)
      onSaved()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          autoFocus
        />
        <button onClick={save} disabled={saving} className="p-1 text-blue-600 hover:text-blue-800">
          <Send size={12} />
        </button>
        <button onClick={() => setEditing(false)} className="p-1 text-slate-400">
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={e => { if (canEdit) { e.stopPropagation(); setEditing(true) } }}
      className={`text-xs ${current ? 'text-slate-700' : 'text-slate-300 italic'} ${canEdit ? 'cursor-pointer hover:text-blue-600' : ''}`}
      title={canEdit ? 'Click to add/edit comment' : undefined}
    >
      {current || (canEdit ? 'Add comment...' : '—')}
    </div>
  )
}

// ─── Detail View ─────────────────────────────────────────────────
function RecordDetail({ record, canEdit, onClose, onPrev, onNext, hasPrev, hasNext }: {
  record: MCNRecord; canEdit: boolean; onClose: () => void
  onPrev: () => void; onNext: () => void; hasPrev: boolean; hasNext: boolean
}) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const pendingCommentRef = useRef('')

  // Keep ref in sync with state
  useEffect(() => { pendingCommentRef.current = newComment }, [newComment])

  // Auto-save pending comment before navigating away
  const autoSave = useCallback(async () => {
    const pending = pendingCommentRef.current.trim()
    if (pending && canEdit) {
      try {
        await fetch(getApiUrl('/api/process/drill-rout/postop-comments'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mcnId: record.id, comment: pending }),
        })
      } catch (e) { console.error('Auto-save failed:', e) }
    }
  }, [record.id, canEdit])

  const handleClose = async () => {
    await autoSave()
    onClose()
  }

  const handlePrev = async () => {
    await autoSave()
    setNewComment('')
    onPrev()
  }

  const handleNext = async () => {
    await autoSave()
    setNewComment('')
    onNext()
  }

  useEffect(() => {
    fetchComments()
  }, [record.id])

  const fetchComments = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/process/drill-rout/postop-comments?mcnId=${record.id}`))
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (e) { console.error(e) }
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    setSavingComment(true)
    try {
      await fetch(getApiUrl('/api/process/drill-rout/postop-comments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcnId: record.id, comment: newComment }),
      })
      setNewComment('')
      await fetchComments()
    } catch (e) { console.error(e) }
    finally { setSavingComment(false) }
  }

  const summaryFields = [
    { label: 'ID', value: record.id },
    { label: 'Initiator', value: record.initiator },
    { label: 'Date', value: formatDate(record.subDate) },
    { label: 'Part Number', value: record.partnum },
    { label: 'Tool Number', value: record.toolnum },
    { label: 'Change Effect', value: record.chngeffect },
  ]

  const knownKeys = new Set(['id', 'initiator', 'subDate', 'toolnum', 'partnum', 'change', 'reason', 'chngeffect'])
  const extraFields = Object.entries(record)
    .filter(([k, v]) => !knownKeys.has(k) && v !== null && v !== '')
    .map(([k, v]) => ({ label: k, value: String(v) }))

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleClose} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              MCN #{record.id} <span className="text-sm font-normal text-slate-500">— {record.partnum}</span>
            </h3>
            <p className="text-sm text-slate-500">{record.initiator} · {formatDate(record.subDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={!hasPrev}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous record"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next record"
          >
            <ChevronRight size={20} />
          </button>
          <button onClick={handleClose} className="p-1 ml-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
      </div>

      <div className="border-b border-slate-200 px-6 flex-shrink-0">
        <button className="px-4 py-2.5 text-sm font-medium border-b-2 border-blue-600 text-blue-600">Details</button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* PostOp Comments — at the top */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-3">
            <MessageSquare size={16} /> PostOp Comments ({comments.length})
          </h4>
          {comments.length > 0 && (
            <div className="space-y-2 mb-3">
              {comments.map((c: any) => (
                <div key={c.id} className="bg-white rounded p-3 text-sm">
                  <p className="text-slate-800">{c.comment}</p>
                  <p className="text-xs text-slate-400 mt-1">{c.created_by} · {new Date(c.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          {canEdit && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addComment() }}
                placeholder="Add a PostOp comment..."
                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
              />
              <button
                onClick={addComment}
                disabled={savingComment || !newComment.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Summary grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {summaryFields.map(f => (
            <div key={f.label}>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{f.label}</p>
              <p className="text-sm text-slate-800">{f.value || <span className="text-slate-300">—</span>}</p>
            </div>
          ))}
        </div>

        {extraFields.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            {extraFields.map(f => (
              <div key={f.label}>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{f.label}</p>
                <p className="text-sm text-slate-800">{f.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Change</label>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[80px] text-sm text-slate-800 whitespace-pre-wrap">
            {record.change || <span className="text-slate-300 italic">No change description</span>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Reason</label>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[80px] text-sm text-slate-800 whitespace-pre-wrap">
            {record.reason || <span className="text-slate-300 italic">No reason provided</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page Content ───────────────────────────────────────────
function PageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const searchId = searchParams.get('searchId')

  const [data, setData] = useState<MCNRecord[]>([])
  const [searchName, setSearchName] = useState('Rout - Speed/Feed Change')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('subDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedRecord, setSelectedRecord] = useState<MCNRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<MCNRecord | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [commentMap, setCommentMap] = useState<Record<number, string>>({})

  // Filters
  const [filterInitiator, setFilterInitiator] = useState('')
  const [filterPartnum, setFilterPartnum] = useState('')

  const canEdit = session?.user?.roles?.some(
    (r: string) => ['Admin', 'ProcessEng'].includes(r)
  ) || false

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const url = searchId
        ? getApiUrl(`/api/process/drill-rout/rout-speed-feed?searchId=${searchId}`)
        : getApiUrl('/api/process/drill-rout/rout-speed-feed')
      const res = await fetch(url)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || 'Failed to fetch')
      }
      const result = await res.json()
      setData(result.data || [])
      setSearchName(result.searchName || 'Search Results')

      // Fetch PostOp comments for visible records
      const ids = (result.data || []).slice(0, 500).map((r: MCNRecord) => r.id)
      if (ids.length > 0) {
        fetchComments(ids)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (ids: number[]) => {
    try {
      const res = await fetch(getApiUrl(`/api/process/drill-rout/postop-comments?mcnIds=${ids.join(',')}`))
      if (res.ok) {
        const data = await res.json()
        setCommentMap(data.commentMap || {})
      }
    } catch (e) { console.error(e) }
  }

  const fetchDetail = async (id: number) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(getApiUrl(`/api/process/drill-rout/rout-speed-feed?id=${id}`))
      if (res.ok) {
        const result = await res.json()
        setDetailRecord(result.record)
      }
    } catch {
      setDetailRecord(data.find(r => r.id === id) || null)
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => { fetchData() }, [searchId])

  // Unique values for filter dropdowns
  const initiators = useMemo(() => {
    return [...new Set(data.map(r => r.initiator).filter(Boolean) as string[])].sort()
  }, [data])

  const filtered = useMemo(() => {
    let result = data
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        (r.partnum || '').toLowerCase().includes(q) ||
        (r.toolnum || '').toLowerCase().includes(q) ||
        (r.initiator || '').toLowerCase().includes(q) ||
        (r.change || '').toLowerCase().includes(q) ||
        (commentMap[r.id] || '').toLowerCase().includes(q)
      )
    }
    if (filterInitiator) {
      result = result.filter(r => r.initiator === filterInitiator)
    }
    if (filterPartnum) {
      const q = filterPartnum.toLowerCase()
      result = result.filter(r => (r.partnum || '').toLowerCase().includes(q))
    }
    return result
  }, [data, search, filterInitiator, filterPartnum, commentMap])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'subDate': cmp = new Date(a.subDate || 0).getTime() - new Date(b.subDate || 0).getTime(); break
        case 'partnum': cmp = (a.partnum || '').localeCompare(b.partnum || '', undefined, { numeric: true }); break
        case 'toolnum': cmp = (a.toolnum || '').localeCompare(b.toolnum || '', undefined, { numeric: true }); break
        case 'initiator': cmp = (a.initiator || '').localeCompare(b.initiator || ''); break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'subDate' ? 'desc' : 'asc') }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={14} className="text-slate-300" />
    return sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
  }

  const handleRowClick = (record: MCNRecord) => {
    setSelectedRecord(record)
    fetchDetail(record.id)
  }

  const handleCommentSaved = () => {
    const ids = data.slice(0, 500).map(r => r.id)
    if (ids.length > 0) fetchComments(ids)
  }

  // Detail view
  const currentIndex = useMemo(() => {
    if (!selectedRecord) return -1
    return sorted.findIndex(r => r.id === selectedRecord.id)
  }, [sorted, selectedRecord])

  const navigateTo = async (index: number) => {
    const rec = sorted[index]
    if (!rec) return
    setSelectedRecord(rec)
    setDetailRecord(null)
    setLoadingDetail(true)
    try {
      const res = await fetch(getApiUrl(`/api/process/drill-rout/rout-speed-feed?id=${rec.id}`))
      if (res.ok) {
        const result = await res.json()
        setDetailRecord(result.record)
      } else {
        setDetailRecord(rec)
      }
    } catch {
      setDetailRecord(rec)
    } finally {
      setLoadingDetail(false)
    }
  }

  if (selectedRecord && (detailRecord || loadingDetail)) {
    if (loadingDetail) {
      return (
        <div className="flex items-center justify-center h-full py-20">
          <RefreshCw size={24} className="animate-spin text-blue-600 mr-3" />
          <span className="text-slate-600">Loading record...</span>
        </div>
      )
    }
    return (
      <RecordDetail
        record={detailRecord!}
        canEdit={canEdit}
        onClose={() => { setSelectedRecord(null); setDetailRecord(null); handleCommentSaved() }}
        onPrev={() => navigateTo(currentIndex - 1)}
        onNext={() => navigateTo(currentIndex + 1)}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < sorted.length - 1}
      />
    )
  }

  const COL = { date: '10%', part: '10%', tool: '10%', init: '12%', change: '38%', postop: '20%' }

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/process/drill-rout" className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{searchName}</h1>
            <p className="text-sm text-slate-600">{data.length} MCN records</p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4 flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search all columns..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <select
            value={filterInitiator} onChange={e => setFilterInitiator(e.target.value)}
            className="pl-8 pr-6 py-2 border border-slate-200 rounded-lg text-sm bg-white appearance-none min-w-[140px]"
          >
            <option value="">All Initiators</option>
            {initiators.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <input
          type="text" value={filterPartnum} onChange={e => setFilterPartnum(e.target.value)}
          placeholder="Filter part #..."
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-32 focus:ring-1 focus:ring-blue-500 outline-none"
        />
        {(search || filterInitiator || filterPartnum) && (
          <button
            onClick={() => { setSearch(''); setFilterInitiator(''); setFilterPartnum('') }}
            className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
          >
            Clear filters ({filtered.length} of {data.length})
          </button>
        )}
        <div className="flex-1" />
        <button onClick={fetchData} disabled={loading} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4 flex-shrink-0">{error}</div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 overflow-y-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: COL.date }} />
            <col style={{ width: COL.part }} />
            <col style={{ width: COL.tool }} />
            <col style={{ width: COL.init }} />
            <col style={{ width: COL.change }} />
            <col style={{ width: COL.postop }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none" onClick={() => toggleSort('subDate')}>
                <div className="flex items-center gap-1">Date <SortIcon col="subDate" /></div>
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none" onClick={() => toggleSort('partnum')}>
                <div className="flex items-center gap-1">Part # <SortIcon col="partnum" /></div>
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none" onClick={() => toggleSort('toolnum')}>
                <div className="flex items-center gap-1">Tool # <SortIcon col="toolnum" /></div>
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100 select-none" onClick={() => toggleSort('initiator')}>
                <div className="flex items-center gap-1">Initiator <SortIcon col="initiator" /></div>
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600">Change</th>
              <th className="px-3 py-3 text-left font-medium text-slate-600">
                <div className="flex items-center gap-1"><MessageSquare size={14} /> PostOp Comments</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Loading...
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  {search || filterInitiator || filterPartnum ? 'No matching records' : 'No records found'}
                </td>
              </tr>
            ) : (
              sorted.map(row => (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer group"
                >
                  <td className="px-3 py-2.5 text-slate-600 text-xs">{formatDate(row.subDate)}</td>
                  <td className="px-3 py-2.5 font-mono font-medium text-slate-800">{row.partnum || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-700">{row.toolnum || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-600 truncate">{row.initiator || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                    <div className="line-clamp-3 whitespace-pre-wrap break-words">
                      {row.change || '—'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <PostOpInline
                      mcnId={row.id}
                      current={commentMap[row.id] || ''}
                      canEdit={canEdit}
                      onSaved={handleCommentSaved}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function RoutSpeedFeedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full py-20">
        <RefreshCw size={24} className="animate-spin text-blue-600 mr-3" />
        <span className="text-slate-600">Loading...</span>
      </div>
    }>
      <PageContent />
    </Suspense>
  )
}
