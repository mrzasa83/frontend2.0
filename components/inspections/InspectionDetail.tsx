'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw, ArrowLeft, Link2 } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type Props = {
  inspectionId: number
  onClose: () => void
  onDataChange?: () => void
}

const PHASE_COLORS: Record<string, string> = {
  Setup: 'bg-slate-100 text-slate-600',
  Measurement: 'bg-blue-100 text-blue-700',
  Verify: 'bg-indigo-100 text-indigo-700',
  Submitted: 'bg-yellow-100 text-yellow-700',
  Rework: 'bg-orange-100 text-orange-700',
  Completed: 'bg-green-100 text-green-700',
  Canceled: 'bg-red-100 text-red-700',
}

function PhaseBadge({ phase }: { phase: string }) {
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${PHASE_COLORS[phase] || 'bg-slate-100 text-slate-600'}`}>{phase}</span>
}

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'history', label: 'History' },
]

export default function InspectionDetail({ inspectionId, onClose, onDataChange }: Props) {
  const [record, setRecord] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('general')

  const fetchRecord = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/operations/inspections?id=${inspectionId}`))
      if (!res.ok) throw new Error((await res.json()).details || 'Failed')
      const r = await res.json()
      setRecord(r.record)
      setHistory(r.history || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRecord() }, [inspectionId])

  if (loading) return <div className="flex items-center gap-2 py-12 justify-center text-slate-500"><RefreshCw size={18} className="animate-spin" /> Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!record) return <div className="p-6 text-red-600">Record not found</div>

  const renderTab = (tabId: string) => {
    if (tabId === 'general') {
      const fields: [string, any][] = [
        ['Inspection #', record.inspection_number],
        ['Type', record.inspection_type],
        ['Product Type', record.product_type],
        ['Part Number', record.part_number],
        ['Work Order', record.work_order],
        ['Owner', record.owner],
        ['Phase', record.phase],
        ['Site', record.site],
        ['Start Date', record.start_date ? new Date(record.start_date).toLocaleDateString() : null],
        ['Dependency', record.dependency ? `${record.dependency.inspection_number} (${record.dependency.phase})` : null],
        ['Created By', record.created_by],
        ['Created', record.created_at ? new Date(record.created_at).toLocaleString() : null],
      ]
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fields.map(([label, val]) => (
              <div key={label}>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm text-slate-800">{val || '—'}</p>
              </div>
            ))}
          </div>
          {record.notes && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-slate-800 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}
        </div>
      )
    }
    if (tabId === 'history') {
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700">Change History ({history.length})</h4>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">No changes recorded</p>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Field</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Old</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">New</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">By</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">When</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-700">{h.field_name}</td>
                      <td className="px-3 py-2 text-red-500 text-xs">{h.old_value || '—'}</td>
                      <td className="px-3 py-2 text-green-600 text-xs">{h.new_value || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{h.changed_by}</td>
                      <td className="px-3 py-2 text-slate-500 text-xs">{new Date(h.changed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 flex-shrink-0">
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"><ArrowLeft size={20} /></button>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            {record.inspection_number} <PhaseBadge phase={record.phase} />
          </h3>
          <p className="text-sm text-slate-500">{record.inspection_type} · {record.product_type}{record.part_number ? ` · ${record.part_number}` : ''}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        <div className="w-48 border-r border-slate-200 py-2 flex-shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                activeTab === t.id ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderTab(activeTab)}
        </div>
      </div>
    </div>
  )
}
