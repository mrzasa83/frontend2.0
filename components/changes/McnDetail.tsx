'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, ClipboardList, PenLine, Gavel, Layers, ShieldCheck,
  Ruler, FileCode, Network, History as HistoryIcon,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

/**
 * Detail view for one Product Change (MCN).
 *
 * The legacy record has ~99 fields. The groupings below follow the tabs the
 * legacy app used where the field dictionary named one, and cluster the rest by
 * subject — cost, BOM/WIP, quality, form-fit-function, CAM files — rather than
 * dumping everything on a single page.
 *
 * Read-only for now: nothing here writes back.
 */

type Field = { key: string; label: string; wide?: boolean; type?: 'date' | 'bool' | 'money' | 'long' }
type Group = { id: string; label: string; icon: any; fields: Field[] }

const GROUPS: Group[] = [
  {
    id: 'general', label: 'General', icon: ClipboardList, fields: [
      { key: 'toolnum', label: 'Tool #' },
      { key: 'partnum', label: 'Part #' },
      { key: 'customer', label: 'Customer' },
      { key: 'custcode', label: 'Customer Code' },
      { key: 'subdate', label: 'Submitted' },
      { key: 'subtime', label: 'Time' },
      { key: 'urgent', label: 'Urgent' },
      { key: 'submission_type', label: 'Submission Type' },
      { key: 'change', label: 'Change', wide: true, type: 'long' },
      { key: 'reason', label: 'Reason', wide: true, type: 'long' },
      { key: 'chngreason', label: 'Change Reason', wide: true, type: 'long' },
      { key: 'chngeffect', label: 'Change Effect', wide: true, type: 'long' },
      { key: 'othereffect', label: 'Other Effect', wide: true },
      { key: 'otherreason', label: 'Other Reason', wide: true },
      { key: 'reqdate', label: 'Requested Date' },
      { key: 'timespent', label: 'Time Spent' },
    ],
  },
  {
    id: 'signoff', label: 'Signoff', icon: PenLine, fields: [
      { key: 'initiator', label: 'Initiator' },
      { key: 'requester', label: 'Requester' },
      { key: 'otherrequester', label: 'Other Requester' },
      { key: 'ppe', label: 'PPE' },
      { key: 'pe', label: 'PE' },
      { key: 'pe_disposition', label: 'PE Disposition' },
      { key: 'pe_disposition_date', label: 'PE Disposition Date' },
      { key: 'pe_disposition_time', label: 'PE Disposition Time' },
      { key: 'pe_forward', label: 'PE Forward' },
      { key: 'whyreject', label: 'Why Rejected', wide: true, type: 'long' },
      { key: 'closedby', label: 'Closed By' },
      { key: 'closeddate', label: 'Closed Date' },
      { key: 'closedtime', label: 'Closed Time' },
      { key: 'user', label: 'User' },
    ],
  },
  {
    id: 'disposition', label: 'Disposition & Cost', icon: Gavel, fields: [
      { key: 'disposition', label: 'Disposition' },
      { key: 'dis_reason', label: 'Disposition Reason', wide: true, type: 'long' },
      { key: 'completed_goods', label: 'Completed Goods' },
      { key: 'completed_parts', label: 'Completed Parts' },
      { key: 'cost_disposition', label: 'Cost Disposition' },
      { key: 'cost_disposition_date', label: 'Cost Disposition Date' },
      { key: 'cost_disposition_time', label: 'Cost Disposition Time' },
      { key: 'total_cost_impact', label: 'Total Cost Impact', type: 'money' },
      { key: 'cost_comments', label: 'Cost Comments', wide: true, type: 'long' },
      { key: 'costing_attachments', label: 'Costing Attachments', wide: true },
    ],
  },
  {
    id: 'bom', label: 'BOM & WIP', icon: Layers, fields: [
      { key: 'bom_disposition', label: 'BOM Disposition' },
      { key: 'bom_disposition_date', label: 'BOM Disposition Date' },
      { key: 'bom_disposition_time', label: 'BOM Disposition Time' },
      { key: 'bom_comments', label: 'BOM Comments', wide: true, type: 'long' },
      { key: 'manuf_bom_items', label: 'Manufactured BOM Items', wide: true },
      { key: 'purch_bom_items', label: 'Purchased BOM Items', wide: true },
      { key: 'wip', label: 'WIP' },
      { key: 'wip_items', label: 'WIP Items', wide: true },
      { key: 'wipinstruct', label: 'WIP Instructions', wide: true, type: 'long' },
      { key: 'batchcard', label: 'Batchcard' },
      { key: 'batchcardinstruct', label: 'Batchcard Instructions', wide: true, type: 'long' },
      { key: 'marked_batchcards', label: 'Marked Batchcards', wide: true },
      { key: 'any_marked_batchcards', label: 'Any Marked Batchcards' },
      { key: 'wo_updated', label: 'WO Updated' },
    ],
  },
  {
    id: 'quality', label: 'Quality', icon: ShieldCheck, fields: [
      { key: 'is_cust_spec_violated', label: 'Customer Spec Violated' },
      { key: 'is_cust_spec_violated_ok', label: 'Spec Violation OK' },
      { key: 'is_cust_req_violation', label: 'Customer Req Violation' },
      { key: 'is_cust_req_violation_ok', label: 'Req Violation OK' },
      { key: 'product_quality_impacted', label: 'Product Quality Impacted' },
      { key: 'qe', label: 'QE' },
      { key: 'pcn_required', label: 'PCN Required' },
      { key: 'pcn_email_sent', label: 'PCN Email Sent' },
      { key: 'delta_first_article', label: 'Delta First Article' },
    ],
  },
  {
    id: 'fff', label: 'Form / Fit / Function', icon: Ruler, fields: [
      { key: 'is_form_fit_function_affected', label: 'FFF Affected' },
      { key: 'form_fit_function_affected', label: 'FFF Detail', wide: true, type: 'long' },
      { key: 'fff_vote', label: 'FFF Vote' },
      { key: 'fff_voter', label: 'FFF Voter' },
      { key: 'fff_vote_date', label: 'Vote Date' },
      { key: 'fff_vote_time', label: 'Vote Time' },
      { key: 'fff_vote_comments', label: 'Vote Comments', wide: true, type: 'long' },
      { key: 'wcm_disposition', label: 'WCM Disposition' },
      { key: 'wcm_disposition_date', label: 'WCM Disposition Date' },
      { key: 'wcm_disposition_time', label: 'WCM Disposition Time' },
    ],
  },
  {
    id: 'cam', label: 'CAM & Files', icon: FileCode, fields: [
      { key: 'software', label: 'Software' },
      { key: 'genesisother', label: 'Genesis Other' },
      { key: 'paradigmother', label: 'Paradigm Other' },
      { key: 'emeraldother', label: 'Emerald Other' },
      { key: 'is_special_nc_file_names', label: 'Special NC File Names?' },
      { key: 'special_nc_file_names', label: 'Special NC File Names', wide: true },
      { key: 'markup_instruct', label: 'Markup Instructions', wide: true, type: 'long' },
      { key: 'attachments', label: 'Attachments', wide: true },
      { key: 'x_email', label: 'Email' },
      { key: 'ext_email', label: 'External Email' },
    ],
  },
  {
    id: 'links', label: 'Where Used & ECO', icon: Network, fields: [
      { key: 'para_top_level', label: 'Paradigm Top Level', wide: true },
      { key: 'eco', label: 'ECO' },
      { key: 'to_eco', label: 'To ECO' },
    ],
  },
  {
    id: 'hold', label: 'Hold', icon: HistoryIcon, fields: [
      { key: 'hold_status', label: 'Hold Status' },
      { key: 'hold_status_reason', label: 'Hold Reason', wide: true, type: 'long' },
      { key: 'paradigm_hold', label: 'Paradigm Hold' },
      { key: 'hold_status_history', label: 'Hold History', wide: true, type: 'long' },
    ],
  },
]

const isEmpty = (v: any) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '')

function renderValue(v: any, type?: string) {
  if (isEmpty(v)) return <span className="text-slate-300">—</span>
  if (type === 'money') {
    const n = Number(v)
    if (isFinite(n)) return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
  }
  const s = String(v)
  if (type === 'long' || s.length > 90) {
    return <span className="whitespace-pre-wrap break-words">{s}</span>
  }
  return s
}

export default function McnDetail({ id }: { id: number }) {
  const [tab, setTab] = useState('general')
  const [rec, setRec] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEmpty, setShowEmpty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/products/changes/mcn?id=${id}`))
      const r = await res.json()
      if (!res.ok) throw new Error(r.error || r.details || 'Failed to load')
      setRec(r.record)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [id])
  useEffect(() => { load() }, [load])

  if (loading) return <div className="text-slate-500 py-8 flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
  if (error) return <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
  if (!rec) return null

  const group = GROUPS.find(g => g.id === tab) || GROUPS[0]
  const visible = group.fields.filter(f => showEmpty || !isEmpty(rec[f.key]))
  const hiddenCount = group.fields.length - visible.length

  return (
    <div>
      <div className="flex gap-0 min-h-[420px]">
        <div className="w-56 flex-shrink-0 border-r border-slate-200">
          {GROUPS.map(g => {
            const Icon = g.icon
            const active = tab === g.id
            // Count of populated fields, so it's obvious where the content is.
            const filled = g.fields.filter(f => !isEmpty(rec[f.key])).length
            return (
              <button key={g.id} onClick={() => setTab(g.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg transition-colors ${
                  active ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                <Icon size={15} /> <span className="flex-1">{g.label}</span>
                <span className={`text-xs ${active ? 'text-blue-100' : 'text-slate-400'}`}>{filled}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 pl-6 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-800">{group.label}</h3>
            {hiddenCount > 0 && (
              <button onClick={() => setShowEmpty(!showEmpty)} className="text-xs text-blue-600 hover:underline">
                {showEmpty ? 'Hide' : 'Show'} {hiddenCount} empty field{hiddenCount === 1 ? '' : 's'}
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-4">
              Nothing recorded in this section.
            </div>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {visible.map(f => (
                <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">{f.label}</dt>
                  <dd className={`text-slate-800 ${isEmpty(rec[f.key]) ? '' : 'mt-0.5'}`}>
                    {renderValue(rec[f.key], f.type)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  )
}
