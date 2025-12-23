'use client'

import { useState, useEffect } from 'react'
import { X, Moon, Sun, Monitor } from 'lucide-react'

type ThemeMode = 'light' | 'dark' | 'system'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement
    
    if (mode === 'dark') {
      root.classList.add('dark')
    } else if (mode === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode)
    localStorage.setItem('theme', mode)
    applyTheme(mode)
  }

  if (!isOpen) return null

  const themeOptions = [
    { id: 'light' as ThemeMode, label: 'Light', icon: Sun, description: 'Always use light theme' },
    { id: 'dark' as ThemeMode, label: 'Dark', icon: Moon, description: 'Always use dark theme' },
    { id: 'system' as ThemeMode, label: 'System', icon: Monitor, description: 'Follow system preference' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Appearance Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Appearance</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Choose how the application looks</p>

            <div className="space-y-2">
              {themeOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleThemeChange(option.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    theme === option.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    theme === option.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    <option.icon size={20} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${
                      theme === option.id 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                  </div>
                  {theme === option.id && (
                    <div className="ml-auto">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Placeholder for future settings */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              More settings coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
