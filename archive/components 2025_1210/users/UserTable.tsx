'use client'

import { useState } from 'react'
import { Eye, Pencil } from 'lucide-react'

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

type Props = {
  users: User[]
  onView: (user: User) => void
  onEdit?: (user: User) => void
  showActions?: boolean // Controls whether to show edit/view buttons
}

export default function UserTable({ users, onView, onEdit, showActions = true }: Props) {
  const [sortKey, setSortKey] = useState<keyof User>('username')
  const [sortAsc, setSortAsc] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const valA = a[sortKey] || ''
    const valB = b[sortKey] || ''
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
  })

  const handleSort = (key: keyof User) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username, name, email, or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Results Count */}
      {searchTerm && (
        <div className="mb-2 text-sm text-slate-600">
          Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th 
                  className="text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={() => handleSort('username')}
                >
                  Username
                  {sortKey === 'username' && (
                    <span className="ml-1">{sortAsc ? '▲' : '▼'}</span>
                  )}
                </th>
                <th 
                  className="text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortKey === 'name' && (
                    <span className="ml-1">{sortAsc ? '▲' : '▼'}</span>
                  )}
                </th>
                <th 
                  className="text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={() => handleSort('email')}
                >
                  Email
                  {sortKey === 'email' && (
                    <span className="ml-1">{sortAsc ? '▲' : '▼'}</span>
                  )}
                </th>
                <th 
                  className="text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={() => handleSort('title')}
                >
                  Title
                  {sortKey === 'title' && (
                    <span className="ml-1">{sortAsc ? '▲' : '▼'}</span>
                  )}
                </th>
                <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">
                  Status
                </th>
                {showActions && (
                  <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 6 : 5} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? 'No users found matching your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => (
                  <tr key={user.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-semibold">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 text-sm">{user.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{user.email || '-'}</td>
                    <td className="px-4 py-3 text-sm">{user.title || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.active === 1
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.active === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onView(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View User"
                          >
                            <Eye size={18} />
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(user)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Edit User"
                            >
                              <Pencil size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}