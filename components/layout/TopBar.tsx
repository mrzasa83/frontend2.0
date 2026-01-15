'use client'


import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, Settings, LogOut } from 'lucide-react'
import ProfileModal from './ProfileModal'
import SettingsModal from './SettingsModal'

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

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile()
    }
  }, [session?.user?.id])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
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
    await signOut({ callbackUrl: '/login' })
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
    </>
  )
}
