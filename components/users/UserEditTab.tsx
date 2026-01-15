'use client'

import { getApiUrl } from '@/lib/api'

import { useState, useEffect } from 'react'
import Tabs from '@/components/ui/Tabs'
import { Save, X, Key, Link2, Wrench } from 'lucide-react'

type User = {
  id: number
  username: string
  name: string | null
  email: string | null
  nickname: string | null
  phone: string | null
  mobile: string | null
  title: string | null
  role: string | null
  active: number | null
  roles?: string[]
  cc_name?: string | null
  engineer_roles?: string[]
}

type Role = {
  id: number
  name: string
}

type EngineerRoleType = 'HDW' | 'CAM' | 'PCB' | 'ASM'

type Props = {
  user: User
  roles?: Role[]
  onSave: (user: User) => void
  onCancel: () => void
  isAdmin?: boolean
  onRefresh?: () => void  // Callback to refresh user data after roles/engineer roles update
}

export default function UserEditTab({ user, roles = [], onSave, onCancel, isAdmin = false, onRefresh }: Props) {
  const [formData, setFormData] = useState(user)
  const [hasChanges, setHasChanges] = useState(false)
  const [innerTab, setInnerTab] = useState('personal')
  
  // Security tab state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  // Roles tab state
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles || [])
  const [savingRoles, setSavingRoles] = useState(false)

  // Control Center linking state
  const [ccUsers, setCcUsers] = useState<string[]>([])
  const [selectedCcName, setSelectedCcName] = useState<string>(user.cc_name || '')
  const [loadingCcUsers, setLoadingCcUsers] = useState(false)
  
  // Engineer roles state
  const [engineerRoles, setEngineerRoles] = useState<EngineerRoleType[]>(
    (user.engineer_roles || []) as EngineerRoleType[]
  )
  const [savingEngineerRoles, setSavingEngineerRoles] = useState(false)

  // Fetch CC users on mount
  useEffect(() => {
    if (isAdmin) {
      fetchCcUsers()
    }
  }, [isAdmin])

  const fetchCcUsers = async () => {
    try {
      setLoadingCcUsers(true)
      const res = await fetch(getApiUrl('/api/admin/cc-users'))
      if (res.ok) {
        const data = await res.json()
        setCcUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching CC users:', error)
    } finally {
      setLoadingCcUsers(false)
    }
  }

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(formData)
    setHasChanges(false)
  }

  const handlePasswordReset = async () => {
    // Validate passwords
    if (!newPassword) {
      setPasswordError('Password is required')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      setResettingPassword(true)
      setPasswordError('')

      const res = await fetch(getApiUrl(`/api/users/${user.id}/password`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newPassword,
          confirmPassword 
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reset password')
      }

      alert('Password reset successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error resetting password:', error)
      setPasswordError(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleSaveRoles = async () => {
    try {
      setSavingRoles(true)

      const res = await fetch(getApiUrl(`/api/users/${user.id}/roles`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: selectedRoles })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update roles')
      }

      alert('Roles updated successfully! User must re-login for changes to take effect.')
      setFormData(prev => ({ ...prev, roles: selectedRoles }))
      
      // Refresh parent data so changes persist when reopening
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating roles:', error)
      alert(error instanceof Error ? error.message : 'Failed to update roles')
    } finally {
      setSavingRoles(false)
    }
  }

  const toggleRole = (roleName: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    )
  }

  const toggleEngineerRole = (role: EngineerRoleType) => {
    setEngineerRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const handleSaveEngineerRoles = async () => {
    try {
      setSavingEngineerRoles(true)

      const res = await fetch(getApiUrl('/api/admin/engineer-roles'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ccName: selectedCcName || null,
          roles: engineerRoles
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update engineer roles')
      }

      alert('Control Center link and engineer roles updated successfully!')
      setFormData(prev => ({ 
        ...prev, 
        cc_name: selectedCcName || null,
        engineer_roles: engineerRoles 
      }))
      
      // Refresh parent data so changes persist when reopening
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating engineer roles:', error)
      alert(error instanceof Error ? error.message : 'Failed to update engineer roles')
    } finally {
      setSavingEngineerRoles(false)
    }
  }

  const inputClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
  const errorClassName = "w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-red-50"

  // Personal Tab Content
  const personalTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nickname
          </label>
          <input
            type="text"
            value={formData.nickname || ''}
            onChange={(e) => handleChange('nickname', e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mobile
          </label>
          <input
            type="tel"
            value={formData.mobile || ''}
            onChange={(e) => handleChange('mobile', e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.active === 1}
            onChange={(e) => handleChange('active', e.target.checked ? 1 : 0)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">Active User</span>
        </label>
      </div>
    </div>
  )

  // Occupation Tab Content
  const occupationTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Job Title
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Role
          </label>
          <input
            type="text"
            value={formData.role || ''}
            onChange={(e) => handleChange('role', e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Additional occupation details (department, manager, start date, etc.) can be added here in future updates.
        </p>
      </div>
    </div>
  )

  // Security Tab Content (Admin only)
  const securityTab = (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>⚠️ Password Reset:</strong> This will immediately change the user's password. 
          The user should be notified of their new credentials.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            New Password *
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setPasswordError('')
            }}
            className={passwordError ? errorClassName : inputClassName}
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm Password *
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setPasswordError('')
            }}
            className={passwordError ? errorClassName : inputClassName}
            placeholder="Confirm new password"
          />
        </div>
      </div>

      {passwordError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{passwordError}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-semibold mb-2">Password Requirements:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Minimum 6 characters</li>
          <li>• User will need to use this password on next login</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handlePasswordReset}
          disabled={resettingPassword || !newPassword || !confirmPassword}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Key size={18} />
          {resettingPassword ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  )

  // Roles Tab Content (Admin only)
  const rolesTab = (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Role changes take effect immediately, but the user must re-login to see updated permissions.
        </p>
      </div>

      {roles.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>No roles available. Create roles in Admin → Role Management first.</p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">
            Assign Roles to {formData.name || formData.username}:
          </p>
          <div className="grid grid-cols-3 gap-3">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => toggleRole(role.name)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                  selectedRoles.includes(role.name)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-blue-300'
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRoles.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Selected Roles:</p>
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map(role => (
              <span
                key={role}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveRoles}
          disabled={savingRoles}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {savingRoles ? 'Saving...' : 'Save Roles'}
        </button>
      </div>
    </div>
  )

  // Engineer Roles Tab Content (Admin only)
  const engineerRolesTab = (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Control Center Integration:</strong> Link this user to their Control Center account and assign them to engineering role groups. Users in these groups will appear in the respective dropdowns when assigning jobs.
        </p>
      </div>

      {/* Control Center Name Link */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Link2 size={16} />
          Control Center Username
        </h4>
        {loadingCcUsers ? (
          <div className="text-sm text-slate-500">Loading Control Center users...</div>
        ) : (
          <div>
            <select
              value={selectedCcName}
              onChange={(e) => setSelectedCcName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Control Center User --</option>
              {ccUsers.map(ccUser => (
                <option key={ccUser} value={ccUser}>{ccUser}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              This links the app user to their Control Center identity for job tracking.
            </p>
          </div>
        )}
      </div>

      {/* Engineer Role Assignments */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Wrench size={16} />
          Engineer Role Assignments
        </h4>
        <p className="text-xs text-slate-500 mb-3">
          Check the roles this user should appear in when assigning engineers to jobs.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {(['HDW', 'CAM', 'PCB', 'ASM'] as EngineerRoleType[]).map(role => (
            <label
              key={role}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                engineerRoles.includes(role)
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
            >
              <input
                type="checkbox"
                checked={engineerRoles.includes(role)}
                onChange={() => toggleEngineerRole(role)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-slate-700">{role}</span>
                <p className="text-xs text-slate-500">
                  {role === 'HDW' && 'HDW Engineer dropdown'}
                  {role === 'CAM' && 'CAM Engineer dropdown'}
                  {role === 'PCB' && 'PCB Engineer dropdown'}
                  {role === 'ASM' && 'ASM Engineer dropdown'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Selected Summary */}
      {(selectedCcName || engineerRoles.length > 0) && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Settings:</h4>
          <div className="text-sm text-slate-600 space-y-1">
            <p><strong>CC Name:</strong> {selectedCcName || 'Not linked'}</p>
            <p><strong>Roles:</strong> {engineerRoles.length > 0 ? engineerRoles.join(', ') : 'None assigned'}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveEngineerRoles}
          disabled={savingEngineerRoles}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {savingEngineerRoles ? 'Saving...' : 'Save CC Link & Roles'}
        </button>
      </div>
    </div>
  )

  // Build tabs array based on admin status
  const tabs = [
    { id: 'personal', label: 'Personal', content: personalTab, closeable: false },
    { id: 'occupation', label: 'Occupation', content: occupationTab, closeable: false },
  ]

  // Add Security and Roles tabs only for admins
  if (isAdmin) {
    tabs.push(
      { id: 'security', label: 'Security', content: securityTab, closeable: false },
      { id: 'roles', label: 'Roles', content: rolesTab, closeable: false },
      { id: 'engineer', label: 'Engineer Roles', content: engineerRolesTab, closeable: false }
    )
  }

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Editing: {formData.name || formData.username}
          </h3>
          {hasChanges && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠️ You have unsaved changes
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Form Tabs */}
      <Tabs tabs={tabs} activeTab={innerTab} onTabChange={setInnerTab} />
    </div>
  )
}