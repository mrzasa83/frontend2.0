'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, ChevronDown, ChevronRight, Tag } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

interface DeptPattern {
  id: number
  discipline_id: number
  dept_code_pattern: string
  note: string | null
}

interface Discipline {
  id: number
  name: string
  description: string | null
  sort_order: number
  active: number
  patterns: DeptPattern[]
}

export default function ScrapDisciplinesPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // New discipline form
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // New pattern form (keyed by discipline id)
  const [newPattern, setNewPattern] = useState<Record<number, string>>({})
  const [newPatternNote, setNewPatternNote] = useState<Record<number, string>>({})

  // Edit state
  const [editing, setEditing] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSort, setEditSort] = useState(0)

  useEffect(() => {
    fetchDisciplines()
  }, [])

  const fetchDisciplines = async () => {
    try {
      const res = await fetch(getApiUrl('/api/admin/scrap-disciplines'))
      if (res.ok) {
        const data = await res.json()
        setDisciplines(data.disciplines)
        // Auto-expand all on first load
        if (expanded.size === 0) {
          setExpanded(new Set(data.disciplines.map((d: Discipline) => d.id)))
        }
      }
    } catch (err) {
      setError('Failed to load disciplines')
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const addDiscipline = async () => {
    if (!newName.trim()) return
    try {
      const res = await fetch(getApiUrl('/api/admin/scrap-disciplines'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addDiscipline',
          name: newName.trim(),
          description: newDesc.trim() || null,
          sort_order: disciplines.length + 1
        })
      })
      if (res.ok) {
        setNewName('')
        setNewDesc('')
        showSuccess('Discipline added')
        fetchDisciplines()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add')
      }
    } catch (err) {
      setError('Failed to add discipline')
    }
  }

  const addPattern = async (disciplineId: number) => {
    const pattern = newPattern[disciplineId]?.trim()
    if (!pattern) return
    try {
      const res = await fetch(getApiUrl('/api/admin/scrap-disciplines'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPattern',
          discipline_id: disciplineId,
          dept_code_pattern: pattern,
          note: newPatternNote[disciplineId]?.trim() || null
        })
      })
      if (res.ok) {
        setNewPattern(prev => ({ ...prev, [disciplineId]: '' }))
        setNewPatternNote(prev => ({ ...prev, [disciplineId]: '' }))
        showSuccess('Pattern added')
        fetchDisciplines()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add pattern')
      }
    } catch (err) {
      setError('Failed to add pattern')
    }
  }

  const deletePattern = async (patternId: number) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/scrap-disciplines?type=pattern&id=${patternId}`), {
        method: 'DELETE'
      })
      if (res.ok) {
        showSuccess('Pattern removed')
        fetchDisciplines()
      }
    } catch (err) {
      setError('Failed to delete pattern')
    }
  }

  const deleteDiscipline = async (id: number) => {
    if (!confirm('Delete this discipline and all its patterns?')) return
    try {
      const res = await fetch(getApiUrl(`/api/admin/scrap-disciplines?type=discipline&id=${id}`), {
        method: 'DELETE'
      })
      if (res.ok) {
        showSuccess('Discipline deleted')
        fetchDisciplines()
      }
    } catch (err) {
      setError('Failed to delete')
    }
  }

  const startEdit = (d: Discipline) => {
    setEditing(d.id)
    setEditName(d.name)
    setEditDesc(d.description || '')
    setEditSort(d.sort_order)
  }

  const saveEdit = async (id: number) => {
    try {
      const res = await fetch(getApiUrl('/api/admin/scrap-disciplines'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          description: editDesc.trim() || null,
          sort_order: editSort,
          active: 1
        })
      })
      if (res.ok) {
        setEditing(null)
        showSuccess('Updated')
        fetchDisciplines()
      }
    } catch (err) {
      setError('Failed to update')
    }
  }

  const toggleExpand = (id: number) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-40 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Scrap Discipline Groupings</h1>
        <p className="text-sm text-slate-600 mt-1">
          Map Paradigm DEPT CODEs to discipline groups for scrap run charts and Pareto analysis.
          Patterns use SQL LIKE syntax (e.g., <code className="bg-slate-100 px-1 rounded">D-%</code> matches all Drill dept codes).
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Add new discipline */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Discipline</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g., Drill"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="e.g., Drilling & Routing (D-, R-)"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={addDiscipline}
            disabled={!newName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Discipline list */}
      <div className="space-y-3">
        {disciplines.map(d => (
          <div key={d.id} className="border border-slate-200 rounded-lg bg-white">
            {/* Discipline header */}
            <div className="flex items-center gap-3 p-4">
              <button onClick={() => toggleExpand(d.id)} className="text-slate-400 hover:text-slate-600">
                {expanded.has(d.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              {editing === d.id ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded text-sm w-40" />
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded text-sm flex-1" placeholder="Description" />
                  <label className="text-xs text-slate-500">Order:</label>
                  <input type="number" value={editSort} onChange={e => setEditSort(parseInt(e.target.value) || 0)}
                    className="px-2 py-1 border border-slate-300 rounded text-sm w-16" />
                  <button onClick={() => saveEdit(d.id)} className="text-green-600 hover:text-green-700">
                    <Save size={16} />
                  </button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-3">
                  <span className="font-semibold text-slate-800">{d.name}</span>
                  <span className="text-sm text-slate-500">{d.description}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {d.patterns.length} pattern{d.patterns.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-slate-400">#{d.sort_order}</span>
                </div>
              )}

              {editing !== d.id && (
                <div className="flex gap-2">
                  <button onClick={() => startEdit(d)} className="text-slate-400 hover:text-blue-600 text-sm">Edit</button>
                  <button onClick={() => deleteDiscipline(d.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Patterns */}
            {expanded.has(d.id) && (
              <div className="px-4 pb-4 pl-12">
                {d.patterns.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {d.patterns.map(p => (
                      <div key={p.id} className="flex items-center gap-3 py-1 px-3 bg-slate-50 rounded text-sm">
                        <Tag size={14} className="text-slate-400" />
                        <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono text-xs">
                          {p.dept_code_pattern}
                        </code>
                        {p.note && <span className="text-slate-500 text-xs">{p.note}</span>}
                        <button onClick={() => deletePattern(p.id)} className="ml-auto text-slate-300 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add pattern */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newPattern[d.id] || ''}
                    onChange={e => setNewPattern(prev => ({ ...prev, [d.id]: e.target.value }))}
                    placeholder="D-%"
                    className="px-2 py-1 border border-slate-300 rounded text-sm w-28 font-mono"
                  />
                  <input
                    type="text"
                    value={newPatternNote[d.id] || ''}
                    onChange={e => setNewPatternNote(prev => ({ ...prev, [d.id]: e.target.value }))}
                    placeholder="Note (optional)"
                    className="px-2 py-1 border border-slate-300 rounded text-sm flex-1"
                  />
                  <button
                    onClick={() => addPattern(d.id)}
                    disabled={!newPattern[d.id]?.trim()}
                    className="px-3 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-700 disabled:opacity-50"
                  >
                    + Pattern
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {disciplines.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            No disciplines configured. Run the SQL migration first, or add one above.
          </p>
        )}
      </div>
    </div>
  )
}
