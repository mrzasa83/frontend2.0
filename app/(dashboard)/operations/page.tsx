'use client'


import { useState, useEffect } from 'react'
import { ClipboardCheck, FileCheck, Calendar, Users } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type AuditSummary = {
  totalAudits: number
  activeAudits: number
  totalRecords: number
  recentRecords: number
}

export default function OperationsPage() {
  const [summary, setSummary] = useState<AuditSummary>({
    totalAudits: 0,
    activeAudits: 0,
    totalRecords: 0,
    recentRecords: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const res = await fetch(getApiUrl('/api/operations/audits/summary')
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Total Audits', value: summary.totalAudits, icon: ClipboardCheck, color: 'bg-blue-500' },
    { label: 'Active Audits', value: summary.activeAudits, icon: FileCheck, color: 'bg-green-500' },
    { label: 'Total Records', value: summary.totalRecords, icon: Calendar, color: 'bg-purple-500' },
    { label: 'Records (7 days)', value: summary.recentRecords, icon: Users, color: 'bg-orange-500' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Operations Dashboard</h1>
        <p className="text-slate-600">Manage audits, surveys, and operational data collection</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">
                  {loading ? '...' : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/operations/audits"
            className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ClipboardCheck size={24} className="text-blue-600" />
            <div>
              <p className="font-medium text-slate-800">Manage Audits</p>
              <p className="text-sm text-slate-600">Create and configure audit definitions</p>
            </div>
          </a>
          <a
            href="/operations/audits?tab=records"
            className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <FileCheck size={24} className="text-green-600" />
            <div>
              <p className="font-medium text-slate-800">View Records</p>
              <p className="text-sm text-slate-600">Browse and export audit records</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
