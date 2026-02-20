'use client'


import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
import { getApiUrl } from '@/lib/api'
  Plus, Edit2, Trash2, Users, ChevronDown, ChevronUp, 
  X, Save, FileText, ClipboardList, Eye 
} from 'lucide-react'

type FieldDef = {
  id: string
  label: string
  type: 'radio' | 'checkbox' | 'text' | 'number'
  options?: string[]
  required: boolean
}

type AuditDef = {
  id: number
  name: string
  description: string | null
  created_by: number
  created_by_name?: string
  created_at: string
  active: number
  fields: FieldDef[]
  authorized_users: number[]
  authorized_user_names?: string[]
  record_count?: number
}

type AuditRecord = {
  id: number
  audit_def_id: number
  audit_name?: string
  recorded_by: number
  recorded_by_name?: string
  recorded_at: string
  values: Record<string, any>
  notes: string | null
}

type User = {
  id: number
  username: string
  name: string | null
}

export default function AuditsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'definitions' | 'records' | 'enter'>('definitions')
  const [audits, setAudits] = useState<AuditDef[]>([])
  const [records, setRecords] = useState<AuditRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAudit, setEditingAudit] = useState<AuditDef | null>(null)
  const [selectedAuditForEntry, setSelectedAuditForEntry] = useState<AuditDef | null>(null)
  const [viewingRecord, setViewingRecord] = useState<AuditRecord | null>(null)
  
  // For authorized audits (ones the user can submit records to)
  const [authorizedAudits, setAuthorizedAudits] = useState<AuditDef[]>([])

  const isAdmin = session?.user?.roles?.includes('Admin')
  const isProcessEng = session?.user?.roles?.includes('ProcessEng')
  const isProductEng = session?.user?.roles?.includes('ProductEng')
  const canCreateAudit = isAdmin || isProcessEng || isProductEng

  useEffect(() => {
    fetchAudits()
    fetchUsers()
    fetchRecords()
  }, [])

  const fetchAudits = async () => {
    try {
      const res = await fetch(getApiUrl('/api/operations/audits')
      if (res.ok) {
        const data = await res.json()
        setAudits(data.audits || [])
        setAuthorizedAudits(data.authorizedAudits || [])
      }
    } catch (error) {
      console.error('Error fetching audits:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(getApiUrl('/api/users')
      if (res.ok) {
        const data = await res.json()
        // API returns array directly, not wrapped in {users: [...]}
        setUsers(Array.isArray(data) ? data : (data.users || []))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchRecords = async () => {
    try {
      const res = await fetch(getApiUrl('/api/operations/audits/records')
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records || [])
      }
    } catch (error) {
      console.error('Error fetching records:', error)
    }
  }

  const handleDeleteAudit = async (id: number) => {
    if (!confirm('Are you sure you want to delete this audit? All records will be deleted.')) return
    
    try {
      const res = await fetch(getApiUrl(`/api/operations/audits/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAudits()
        fetchRecords()
      }
    } catch (error) {
      console.error('Error deleting audit:', error)
    }
  }

  const openEditModal = (audit: AuditDef) => {
    setEditingAudit(audit)
    setShowModal(true)
  }

  const openNewModal = () => {
    setEditingAudit(null)
    setShowModal(true)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Audits</h1>
        <p className="text-slate-600">Create and manage audit surveys, log measurements and records</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('definitions')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'definitions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardList size={18} />
            Audit Definitions
          </div>
        </button>
        <button
          onClick={() => setActiveTab('enter')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'enter'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Plus size={18} />
            Enter Record
          </div>
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'records'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={18} />
            View Records
          </div>
        </button>
      </div>

      {/* Definitions Tab */}
      {activeTab === 'definitions' && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Audit Definitions</h2>
            {canCreateAudit && (
              <button
                onClick={openNewModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                New Audit
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : audits.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No audits defined yet.
              {canCreateAudit && ' Click "New Audit" to create one.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {audits.map((audit) => (
                <div key={audit.id} className="p-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-800">{audit.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          audit.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {audit.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {audit.description && (
                        <p className="text-sm text-slate-600 mt-1">{audit.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>Created by: {audit.created_by_name || 'Unknown'}</span>
                        <span>Fields: {audit.fields.length}</span>
                        <span>Records: {audit.record_count || 0}</span>
                        <span>Authorized Users: {audit.authorized_users.length}</span>
                      </div>
                    </div>
                    {canCreateAudit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(audit)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteAudit(audit.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enter Record Tab */}
      {activeTab === 'enter' && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Submit Audit Record</h2>
          </div>

          {authorizedAudits.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              You are not authorized to submit records for any audits.
            </div>
          ) : !selectedAuditForEntry ? (
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-4">Select an audit to submit a record:</p>
              <div className="grid gap-3">
                {authorizedAudits.map((audit) => (
                  <button
                    key={audit.id}
                    onClick={() => setSelectedAuditForEntry(audit)}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{audit.name}</p>
                      {audit.description && (
                        <p className="text-sm text-slate-600">{audit.description}</p>
                      )}
                    </div>
                    <ChevronDown size={20} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <RecordEntryForm
              audit={selectedAuditForEntry}
              onCancel={() => setSelectedAuditForEntry(null)}
              onSaved={() => {
                setSelectedAuditForEntry(null)
                fetchRecords()
                fetchAudits()
              }}
            />
          )}
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Audit Records</h2>
          </div>

          {records.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Audit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Recorded By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-800">{record.audit_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{record.recorded_by_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(record.recorded_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setViewingRecord(record)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Definition Modal */}
      {showModal && (
        <AuditDefModal
          audit={editingAudit}
          users={users}
          onClose={() => {
            setShowModal(false)
            setEditingAudit(null)
          }}
          onSaved={() => {
            setShowModal(false)
            setEditingAudit(null)
            fetchAudits()
          }}
        />
      )}

      {/* Record View Modal */}
      {viewingRecord && (
        <RecordViewModal
          record={viewingRecord}
          audits={audits}
          onClose={() => setViewingRecord(null)}
        />
      )}
    </div>
  )
}

// Audit Definition Modal Component
function AuditDefModal({ 
  audit, 
  users, 
  onClose, 
  onSaved 
}: { 
  audit: AuditDef | null
  users: User[]
  onClose: () => void
  onSaved: () => void 
}) {
  const [name, setName] = useState(audit?.name || '')
  const [description, setDescription] = useState(audit?.description || '')
  const [active, setActive] = useState(audit?.active ?? 1)
  const [fields, setFields] = useState<FieldDef[]>(audit?.fields || [])
  const [authorizedUsers, setAuthorizedUsers] = useState<number[]>(audit?.authorized_users || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addField = () => {
    setFields([...fields, {
      id: `field_${Date.now()}`,
      label: '',
      type: 'radio',
      options: ['Option 1', 'Option 2'],
      required: false
    }])
  }

  const updateField = (index: number, updates: Partial<FieldDef>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFields(newFields)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (fields.length === 0) {
      setError('At least one field is required')
      return
    }
    if (authorizedUsers.length === 0) {
      setError('At least one authorized user is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const url = audit ? getApiUrl(`/api/operations/audits/${audit.id}`) : getApiUrl('/api/operations/audits')
      const method = audit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          active,
          fields,
          authorized_users: authorizedUsers
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {audit ? 'Edit Audit' : 'New Audit'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Daily Quality Check"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Optional description..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={active === 1}
                onChange={(e) => setActive(e.target.checked ? 1 : 0)}
                className="w-4 h-4"
              />
              <label htmlFor="active" className="text-sm text-slate-700">Active</label>
            </div>
          </div>

          {/* Fields */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-slate-700">Fields *</label>
              <button
                onClick={addField}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Field
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      placeholder="Field label"
                    />
                    <button
                      onClick={() => removeField(index)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex gap-3 items-center text-sm">
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as FieldDef['type'] })}
                      className="px-2 py-1 border rounded"
                    >
                      <option value="radio">Single Select (Radio)</option>
                      <option value="checkbox">Multi Select (Checkbox)</option>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                    </select>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>
                  {(field.type === 'radio' || field.type === 'checkbox') && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={field.options?.join(', ') || ''}
                        onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Options (comma separated)"
                      />
                    </div>
                  )}
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No fields defined. Click "Add Field" to create one.</p>
              )}
            </div>
          </div>

          {/* Authorized Users */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Authorized Users * <span className="font-normal text-slate-500">(who can submit records)</span>
            </label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
              {users.map((user) => (
                <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorizedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAuthorizedUsers([...authorizedUsers, user.id])
                      } else {
                        setAuthorizedUsers(authorizedUsers.filter(id => id !== user.id))
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{user.name || user.username}</span>
                  <span className="text-xs text-slate-500">@{user.username}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {authorizedUsers.length} user(s) selected
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Record Entry Form Component
function RecordEntryForm({
  audit,
  onCancel,
  onSaved
}: {
  audit: AuditDef
  onCancel: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    // Validate required fields
    for (const field of audit.fields) {
      if (field.required) {
        const val = values[field.id]
        if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
          setError(`"${field.label}" is required`)
          return
        }
      }
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(getApiUrl('/api/operations/audits/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_def_id: audit.id,
          values,
          notes
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-medium text-slate-800">{audit.name}</h3>
          {audit.description && (
            <p className="text-sm text-slate-600">{audit.description}</p>
          )}
        </div>
        <button onClick={onCancel} className="text-sm text-slate-600 hover:text-slate-800">
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      <div className="space-y-6">
        {audit.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>

            {field.type === 'radio' && field.options && (
              <div className="space-y-2">
                {field.options.map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={field.id}
                      checked={values[field.id] === option}
                      onChange={() => setValues({ ...values, [field.id]: option })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'checkbox' && field.options && (
              <div className="space-y-2">
                {field.options.map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(values[field.id] || []).includes(option)}
                      onChange={(e) => {
                        const current = values[field.id] || []
                        if (e.target.checked) {
                          setValues({ ...values, [field.id]: [...current, option] })
                        } else {
                          setValues({ ...values, [field.id]: current.filter((v: string) => v !== option) })
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'text' && (
              <input
                type="text"
                value={values[field.id] || ''}
                onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                value={values[field.id] || ''}
                onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Submitting...' : 'Submit Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Record View Modal
function RecordViewModal({
  record,
  audits,
  onClose
}: {
  record: AuditRecord
  audits: AuditDef[]
  onClose: () => void
}) {
  const audit = audits.find(a => a.id === record.audit_def_id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{record.audit_name}</h2>
            <p className="text-sm text-slate-600">
              {new Date(record.recorded_at).toLocaleString()} by {record.recorded_by_name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {audit?.fields.map((field) => {
            const value = record.values[field.id]
            return (
              <div key={field.id}>
                <p className="text-sm font-medium text-slate-700">{field.label}</p>
                <p className="text-slate-800">
                  {Array.isArray(value) ? value.join(', ') : value || '-'}
                </p>
              </div>
            )
          })}

          {record.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-slate-700">Notes</p>
              <p className="text-slate-800">{record.notes}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
