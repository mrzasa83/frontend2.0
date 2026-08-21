'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, ScrollText, ClipboardList } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

export default function ContractDashboardPage() {
  const [clauseCount, setClauseCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(getApiUrl('/api/contract/clauses'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setClauseCount(d.count ?? 0) })
      .catch(() => {})
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Contract</h1>
        <p className="text-sm text-slate-600">FAR / DFAR clause management and PO compliance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/contract/clauses"
          className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition">
          <div className="flex items-center gap-3 mb-2">
            <ScrollText className="text-blue-600" size={22} />
            <h2 className="font-semibold text-slate-800">Clauses</h2>
          </div>
          <p className="text-sm text-slate-500">
            The standardized FAR/DFAR/agency clause catalog.
            {clauseCount != null && <span className="text-slate-700 font-medium"> {clauseCount.toLocaleString()} clauses.</span>}
          </p>
        </Link>

        <Link href="/contract/pos"
          className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="text-blue-600" size={22} />
            <h2 className="font-semibold text-slate-800">POs</h2>
          </div>
          <p className="text-sm text-slate-500">
            Relate a purchase order to its called-out clauses. OCR-assisted review (coming soon).
          </p>
        </Link>
      </div>
    </div>
  )
}
