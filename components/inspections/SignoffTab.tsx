'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle2, Circle, Lock, X, ShieldCheck } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Signoff = { phase: string; approved_by: string; approved_at: string; note: string | null }

const SIGNOFF_ROLES = ['Admin', 'Quality Control']
// Phases that participate in the signoff pipeline (Rework/Canceled are off-pipeline)
const PIPELINE = ['Setup', 'Measurement', 'Verify', 'Submitted', 'Completed']

export default function SignoffTab({ inspectionId, currentPhase, onChanged }: {
  inspectionId: number; currentPhase: string; onChanged?: () => void
}) {
  const { data: session } = useSession()
  const canSignoff = ((session?.user?.roles || []) as string[]).some(r => SIGNOFF_ROLES.includes(r))

  const [signoffs, setSignoffs] = useState<Signoff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/operations/inspections/signoff?inspectionId=${inspectionId}`))
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setSignoffs((await res.json()).signoffs || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [inspectionId])

  useEffect(() => { load() }, [load])

  const signoffFor = (phase: string) => signoffs.find(s => s.phase === phase)
  const currentIdx = PIPELINE.indexOf(currentPhase)
  const isTerminal = ['Completed', 'Canceled'].includes(currentPhase)
  const canApproveNow = canSignoff && currentIdx >= 0 && currentPhase !== 'Completed' && currentPhase !== 'Canceled'

  const approve = async () => {
    if (!password) { setModalError('Password is required'); return }
    setSubmitting(true); setModalError('')
    try {
      const res = await fetch(getApiUrl('/api/operations/inspections/signoff'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionId, password, note }),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || 'Sign-off failed')
      setShowModal(false); setPassword(''); setNote('')
      await load()
      onChanged?.()
    } catch (e: any) { setModalError(e.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-700">Signoff Timeline</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTerminal ? `Inspection is ${currentPhase}.` : `Current phase: ${currentPhase}`}
          </p>
        </div>
        {canApproveNow && (
          <button onClick={() => { setModalError(''); setPassword(''); setNote(''); setShowModal(true) }}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5">
            <ShieldCheck size={15} /> Approve {currentPhase}
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <p className="text-sm text-slate-400 py-6 text-center">Loading...</p>
      ) : (
        <ol className="relative border-l-2 border-slate-200 ml-3 space-y-6 py-2">
          {PIPELINE.map((phase, i) => {
            const so = signoffFor(phase)
            const done = !!so
            const isCurrent = phase === currentPhase
            return (
              <li key={phase} className="ml-6">
                <span className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white ${
                  done ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-slate-300'
                }`}>
                  {done ? <CheckCircle2 size={12} className="text-white" /> : <Circle size={8} className="text-white" />}
                </span>
                <div className="flex items-center gap-2">
                  <h5 className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : done ? 'text-slate-700' : 'text-slate-400'}`}>{phase}</h5>
                  {isCurrent && !isTerminal && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">current</span>}
                  {done && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">signed</span>}
                </div>
                {so ? (
                  <p className="text-xs text-slate-500 mt-1">
                    {so.approved_by} · {new Date(so.approved_at).toLocaleString()}
                    {so.note ? <span className="block text-slate-600 mt-0.5 italic">“{so.note}”</span> : null}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">{i < currentIdx ? 'Not recorded' : 'Pending'}</p>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {!canSignoff && (
        <p className="text-xs text-slate-400 flex items-center gap-1"><Lock size={12} /> Only Quality Control or Admin can sign off a stage.</p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><ShieldCheck size={18} className="text-green-600" /> Approve “{currentPhase}”</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">
                Signing off advances this inspection to the next phase. Enter your password to confirm.
              </p>
              {modalError && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{modalError}</div>}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
                <input type="password" value={password} autoFocus
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') approve() }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Note (optional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
              <button onClick={() => setShowModal(false)} disabled={submitting}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={approve} disabled={submitting || !password}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5">
                <ShieldCheck size={15} /> {submitting ? 'Verifying...' : 'Approve & Advance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
