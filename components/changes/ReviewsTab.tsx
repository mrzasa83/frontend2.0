'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus, MessageSquare, ChevronDown, ChevronRight, CheckCircle, XCircle,
  Clock, X, Shield, AlertTriangle
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Action = {
  id: number; escf_id: number; action_text: string; owner: string | null
  assigned_to: string | null; due_date: string | null; status: string
  created_by: string; created_at: string
}
type Comment = {
  id: number; action_id: number; comment_text: string
  created_by: string; created_at: string
}

// ─── Software checkboxes ─────────────────────────────────────────
const SOFTWARE_GROUPS = [
  { label: 'Control Center', prefix: 'CC', options: ['Addition', 'Edit', 'Deletion', 'Other'] },
  { label: 'Genesis Scripting', prefix: 'GEN', options: ['Artwork', 'Drill', 'Rout', 'Other'] },
  { label: 'Paradigm', prefix: 'PDGM', options: ['Addition', 'Edit', 'Deletion', 'Other'] },
]

// Parse "Add EMLD,Edit PDGM" → { 'Add EMLD': true, 'Edit PDGM': true }
function parseSoftware(val: string | null): Record<string, boolean> {
  if (!val) return {}
  const map: Record<string, boolean> = {}
  val.split(',').forEach(s => { if (s.trim()) map[s.trim()] = true })
  return map
}
// Build back: { 'Add EMLD': true, 'Edit PDGM': true } → "Add EMLD,Edit PDGM"
function buildSoftwareString(selected: Record<string, boolean>, otherTexts: Record<string, string>): string {
  const parts: string[] = []
  // Map UI labels to DB format
  const labelMap: Record<string, string> = {
    'Addition': 'Add', 'Edit': 'Edit', 'Deletion': 'Delete',
    'Artwork': 'A/W', 'Drill': 'Drill', 'Rout': 'Rout', 'Other': 'Other'
  }
  const suffixMap: Record<string, string> = {
    'CC': 'CC', 'GEN': 'GEN', 'PDGM': 'PDGM', 'EMLD': 'EMLD'
  }

  for (const [key, val] of Object.entries(selected)) {
    if (val) parts.push(key)
  }
  return parts.join(',')
}

// ─── Modal wrapper ───────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" /> {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Main ReviewsTab ─────────────────────────────────────────────
export default function ReviewsTab({ escfId, record, isAdmin, onRefresh }: {
  escfId: number; record: any; isAdmin: boolean; onRefresh: () => void
}) {
  const [actions, setActions] = useState<Action[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set())
  const [users, setUsers] = useState<{ username: string; name: string }[]>([])

  // New action form
  const [showAddAction, setShowAddAction] = useState(false)
  const [newAction, setNewAction] = useState({ text: '', owner: '', assigned: '', dueDate: '' })
  const [newComment, setNewComment] = useState<Record<number, string>>({})

  // Modals
  const [approveModal, setApproveModal] = useState<'approve' | 'disapprove' | null>(null)
  const [implementModal, setImplementModal] = useState(false)
  const [modalPassword, setModalPassword] = useState('')
  const [modalComment, setModalComment] = useState('')
  const [modalCostImpact, setModalCostImpact] = useState(false)
  const [modalCostAmount, setModalCostAmount] = useState('')
  const [modalPrevTooled, setModalPrevTooled] = useState('')
  const [modalSoftware, setModalSoftware] = useState<Record<string, boolean>>({})
  const [modalOtherText, setModalOtherText] = useState<Record<string, string>>({})
  const [modalPpeCost, setModalPpeCost] = useState(false)
  const [modalPpeAmount, setModalPpeAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const computedStatus = (() => {
    const s = Number(record.escf_status)
    const d = (record.pe_disposition || '').trim()
    if (s === 2) return 'Rejected'
    if (!d && s === 0) return 'Pending'
    if (d === 'Approved' && s === 1) return 'Implemented'
    if (d === 'Approved' && s === 0) return 'Approved'
    return 'Legacy'
  })()

  const fetchActions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(getApiUrl(`/api/products/changes/standards/actions?escfId=${escfId}`))
      if (res.ok) {
        const r = await res.json()
        setActions(r.actions || [])
        setComments(r.comments || [])
        if (r.users) {
          setUsers(r.users.map((u: any) => ({
            username: u.username,
            name: u.name || u.username,
          })))
        }
      }
    } catch {}
    setLoading(false)
  }, [escfId])

  useEffect(() => { fetchActions() }, [fetchActions])

  const handleAddAction = async () => {
    if (!newAction.text.trim()) return
    try {
      await fetch(getApiUrl('/api/products/changes/standards/actions'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createAction', escfId,
          actionText: newAction.text, owner: newAction.owner,
          assignedTo: newAction.assigned, dueDate: newAction.dueDate || null
        }),
      })
      setNewAction({ text: '', owner: '', assigned: '', dueDate: '' })
      setShowAddAction(false)
      fetchActions()
    } catch {}
  }

  const handleAddComment = async (actionId: number) => {
    const text = newComment[actionId]?.trim()
    if (!text) return
    try {
      await fetch(getApiUrl('/api/products/changes/standards/actions'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addComment', escfId, actionId, commentText: text }),
      })
      setNewComment(prev => ({ ...prev, [actionId]: '' }))
      fetchActions()
    } catch {}
  }

  const handleStatusChange = async (actionId: number, status: string) => {
    try {
      await fetch(getApiUrl('/api/products/changes/standards/actions'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateActionStatus', escfId, actionId, status }),
      })
      fetchActions()
    } catch {}
  }

  const handleApproveSubmit = async () => {
    if (!modalPassword) { setModalError('Password required'); return }
    if (approveModal === 'approve' && !modalPrevTooled.trim()) {
      setModalError('Previous Tooled Disposition is required for approval'); return
    }
    setSubmitting(true); setModalError('')
    try {
      // Verify password via login API
      const authRes = await fetch(getApiUrl('/api/auth/verify'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: modalPassword }),
      })
      if (!authRes.ok) { setModalError('Invalid password'); setSubmitting(false); return }

      await fetch(getApiUrl('/api/products/changes/standards/actions'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approveModal, escfId,
          comment: modalComment, peCostImpact: modalCostImpact,
          peCostAmount: modalCostAmount, prevTooledDis: modalPrevTooled,
        }),
      })
      setApproveModal(null)
      resetModal()
      onRefresh()
      fetchActions()
    } catch (e: any) { setModalError(e.message) }
    setSubmitting(false)
  }

  const handleImplementSubmit = async () => {
    if (!modalPassword) { setModalError('Password required'); return }
    setSubmitting(true); setModalError('')
    try {
      const authRes = await fetch(getApiUrl('/api/auth/verify'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: modalPassword }),
      })
      if (!authRes.ok) { setModalError('Invalid password'); setSubmitting(false); return }

      const softwareStr = buildSoftwareString(modalSoftware, modalOtherText)
      await fetch(getApiUrl('/api/products/changes/standards/actions'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'implement', escfId,
          software: softwareStr, comment: modalComment,
          ppeCostImpact: modalPpeCost, ppeCostAmount: modalPpeAmount,
        }),
      })
      setImplementModal(false)
      resetModal()
      onRefresh()
    } catch (e: any) { setModalError(e.message) }
    setSubmitting(false)
  }

  const resetModal = () => {
    setModalPassword(''); setModalComment(''); setModalCostImpact(false)
    setModalCostAmount(''); setModalPrevTooled(''); setModalError('')
    setModalSoftware(parseSoftware(record.software))
    setModalOtherText({}); setModalPpeCost(false); setModalPpeAmount('')
  }

  const toggleExpand = (id: number) => {
    setExpandedActions(prev => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
    })
  }

  const getActionComments = (actionId: number) => comments.filter(c => c.action_id === actionId)

  const statusIcon = (s: string) => {
    if (s === 'Complete') return <CheckCircle size={14} className="text-green-500" />
    if (s === 'Canceled') return <XCircle size={14} className="text-red-400" />
    return <Clock size={14} className="text-yellow-500" />
  }

  const statusColor = (s: string) => {
    if (s === 'Complete') return 'bg-green-100 text-green-700'
    if (s === 'Canceled') return 'bg-red-100 text-red-600'
    return 'bg-yellow-100 text-yellow-700'
  }

  const canApprove = computedStatus === 'Pending' && isAdmin
  const canImplement = computedStatus === 'Approved' && isAdmin
  const actionsActive = computedStatus !== 'Implemented'

  return (
    <div className="space-y-6">
      {/* ─── Actions Table ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700">Actions ({actions.length})</h4>
          {actionsActive && isAdmin && (
            <button onClick={() => setShowAddAction(!showAddAction)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-blue-700">
              <Plus size={14} /> Add Action
            </button>
          )}
        </div>

        {/* Add action form */}
        {showAddAction && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 space-y-3">
            <input type="text" value={newAction.text} onChange={e => setNewAction(p => ({ ...p, text: e.target.value }))}
              placeholder="Action description..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <div className="grid grid-cols-3 gap-3">
              <select value={newAction.owner} onChange={e => setNewAction(p => ({ ...p, owner: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                <option value="">Owner...</option>
                {users.map(u => <option key={u.username} value={u.name}>{u.name}</option>)}
              </select>
              <select value={newAction.assigned} onChange={e => setNewAction(p => ({ ...p, assigned: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                <option value="">Assigned to...</option>
                {users.map(u => <option key={u.username} value={u.name}>{u.name}</option>)}
              </select>
              <input type="date" value={newAction.dueDate} onChange={e => setNewAction(p => ({ ...p, dueDate: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddAction} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
              <button onClick={() => setShowAddAction(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Actions list */}
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {actions.length === 0 ? (
            <p className="p-4 text-sm text-slate-400 italic">No actions yet</p>
          ) : actions.map(a => {
            const ac = getActionComments(a.id)
            const expanded = expandedActions.has(a.id)
            return (
              <div key={a.id}>
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                  <button onClick={() => toggleExpand(a.id)} className="mt-1 text-slate-400 hover:text-slate-600">
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{a.action_text}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      {a.owner && <span>Owner: {a.owner}</span>}
                      {a.assigned_to && <span>→ {a.assigned_to}</span>}
                      {a.due_date && <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                      <span>{a.created_by} · {new Date(a.created_at).toLocaleDateString()}</span>
                      {ac.length > 0 && (
                        <span className="flex items-center gap-1"><MessageSquare size={12} /> {ac.length}</span>
                      )}
                    </div>
                  </div>
                  {actionsActive && isAdmin && (
                    <select value={a.status} onChange={e => handleStatusChange(a.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border-0 font-medium ${statusColor(a.status)}`}>
                      <option value="Open">Open</option>
                      <option value="Complete">Complete</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  )}
                  {!actionsActive && (
                    <span className={`text-xs px-2 py-1 rounded font-medium inline-flex items-center gap-1 ${statusColor(a.status)}`}>
                      {statusIcon(a.status)} {a.status}
                    </span>
                  )}
                </div>

                {/* Comments */}
                {expanded && (
                  <div className="pl-12 pr-4 pb-3 space-y-2">
                    {ac.map(c => (
                      <div key={c.id} className="bg-slate-50 rounded p-2 text-sm">
                        <p className="text-slate-700">{c.comment_text}</p>
                        <p className="text-xs text-slate-400 mt-1">{c.created_by} · {new Date(c.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                    {actionsActive && (
                      <div className="flex gap-2">
                        <input type="text" value={newComment[a.id] || ''}
                          onChange={e => setNewComment(p => ({ ...p, [a.id]: e.target.value }))}
                          placeholder="Add a comment..." className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm"
                          onKeyDown={e => { if (e.key === 'Enter') handleAddComment(a.id) }} />
                        <button onClick={() => handleAddComment(a.id)}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs font-medium">Post</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Approve / Disapprove / Implement buttons ────────── */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        {canApprove && (
          <>
            <button onClick={() => { resetModal(); setApproveModal('approve') }}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
              <CheckCircle size={18} /> Approve
            </button>
            <button onClick={() => { resetModal(); setApproveModal('disapprove') }}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2">
              <XCircle size={18} /> Disapprove
            </button>
          </>
        )}
        {canImplement && (
          <button onClick={() => { resetModal(); setModalSoftware(parseSoftware(record.software)); setImplementModal(true) }}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
            <CheckCircle size={18} /> Implement
          </button>
        )}
        {!canApprove && !canImplement && (
          <p className="text-sm text-slate-400 italic">
            {computedStatus === 'Implemented' ? 'This standard has been implemented.' :
             computedStatus === 'Rejected' ? 'This standard was rejected.' :
             'No actions available for current status.'}
          </p>
        )}
      </div>

      {/* ─── Approve/Disapprove Modal ────────────────────────── */}
      <Modal open={!!approveModal} onClose={() => setApproveModal(null)}
        title={approveModal === 'approve' ? 'Approve Standard' : 'Disapprove Standard'}>
        <div className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> {modalError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">System Password *</label>
            <input type="password" value={modalPassword} onChange={e => setModalPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Enter your password" />
          </div>

          {approveModal === 'approve' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Previous Tooled Disposition *</label>
              <input type="text" value={modalPrevTooled} onChange={e => setModalPrevTooled(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Required for approval" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
            <textarea value={modalComment} onChange={e => setModalComment(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Reason or notes..." />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={modalCostImpact} onChange={e => setModalCostImpact(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600" />
              <span className="text-sm text-slate-700">PE Cost Impact</span>
            </label>
            {modalCostImpact && (
              <input type="text" value={modalCostAmount} onChange={e => setModalCostAmount(e.target.value)}
                placeholder="Enter amount" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setApproveModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
            <button onClick={handleApproveSubmit} disabled={submitting}
              className={`px-6 py-2 text-white rounded-lg font-medium text-sm disabled:opacity-50 ${
                approveModal === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}>
              {submitting ? 'Processing...' : approveModal === 'approve' ? 'Approve' : 'Disapprove'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Implement Modal ─────────────────────────────────── */}
      <Modal open={implementModal} onClose={() => setImplementModal(false)} title="Implement Standard">
        <div className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> {modalError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">System Password *</label>
            <input type="password" value={modalPassword} onChange={e => setModalPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Enter your password" />
          </div>

          {/* Software Affected */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Software Affected</p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              {SOFTWARE_GROUPS.map(group => (
                <div key={group.prefix} className="flex items-center gap-4">
                  <span className="text-xs font-medium text-slate-600 w-32">{group.label}:</span>
                  <div className="flex items-center gap-4 flex-wrap">
                    {group.options.map(opt => {
                      const key = `${opt === 'Addition' ? 'Add' : opt === 'Deletion' ? 'Delete' : opt === 'Artwork' ? 'A/W' : opt} ${group.prefix === 'CC' ? 'EMLD' : group.prefix}`
                      return (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={!!modalSoftware[key]}
                            onChange={e => setModalSoftware(p => ({ ...p, [key]: e.target.checked }))}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600" />
                          <span className="text-xs text-slate-600">{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-600 w-32">Other:</span>
                <input type="text" value={modalOtherText['other'] || ''}
                  onChange={e => setModalOtherText(p => ({ ...p, other: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm" placeholder="Other software..." />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={modalPpeCost} onChange={e => setModalPpeCost(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600" />
              <span className="text-sm text-slate-700">Front End Cost Impact</span>
            </label>
            {modalPpeCost && (
              <input type="text" value={modalPpeAmount} onChange={e => setModalPpeAmount(e.target.value)}
                placeholder="Enter amount" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
            <textarea value={modalComment} onChange={e => setModalComment(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setImplementModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
            <button onClick={handleImplementSubmit} disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Processing...' : 'Implement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
