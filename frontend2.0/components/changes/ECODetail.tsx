'use client'

import React, { useState, useEffect } from 'react'
import {
  RefreshCw, ArrowLeft, X, Save, Pencil,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, AlertTriangle, Edit3
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Props = {
  ecoId: number
  isAdmin: boolean
  onClose: () => void
  onDataChange?: () => void
  navList?: number[]
  onNavigate?: (id: number) => void
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: 'bg-yellow-100 text-yellow-700',
    Closed: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
  }
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

function formatDateTime(val: string | null): string {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return val }
}

// ─── Field grouping ──────────────────────────────────────────────
// Fields broken out logically. Anything uncertain goes to Admin.
const TABS = [
  { id: 'general', label: 'General' },
  { id: 'cam', label: 'CAM Work' },
  { id: 'review', label: 'Review' },
  { id: 'signoff', label: 'Signoff' },
  { id: 'attachments', label: 'Attachments' },
]
const ADMIN_TAB = { id: 'admin', label: 'Admin' }

// Fields placed in each tab. Admin gets everything not otherwise mapped.
const FIELD_GROUPS: Record<string, { label: string; field: string; ml?: boolean }[]> = {
  general: [
    { label: 'Tool Number', field: 'toolnum' },
    { label: 'Part Number', field: 'partnum' },
    { label: 'Customer', field: 'customer' },
    { label: 'Job Type', field: 'job_type' },
    { label: 'Submission Type', field: 'submission_type' },
    { label: 'Urgent', field: 'urgent' },
    { label: 'From MCN', field: 'from_mcn' },
    { label: 'MCN Required By Date', field: 'mcn_required_by_date' },
    { label: 'MCN Required By Day', field: 'mcn_required_by_day' },
    { label: 'Action Required', field: 'action_required', ml: true },
    { label: 'Comments', field: 'comments', ml: true },
  ],
  cam: [
    { label: 'How CAM Notified', field: 'how_cam_notified' },
    { label: 'How CAM Notified (Other)', field: 'how_cam_notified_other' },
    { label: 'Number of Replots', field: 'num_replots' },
    { label: 'New Drill/Rout Names', field: 'new_drill_rout_names' },
    { label: 'Software', field: 'software' },
    { label: 'Process Route', field: 'process_route' },
    { label: 'Email Route', field: 'email_route' },
    { label: 'Panel X', field: 'panelx' },
    { label: 'Panel Y', field: 'panely' },
    { label: 'Affects', field: 'affects' },
    { label: 'Affects (Other)', field: 'affects_other' },
    // Support information
    { label: 'Support Type', field: 'support_type' },
    { label: 'Support Type (Other)', field: 'support_type_other' },
    { label: 'Support Requester', field: 'support_requester' },
    { label: 'Support Requested By', field: 'support_requested_by' },
    { label: 'Support Requested By (Other)', field: 'support_requested_by_other' },
    { label: 'Charge External Entity', field: 'charge_external_entity' },
    { label: 'Reason Internal ECO', field: 'reason_internal_eco', ml: true },
    { label: 'Reason Internal ECO (Other)', field: 'reason_internal_eco_other', ml: true },
    { label: 'CAM Notes', field: 'cam_notes', ml: true },
  ],
  review: [
    { label: 'Disposition', field: 'disposition' },
    { label: 'Actual Time Spent (hrs)', field: 'actual_time_spent' },
    { label: 'PPE', field: 'ppe' },
    { label: 'Revised On', field: 'revised_on' },
  ],
  admin: [
    { label: 'ECO Status', field: 'eco_status' },
    { label: 'Change Status', field: 'change_status' },
    { label: 'X Email', field: 'x_email' },
  ],
}

function Field({ label, value, ml }: { label: string; value: any; ml?: boolean }) {
  const display = value !== null && value !== undefined && String(value).trim() !== '' ? String(value) : '—'
  return (
    <div className={ml ? 'col-span-full' : ''}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      {ml ? (
        <p className="text-sm text-slate-800 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap min-h-[2.5rem]">{display}</p>
      ) : (
        <p className="text-sm text-slate-800">{display}</p>
      )}
    </div>
  )
}

export default function ECODetail({ ecoId, isAdmin, onClose, onDataChange, navList, onNavigate }: Props) {
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('general')

  // Modals
  const [closeModal, setCloseModal] = useState<'complete' | 'cancel' | null>(null)
  const [reviseModal, setReviseModal] = useState(false)
  const [timeSpent, setTimeSpent] = useState('')
  const [reviseNote, setReviseNote] = useState('')
  const [modalError, setModalError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchRecord = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/products/changes/eco?id=${ecoId}`))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setRecord(r.record)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRecord() }, [ecoId])

  const handleCloseOut = async () => {
    setModalError('')
    if (timeSpent === '' || isNaN(Number(timeSpent)) || Number(timeSpent) < 0) {
      setModalError('Time spent must be a valid number (hours)'); return
    }
    setSubmitting(true)
    try {
      const res = await fetch(getApiUrl('/api/products/changes/eco'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: closeModal, ecoId, timeSpent: Number(timeSpent) }),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      setCloseModal(null); setTimeSpent('')
      await fetchRecord()
      onDataChange?.()
    } catch (e: any) { setModalError(e.message) }
    setSubmitting(false)
  }

  const handleRevise = async () => {
    setModalError('')
    if (!reviseNote.trim()) { setModalError('Please describe the revision'); return }
    setSubmitting(true)
    try {
      const res = await fetch(getApiUrl('/api/products/changes/eco'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revise', ecoId, revisionNote: reviseNote }),
      })
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      setReviseModal(false); setReviseNote('')
      await fetchRecord()
      onDataChange?.()
    } catch (e: any) { setModalError(e.message) }
    setSubmitting(false)
  }

  if (loading) return <div className="flex items-center gap-2 py-12 justify-center text-slate-500"><RefreshCw size={18} className="animate-spin" /> Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!record) return <div className="p-6 text-red-600">Record not found</div>

  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS

  const renderTab = (tabId: string) => {
    if (tabId === 'general') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FIELD_GROUPS.general.filter(f => !f.ml).map(f => <Field key={f.field} label={f.label} value={record[f.field]} />)}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Submitted</p>
              <p className="text-sm text-slate-800">{formatDateTime(record.submitted_at)}</p>
            </div>
          </div>
          <div className="space-y-4">
            {FIELD_GROUPS.general.filter(f => f.ml).map(f => <Field key={f.field} label={f.label} value={record[f.field]} ml />)}
          </div>
        </div>
      )
    }
    if (tabId === 'review') {
      const isClosed = ['Completed', 'Canceled', 'Removed'].includes(record.status)
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FIELD_GROUPS.review.filter(f => !f.ml).map(f => <Field key={f.field} label={f.label} value={record[f.field]} />)}
          </div>

          {/* Revise (PPE can update) */}
          {!isClosed && (
            <div className="pt-4 border-t border-slate-100">
              <button onClick={() => { setReviseNote(''); setModalError(''); setReviseModal(true) }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-2">
                <Edit3 size={16} /> Add Revision
              </button>
              <p className="text-xs text-slate-400 mt-1">Stamps Revised On date and appends a note to Comments.</p>
            </div>
          )}

          {/* Close-out buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            {isClosed ? (
              <p className="text-sm text-slate-400 italic">
                This ECO is {record.status.toLowerCase()}{record.cam_operator ? ` — closed by ${record.cam_operator}` : ''}.
              </p>
            ) : (
              <>
                <button onClick={() => { setTimeSpent(''); setModalError(''); setCloseModal('complete') }}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
                  <CheckCircle size={18} /> Complete
                </button>
                <button onClick={() => { setTimeSpent(''); setModalError(''); setCloseModal('cancel') }}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2">
                  <XCircle size={18} /> Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )
    }
    if (tabId === 'signoff') {
      // Timeline: Requested (PPE + creation date) → Closed (CAM Operator + close date)
      const isClosed = ['Completed', 'Canceled', 'Removed'].includes(record.status)
      const queueDays = (() => {
        if (!record.submitted_at) return null
        const start = new Date(record.submitted_at).getTime()
        const end = record.closed_at ? new Date(record.closed_at).getTime() : Date.now()
        if (isNaN(start)) return null
        return Math.floor((end - start) / 86400000)
      })()
      return (
        <div className="space-y-6">
          <h4 className="text-sm font-semibold text-slate-700">Signoff Timeline</h4>
          <div className="space-y-0">
            {/* Requested */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5" />
                <div className="w-0.5 flex-1 bg-slate-200" />
              </div>
              <div className="pb-6">
                <p className="text-sm font-medium text-slate-800">Requested</p>
                <p className="text-xs text-slate-500 mt-0.5">By: {record.ppe || '—'}</p>
                <p className="text-xs text-slate-400">{formatDateTime(record.submitted_at)}</p>
              </div>
            </div>
            {/* Closed (Completed/Canceled/Removed) */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${isClosed ? (record.status === 'Canceled' ? 'bg-red-500' : 'bg-green-500') : 'bg-slate-300'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{isClosed ? record.status : 'Pending Close-out'}</p>
                <p className="text-xs text-slate-500 mt-0.5">By: {record.cam_operator || '—'}</p>
                <p className="text-xs text-slate-400">{isClosed ? formatDateTime(record.closed_at) : 'Not yet closed'}</p>
              </div>
            </div>
          </div>

          {/* Time in queue */}
          <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
            <Clock size={18} className="text-slate-400" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Time in Queue</p>
              <p className="text-sm text-slate-800">
                {queueDays === null ? '—' : queueDays === 0 ? 'Same day' : `${queueDays} day${queueDays !== 1 ? 's' : ''}`}
                {!isClosed && queueDays !== null && <span className="text-slate-400"> (still open)</span>}
              </p>
            </div>
          </div>
        </div>
      )
    }
    if (tabId === 'attachments') {
      const atts = String(record.attachments || '').split(',').map((s: string) => s.trim()).filter(Boolean)
      const mcnAtts = String(record.mcn_attachments || '').split(',').map((s: string) => s.trim()).filter(Boolean)
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Attachments ({atts.length})</h4>
            {atts.length === 0 ? <p className="text-sm text-slate-400 italic">None</p> : (
              <div className="space-y-1">
                {atts.map((a: string) => <div key={a} className="bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-700">{a}</div>)}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">MCN Attachments ({mcnAtts.length})</h4>
            {mcnAtts.length === 0 ? <p className="text-sm text-slate-400 italic">None</p> : (
              <div className="space-y-1">
                {mcnAtts.map((a: string) => <div key={a} className="bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-700">{a}</div>)}
              </div>
            )}
          </div>
        </div>
      )
    }
    // cam, support, admin — simple grids
    const fields = FIELD_GROUPS[tabId] || []
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {fields.filter(f => !f.ml).map(f => <Field key={f.field} label={f.label} value={record[f.field]} />)}
        </div>
        <div className="space-y-4">
          {fields.filter(f => f.ml).map(f => <Field key={f.field} label={f.label} value={record[f.field]} ml />)}
        </div>
        {tabId === 'admin' && (
          <p className="text-xs text-slate-400 italic pt-4 border-t border-slate-100">
            Fields here are uncategorized or system-level. Reassign to other tabs as the workflow is defined.
          </p>
        )}
      </div>
    )
  }

  const idx = navList ? navList.indexOf(ecoId) : -1
  const prevId = idx > 0 ? navList![idx - 1] : null
  const nextId = idx >= 0 && navList && idx < navList.length - 1 ? navList[idx + 1] : null

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} />
          </button>
          {navList && navList.length > 1 && onNavigate && (
            <div className="flex items-center gap-1">
              <button onClick={() => prevId && onNavigate(prevId)} disabled={!prevId}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title={prevId ? `Previous (#${prevId})` : 'No previous'}>
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs text-slate-400 min-w-[3rem] text-center">{idx >= 0 ? `${idx + 1} / ${navList.length}` : ''}</span>
              <button onClick={() => nextId && onNavigate(nextId)} disabled={!nextId}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title={nextId ? `Next (#${nextId})` : 'No next'}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              ECO #{record.id} <StatusBadge status={record.status} />
            </h3>
            <p className="text-sm text-slate-500">{record.request} · {record.subdate}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar tabs */}
        <div className="w-48 border-r border-slate-200 py-2 flex-shrink-0 overflow-y-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                activeTab === t.id ? 'bg-purple-50 text-purple-700 font-medium border-r-2 border-purple-600' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTab(activeTab)}
        </div>
      </div>

      {/* Close-out Modal */}
      {closeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                {closeModal === 'complete'
                  ? <><CheckCircle size={20} className="text-green-600" /> Complete ECO</>
                  : <><XCircle size={20} className="text-red-600" /> Cancel ECO</>}
              </h3>
              <button onClick={() => setCloseModal(null)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle size={16} /> {modalError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time Spent (hours) *</label>
                <input type="number" min="0" step="0.25" value={timeSpent}
                  onChange={e => setTimeSpent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 1.5" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleCloseOut() }} />
              </div>
              <p className="text-xs text-slate-500">
                {closeModal === 'complete'
                  ? 'Marks the ECO Completed. Disposition left blank, close date and CAM operator recorded.'
                  : 'Marks the ECO Canceled. Disposition set to "Cancel", close date and CAM operator recorded.'}
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setCloseModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Back</button>
                <button onClick={handleCloseOut} disabled={submitting}
                  className={`px-6 py-2 text-white rounded-lg font-medium text-sm disabled:opacity-50 ${
                    closeModal === 'complete' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}>
                  {submitting ? 'Processing...' : closeModal === 'complete' ? 'Complete' : 'Cancel ECO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revise Modal */}
      {reviseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Edit3 size={20} className="text-blue-600" /> Add Revision
              </h3>
              <button onClick={() => setReviseModal(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle size={16} /> {modalError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Revision Note *</label>
                <textarea value={reviseNote} onChange={e => setReviseNote(e.target.value)} rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Describe what changed..." autoFocus />
              </div>
              <p className="text-xs text-slate-500">Stamps today's date in Revised On and appends this note to Comments.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setReviseModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button onClick={handleRevise} disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Revision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
