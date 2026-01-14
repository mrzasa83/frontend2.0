'use client'

import { useState, useEffect } from 'react'
import Tabs from '@/components/ui/Tabs'
import UserTable from '@/components/users/UserTable'
import UserForm from '@/components/users/UserForm'
import UserEditTab from '@/components/users/UserEditTab'
import UserAddForm from '@/components/users/UserAddForm'
import { Plus, Shield } from 'lucide-react'

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

type NewUser = {
  username: string
  name: string
  email: string
  nickname: string
  phone: string
  mobile: string
  title: string
  role: string
  password: string
  active: number
}

type Role = {
  id: number
  name: string
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewUser, setViewUser] = useState<User | null>(null)
  const [editingUsers, setEditingUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [showAddUser, setShowAddUser] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const usersRes = await fetch('/api/users')
      
      if (!usersRes.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const usersData = await usersRes.json()
      setUsers(usersData)
      
      // Try to fetch roles, but don't fail if endpoint doesn't exist yet
      try {
        const rolesRes = await fetch('/api/roles')
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json()
          setRoles(rolesData)
        }
      } catch (roleError) {
        console.warn('Could not fetch roles:', roleError)
        // Continue without roles - can still manage users
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (user: User) => {
    setViewUser(user)
  }

  const handleEdit = (user: User) => {
    const alreadyEditing = editingUsers.find(u => u.id === user.id)
    if (!alreadyEditing) {
      setEditingUsers(prev => [...prev, user])
    }
    setActiveTab(`edit-${user.id}`)
  }

  const handleCloseEditTab = (userId: number) => {
    setEditingUsers(prev => prev.filter(u => u.id !== userId))
    setActiveTab('all')
  }

  const handleSave = async (user: User) => {
    try {
      // Save user basic info
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })
      
      const responseData = await res.json()
      
      if (!res.ok) {
        throw new Error(responseData.error || responseData.details || 'Failed to save user')
      }
      
      await fetchData()
      handleCloseEditTab(user.id)
      alert('User updated successfully!')
      
    } catch (error) {
      console.error('Error saving user:', error)
      alert(`Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleAddUser = async (newUser: NewUser) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to create user')
      }

      await fetchData()
      setShowAddUser(false)
      alert('User created successfully!')
    } catch (error) {
      console.error('Error creating user:', error)
      alert(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error loading data</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const userListTab = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            All Users ({users.length})
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Full user management with role assignment and password reset
          </p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>
      <UserTable 
        users={users} 
        onView={handleView} 
        onEdit={handleEdit}
        showActions={true}
      />
    </div>
  )

  const tabs = [
    { 
      id: 'all', 
      label: 'All Users', 
      content: userListTab,
      closeable: false
    },
    ...editingUsers.map(editUser => ({
      id: `edit-${editUser.id}`,
      label: editUser.name || editUser.username,
      content: (
        <UserEditTab
          user={editUser}
          roles={roles}
          onSave={handleSave}
          onCancel={() => handleCloseEditTab(editUser.id)}
          isAdmin={true}
          onRefresh={async () => {
            // Fetch fresh user data and update both users and editingUsers
            await fetchData()
            // Update the editing user with fresh data
            const usersRes = await fetch('/api/users')
            if (usersRes.ok) {
              const freshUsers = await usersRes.json()
              const freshUser = freshUsers.find((u: User) => u.id === editUser.id)
              if (freshUser) {
                setEditingUsers(prev => 
                  prev.map(u => u.id === editUser.id ? freshUser : u)
                )
              }
            }
          }}
        />
      ),
      closeable: true,
      onClose: () => handleCloseEditTab(editUser.id)
    }))
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield size={28} />
          User Management
        </h2>
        <p className="text-slate-600 mt-1">
          Manage users, assign roles, and reset passwords (Admin only)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* View User Modal (read-only) */}
      {viewUser && (
        <UserForm
          user={viewUser}
          mode="view"
          onClose={() => setViewUser(null)}
        />
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <UserAddForm
          onClose={() => setShowAddUser(false)}
          onSave={handleAddUser}
        />
      )}
    </div>
  )
}