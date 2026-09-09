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
  /** When provided, the "Show inactive" switch is rendered beside the search. */
  showInactive?: boolean
  onShowInactiveChange?: (next: boolean) => void
}

/**
 * `active` is 1 for enabled accounts and 0 *or* NULL for everything else —
 * plenty of older rows never had the column set. Test for 1, never for 0.
 */
export const isActiveUser = (u: { active: number | null }) => u.active === 1

export default function UserTable({
  users, onView, onEdit, showActions = true,
  showInactive, onShowInactiveChange,
}: Props) {
  const [sortKey, setSortKey] = useState<keyof User>('username')
  const [sortAsc, setSortAsc] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const canToggleInactive = typeof onShowInactiveChange === 'function'

  // Filter users based on search. Username is the only field guaranteed to be
  // present; the rest are nullable, so each is guarded.
  const term = searchTerm.trim().toLowerCase()
  const matchesSearch = (user: User) => {
    if (!term) return true
    return [user.username, user.name, user.email, user.title, user.nickname]
      .some(v => (v ?? '').toLowerCase().includes(term))
  }

  // Second line of defence: the API is what actually decides which rows arrive,
  // but if the switch is off nothing inactive should slip through either way.
  const filteredUsers = users.filter(user =>
    matchesSearch(user) && (showInactive || !canToggleInactive || isActiveUser(user))
  )

  const inactiveCount = users.filter(u => !isActiveUser(u)).length

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
      {/* Search Bar + inactive switch */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          placeholder="Search by username, name, email, title, or nickname..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        {canToggleInactive && (
          <label
            className="flex items-center gap-2 shrink-0 cursor-pointer select-none"
            title="Include deactivated accounts so they can be viewed or reactivated"
          >
            <button
              type="button"
              role="switch"
              aria-checked={!!showInactive}
              onClick={() => onShowInactiveChange!(!showInactive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showInactive ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showInactive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-slate-700 whitespace-nowrap">
              Show inactive
              {showInactive && inactiveCount > 0 && (
                <span className="ml-1 text-slate-500">({inactiveCount})</span>
              )}
            </span>
          </label>
        )}
      </div>

      {/* Results Count */}
      {(searchTerm || showInactive) && (
        <div className="mb-2 text-sm text-slate-600">
          Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          {showInactive && inactiveCount > 0 && `, including ${inactiveCount} inactive`}
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
                    {!searchTerm && canToggleInactive && !showInactive && (
                      <span className="block mt-1 text-xs">
                        Inactive accounts are hidden — turn on &ldquo;Show inactive&rdquo; to see them.
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-t border-slate-200 hover:bg-slate-50 transition-colors ${
                      isActiveUser(user) ? '' : 'bg-slate-50/60 text-slate-500'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-sm font-semibold">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 text-sm">{user.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{user.email || '-'}</td>
                    <td className="px-4 py-3 text-sm">{user.title || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isActiveUser(user)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isActiveUser(user) ? 'Active' : 'Inactive'}
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