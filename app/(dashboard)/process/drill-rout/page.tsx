'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Zap, Plus, Edit3, Trash2, Save, X, RefreshCw } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Condition = {
  field: string
  op: string
  value: string
  logic: string
}

type SavedSearch = {
  id: number
  name: string
  description: string | null
  conditions: Condition[]
  created_by: string
}

const EMPTY_CONDITION: Condition = { field: 'change', op: 'contains', value: '', logic: 'OR' }

function SearchEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: SavedSearch
  onSave: (data: { name: string; description: string; conditions: Condition[] }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [conditions, setConditions] = useState<Condition[]>(
    initial?.conditions?.length ? initial.conditions : [{ ...EMPTY_CONDITION }]
  )

  const updateCondition = (i: number, field: string, value: string) => {
    setConditions(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  const addCondition = () => {
    setConditions(prev => [...prev, { ...EMPTY_CONDITION }])
  }

  const removeCondition = (i: number) => {
    if (conditions.length <= 1) return
    setConditions(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        {initial ? 'Edit Search' : 'New Search'}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Rout - Speed/Feed Change"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <input
            type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <label className="block text-xs font-medium text-slate-600 mb-2">Conditions</label>
      <div className="space-y-2 mb-4">
        {conditions.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <select
                value={conditions[i - 1].logic}
                onChange={e => updateCondition(i - 1, 'logic', e.target.value)}
                className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            )}
            {i === 0 && <div className="w-16" />}
            <select
              value={c.field}
              onChange={e => updateCondition(i, 'field', e.target.value)}
              className="w-32 px-2 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="change">change</option>
              <option value="chngeffect">chngeffect</option>
            </select>
            <select
              value={c.op}
              onChange={e => updateCondition(i, 'op', e.target.value)}
              className="w-28 px-2 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="contains">contains</option>
              <option value="equals">equals</option>
              <option value="startsWith">starts with</option>
            </select>
            <input
              type="text"
              value={c.value}
              onChange={e => updateCondition(i, 'value', e.target.value)}
              placeholder="search value"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={() => removeCondition(i)}
              disabled={conditions.length <= 1}
              className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addCondition} className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1">
        <Plus size={14} /> Add Condition
      </button>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
          Cancel
        </button>
        <button
          onClick={() => onSave({ name, description, conditions })}
          disabled={!name.trim() || conditions.some(c => !c.value.trim())}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={14} /> Save
        </button>
      </div>
    </div>
  )
}

export default function DrillRoutPage() {
  const { data: session } = useSession()
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<SavedSearch | null>(null)
  const [creating, setCreating] = useState(false)

  const isProcessEng = session?.user?.roles?.some(
    (r: string) => ['Admin', 'ProcessEng'].includes(r)
  )

  const fetchSearches = async () => {
    setLoading(true)
    try {
      const res = await fetch(getApiUrl('/api/process/drill-rout/searches'))
      if (res.ok) {
        const data = await res.json()
        setSearches(data.searches || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSearches() }, [])

  const handleSave = async (data: { name: string; description: string; conditions: Condition[] }) => {
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { id: editing.id, ...data } : data
    const res = await fetch(getApiUrl('/api/process/drill-rout/searches'), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setEditing(null)
      setCreating(false)
      await fetchSearches()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this saved search?')) return
    await fetch(getApiUrl(`/api/process/drill-rout/searches?id=${id}`), { method: 'DELETE' })
    await fetchSearches()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Drill / Rout</h2>
          <p className="text-slate-600">Engineering change management for drill and rout operations</p>
        </div>
        {isProcessEng && !creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> New Search
          </button>
        )}
      </div>

      {/* Editor */}
      {creating && (
        <SearchEditor onSave={handleSave} onCancel={() => setCreating(false)} />
      )}
      {editing && (
        <SearchEditor initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}

      {/* Search cards */}
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-500">
          <RefreshCw size={18} className="animate-spin" /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searches.map(s => (
            <div key={s.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 relative group">
              <Link href={`/process/drill-rout/rout-speed-feed?searchId=${s.id}`}>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Zap className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{s.name}</h3>
                <p className="text-sm text-slate-600">{s.description || `${s.conditions.length} conditions`}</p>
                <p className="text-xs text-slate-400 mt-2">by {s.created_by}</p>
              </Link>
              {isProcessEng && !creating && !editing && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={e => { e.preventDefault(); setEditing(s) }}
                    className="p-1.5 bg-white rounded shadow hover:bg-slate-50"
                    title="Edit"
                  >
                    <Edit3 size={14} className="text-slate-500" />
                  </button>
                  <button
                    onClick={e => { e.preventDefault(); handleDelete(s.id) }}
                    className="p-1.5 bg-white rounded shadow hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
