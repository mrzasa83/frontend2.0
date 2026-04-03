'use client'

import { useState, useEffect } from 'react'
import { Ruler, RefreshCw } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Props = {
  partNumber: string
}

type ScaleRecord = {
  Date: string
  Note: string
  PartNumber: string
  Version: string
  User: string
}

export default function EngineeringTab({ partNumber }: Props) {
  const [activeSubTab, setActiveSubTab] = useState('scale-history')

  // Scale History state
  const [scaleData, setScaleData] = useState<ScaleRecord[]>([])
  const [loadingScale, setLoadingScale] = useState(false)
  const [scaleError, setScaleError] = useState<string | null>(null)

  const fetchScaleData = async () => {
    if (loadingScale || scaleData.length > 0) return
    setLoadingScale(true)
    setScaleError(null)
    try {
      const res = await fetch(getApiUrl(`/api/process/scales?partNumber=${encodeURIComponent(partNumber)}`))
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      const sorted = (result.data || []).sort((a: ScaleRecord, b: ScaleRecord) =>
        (parseInt(b.Version) || 0) - (parseInt(a.Version) || 0)
      )
      setScaleData(sorted)
    } catch (err) {
      setScaleError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoadingScale(false)
    }
  }

  // Fetch data when sub-tab changes
  useEffect(() => {
    switch (activeSubTab) {
      case 'scale-history':
        fetchScaleData()
        break
      // Future tabs will be added here
    }
  }, [activeSubTab, partNumber])

  const subTabs = [
    { id: 'scale-history', label: 'Scale History', icon: Ruler },
    // Future engineering tabs will be added here
  ]

  return (
    <div className="flex gap-6">
      {/* Left sidebar nav */}
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSubTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {activeSubTab === 'scale-history' && (
          <div>
            <div className="mb-4">
              <h4 className="font-semibold text-slate-800">
                Scale History ({scaleData.length})
              </h4>
              <p className="text-sm text-slate-600">Scale records for part {partNumber}</p>
            </div>
            {loadingScale ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <RefreshCw size={18} className="animate-spin mr-2" />
                Loading...
              </div>
            ) : scaleError ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {scaleError}
              </div>
            ) : scaleData.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4">
                No scale records found for part {partNumber}
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2 text-left font-medium text-slate-600 w-20">Version</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600 w-52">Date</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600 w-28">User</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scaleData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <span className="inline-block bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-xs">
                            v{row.Version}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600 text-xs">{row.Date}</td>
                        <td className="px-4 py-2 text-slate-600">{row.User}</td>
                        <td className="px-4 py-2 text-slate-600 text-xs">
                          {row.Note || <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
