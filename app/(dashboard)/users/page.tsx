'use client'


import { useState, useEffect } from 'react'
import Tabs from '@/components/ui/Tabs'
import UserTable from '@/components/users/UserTable'
import { Users as UsersIcon } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

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
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewingUsers, setViewingUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch(getApiUrl('/api/users')
      
      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.status}`)
      }
      
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (user: User) => {
    const alreadyViewing = viewingUsers.find(u => u.id === user.id)
    if (!alreadyViewing) {
      setViewingUsers(prev => [...prev, user])
    }
    setActiveTab(`view-${user.id}`)
  }

  const handleCloseViewTab = (userId: number) => {
    setViewingUsers(prev => prev.filter(u => u.id !== userId))
    setActiveTab('all')
  }

  const renderUserView = (user: User) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
            {user.username}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
            {user.name || '-'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
            {user.email || '-'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
            {user.title || '-'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
            {user.phone || '-'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
            {user.mobile || '-'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
            {user.nickname || '-'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.active === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {user.active === 1 ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a read-only view. To edit user information, please contact an administrator.
        </p>
      </div>
    </div>
  )

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
          <p className="font-semibold">Error loading users</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchUsers}
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
      {/* Info Banner */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a read-only directory. To manage users, assign roles, or reset passwords, 
          please contact an administrator or access the Admin → User Management section if you have permission.
        </p>
      </div>

      {/* User Table with built-in search */}
      <UserTable 
        users={users} 
        onView={handleView}
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
    ...viewingUsers.map(user => ({
      id: `view-${user.id}`,
      label: user.name || user.username,
      content: renderUserView(user),
      closeable: true,
      onClose: () => handleCloseViewTab(user.id)
    }))
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UsersIcon size={28} />
          Users Directory
        </h2>
        <p className="text-slate-600 mt-1">View system users (read-only)</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  )
}