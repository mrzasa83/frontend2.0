'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MonitorSmartphone, RefreshCw, Plus, Trash2, ChevronDown, ChevronRight,
  Circle, AlertTriangle, UserCheck,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type UserInfo = { user: string; sessions: number; loggedInSecs: number }
type MachineStatus = {
  id: number; hostname: string; label: string | null
  reachable: boolean; error: string | null; users: UserInfo[]; activeCount: number
}

function fmtAge(secs: number): string {
  if (!secs || secs <= 0) return '—'
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${secs}s`
}

export default function CadWorkstationsPage() {
  const [machines, setMachines] = useState<MachineStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkedAt, setCheckedAt] = useState<string>('')
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newHost, setNewHost] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)

  const loadStatus = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/admin/cad-workstations/status'))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load status')
      setMachines(data.machines || [])
      setCheckedAt(data.checkedAt || '')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  const addMachine = async () => {
    if (!newHost.trim()) return
    setAdding(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/admin/cad-workstations'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: newHost.trim(), label: newLabel.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Add failed')
      setNewHost(''); setNewLabel(''); setShowAdd(false)
      await loadStatus()
    } catch (e: any) { setError(e.message) }
    finally { setAdding(false) }
  }

  const removeMachine = async (id: number, hostname: string) => {
    if (!confirm(`Remove ${hostname} from the list?`)) return
    await fetch(getApiUrl(`/api/admin/cad-workstations?id=${id}`), { method: 'DELETE' })
    await loadStatus()
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-1">
        <MonitorSmartphone size={22} className="text-blue-600" />
        <h1 className="text-xl font-bold text-slate-800">CAD Workstations</h1>
        <span className="text-sm text-slate-500">({machines.length})</span>
        <div className="flex-1" />
        <button onClick={() => setShowAdd(s => !s)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
        <button onClick={loadStatus} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Live view of logged-in users and their processes on each workstation (root and system accounts hidden).
        {checkedAt && <span className="text-slate-400"> · checked {new Date(checkedAt).toLocaleTimeString()}</span>}
      </p>

      {error && <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {showAdd && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-end gap-2 flex-wrap">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Hostname</label>
            <input value={newHost} onChange={e => setNewHost(e.target.value)} placeholder="nh3301rh"
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Label (optional)</label>
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="CAD bay 3"
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button onClick={addMachine} disabled={adding || !newHost.trim()} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {adding ? 'Adding…' : 'Add machine'}
          </button>
        </div>
      )}

      {loading && machines.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-500 py-10 justify-center"><RefreshCw size={18} className="animate-spin" /> Querying workstations…</div>
      ) : machines.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-lg">No workstations yet. Click Add to include one.</div>
      ) : (
        <div className="space-y-2">
          {machines.map(m => {
            const isOpen = expanded[m.id]
            return (
              <div key={m.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))} className="text-slate-400 hover:text-slate-600">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <Circle size={10} className={
                    m.reachable ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'
                  } />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 font-mono">{m.hostname}</span>
                      {m.label && <span className="text-xs text-slate-400">{m.label}</span>}
                    </div>
                    {!m.reachable && <span className="text-xs text-red-500">unreachable: {m.error}</span>}
                  </div>
                  {m.reachable && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-600">
                      <UserCheck size={14} className={m.activeCount > 0 ? 'text-green-600' : 'text-slate-400'} />
                      {m.activeCount === 0 ? 'nobody' : `${m.activeCount} logged in`}
                    </span>
                  )}
                  <button onClick={() => removeMachine(m.id, m.hostname)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded" title="Remove">
                    <Trash2 size={15} />
                  </button>
                </div>

                {isOpen && m.reachable && (
                  <div className="border-t border-slate-100 px-3 py-2">
                    {m.users.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1">Nobody logged in.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-500">
                            <th className="text-left font-medium py-1">User</th>
                            <th className="text-left font-medium py-1">Status</th>
                            <th className="text-right font-medium py-1">Logged in for</th>
                            <th className="text-right font-medium py-1">Sessions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.users.map(u => (
                            <tr key={u.user} className="border-t border-slate-50">
                              <td className="py-1.5 font-mono text-slate-800">{u.user}</td>
                              <td className="py-1.5">
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded"><UserCheck size={11} /> logged in</span>
                              </td>
                              <td className="py-1.5 text-right text-slate-600">{fmtAge(u.loggedInSecs)}</td>
                              <td className="py-1.5 text-right text-slate-400">{u.sessions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
