'use client'

import { useState, useEffect } from 'react'
import { Settings, Eye, EyeOff, Save, RefreshCw } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

export default function SystemSettingsPage() {
  const [deletePw, setDeletePw] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(getApiUrl('/api/admin/settings'))
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
        setDeletePw((await res.json()).deleteFaiPassword || '')
      } catch (e: any) { setError(e.message) }
      finally { setLoading(false) }
    })()
  }, [])

  const save = async () => {
    setSaving(true); setMsg(''); setError('')
    try {
      const res = await fetch(getApiUrl('/api/admin/settings'), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteFaiPassword: deletePw }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed')
      setMsg('Saved.')
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-1">
        <Settings size={22} className="text-blue-600" />
        <h1 className="text-xl font-bold text-slate-800">System Settings</h1>
      </div>
      <p className="text-sm text-slate-500 mb-5">Admin-only application settings.</p>

      {error && <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {msg && <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{msg}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-8"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <label className="text-sm font-medium text-slate-700 block mb-1">Delete FAI password</label>
          <p className="text-xs text-slate-500 mb-2">Required to delete a First Article Inspection. Stored encrypted.</p>
          <div className="flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <input type={show ? 'text' : 'password'} value={deletePw} onChange={e => setDeletePw(e.target.value)}
                className="w-full px-3 py-2 pr-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Save size={15} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
