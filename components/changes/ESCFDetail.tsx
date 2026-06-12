'use client'

import React, { useState, useEffect } from 'react'
import {
  RefreshCw, ArrowLeft, X, Save, Pencil,
  Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import ReviewsTab from '@/components/changes/ReviewsTab'

type Props = {
  escfId: number
  isAdmin: boolean
  onClose: () => void
  onOpenEscf?: (id: number) => void
  onDataChange?: () => void
  navList?: number[]
  onNavigate?: (id: number) => void
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Implemented: 'bg-green-100 text-green-700',
    Approved: 'bg-blue-100 text-blue-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Rejected: 'bg-red-100 text-red-700',
    Legacy: 'bg-slate-100 text-slate-600',
  }
  const icons: Record<string, any> = { Implemented: CheckCircle, Approved: CheckCircle, Pending: Clock, Rejected: XCircle, Legacy: Clock }
  const Icon = icons[status] || Clock
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      <Icon size={12} /> {status}
    </span>
  )
}

// ─── Field renderer ──────────────────────────────────────────────
function FieldRow({ label, field, data, editing, onChange, readOnly, multiline, checkbox }: {
  label: string; field: string; data: any; editing: boolean
  onChange: (f: string, v: string) => void; readOnly?: boolean; multiline?: boolean; checkbox?: boolean
}) {
  const val = data[field]
  const displayVal = val !== null && val !== undefined && val !== '' ? String(val) : null

  // Checkbox mode
  if (checkbox) {
    const isChecked = displayVal?.toLowerCase() === 'yes'
    if (editing && !readOnly) {
      return (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isChecked}
              onChange={e => onChange(field, e.target.checked ? 'Yes' : 'No')}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-slate-700">{isChecked ? 'Yes' : 'No'}</span>
          </label>
        </div>
      )
    }
    return (
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isChecked} disabled
            className="w-4 h-4 rounded border-slate-300 text-blue-600" />
          <span className="text-sm text-slate-700">{isChecked ? 'Yes' : 'No'}</span>
        </label>
      </div>
    )
  }

  if (editing && !readOnly) {
    return (
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        {multiline ? (
          <textarea value={data[field] ?? ''} onChange={e => onChange(field, e.target.value)} rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-y" />
        ) : (
          <input type="text" value={data[field] ?? ''} onChange={e => onChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      {multiline && displayVal ? (
        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-lg p-3 min-h-[60px]">{displayVal}</p>
      ) : (
        <p className="text-sm text-slate-800">{displayVal || <span className="text-slate-300">—</span>}</p>
      )}
    </div>
  )
}

// ─── Date formatter ──────────────────────────────────────────────
function formatDateTime(val: string | null): string {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return val }
}

// ─── Tabs ────────────────────────────────────────────────────────
const TABS = [
  { id: 'general', label: 'General' },
  { id: 'workcenter', label: 'Work Center' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'signoff', label: 'Signoff' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'related', label: 'Related Parts' },
  { id: 'history', label: 'History' },
]
const ADMIN_TAB = { id: 'admin', label: 'Admin' }

// ─── Related Parts Tab ───────────────────────────────────────────
function RelatedPartsTab({ escfId, department }: { escfId: number; department: string }) {
  const [data, setData] = React.useState<any[]>([])
  const [deptCodes, setDeptCodes] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    const fetchParts = async () => {
      setLoading(true); setError('')
      try {
        const res = await fetch(getApiUrl(`/api/products/changes/standards/related-parts?escfId=${escfId}&department=${encodeURIComponent(department)}`))
        if (!res.ok) throw new Error((await res.json()).details || 'Failed')
        const r = await res.json()
        setData(r.data || [])
        setDeptCodes(r.deptCodes || [])
        if (r.message) setError(r.message)
      } catch (e: any) { setError(e.message) }
      setLoading(false)
    }
    fetchParts()
  }, [escfId, department])

  const filtered = React.useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((r: any) =>
      (r.customerPartNumber || '').toLowerCase().includes(q) ||
      (r.inventoryPartNumber || '').toLowerCase().includes(q) ||
      (r.routeSteps || '').toLowerCase().includes(q)
    )
  }, [data, search])

  if (loading) return <div className="flex items-center gap-2 py-8 justify-center text-slate-500"><RefreshCw size={16} className="animate-spin" /> Loading related parts...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-700">
            Related Parts — {department} ({filtered.length} parts)
          </h4>
          {deptCodes.length > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              Paradigm depts: {deptCodes.join(', ')}
            </p>
          )}
        </div>
        <div className="relative">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter parts..." className="pl-3 pr-8 py-1.5 border border-slate-200 rounded text-sm w-48" />
        </div>
      </div>

      {error && !data.length && <p className="text-sm text-orange-500 italic">{error}</p>}

      {data.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-y-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Customer Part#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Inventory Part#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Route Steps</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any, i: number) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-slate-800">{r.customerPartNumber}</td>
                  <td className="px-3 py-2 font-mono text-slate-600">{r.inventoryPartNumber || '—'}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{r.routeSteps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ESCFDetail({ escfId, isAdmin, onClose, onOpenEscf, onDataChange, navList, onNavigate }: Props) {
  const [record, setRecord] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [wcHistory, setWcHistory] = useState<any[]>([])
  const [emailLog, setEmailLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('general')
  const [showLegacy, setShowLegacy] = useState(false)
  const [attachmentMeta, setAttachmentMeta] = useState<Record<string, { description: string | null }>>({})
  const [matchedFiles, setMatchedFiles] = useState<{ ref: string; actualName: string; found: boolean; size: number; modified: string }[]>([])
  const [editingDesc, setEditingDesc] = useState<string | null>(null)
  const [descDraft, setDescDraft] = useState('')

  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS

  useEffect(() => { fetchRecord() }, [escfId])

  const fetchRecord = async () => {
    setLoading(true)
    try {
      const res = await fetch(getApiUrl(`/api/products/changes/standards?id=${escfId}`))
      if (!res.ok) throw new Error('Failed to fetch')
      const r = await res.json()
      setRecord(r.record)
      setFormData(r.record)
      setHistory(r.history || [])
      setWcHistory(r.wcHistory || [])
      setEmailLog(r.emailLog || [])
      // Fetch attachment metadata
      try {
        const attRaw = encodeURIComponent(r.record.attachments || '')
        const reqField = encodeURIComponent(r.record.request || '')
        const attRes = await fetch(getApiUrl(`/api/products/changes/standards/attachments?escfId=${escfId}&attachments=${attRaw}&request=${reqField}`))
        if (attRes.ok) {
          const attData = await attRes.json()
          const metaMap: Record<string, { description: string | null }> = {}
          for (const m of (attData.metadata || [])) {
            metaMap[m.filename] = { description: m.description }
          }
          setAttachmentMeta(metaMap)
          setMatchedFiles(attData.files || [])
        }
      } catch {}
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const saveDescription = async (filename: string, description: string) => {
    try {
      await fetch(getApiUrl('/api/products/changes/standards/attachments'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escfId, filename, description }),
      })
      setAttachmentMeta(prev => ({
        ...prev,
        [filename]: { ...prev[filename], description }
      }))
      setEditingDesc(null)
    } catch (e: any) { setError(e.message) }
  }

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/products/changes/standards'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Save failed')
      setEditing(false)
      await fetchRecord()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const computedStatus = (() => {
    if (!record) return ''
    const s = Number(record.escf_status)
    const d = (record.pe_disposition || '').trim()
    if (s === 2) return 'Rejected'
    if ((!d) && s === 0) return 'Pending'
    if (d === 'Approved' && s === 1) return 'Implemented'
    if (d === 'Approved' && s === 0) return 'Approved'
    return 'Legacy'
  })()

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-blue-600 mr-3" />
      <span className="text-slate-600">Loading...</span>
    </div>
  }
  if (!record) return <div className="p-6 text-red-600">Record not found</div>

  const F = (label: string, field: string, opts?: { ro?: boolean; ml?: boolean; cb?: boolean }) => (
    <FieldRow label={label} field={field} data={editing ? formData : record}
      editing={editing} onChange={updateField} readOnly={opts?.ro} multiline={opts?.ml} checkbox={opts?.cb} />
  )

    // Filtered + sorted WC history (newest first, Legacy toggle)
    const filteredWcHistory = wcHistory
      .filter(h => showLegacy || h.status !== 'Legacy')
      .sort((a, b) => {
        const da = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
        const db = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
        return db - da // newest first
      })

    const wcHistoryTable = (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">
            Work Center History — {record.department} ({filteredWcHistory.length} records)
          </h4>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showLegacy}
              onChange={e => setShowLegacy(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Show Legacy
          </label>
        </div>
        {filteredWcHistory.length === 0 ? (
          <p className="text-sm text-slate-400">No history found for this department</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-y-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Department</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Initiator</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">WCM</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Submitted</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWcHistory.map((h: any, i: number) => (
                  <tr key={`${h.id}-${i}`}
                    className={`border-t border-slate-100 ${h.id === escfId ? 'bg-blue-50 font-medium' : 'hover:bg-slate-50 cursor-pointer'}`}
                    onClick={() => { if (h.id !== escfId && onOpenEscf) onOpenEscf(h.id) }}>
                    <td className="px-3 py-2 font-mono text-slate-800">{h.id}{h.id === escfId ? ' ←' : ''}</td>
                    <td className="px-3 py-2 text-slate-700">{h.department}</td>
                    <td className="px-3 py-2 text-slate-600">{h.initiator || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{h.wcm || '—'}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{formatDateTime(h.submitted_at) || h.subdate || '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={h.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  // ─── Tab content ───────────────────────────────────────────────
  const tabContent: Record<string, React.ReactNode> = {
    general: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {F('Request', 'request', { ro: true })}
          {F('Department', 'department')}
          {F('Affected Departments', 'affected_departments')}
          {F('WCM', 'wcm')}
          {F('Initiator', 'initiator')}
          {F('PES', 'pes')}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Submitted</p>
            <p className="text-sm text-slate-800">{formatDateTime(record.submitted_at)}</p>
          </div>
          {F('Is New Process', 'is_new_process', { cb: true })}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Intended Imp Date</p>
            <p className="text-sm text-slate-800">{record.intended_imp_datetime ? new Date(record.intended_imp_datetime).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : record.intended_imp_date || '—'}</p>
          </div>
        </div>
        <div className="space-y-4">
          {F('Current Standard', 'current_standards', { ml: true })}
          {F('Requested Change', 'requested_change', { ml: true })}
          {F('Reason for Change', 'reason_for_change', { ml: true })}
        </div>
      </div>
    ),

    workcenter: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {F('Department', 'department')}
          {F('Affected Departments', 'affected_departments')}
          {F('WCM', 'wcm')}
          {F('PES', 'pes')}
        </div>
        <div className="pt-4 border-t border-slate-100">
          {wcHistoryTable}
        </div>
      </div>
    ),

    reviews: (
      <ReviewsTab escfId={escfId} record={record} isAdmin={isAdmin} onRefresh={() => { fetchRecord(); onDataChange?.() }} />
    ),

    signoff: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {F('Initiator', 'initiator')}
          {F('User', 'user')}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Submitted</p>
            <p className="text-sm text-slate-800">{formatDateTime(record.submitted_at)}</p>
          </div>
          {F('PE Disposition', 'pe_disposition')}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Disposition Date</p>
            <p className="text-sm text-slate-800">{formatDateTime(record.disposed_at)}</p>
          </div>
          {F('PE Cost Impact', 'is_pe_cost_impact')}
          {F('Completed By', 'completedby')}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Closed</p>
            <p className="text-sm text-slate-800">{formatDateTime(record.closed_at)}</p>
          </div>
          {F('Engenix Affected', 'engenix_affected')}
          {F('Disposition', 'disposition')}
          {F('Prev Tooled Dis', 'prev_tooled_dis')}
          {F('Software', 'software')}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {F('Rejection Reason', 'rejection_reason', { ml: true })}
        </div>

        {/* Signoff timeline */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Signoff Timeline</h4>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">User</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Action</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Description</th>
                </tr>
              </thead>
              <tbody>
                {/* Submitted row */}
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{record.initiator || '—'}</td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{record.subdate || '—'}</td>
                  <td className="px-3 py-2 text-slate-600">Submitted</td>
                  <td className="px-3 py-2"><StatusBadge status="Pending" /></td>
                  <td className="px-3 py-2 text-slate-600 text-xs max-w-xs truncate">{record.request || '—'}</td>
                </tr>
                {/* Disposition row (if exists) */}
                {record.pe_disposition && (
                  <tr className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{record.pem || record.user || '—'}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{record.pe_disposition_date || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{record.pe_disposition}</td>
                    <td className="px-3 py-2"><StatusBadge status={computedStatus} /></td>
                    <td className="px-3 py-2 text-slate-600 text-xs max-w-xs truncate">{record.is_pe_cost_impact === 'Yes' ? 'Cost impact noted' : '—'}</td>
                  </tr>
                )}
                {/* Implementation row (if implemented) */}
                {computedStatus === 'Implemented' && record.completedby && (
                  <tr className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{record.completedby}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{record.closeddate || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">Implement</td>
                    <td className="px-3 py-2"><StatusBadge status="Implemented" /></td>
                    <td className="px-3 py-2 text-slate-600 text-xs max-w-xs truncate">{record.rejection_reason || '—'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Change History moved to History tab */}
      </div>
    ),

    history: (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-700">Change History ({history.length})</h4>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No changes recorded</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Field</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Old Value</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">New Value</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Changed By</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h: any) => (
                  <tr key={h.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-700">{h.field_name}</td>
                    <td className="px-3 py-2 text-red-500 text-xs">{h.old_value || '(empty)'}</td>
                    <td className="px-3 py-2 text-green-600 text-xs">{h.new_value || '(empty)'}</td>
                    <td className="px-3 py-2 text-slate-600">{h.changed_by}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{new Date(h.changed_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h4 className="text-sm font-semibold text-slate-700 pt-2">Sent Emails ({emailLog.length})</h4>
        {emailLog.length === 0 ? (
          <p className="text-sm text-slate-400">No emails logged for this ESCF</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Subject</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Recipient</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">CC</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Sent</th>
                </tr>
              </thead>
              <tbody>
                {emailLog.map((m: any) => (
                  <tr key={m.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 font-medium text-slate-700">{m.subject || '—'}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs break-all">{m.recipient || '—'}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs break-all">{m.cc_recipient || '—'}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{m.sent_at ? new Date(m.sent_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    ),

    related: <RelatedPartsTab escfId={escfId} department={record.department} />,

    attachments: (() => {
      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1048576).toFixed(1)} MB`
      }
      const getFileIcon = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase() || ''
        if (['pdf'].includes(ext)) return '📕'
        if (['xlsx', 'xls', 'csv'].includes(ext)) return '📗'
        if (['doc', 'docx'].includes(ext)) return '📘'
        if (['pptx', 'ppt'].includes(ext)) return '📙'
        if (['msg'].includes(ext)) return '📧'
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return '🖼️'
        return '📄'
      }
      const basePath = '/mnt/jdrive/APC EngJobs/00 DocControl/escf'
      const attValue = record.attachments || ''
      const downloadUrl = (filename: string) =>
        getApiUrl(`/api/products/changes/standards/attachments?download=true&filename=${encodeURIComponent(filename)}`)

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">
              Attachments ({matchedFiles.length} file{matchedFiles.length !== 1 ? 's' : ''})
            </h4>
            <p className="text-xs text-slate-400 font-mono">Path: {basePath}</p>
          </div>

          {!attValue ? (
            <p className="text-sm text-slate-400 italic py-4">No attachments in ESCF record</p>
          ) : matchedFiles.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4">Loading attachments...</p>
          ) : (
            <div className="space-y-2">
              {matchedFiles.map((file) => {
                const meta = attachmentMeta[file.actualName]
                const isEditingThis = editingDesc === file.actualName

                return (
                  <div key={file.ref} className="group bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-blue-200 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0 mt-0.5">{getFileIcon(file.actualName)}</span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 break-all">{file.actualName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {file.found ? (
                            <>
                              <span className="text-xs text-green-600">{formatSize(file.size)}</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">
                                {new Date(file.modified).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-orange-500">File not found on disk</span>
                          )}
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">ref: {file.ref}</span>
                        </div>

                        {/* Description */}
                        {isEditingThis ? (
                          <div className="mt-2 flex items-center gap-2">
                            <input type="text" value={descDraft}
                              onChange={e => setDescDraft(e.target.value)}
                              placeholder="Add a description..."
                              className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveDescription(file.actualName, descDraft)
                                if (e.key === 'Escape') setEditingDesc(null)
                              }}
                            />
                            <button onClick={() => saveDescription(file.actualName, descDraft)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium">Save</button>
                            <button onClick={() => setEditingDesc(null)}
                              className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-2">
                            {meta?.description ? (
                              <p className="text-xs text-slate-600 italic">{meta.description}</p>
                            ) : (
                              <p className="text-xs text-slate-300 italic">No description</p>
                            )}
                            <button onClick={() => { setEditingDesc(file.actualName); setDescDraft(meta?.description || '') }}
                              className="text-xs text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              {meta?.description ? 'edit' : 'add description'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Download/Open actions */}
                      {file.found && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <a href={downloadUrl(file.actualName)} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Open / Preview">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <a href={downloadUrl(file.actualName)} download
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Download">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    })(),

    admin: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {F('Submission Type', 'submission_type', { ro: true })}
          {F('ESCF Status', 'escf_status')}
          {F('Change Status', 'change_status')}
          {F('Engenix Updated', 'engenix_updated')}
        </div>
      </div>
    ),
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} />
          </button>
          {navList && navList.length > 1 && onNavigate && (() => {
            const idx = navList.indexOf(escfId)
            const prevId = idx > 0 ? navList[idx - 1] : null
            const nextId = idx >= 0 && idx < navList.length - 1 ? navList[idx + 1] : null
            return (
              <div className="flex items-center gap-1">
                <button onClick={() => prevId && onNavigate(prevId)} disabled={!prevId}
                  className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title={prevId ? `Previous (#${prevId})` : 'No previous'}>
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs text-slate-400 min-w-[3rem] text-center">
                  {idx >= 0 ? `${idx + 1} / ${navList.length}` : ''}
                </span>
                <button onClick={() => nextId && onNavigate(nextId)} disabled={!nextId}
                  className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title={nextId ? `Next (#${nextId})` : 'No next'}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )
          })()}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              ESCF #{record.id} <StatusBadge status={computedStatus} />
            </h3>
            <p className="text-sm text-slate-500">{record.initiator} · {record.subdate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setFormData(record) }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2">
                <X size={18} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                <Save size={18} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              {isAdmin && (
                <button onClick={() => setEditing(true)}
                  className="px-4 py-2 text-green-700 hover:bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                  <Pencil size={18} /> Edit
                </button>
              )}
              <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2">
                <X size={18} /> Close
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Body: left tabs + content */}
      <div className="flex-1 flex min-h-0">
        {/* Left tab nav */}
        <div className="w-48 border-r border-slate-200 bg-slate-50 flex-shrink-0 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {tabContent[activeTab] || <p className="text-slate-400">Tab not found</p>}
        </div>
      </div>
    </div>
  )
}
