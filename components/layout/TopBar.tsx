'use client'


import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, Settings, LogOut, KeyRound } from 'lucide-react'
import ProfileModal from './ProfileModal'
import SettingsModal from './SettingsModal'
import { getApiUrl } from '@/lib/api'

type UserProfile = {
  id: number
  username: string
  name: string | null
  email: string | null
  nickname: string | null
  phone: string | null
  mobile: string | null
  title: string | null
  role: string | null
  roles?: string[]
}

export default function TopBar() {
  const { data: session } = useSession()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [changePwOpen, setChangePwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwSubmitting, setPwSubmitting] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile()
    }
  }, [session?.user?.id])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(getApiUrl('/api/user/profile'))
      if (res.ok) {
        const data = await res.json()
        setUserProfile({
          ...data.user,
          roles: session?.user?.roles || []
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleLogout = async () => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    await signOut({ callbackUrl: `${basePath}/login` })
  }

  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess('')
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError('All fields are required'); return
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('New passwords do not match'); return
    }
    if (pwForm.newPw.length < 6) {
      setPwError('New password must be at least 6 characters'); return
    }
    setPwSubmitting(true)
    try {
      const res = await fetch(getApiUrl('/api/user/change-password'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setPwSuccess('Password changed successfully')
      setPwForm({ current: '', newPw: '', confirm: '' })
      setTimeout(() => setChangePwOpen(false), 1500)
    } catch (e: any) { setPwError(e.message) }
    finally { setPwSubmitting(false) }
  }

  const openProfile = () => {
    setUserMenuOpen(false)
    setProfileOpen(true)
  }

  const openSettings = () => {
    setUserMenuOpen(false)
    setSettingsOpen(true)
  }

  return (
    <>
      <div className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 shadow-lg z-10">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold">frontEnd2.0</h1>
          
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
              New Product
            </button>
            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors">
              Quick Search
            </button>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center font-semibold transition-colors"
          >
            {session?.user?.initials || 'U'}
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-20 py-2 text-slate-800">
                <div className="px-4 py-2 border-b border-slate-200">
                  <p className="font-semibold">{session?.user?.name}</p>
                  <p className="text-xs text-slate-500">@{session?.user?.username}</p>
                  {session?.user?.roles && session.user.roles.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      {session.user.roles.join(', ')}
                    </p>
                  )}
                </div>
                <button 
                  onClick={openProfile}
                  className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-2"
                >
                  <User size={16} />
                  Profile
                </button>
                <button 
                  onClick={openSettings}
                  className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-2"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button 
                  onClick={() => { setUserMenuOpen(false); setChangePwOpen(true); setPwForm({ current: '', newPw: '', confirm: '' }); setPwError(''); setPwSuccess('') }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-2"
                >
                  <KeyRound size={16} />
                  Change password
                </button>
                <hr className="my-2" />
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-2 text-red-600"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {userProfile && (
        <ProfileModal
          isOpen={profileOpen}
          onClose={() => {
            setProfileOpen(false)
            fetchUserProfile() // Refresh data after closing
          }}
          user={userProfile}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Change Password Modal */}
      {changePwOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <KeyRound size={20} className="text-blue-600" /> Change Password
              </h2>
              <button onClick={() => setChangePwOpen(false)} className="p-1 hover:bg-slate-200 rounded">
                <LogOut size={16} className="text-slate-500 rotate-180" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {pwError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{pwError}</div>}
              {pwSuccess && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{pwSuccess}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input type="password" value={pwForm.current}
                  onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input type="password" value={pwForm.newPw}
                  onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  onKeyDown={e => { if (e.key === 'Enter') handleChangePassword() }} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setChangePwOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button onClick={handleChangePassword} disabled={pwSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {pwSubmitting ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
