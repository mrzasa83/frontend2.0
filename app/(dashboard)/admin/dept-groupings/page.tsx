'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Grouping = {
  id: number
  prefix: string
  discipline: string
  description: string | null
  sort_order: number
  active: number
}

export default function DeptGroupingsPage() {
  const [groupings, setGroupings] = useState<Grouping[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newRow, setNewRow] = useState({ prefix: '', discipline: '', description: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchGroupings() }, [])

  const fetchGroupings = async () => {
    try {
      const res = await fetch(getApiUrl('/api/admin/dept-groupings'))
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setGroupings(data.groupings)
    } catch (err) {
      setError('Failed to load department groupings')
    } finally {
      setLoading(false)
    }
  }

  const updateGrouping = async (g: Grouping) => {
    setSaving(g.id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(getApiUrl('/api/admin/dept-groupings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(g),
      })
      if (!res.ok) throw new Error('Failed to update')
      setSuccess(`Updated "${g.prefix}" → ${g.discipline}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to update grouping')
    } finally {
      setSaving(null)
    }
  }

  const addGrouping = async () => {
    if (!newRow.prefix || !newRow.discipline) {
      setError('Prefix and discipline are required')
      return
    }
    setAdding(true)
    setError('')
    try {
      const res = await fetch(getApiUrl('/api/admin/dept-groupings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: newRow.prefix,
          discipline: newRow.discipline,
          description: newRow.description,
          sort_order: groupings.length + 1,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add')
      }
      setNewRow({ prefix: '', discipline: '', description: '' })
      await fetchGroupings()
      setSuccess('Grouping added')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to add grouping')
    } finally {
      setAdding(false)
    }
  }

  const toggleActive = async (g: Grouping) => {
    const updated = { ...g, active: g.active ? 0 : 1 }
    setGroupings(prev => prev.map(x => x.id === g.id ? updated : x))
    await updateGrouping(updated)
  }

  const handleFieldChange = (id: number, field: keyof Grouping, value: string | number) => {
    setGroupings(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Department Groupings</h1>
        <p className="text-sm text-slate-600 mt-1">
          Map Paradigm department code prefixes to discipline groups for scrap run charts.
          The prefix is the first letter of the DEPT CODE (e.g. D-HIT10A-W → prefix "D" → Drill).
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-medium text-slate-600 w-20">Prefix</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 w-40">Discipline</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Description</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 w-20">Order</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600 w-20">Active</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600 w-20">Save</th>
            </tr>
          </thead>
          <tbody>
            {groupings.map(g => (
              <tr key={g.id} className={`border-b border-slate-100 ${!g.active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2">
                  <span className="inline-block bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded text-center w-8">
                    {g.prefix}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={g.discipline}
                    onChange={e => handleFieldChange(g.id, 'discipline', e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={g.description || ''}
                    onChange={e => handleFieldChange(g.id, 'description', e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={g.sort_order}
                    onChange={e => handleFieldChange(g.id, 'sort_order', parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-slate-200 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => toggleActive(g)}
                    className={`${g.active ? 'text-green-600' : 'text-slate-400'} hover:opacity-70`}
                    title={g.active ? 'Active — click to disable' : 'Inactive — click to enable'}
                  >
                    {g.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => updateGrouping(g)}
                    disabled={saving === g.id}
                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    title="Save changes"
                  >
                    <Save size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {/* Add new row */}
            <tr className="bg-blue-50/50">
              <td className="px-4 py-2">
                <input
                  type="text"
                  maxLength={1}
                  value={newRow.prefix}
                  onChange={e => setNewRow(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                  placeholder="X"
                  className="w-8 px-2 py-1 border border-slate-300 rounded text-sm text-center font-mono font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={newRow.discipline}
                  onChange={e => setNewRow(prev => ({ ...prev, discipline: e.target.value }))}
                  placeholder="Discipline name"
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={newRow.description}
                  onChange={e => setNewRow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)"
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </td>
              <td className="px-4 py-2" />
              <td className="px-4 py-2" />
              <td className="px-4 py-2 text-center">
                <button
                  onClick={addGrouping}
                  disabled={adding}
                  className="text-green-600 hover:text-green-800 disabled:opacity-50"
                  title="Add grouping"
                >
                  <Plus size={18} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
