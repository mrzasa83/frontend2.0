'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, MessageSquare, ChevronDown, ChevronRight, CheckCircle, RotateCcw } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { canWriteScope } from '@/lib/config/access'

type Note = { id: number; action_id: number; note_text: string; created_by: string; created_at: string }
type Action = {
  id: number; inspection_id: number; action_text: string; assigned_to: string | null
  status: 'Open' | 'Closed'; created_by: string; created_at: string; notes: Note[]
}


export default function ReviewsTab({ inspectionId }: { inspectionId: number }) {
  const { data: session } = useSession()
  const canEdit = canWriteScope((session?.user?.roles || []) as string[], 'operations/inspections')

  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/operations/inspections/reviews?inspectionId=${inspectionId}`))
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setActions((await res.json()).actions || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [inspectionId])

  useEffect(() => { load() }, [load])

  const post = async (payload: any) => {
    setBusy(true)
    try {
      const res = await fetch(getApiUrl('/api/operations/inspections/reviews'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      return true
    } catch (e: any) { setError(e.message); return false }
    finally { setBusy(false) }
  }

  const addAction = async () => {
    if (!newText.trim()) return
    if (await post({ op: 'addAction', inspectionId, actionText: newText, assignedTo: newAssignee })) {
      setNewText(''); setNewAssignee(''); setShowAdd(false); load()
    }
  }
  const addNote = async (actionId: number) => {
    const text = (noteDrafts[actionId] || '').trim()
    if (!text) return
    if (await post({ op: 'addNote', actionId, noteText: text })) {
      setNoteDrafts(d => ({ ...d, [actionId]: '' })); load()
    }
  }
  const toggleStatus = async (a: Action) => {
    if (await post({ op: 'setStatus', actionId: a.id, status: a.status === 'Open' ? 'Closed' : 'Open' })) load()
  }
  const toggleExpand = (id: number) => setExpanded(s => {
    const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const openCount = actions.filter(a => a.status === 'Open').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-700">Reviews ({actions.length})</h4>
          <p className="text-xs text-slate-500 mt-0.5">{openCount} open · {actions.length - openCount} closed</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowAdd(s => !s)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
            <Plus size={14} /> Add Action
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {showAdd && canEdit && (
        <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
          <textarea value={newText} onChange={e => setNewText(e.target.value)} rows={3} placeholder="Describe the action item..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <div className="flex items-center gap-2">
            <input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="Assigned to (optional)"
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <button onClick={addAction} disabled={busy || !newText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">Add</button>
            <button onClick={() => { setShowAdd(false); setNewText(''); setNewAssignee('') }}
              className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 py-6 text-center">Loading...</p>
      ) : actions.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No review actions yet.</p>
      ) : (
        <div className="space-y-2">
          {actions.map(a => {
            const isOpen = expanded.has(a.id)
            return (
              <div key={a.id} className={`border rounded-lg ${a.status === 'Closed' ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200'}`}>
                <div className="flex items-start gap-2 p-3">
                  <button onClick={() => toggleExpand(a.id)} className="mt-0.5 text-slate-400 hover:text-slate-600">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${a.status === 'Closed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{a.action_text}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {a.created_by} · {new Date(a.created_at).toLocaleDateString()}
                      {a.assigned_to ? ` · assigned: ${a.assigned_to}` : ''}
                      {a.notes.length ? ` · ${a.notes.length} note${a.notes.length > 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'Open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{a.status}</span>
                  {canEdit && (
                    <button onClick={() => toggleStatus(a)} disabled={busy}
                      className="text-slate-400 hover:text-slate-700" title={a.status === 'Open' ? 'Mark closed' : 'Reopen'}>
                      {a.status === 'Open' ? <CheckCircle size={16} /> : <RotateCcw size={16} />}
                    </button>
                  )}
                </div>
                {isOpen && (
                  <div className="px-3 pb-3 pl-9 space-y-2">
                    {a.notes.map(n => (
                      <div key={n.id} className="text-sm bg-white border border-slate-100 rounded px-3 py-2">
                        <p className="text-slate-700 whitespace-pre-wrap">{n.note_text}</p>
                        <p className="text-xs text-slate-400 mt-1">{n.created_by} · {new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <MessageSquare size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                          <input value={noteDrafts[a.id] || ''} onChange={e => setNoteDrafts(d => ({ ...d, [a.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') addNote(a.id) }}
                            placeholder="Add a note..."
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <button onClick={() => addNote(a.id)} disabled={busy || !(noteDrafts[a.id] || '').trim()}
                          className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50">Note</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
