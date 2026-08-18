'use client'

import { ClipboardList } from 'lucide-react'

export default function ContractPOsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">POs</h1>
        <p className="text-sm text-slate-600">Relate a purchase order to its called-out clauses</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-2xl">
        <ClipboardList className="mx-auto text-slate-300 mb-3" size={40} />
        <h2 className="font-semibold text-slate-700 mb-1">Coming next</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          This is where a Program Manager will pull a PO from the existing PO database, run an
          OCR pass over the PO PDF to surface suggested clauses called out, and relate them to
          the standardized clause catalog. Suggested clauses will be advisory — it stays at the
          user’s discretion to accept them.
        </p>
      </div>
    </div>
  )
}
