'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Pencil, Save, X, CheckCircle, XCircle, RotateCcw, Printer } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import StepPicker, { Step } from './StepPicker'
import { canWriteScope } from '@/lib/config/access'


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open: 'bg-amber-100 text-amber-700',
    Closed: 'bg-green-100 text-green-700',
    Canceled: 'bg-slate-200 text-slate-600',
  }
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

export default function ReworkDetail({ reworkId, onClose, onDataChange }: {
  reworkId: number; onClose: () => void; onDataChange?: () => void
}) {
  const { data: session } = useSession()
  const roles = (session?.user?.roles || []) as string[]
  const canEdit = canWriteScope(roles, 'operations/reworks')

  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [steps, setSteps] = useState<Step[]>([])

  const fetchRecord = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/operations/reworks?id=${reworkId}`))
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setRecord((await res.json()).record)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchRecord() }, [reworkId])

  const startEdit = () => {
    setForm({
      customerName: record.customer_name || '', customerPart: record.customer_part || '',
      workOrder: record.work_order || '', pcbNumber: record.pcb_number || '',
      inspectionReport: record.inspection_report || '', authorizedBy: record.authorized_by || '',
      reworkDate: record.rework_date ? String(record.rework_date).slice(0, 10) : '',
      discrepancy: record.discrepancy || '',
    })
    setSteps((record.steps || []).map((s: any) => ({ code: s.step_code, name: s.step_name, notes: s.notes || '' })))
    setEditing(true)
  }

  const save = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch(getApiUrl('/api/operations/reworks'), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reworkId, ...form, steps }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed')
      setEditing(false); await fetchRecord(); onDataChange?.()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const setStatus = async (status: string) => {
    setError('')
    try {
      const res = await fetch(getApiUrl('/api/operations/reworks'), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reworkId, status }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      await fetchRecord(); onDataChange?.()
    } catch (e: any) { setError(e.message) }
  }

  const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

  const printRework = () => {
    if (!record) return
    const steps = (record.steps || []) as any[]
    const dateStr = record.rework_date ? new Date(record.rework_date).toLocaleDateString() : ''
    const stepRows = steps.map((s, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="step">${esc(s.step_name)}${s.step_code ? ` <span class="code">${esc(s.step_code)}</span>` : ''}
          ${s.notes ? `<div class="notes">${esc(s.notes)}</div>` : ''}</td>
        <td></td><td></td><td></td><td></td>
      </tr>`).join('')

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(record.rework_number)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 24px; font-size: 12px; }
      h1 { font-size: 18px; margin: 0; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 12px; }
      .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 24px; margin-bottom: 14px; }
      .meta .k { font-size: 9px; text-transform: uppercase; color: #555; letter-spacing: .04em; }
      .meta .v { font-size: 13px; font-weight: 600; border-bottom: 1px solid #999; min-height: 18px; }
      .sect { font-weight: 700; margin: 14px 0 4px; }
      .disc { border: 1px solid #999; min-height: 48px; padding: 6px; white-space: pre-wrap; }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      th, td { border: 1px solid #999; padding: 4px 6px; vertical-align: top; }
      th { background: #f0f0f0; font-size: 10px; text-transform: uppercase; }
      td.num { width: 24px; text-align: center; color: #555; }
      td.step { width: 46%; }
      .code { color: #777; font-size: 10px; }
      .notes { color: #444; font-size: 11px; margin-top: 2px; font-style: italic; }
      .footer { margin-top: 18px; display: flex; justify-content: space-between; font-size: 10px; color: #555; border-top: 1px solid #ccc; padding-top: 6px; }
      @media print { body { margin: 0.5in; } }
    </style></head><body>
      <div class="top">
        <div><h1>Amphenol — Rework Form</h1><div style="font-size:11px;color:#555">Printed Circuits</div></div>
        <div style="text-align:right"><div style="font-size:16px;font-weight:700">${esc(record.rework_number)}</div><div style="font-size:11px">Status: ${esc(record.status)}</div></div>
      </div>
      <div class="meta">
        <div><div class="k">Customer Name</div><div class="v">${esc(record.customer_name)}</div></div>
        <div><div class="k">Inspection Report #</div><div class="v">${esc(record.inspection_report)}</div></div>
        <div><div class="k">Authorized By</div><div class="v">${esc(record.authorized_by)}</div></div>
        <div><div class="k">APC Part #</div><div class="v">${esc(record.customer_part)}</div></div>
        <div><div class="k">PCB Number</div><div class="v">${esc(record.pcb_number)}</div></div>
        <div><div class="k">Date</div><div class="v">${esc(dateStr)}</div></div>
        <div><div class="k">Work Order #</div><div class="v">${esc(record.work_order)}</div></div>
        <div><div class="k">Site</div><div class="v">${esc(record.site)}</div></div>
      </div>
      <div class="sect">Discrepancy:</div>
      <div class="disc">${esc(record.discrepancy)}</div>
      <div class="sect">Rework Steps / Special Instructions:</div>
      <table>
        <thead><tr><th>#</th><th>Step / Instructions</th><th>Operator Init</th><th>Qty In</th><th>Qty Out</th><th>Date</th></tr></thead>
        <tbody>${stepRows || '<tr><td colspan="6" style="text-align:center;color:#999">No steps</td></tr>'}</tbody>
      </table>
      <div class="footer"><span>F01-2A-990-09</span><span>The original form must remain with the Batch Card</span></div>
      <script>window.onload = function(){ window.print(); }</script>
    </body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading…</div>
  if (error && !record) return <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
  if (!record) return null

  const F = (label: string, val: any) => (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-800">{val || '—'}</p>
    </div>
  )
  const In = (label: string, key: string, type = 'text') => (
    <div>
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"><ArrowLeft size={20} /></button>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              {record.rework_number} <StatusBadge status={record.status} />
            </h3>
            <p className="text-xs text-slate-500">{record.customer_name || '—'} · WO {record.work_order || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <button onClick={printRework} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 border border-slate-200" title="Print / Save as PDF"><Printer size={14} /> Print</button>
          )}
          {canEdit && !editing && record.status === 'Open' && (
            <>
              <button onClick={startEdit} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 border border-slate-200"><Pencil size={14} /> Edit</button>
              <button onClick={() => setStatus('Closed')} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5"><CheckCircle size={14} /> Close</button>
              <button onClick={() => setStatus('Canceled')} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"><XCircle size={14} /> Cancel</button>
            </>
          )}
          {canEdit && !editing && record.status !== 'Open' && (
            <button onClick={() => setStatus('Open')} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 border border-slate-200"><RotateCcw size={14} /> Reopen</button>
          )}
          {editing && (
            <>
              <button onClick={save} disabled={saving} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50"><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"><X size={14} /> Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {In('Customer Name', 'customerName')}
            {In('APC Part #', 'customerPart')}
            {In('Work Order #', 'workOrder')}
            {In('PCB Number', 'pcbNumber')}
            {In('Inspection Report #', 'inspectionReport')}
            {In('Authorized By', 'authorizedBy')}
            {In('Date', 'reworkDate', 'date')}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {F('Customer Name', record.customer_name)}
            {F('APC Part #', record.customer_part)}
            {F('Work Order #', record.work_order)}
            {F('PCB Number', record.pcb_number)}
            {F('Inspection Report #', record.inspection_report)}
            {F('Authorized By', record.authorized_by)}
            {F('Date', record.rework_date ? new Date(record.rework_date).toLocaleDateString() : null)}
            {F('Site', record.site)}
            {F('Created By', record.created_by)}
          </div>
        )}

        {/* Discrepancy */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Discrepancy</p>
          {editing ? (
            <textarea value={form.discrepancy || ''} onChange={e => setForm((f: any) => ({ ...f, discrepancy: e.target.value }))} rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          ) : (
            <p className="text-sm text-slate-800 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{record.discrepancy || '—'}</p>
          )}
        </div>

        {/* Steps */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Rework Steps / Special Instructions</p>
          {editing ? (
            <StepPicker steps={steps} onChange={setSteps} />
          ) : (record.steps || []).length === 0 ? (
            <p className="text-sm text-slate-400">No steps recorded.</p>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-10">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Step</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Parameters / Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {record.steps.map((s: any, i: number) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 text-slate-800">{s.step_name}{s.step_code ? <span className="text-xs text-slate-400 ml-2">{s.step_code}</span> : null}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs whitespace-pre-wrap">{s.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
