'use client'

import React, { useState, useEffect } from 'react'
import {
  RefreshCw, ArrowLeft, X, Save, Pencil,
  ChevronLeft, ChevronRight
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
  { id: 'support', label: 'Support' },
  { id: 'disposition', label: 'Disposition' },
  { id: 'attachments', label: 'Attachments' },
]
const ADMIN_TAB = { id: 'admin', label: 'Admin' }

// Fields placed in each tab. Admin gets everything not otherwise mapped.
const FIELD_GROUPS: Record<string, { label: string; field: string; ml?: boolean }[]> = {
  general: [
    { label: 'Request', field: 'request' },
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
    { label: 'CAM Operator', field: 'cam_operator' },
    { label: 'How CAM Notified', field: 'how_cam_notified' },
    { label: 'How CAM Notified (Other)', field: 'how_cam_notified_other' },
    { label: 'Number of Replots', field: 'num_replots' },
    { label: 'New Drill/Rout Names', field: 'new_drill_rout_names' },
    { label: 'Tool Number', field: 'toolnum' },
    { label: 'Software', field: 'software' },
    { label: 'Process Route', field: 'process_route' },
    { label: 'Email Route', field: 'email_route' },
    { label: 'Panel X', field: 'panelx' },
    { label: 'Panel Y', field: 'panely' },
    { label: 'CAM Notes', field: 'cam_notes', ml: true },
  ],
  support: [
    { label: 'Support Type', field: 'support_type' },
    { label: 'Support Type (Other)', field: 'support_type_other' },
    { label: 'Support Requester', field: 'support_requester' },
    { label: 'Support Requested By', field: 'support_requested_by' },
    { label: 'Support Requested By (Other)', field: 'support_requested_by_other' },
    { label: 'Charge External Entity', field: 'charge_external_entity' },
    { label: 'Reason Internal ECO', field: 'reason_internal_eco', ml: true },
    { label: 'Reason Internal ECO (Other)', field: 'reason_internal_eco_other', ml: true },
  ],
  disposition: [
    { label: 'Disposition', field: 'disposition' },
    { label: 'Actual Time Spent', field: 'actual_time_spent' },
    { label: 'PPE', field: 'ppe' },
    { label: 'Affects', field: 'affects' },
    { label: 'Affects (Other)', field: 'affects_other' },
    { label: 'Revised On', field: 'revised_on' },
  ],
  // Admin: status + system fields + anything uncertain (reassign as needed)
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
    if (tabId === 'disposition') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FIELD_GROUPS.disposition.filter(f => !f.ml).map(f => <Field key={f.field} label={f.label} value={record[f.field]} />)}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Closed</p>
              <p className="text-sm text-slate-800">{formatDateTime(record.closed_at)}</p>
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
    </div>
  )
}
