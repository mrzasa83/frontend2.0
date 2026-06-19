'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, X, ChevronUp, ChevronDown } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

export type Step = { code: string | null; name: string; notes: string }
type Dept = { code: string; name: string; location: string; active: boolean }

export default function StepPicker({ steps, onChange }: {
  steps: Step[]
  onChange: (steps: Step[]) => void
}) {
  const [depts, setDepts] = useState<Dept[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [freeText, setFreeText] = useState('')

  useEffect(() => {
    fetch(getApiUrl('/api/operations/reworks/step-options'))
      .then(r => r.ok ? r.json() : null)
      .then(d => setDepts(d?.departments || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return depts.slice(0, 50)
    return depts.filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)).slice(0, 50)
  }, [depts, filter])

  const addStep = (s: Step) => onChange([...steps, s])
  const addDept = (d: Dept) => addStep({ code: d.code, name: d.name, notes: '' })
  const addFree = () => {
    const t = freeText.trim()
    if (!t) return
    addStep({ code: null, name: t, notes: '' })
    setFreeText('')
  }
  const removeStep = (i: number) => onChange(steps.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const setNotes = (i: number, notes: string) => {
    const next = [...steps]
    next[i] = { ...next[i], notes }
    onChange(next)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Options list */}
      <div className="border border-slate-200 rounded-lg flex flex-col min-h-0">
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search work centers / steps..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div className="overflow-y-auto max-h-72">
          {loading ? (
            <p className="text-xs text-slate-400 p-3">Loading steps…</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-slate-400 p-3">No matches.</p>
          ) : (
            filtered.map((d, i) => (
              <button key={`${d.code}-${i}`} onClick={() => addDept(d)} type="button"
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-blue-50 border-b border-slate-50">
                <span className="min-w-0">
                  <span className="text-slate-800">{d.name}</span>
                  <span className="text-xs text-slate-400 ml-2">{d.code}{d.location ? ` · ${d.location}` : ''}</span>
                </span>
                <Plus size={14} className="text-slate-400 flex-shrink-0" />
              </button>
            ))
          )}
        </div>
        <div className="p-2 border-t border-slate-100 flex items-center gap-2">
          <input value={freeText} onChange={e => setFreeText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFree() } }}
            placeholder="…or type a custom step"
            className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <button type="button" onClick={addFree} disabled={!freeText.trim()}
            className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50">Add</button>
        </div>
      </div>

      {/* Selected steps */}
      <div className="border border-slate-200 rounded-lg flex flex-col">
        <div className="px-3 py-2 border-b border-slate-100 text-xs font-medium text-slate-600">
          Rework Steps ({steps.length})
        </div>
        <div className="overflow-y-auto max-h-[22rem] divide-y divide-slate-100">
          {steps.length === 0 ? (
            <p className="text-xs text-slate-400 p-3">No steps yet. Pick from the list or add custom steps.</p>
          ) : (
            steps.map((s, i) => (
              <div key={i} className="p-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-400 mt-1 w-5 text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-800">{s.name}</span>
                      {s.code && <span className="text-xs text-slate-400">{s.code}</span>}
                    </div>
                    <input value={s.notes} onChange={e => setNotes(i, e.target.value)}
                      placeholder="Parameters / instructions (optional)"
                      className="mt-1 w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ChevronDown size={14} /></button>
                  </div>
                  <button type="button" onClick={() => removeStep(i)} className="text-slate-300 hover:text-red-500 mt-0.5"><X size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
