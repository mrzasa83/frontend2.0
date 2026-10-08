'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  RefreshCw, ArrowLeft, Search, Plus, Trash2, GitCompare, Layers,
  AlertTriangle, CheckCircle2, X,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import GoldStandardCompare from '@/components/products/GoldStandardCompare'

/**
 * One gold standard: General, BOM, Route, Like Parts.
 *
 * The captured data is shown per CARD LEVEL, because that is how a batch card
 * set is built — level 0 is the customer part, each level below it a
 * manufactured sub-assembly with its own BOM and route. Flattening them into
 * one list would lose the thing being standardised.
 *
 * Read-only for now by design. The tables are editable (every row carries its
 * id and history is wired), but editing is held back until the layout is
 * settled — shipping an editor over a shape that is about to change would
 * mean migrating edits nobody asked for yet.
 */

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'bom', label: 'BOM' },
  { id: 'route', label: 'Route' },
  { id: 'like-parts', label: 'Like Parts' },
] as const
type TabId = typeof TABS[number]['id']

const fmtDate = (v: any) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()
}

/** The three states a standard moves through. Free text in the column, but
 *  these are the only ones the interface offers. */
const STATUSES = ['draft', 'active', 'retired'] as const

export default function GoldStandardDetail(
  { id, onClose, onChanged, onDeleted }:
  { id: number; onClose: () => void; onChanged?: () => void
    /** Closes this standard's TAB. onClose only returns to the list. */
    onDeleted?: () => void }
) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabId>('general')
  const [cardIdx, setCardIdx] = useState(0)
  const [recapturing, setRecapturing] = useState(false)
  /**
   * The active comparison, one at a time. It takes over the tab body rather
   * than opening a tab of its own: a compare belongs to this standard, and the
   * page's tab strip is for standards.
   */
  const [compare, setCompare] = useState<{ likePartId: number; partNumber: string } | null>(null)
  /** What this user may change here, as the API reports it. */
  const [can, setCan] = useState({ manageStandards: false, manageParts: false })
  const [savingStatus, setSavingStatus] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/products/gold-standard/${id}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      setData(d)
      setCan({
        manageStandards: !!d.can?.manageStandards,
        manageParts: !!d.can?.manageParts,
      })
      setCardIdx(i => Math.min(i, Math.max((d.cards?.length || 1) - 1, 0)))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  /**
   * Status drives nothing yet — no query filters on it. It is a label the
   * team keeps honest by hand: draft while a standard is being built, active
   * once it is the one to measure against, retired when it no longer is.
   */
  const setStatus = async (status: string) => {
    setSavingStatus(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/products/gold-standard/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      await load(); onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setSavingStatus(false) }
  }

  const remove = async () => {
    setError('')
    try {
      const res = await fetch(getApiUrl(`/api/products/gold-standard/${id}`), { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      setConfirmDelete(false)
      // The tab has to go, not just lose focus — leaving it open would point
      // at a row that no longer exists.
      onDeleted ? onDeleted() : onClose()
      onChanged?.()
    } catch (e) {
      setConfirmDelete(false)
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const recapture = async () => {
    setRecapturing(true); setError('')
    try {
      const res = await fetch(getApiUrl(`/api/products/gold-standard/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recapture' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      if (d.partial) {
        setError(`Captured ${d.captured.cards} of ${d.captured.expected} card levels — the copy is incomplete.`)
      }
      await load(); onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setRecapturing(false) }
  }

  const cards = data?.cards || []
  const card = cards[cardIdx]

  if (loading && !data) {
    return <div className="flex items-center gap-2 py-16 justify-center text-slate-500">
      <RefreshCw size={18} className="animate-spin" /> Loading…
    </div>
  }
  if (!data) {
    return <div className="p-6">
      <button onClick={onClose} className="text-sm text-blue-600 mb-3 inline-flex items-center gap-1">
        <ArrowLeft size={14} /> Back
      </button>
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
    </div>
  }

  const s = data.standard

  /**
   * Card picker for the BOM and Route tabs.
   *
   * A rail rather than a row of buttons: a real board puts seven or more
   * manufactured parts at level 1 alone (inner layers, adhesives, coverlays),
   * and a wrapping button row becomes unreadable at that size. Indented by
   * parent so the set reads as the tree it is.
   */
  const CardRail = () => {
    if (cards.length <= 1) return null
    const byParent = new Map<number | null, any[]>()
    for (const c of cards) {
      const k = c.parentCardId ?? null
      if (!byParent.has(k)) byParent.set(k, [])
      byParent.get(k)!.push(c)
    }
    // Orphans (a parent that failed to capture) would otherwise be invisible,
    // so anything unreachable from the root is shown at the top level.
    const ids = new Set(cards.map((c: any) => c.id))
    const roots = cards.filter((c: any) =>
      c.parentCardId == null || !ids.has(c.parentCardId))

    const render = (list: any[], depth: number): any[] =>
      list.flatMap((c: any) => [
        <button key={c.id} onClick={() => setCardIdx(cards.findIndex((x: any) => x.id === c.id))}
          title={c.description}
          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
            cards[cardIdx]?.id === c.id
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-100'}`}
          style={{ paddingLeft: 8 + depth * 12 }}>
          <span className="font-mono">{c.partNumber || '—'}</span>
          <span className={`ml-1.5 ${cards[cardIdx]?.id === c.id ? 'text-blue-100' : 'text-slate-400'}`}>
            {c.route?.length || 0}s · {c.bom?.length || 0}b
          </span>
        </button>,
        ...render(byParent.get(c.id) || [], depth + 1),
      ])

    return (
      <div className="w-56 shrink-0 border border-slate-200 rounded-lg p-1 max-h-[32rem] overflow-y-auto">
        <div className="px-2 py-1 text-xs uppercase tracking-wider text-slate-500">
          Cards ({cards.length})
        </div>
        {render(roots, 0)}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <button onClick={onClose} className="text-sm text-blue-600 mb-2 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> All Gold Standards
          </button>
          <h2 className="text-xl font-bold text-slate-800 truncate">
            {s.apcPartNumber || s.customerPartNumber}
            <span className="ml-2 text-sm font-normal text-slate-500">{s.technology}</span>
          </h2>
          <p className="text-sm text-slate-600">
            {s.customerPartNumber}{s.program ? ` · ${s.program}` : ''}
            {s.customerName ? ` · ${s.customerName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status is a dropdown for whoever may change it and a badge for
              everyone else — same three values either way, so the page reads
              the same whichever you are. */}
          {can.manageStandards ? (
            <select value={s.status} onChange={e => setStatus(e.target.value)}
              disabled={savingStatus}
              title="Draft while it is being built; Active once it is the standard to measure against; Retired when it no longer is"
              className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer disabled:opacity-50 ${
                s.status === 'active' ? 'bg-green-100 text-green-700 border-green-200'
                  : s.status === 'retired' ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
              {STATUSES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          ) : (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              s.status === 'active' ? 'bg-green-100 text-green-700'
                : s.status === 'retired' ? 'bg-slate-100 text-slate-500'
                : 'bg-amber-100 text-amber-700'}`}>{s.status}</span>
          )}
          {/* Re-capture replaces every card under the standard, so it needs
              the same role as creating one. */}
          {can.manageStandards && (
            <button onClick={recapture} disabled={recapturing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw size={14} className={recapturing ? 'animate-spin' : ''} />
              {recapturing ? 'Capturing…' : 'Re-capture'}
            </button>
          )}
          {can.manageStandards && (
            <button onClick={() => setConfirmDelete(true)} title="Delete this gold standard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {confirmDelete && (
        <DeleteDialog standard={s} cardCount={cards.length}
          likePartCount={(data.likeParts || []).length}
          onClose={() => setConfirmDelete(false)}
          onConfirm={remove} />
      )}

      {/* A standard with no cards is the shape a failed capture leaves behind.
          Saying so beats four empty tabs. */}
      {!cards.length && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            Nothing has been captured for this standard yet.{' '}
            {can.manageStandards
              ? <>Use <em>Re-capture</em> to read it from Paradigm.</>
              : 'Someone with the NPIeng role needs to capture it from Paradigm.'}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 break-words">{error}</div>
        </div>
      )}

      {compare ? (
        <GoldStandardCompare goldStandardId={id}
          likePartId={compare.likePartId} partNumber={compare.partNumber}
          onBack={() => { setCompare(null); load() }} />
      ) : (
      <>
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-700 font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-800'}`}>
            {t.label}
            {t.id === 'like-parts' && data.likeParts?.length
              ? <span className="ml-1.5 text-xs text-slate-400">{data.likeParts.length}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab standard={s} cards={cards} />}
      {tab === 'bom' && (
        <div className="flex gap-4 items-start">
          <CardRail />
          <div className="min-w-0 flex-1">
            {card && <CardHeading card={card} />}
            {card ? <BomTab card={card} /> : null}
          </div>
        </div>
      )}
      {tab === 'route' && (
        <div className="flex gap-4 items-start">
          <CardRail />
          <div className="min-w-0 flex-1">
            {card && <CardHeading card={card} />}
            {card ? <RouteTab card={card} /> : null}
          </div>
        </div>
      )}
      {tab === 'like-parts' && (
        <LikePartsTab goldStandardId={id} standard={s} parts={data.likeParts || []}
          onChanged={() => { load(); onChanged?.() }}
          canManage={can.manageParts}
          onCompare={(likePartId, partNumber) => setCompare({ likePartId, partNumber })} />
      )}
      </>
      )}
    </div>
  )
}

/**
 * Delete confirmation.
 *
 * Typing the part number rather than clicking OK, because the delete cascades
 * through all nine tables: every captured card, its BOM, route, instructions
 * and parameters, every attached like part with its comparison history, and
 * the standard's own history. There is no undo and no soft delete — what the
 * dialog lists is what goes.
 */
function DeleteDialog(
  { standard, cardCount, likePartCount, onClose, onConfirm }:
  { standard: any; cardCount: number; likePartCount: number
    onClose: () => void; onConfirm: () => void }
) {
  const target = String(standard.apcPartNumber || standard.customerPartNumber || '')
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const ok = typed.trim().toUpperCase() === target.trim().toUpperCase()

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Delete gold standard</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              This permanently deletes <span className="font-mono font-semibold">{target}</span> and
              everything under it: {cardCount} captured card{cardCount === 1 ? '' : 's'} with their
              BOM, route and parameters, {likePartCount} like part
              {likePartCount === 1 ? '' : 's'} with their comparison history, and the
              standard&apos;s own history. It cannot be undone.
            </div>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
              Type <span className="font-mono text-slate-700">{target}</span> to confirm
            </span>
            <input value={typed} onChange={e => setTyped(e.target.value)} autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && ok && !busy) { setBusy(true); onConfirm() } }}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400" />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            Cancel
          </button>
          <button onClick={() => { setBusy(true); onConfirm() }} disabled={!ok || busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
            <Trash2 size={14} /> {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Which card is on screen — with 20 cards the rail alone is not enough. */
function CardHeading({ card }: { card: any }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xs text-slate-500">Level {card.level}</span>
        <span className="font-mono text-sm font-semibold text-slate-800">{card.partNumber}</span>
        <span className="text-sm text-slate-600">{card.description}</span>
        {card.routeCode && (
          <span className="text-xs text-slate-500">
            · {card.routeCode}{card.routeName ? ` ${card.routeName}` : ''}
          </span>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm text-slate-800 break-words">{value || <span className="text-slate-300">—</span>}</div>
    </div>
  )
}

function GeneralTab({ standard: s, cards }: { standard: any; cards: any[] }) {
  const top = cards[0]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Technology" value={s.technology} />
        <Field label="APC Part Number" value={s.apcPartNumber} />
        <Field label="Customer Part Number" value={s.customerPartNumber} />
        <Field label="Program" value={s.program} />
        <Field label="Customer" value={s.customerName || s.customerCode} />
        <Field label="Revision" value={s.revision || top?.revision} />
        <Field label="Card Levels" value={s.cardCount} />
        <Field label="Like Parts" value={s.likePartCount} />
        <Field label="Captured" value={s.capturedAt ? `${fmtDate(s.capturedAt)} by ${s.capturedBy}` : 'never'} />
        <Field label="Created" value={`${fmtDate(s.createdAt)} by ${s.createdBy}`} />
      </div>

      {s.notes && (
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Notes</div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">{s.notes}</div>
        </div>
      )}

      {top && (
        <div>
          <h4 className="font-semibold text-slate-800 mb-2">Top card</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <Field label="Description" value={top.description} />
            <Field label="BOM" value={top.bomNumber} />
            <Field label="Route" value={top.routeCode ? `${top.routeCode} — ${top.routeName}` : ''} />
            <Field label="Product Code" value={top.productCode ? `${top.productCode} — ${top.productName}` : ''} />
            <Field label="Catalog Number" value={top.catalogNumber} />
            <Field label="Sales Part" value={top.salesPartNumber} />
            <Field label="Modified" value={top.modifiedBy ? `${top.modifiedDate} — ${top.modifiedBy}` : ''} />
            <Field label="Entered" value={top.enteredBy ? `${top.enteredDate} — ${top.enteredBy}` : ''} />
          </div>
        </div>
      )}

      {/* The card sequence, so the depth of the capture is visible without
          clicking into BOM or Route. */}
      {cards.length > 1 && (
        <div>
          <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
            <Layers size={15} /> Card sequence
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Level</th>
                  <th className="px-3 py-2">Part</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Route</th>
                  <th className="px-3 py-2 text-right">BOM lines</th>
                  <th className="px-3 py-2 text-right">Steps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cards.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-500">{c.level}</td>
                    <td className="px-3 py-2 font-mono text-xs">{c.partNumber}</td>
                    <td className="px-3 py-2 max-w-md truncate" title={c.description}>{c.description}</td>
                    <td className="px-3 py-2 text-xs">{c.routeCode}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.bom?.length || 0}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.route?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function BomTab({ card }: { card: any }) {
  if (!card.bom?.length) {
    return <div className="py-10 text-center text-sm text-slate-500">
      No BOM lines captured for level {card.level}.
    </div>
  }
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2">Part Number</th>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2">P/M</th>
            <th className="px-3 py-2">Unit</th>
            <th className="px-3 py-2 text-right">Required Per</th>
            <th className="px-3 py-2 text-right">Qty Required</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {card.bom.map((b: any, i: number) => (
            <tr key={b.id} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-slate-400">{i + 1}</td>
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{b.partNumber}</td>
              <td className="px-3 py-2 max-w-md truncate" title={b.description}>{b.description}</td>
              <td className="px-3 py-2">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  b.isManufactured ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                  {b.isManufactured ? 'M' : 'P'}
                </span>
              </td>
              <td className="px-3 py-2 text-xs">{b.unit}</td>
              <td className="px-3 py-2 text-right tabular-nums">{b.requiredPer}</td>
              <td className="px-3 py-2 text-right tabular-nums">{b.qtyRequired}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RouteTab({ card }: { card: any }) {
  if (!card.route?.length) {
    return <div className="py-10 text-center text-sm text-slate-500">
      No route steps captured for level {card.level}.
    </div>
  }
  return (
    <div className="space-y-3">
      {card.route.map((r: any) => (
        <div key={r.id} className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200">
            <span className="w-10 text-sm font-semibold text-slate-700 tabular-nums">{r.step}</span>
            <span className="text-sm font-medium text-slate-800">{r.dept}</span>
            {r.deptCode && <span className="font-mono text-xs text-slate-500">{r.deptCode}</span>}
            {r.instructionCodes &&
              <span className="ml-auto font-mono text-xs text-slate-400">{r.instructionCodes}</span>}
          </div>
          <div className="px-3 py-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Instructions</div>
              {r.instructions?.length ? (
                <ul className="text-sm text-slate-700 space-y-0.5 list-disc pl-4">
                  {r.instructions.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              ) : <div className="text-sm text-slate-300">—</div>}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Parameters</div>
              {r.params?.length ? (
                <table className="text-sm">
                  <tbody>
                    {r.params.map((p: any) => (
                      <tr key={p.id}>
                        <td className="pr-3 py-0.5 text-slate-500 align-top">{p.name}</td>
                        {/* A parameter's value may be a multi-line note;
                            whitespace-pre-line keeps those breaks. */}
                        <td className="py-0.5 font-medium text-slate-800 whitespace-pre-line">{p.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="text-sm text-slate-300">—</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** The part number a like part is filed under — the sales part when there
 *  is one, otherwise the production part. Used for both the Add payload and
 *  the already-attached check, so the two can't disagree. */
function likePartKey(r: any): string {
  return String(r?.sales_part || r?.prod_part || '')
}

/**
 * Like Parts — attach parts to compare against this standard.
 *
 * The picker runs the same search as EHS -> Product Compliance -> Assess a
 * product. It calls /api/products/gold-standard/part-search rather than the
 * EHS route because that one is gated on EHS read and most roles with Product
 * read have none; both routes share one query in lib/products/partSearch.ts.
 */
function LikePartsTab(
  { goldStandardId, standard, parts, onChanged, canManage, onCompare }:
  { goldStandardId: number; standard: any; parts: any[]; onChanged: () => void
    canManage: boolean
    onCompare: (likePartId: number, partNumber: string) => void }
) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  // null, not '', so an empty key can never match and strand the button on
  // "Adding…" — the bug the first version shipped with.
  const [adding, setAdding] = useState<string | null>(null)
  const [includeObsolete, setIncludeObsolete] = useState(false)
  const [err, setErr] = useState('')

  const attached = useMemo(
    () => new Set(parts.map(p => String(p.customerPartNumber || ''))), [parts])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setResults([]); return }
    let cancelled = false
    const t = setTimeout(async () => {
      setSearching(true); setErr('')
      try {
        const p = new URLSearchParams({ q: term })
        if (includeObsolete) p.set('includeObsolete', '1')
        const res = await fetch(getApiUrl(`/api/products/gold-standard/part-search?${p}`))
        const d = await res.json()
        if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
        if (!cancelled) setResults(d.rows || [])
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e))
      } finally { if (!cancelled) setSearching(false) }
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, includeObsolete])

  const add = async (r: any) => {
    const customerPart = likePartKey(r)
    if (!customerPart) { setErr('That row has no part number to attach.'); return }
    setAdding(customerPart); setErr('')
    try {
      const res = await fetch(getApiUrl('/api/products/gold-standard/like-parts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goldStandardId,
          apcPartNumber: r.prod_part || '',
          customerPartNumber: customerPart,
          program: r.program || '',
          customerName: r.customer_name || '',
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally { setAdding(null) }
  }

  const remove = async (id: number) => {
    setErr('')
    try {
      const res = await fetch(getApiUrl(`/api/products/gold-standard/like-parts?id=${id}`), { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="space-y-5">
      {err && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{err}</div>
      )}

      {!canManage && (
        <p className="text-sm text-slate-500">
          Attaching or removing a like part requires the ProductEng or NPIeng role.
          Comparing an attached part is open to anyone who can see this page.
        </p>
      )}

      {canManage && (
      <div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[18rem] max-w-lg">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search APC part, customer part or program…"
              className="w-full pl-8 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            {searching && <RefreshCw size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={includeObsolete}
              onChange={e => setIncludeObsolete(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            Include obsolete
          </label>
        </div>

        {!!results.length && (
          <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Prod Part #</th>
                  <th className="px-3 py-2">Sales Part #</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Program</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r: any, i: number) => {
                  const key = likePartKey(r)
                  const already = attached.has(key)
                  const isSelf = !!key && key === standard.customerPartNumber
                  const obsolete = String(r.status || '').toUpperCase() === 'OBSOLETE'
                  return (
                    <tr key={`${key || 'row'}-${i}`} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 font-mono text-xs whitespace-nowrap">{r.prod_part}</td>
                      <td className="px-3 py-1.5 font-mono text-xs whitespace-nowrap text-slate-600">{r.sales_part}</td>
                      <td className="px-3 py-1.5 text-xs text-slate-600">{r.customer_name}</td>
                      <td className="px-3 py-1.5 text-xs text-slate-500">{r.program}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        {r.status && (
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            obsolete ? 'bg-slate-100 text-slate-600'
                                     : 'bg-green-100 text-green-700'}`}>
                            {r.status}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {isSelf ? <span className="text-xs text-slate-400">this standard</span>
                          : already ? <span className="text-xs text-green-600 inline-flex items-center gap-1">
                              <CheckCircle2 size={13} /> added</span>
                          : <button onClick={() => add(r)} disabled={adding === key}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                              <Plus size={12} /> {adding === key ? 'Adding…' : 'Add'}
                            </button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {q.trim().length >= 2 && !searching && !results.length && !err && (
          <p className="mt-2 text-sm text-slate-500">No parts match that search.</p>
        )}
      </div>
      )}

      {parts.length ? (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">APC Part</th>
                <th className="px-3 py-2">Customer Part</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Program</th>
                <th className="px-3 py-2">Last Compared</th>
                <th className="px-3 py-2">Added</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parts.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{p.apcPartNumber}</td>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-slate-600">{p.customerPartNumber}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{p.customerName}</td>
                  <td className="px-3 py-2 text-xs">{p.program}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {p.lastComparedAt
                      ? `${fmtDate(p.lastComparedAt)}${p.diffCount != null ? ` · ${p.diffCount} diff${p.diffCount === 1 ? '' : 's'}` : ''}`
                      : <span className="text-slate-300">never</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(p.addedAt)} {p.addedBy}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => onCompare(p.id, p.customerPartNumber)}
                        title={`Compare ${p.customerPartNumber} against this standard`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50 hover:text-blue-700 hover:border-blue-300">
                        <GitCompare size={12} /> Compare
                      </button>
                      {canManage && (
                        <button onClick={() => remove(p.id)} title="Remove"
                          className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No like parts attached yet.{canManage ? ' Search above to add the parts that should' : ''}
          match this standard.
        </p>
      )}
    </div>
  )
}
