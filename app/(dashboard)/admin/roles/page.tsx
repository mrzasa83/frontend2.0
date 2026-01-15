'use client'


import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, Users } from 'lucide-react'

type Role = {
  id: number
  name: string
  userCount: number
  createdAt: string
  updatedAt: string
}

export default function AdminRoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/roles')
      if (!res.ok) {
        throw new Error('Failed to fetch roles')
      }

      const data = await res.json()
      setRoles(data)
    } catch (err) {
      console.error('Error fetching roles:', err)
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newRoleName.trim()) {
      alert('Please enter a role name')
      return
    }

    try {
      setSaving(true)

      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName.trim() })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create role')
      }

      await fetchRoles()
      setNewRoleName('')
      setShowAddModal(false)
    } catch (err) {
      console.error('Error creating role:', err)
      alert(err instanceof Error ? err.message : 'Failed to create role')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRole = async (roleId: number, roleName: string, userCount: number) => {
    if (userCount > 0) {
      alert(`Cannot delete role "${roleName}" because it is assigned to ${userCount} user(s). Remove users from this role first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete role')
      }

      await fetchRoles()
    } catch (err) {
      console.error('Error deleting role:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete role')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchRoles}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield size={28} />
            Role Management
          </h2>
          <p className="text-slate-600 mt-1">Create and manage user roles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-lg shadow p-6 border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Shield className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{role.name}</h3>
                  <p className="text-sm text-slate-500">ID: {role.id}</p>
                </div>
              </div>
              {role.userCount === 0 && role.name !== 'admin' && (
                <button
                  onClick={() => handleDeleteRole(role.id, role.name, role.userCount)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete role"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={16} />
                <span className="text-sm">
                  {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Created: {new Date(role.createdAt).toLocaleDateString()}
              </div>
            </div>

            {role.name === 'admin' && (
              <div className="mt-4 px-3 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium inline-block">
                System Role
              </div>
            )}
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Shield size={48} className="mx-auto mb-4 opacity-50" />
          <p>No roles found</p>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Add New Role</h3>
            
            <form onSubmit={handleAddRole}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., manager, engineer, viewer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use lowercase with no spaces (e.g., "process-engineer")
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setNewRoleName('')
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newRoleName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}