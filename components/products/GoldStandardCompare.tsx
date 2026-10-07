'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  RefreshCw, ArrowLeft, AlertTriangle, Settings2, GitCompare, CheckCircle2,
  ChevronRight, Filter, X,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import {
  pairCardsByLevel, pairByName, DEFAULT_MATCH_RULES, parsePartName, matchNameOf, canonicalPartName,
  type MatchRules, type CardPair,
} from '@/lib/products/partSimilarity'
import { diffLines, diffAligned, type DiffLine } from '@/lib/products/textDiff'
import {
  sectionLines, routeLineSteps, bomLineText,
  type CompareCard, type CompareSection,
} from '@/lib/products/compareModel'

/**
 * Gold Standard vs one like part, side by side.
 *
 * Level for level, card for card. The pairing is by part NAME rather than by
 * position: two products rarely build their layers in the same order, so
 * lining up the Nth card against the Nth card would report every pair as
 * different. See lib/products/partSimilarity.ts for the naming rule.
 *
 * Pairing and diffing both run here, in the browser, over the two card sets
 * the API returns in one fetch. That is what makes the tolerance controls
 * usable — a nudge re-pairs in a frame instead of re-reading the assembly out
 * of Paradigm.
 */

type ComparePayload = {
  standard: any
  likePart: any
  gold: { label: string; capturedAt: string | null; cards: CompareCard[] }
  other: {
    label: string
    cards: CompareCard[]
    error?: string
    /** Set when the number asked for was a customer number. */
    note?: string
    customerPart?: string
    asked?: string
  }
}

export default function GoldStandardCompare(
  { goldStandardId, likePartId, partNumber, onBack }:
  { goldStandardId: number; likePartId?: number | null; partNumber?: string; onBack: () => void }
) {
  const [data, setData] = useState<ComparePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [rules, setRules] = useState<MatchRules>(DEFAULT_MATCH_RULES)
  const [showRules, setShowRules] = useState(false)
  const [section, setSection] = useState<CompareSection>('route')
  const [onlyChanges, setOnlyChanges] = useState(false)
  /**
   * Ignore the part's own base number when deciding whether a BOM line
   * changed. On by default: 76443 against 76237 differs on every single
   * line, which is the one difference that carries no information.
   */
  const [ignoreBase, setIgnoreBase] = useState(true)
  const [selected, setSelected] = useState(0)
  const [recorded, setRecorded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const p = new URLSearchParams()
      if (likePartId) p.set('likePartId', String(likePartId))
      else if (partNumber) p.set('part', partNumber)
      const res = await fetch(getApiUrl(`/api/products/gold-standard/${goldStandardId}/compare?${p}`))
      const d = await res.json()
      if (!res.ok) throw new Error(d.details || d.error || `HTTP ${res.status}`)
      setData(d)
      setSelected(0)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }, [goldStandardId, likePartId, partNumber])

  useEffect(() => { load() }, [load])

  // Level-for-level pairing, recomputed whenever a rule changes.
  const pairs = useMemo<CardPair<CompareCard, CompareCard>[]>(() => {
    if (!data) return []
    return pairCardsByLevel(data.gold.cards, data.other.cards, rules)
  }, [data, rules])

  /**
   * The diff for every pair, not just the selected one: the rail shows a
   * difference count per card, which is how someone finds the level that
   * actually drifted instead of clicking through all 28.
   */
  const diffs = useMemo(() => pairs.map(p => {
    if (section === 'bom') {
      // The BOM is aligned by part NAME before it is diffed, under the same
      // rule that pairs the cards. Diffing it as plain text lines up line 2
      // with line 2, so one layer the other product doesn't have shifts
      // everything beneath it and the whole BOM reads as changed.
      const rows = pairByName(
        p.gold?.bom || [], p.other?.bom || [], rules,
        b => b.partNumber, b => b.description,
      )
      const keyOf = (b: any) => ignoreBase
        ? bomLineText({ ...b, partNumber: canonicalPartName(b.partNumber) })
        : bomLineText(b)
      return diffAligned(rows.map(r => ({
        left: r.gold ? bomLineText(r.gold) : null,
        right: r.other ? bomLineText(r.other) : null,
        leftKey: r.gold ? keyOf(r.gold) : null,
        rightKey: r.other ? keyOf(r.other) : null,
      })))
    }
    return diffLines(sectionLines(p.gold, section), sectionLines(p.other, section))
  }), [pairs, section, rules, ignoreBase])

  const totalChanges = useMemo(
    () => diffs.reduce((n, d) => n + d.changes, 0), [diffs])

  // Stamp the like part once per comparison, so the list can show when it was
  // last checked. Fire-and-forget: failing to record is not worth interrupting
  // someone who is reading a diff.
  useEffect(() => {
    if (!data || !likePartId || loading || recorded || !diffs.length) return
    setRecorded(true)
    fetch(getApiUrl(`/api/products/gold-standard/${goldStandardId}/compare`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likePartId, diffCount: totalChanges, partNumber: data.other.label }),
    }).catch(() => {})
  }, [data, likePartId, loading, recorded, diffs.length, totalChanges, goldStandardId])

  const pair = pairs[selected] || null
  const diff = diffs[selected] || null

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 justify-center text-slate-500">
        <RefreshCw size={18} className="animate-spin" /> Building both sides from Paradigm…
      </div>
    )
  }

  if (err) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={14} /> Back to Like Parts
        </button>
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 break-words">{err}</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* ── header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-1">
            <ArrowLeft size={14} /> Back to Like Parts
          </button>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
            <span className="font-mono">{data.gold.label}</span>
            <GitCompare size={16} className="text-slate-400" />
            <span className="font-mono">{data.other.label}</span>
            {data.other.customerPart && (
              <span className="text-sm font-normal text-slate-500 font-mono">
                ({data.other.customerPart})
              </span>
            )}
          </h3>
          {data.other.note && (
            <p className="text-xs text-slate-500">{data.other.note}</p>
          )}
          <p className="text-xs text-slate-500">
            {pairs.filter(p => p.gold && p.other).length} paired ·{' '}
            {pairs.filter(p => p.gold && !p.other).length} only in standard ·{' '}
            {pairs.filter(p => !p.gold && p.other).length} only in {data.other.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
            totalChanges ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}>
            {totalChanges
              ? `${totalChanges} difference${totalChanges === 1 ? '' : 's'} in ${sectionLabel(section)}`
              : `${sectionLabel(section)} identical`}
          </span>
          <button onClick={() => setShowRules(v => !v)} title="Matching rules"
            className={`p-2 rounded-lg border ${showRules
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
            <Settings2 size={16} />
          </button>
          <button onClick={load} title="Rebuild from Paradigm"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {data.other.error && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 break-words">
            Paradigm returned nothing for {data.other.label}: {data.other.error}
          </div>
        </div>
      )}

      {showRules && <RulesPanel rules={rules} setRules={setRules} onClose={() => setShowRules(false)} />}

      {/* ── section tabs ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200">
        <div className="flex items-center gap-1">
          {(['route', 'bom', 'general'] as CompareSection[]).map(s => (
            <button key={s} onClick={() => setSection(s)}
              className={`px-3 py-2 text-sm -mb-px border-b-2 transition-colors ${
                section === s
                  ? 'border-blue-600 text-blue-700 font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-800'}`}>
              {sectionLabel(s)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 pb-2">
          {section === 'bom' && (
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer"
              title="76443 against 76237 differs on every line; that difference carries no information">
              <input type="checkbox" checked={ignoreBase} onChange={e => setIgnoreBase(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
              Ignore the part&apos;s own number
            </label>
          )}
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={onlyChanges} onChange={e => setOnlyChanges(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            <Filter size={13} /> Changes only
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-4">
        {/* ── card rail ── */}
        <div className="border border-slate-200 rounded-lg overflow-hidden self-start max-h-[34rem] overflow-y-auto">
          {pairs.map((p, i) => {
            const d = diffs[i]
            const both = !!(p.gold && p.other)
            return (
              <button key={i} onClick={() => setSelected(i)}
                className={`w-full text-left px-3 py-2 border-b border-slate-100 last:border-0 transition-colors ${
                  selected === i ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">
                    Level {p.level}
                  </span>
                  {both ? (
                    d.changes
                      ? <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-1.5 rounded">
                          {d.changes}
                        </span>
                      : <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 rounded shrink-0">
                      one side
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-slate-800 truncate">
                  {p.gold?.partNumber || <span className="text-slate-300">— not in standard</span>}
                </div>
                <div className="flex items-center gap-1 font-mono text-xs text-slate-500 truncate">
                  <ChevronRight size={11} className="shrink-0 text-slate-300" />
                  {p.other?.partNumber || <span className="text-slate-300">— not in {data.other.label}</span>}
                </div>
                {p.verdict?.warn ? (
                  <div className="flex items-start gap-1 text-[10px] text-amber-700 mt-0.5">
                    <AlertTriangle size={10} className="mt-px shrink-0" />
                    <span className="min-w-0">{p.verdict.warn}</span>
                  </div>
                ) : p.verdict ? (
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.verdict.reason}</div>
                ) : null}
              </button>
            )
          })}
          {!pairs.length && (
            <p className="px-3 py-6 text-sm text-slate-500 text-center">Nothing to pair.</p>
          )}
        </div>

        {/* ── the diff ── */}
        <div className="min-w-0">
          {pair ? (
            <DiffPane pair={pair} diff={diff!} section={section}
              onlyChanges={onlyChanges}
              goldLabel={data.gold.label} otherLabel={data.other.label} />
          ) : (
            <div className="border border-slate-200 rounded-lg py-16 text-center text-sm text-slate-500">
              Select a card on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const sectionLabel = (s: CompareSection) =>
  s === 'route' ? 'Route' : s === 'bom' ? 'BOM' : 'General'

/* ───────────────────────────── the two panes ───────────────────────────── */

function DiffPane(
  { pair, diff, section, onlyChanges, goldLabel, otherLabel }: {
    pair: CardPair<CompareCard, CompareCard>
    diff: { lines: DiffLine[]; added: number; removed: number; modified: number; changes: number }
    section: CompareSection
    onlyChanges: boolean
    goldLabel: string
    otherLabel: string
  }
) {
  // Route panes label their gutter with the Paradigm step number rather than a
  // line number, because that is what someone reading a route is looking for.
  const leftSteps = useMemo(
    () => section === 'route' ? routeLineSteps(pair.gold) : [], [pair.gold, section])
  const rightSteps = useMemo(
    () => section === 'route' ? routeLineSteps(pair.other) : [], [pair.other, section])

  const shown = useMemo(() => {
    if (!onlyChanges) return diff.lines.map((l, i) => ({ l, i, gap: false }))
    const keep = new Set<number>()
    diff.lines.forEach((l, i) => {
      if (l.op === 'equal') return
      // Two lines of context either side, so a changed value is readable
      // against the step it sits under.
      for (let k = i - 2; k <= i + 2; k++) if (k >= 0 && k < diff.lines.length) keep.add(k)
    })
    const out: { l: DiffLine; i: number; gap: boolean }[] = []
    let prev = -1
    for (const i of Array.from(keep).sort((a, b) => a - b)) {
      out.push({ l: diff.lines[i], i, gap: prev >= 0 && i > prev + 1 })
      prev = i
    }
    return out
  }, [diff.lines, onlyChanges])

  const gutter = (side: 'left' | 'right', l: DiffLine) => {
    const no = side === 'left' ? l.leftNo : l.rightNo
    if (no == null) return ''
    if (section === 'route') {
      const steps = side === 'left' ? leftSteps : rightSteps
      const st = steps[no - 1]
      return st == null ? '' : String(st)
    }
    return String(no)
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* pane headers */}
      <div className="grid grid-cols-2 divide-x divide-slate-200 bg-slate-50 border-b border-slate-200">
        <PaneHead side="Gold Standard" label={goldLabel} card={pair.gold} />
        <PaneHead side="Compared" label={otherLabel} card={pair.other} />
      </div>

      {/* summary strip */}
      <div className="px-3 py-1.5 bg-slate-50/70 border-b border-slate-200 text-xs text-slate-600 flex items-center gap-3 flex-wrap">
        {diff.changes === 0 ? (
          <span className="inline-flex items-center gap-1 text-green-700">
            <CheckCircle2 size={13} /> No differences in {sectionLabel(section).toLowerCase()}
          </span>
        ) : (
          <>
            {!!diff.modified && <span><b className="text-amber-700">{diff.modified}</b> changed</span>}
            {!!diff.added && <span><b className="text-green-700">{diff.added}</b> only on the right</span>}
            {!!diff.removed && <span><b className="text-red-700">{diff.removed}</b> only on the left</span>}
          </>
        )}
        {pair.verdict && <span className="text-slate-400">· paired: {pair.verdict.reason}</span>}
      </div>

      {/* A pair that was made but should be questioned. Placed above the diff
          rather than beside it, so a clean-looking result is not read as
          agreement when the two cards are not the same kind of assembly. */}
      {pair.verdict?.warn && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-px shrink-0" />
          <div className="min-w-0">{pair.verdict.warn}</div>
        </div>
      )}

      {!shown.length ? (
        <p className="py-12 text-center text-sm text-slate-500">
          {diff.lines.length ? 'No changes to show.' : `Neither card has ${sectionLabel(section).toLowerCase()} data.`}
        </p>
      ) : (
        <div className="overflow-auto max-h-[34rem] font-mono text-[11.5px] leading-[1.6]">
          {shown.map(({ l, i, gap }) => (
            <div key={i}>
              {gap && (
                <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem_minmax(0,1fr)] bg-slate-50 text-slate-400 border-y border-slate-100">
                  <div /><div className="px-2 select-none">⋯</div><div /><div className="px-2 select-none">⋯</div>
                </div>
              )}
              <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem_minmax(0,1fr)]">
                <Cell no={gutter('left', l)} op={l.op} side="left"
                  text={l.left} runs={l.leftWords} />
                <Cell no={gutter('right', l)} op={l.op} side="right"
                  text={l.right} runs={l.rightWords} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PaneHead(
  { side, label, card }:
  { side: string; label: string; card: CompareCard | null }
) {
  // The name the pairing actually used, which for a DATA0050 card is its BOM
  // part rather than the APC number printed above.
  const name = matchNameOf(card)
  const p = card ? parsePartName(name) : null
  return (
    <div className="px-3 py-2 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{side} · {label}</div>
      {card ? (
        <>
          <div className="font-mono text-sm text-slate-800 truncate">
            {card.partNumber}
            {name && name !== card.partNumber && (
              <span className="ml-2 text-xs text-slate-400">· matched as {name}</span>
            )}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {card.description || <span className="text-slate-300">no description</span>}
            {p?.parsed && (
              <span className="ml-2 text-slate-400">
                {p.prefix}·{p.base}·{p.form === 'suffix'
                  ? `${p.suffixGroup}${p.suffixNum ?? ''}`
                  : `${String(p.idx1).padStart(2, '0')}${p.idx2 != null ? `/${String(p.idx2).padStart(2, '0')}` : ''}`}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-400 italic">no matching card</div>
      )}
    </div>
  )
}

/**
 * One side of one row.
 *
 * A row the other side does not have is tinted and left blank here, so the
 * two panes never drift out of alignment — the thing an editor compare gets
 * right and a pair of independently scrolled tables does not.
 */
function Cell(
  { no, op, side, text, runs }: {
    no: string
    op: DiffLine['op']
    side: 'left' | 'right'
    text: string | null
    runs?: { text: string; changed: boolean }[]
  }
) {
  const absent = text == null
  const bg =
    op === 'equal' ? ''
      : op === 'modified' ? 'bg-amber-50'
        : op === 'added' ? (side === 'right' ? 'bg-green-50' : 'bg-slate-50/80')
          : /* removed */ (side === 'left' ? 'bg-red-50' : 'bg-slate-50/80')

  const mark =
    absent ? ''
      : op === 'modified' ? '~'
        : op === 'added' ? '+'
          : op === 'removed' ? '-' : ''

  const markColor =
    op === 'modified' ? 'text-amber-600'
      : op === 'added' ? 'text-green-700'
        : op === 'removed' ? 'text-red-700' : 'text-slate-300'

  return (
    <>
      <div className={`px-1 text-right text-slate-400 select-none border-r border-slate-100 tabular-nums ${bg}`}>
        <span className={`mr-0.5 ${markColor}`}>{mark}</span>{no}
      </div>
      <div className={`px-2 whitespace-pre-wrap break-words border-r border-slate-100 ${bg}`}>
        {absent ? '' : runs
          ? runs.map((r, k) => r.changed
              ? <span key={k} className={side === 'left'
                  ? 'bg-red-200/70 rounded-sm' : 'bg-green-200/70 rounded-sm'}>{r.text}</span>
              : <span key={k}>{r.text}</span>)
          : text}
      </div>
    </>
  )
}

/* ───────────────────────────── matching rules ───────────────────────────── */

/**
 * The tolerances, exposed.
 *
 * The naming rule is a convention rather than something Paradigm enforces, so
 * a pairing can be wrong in a way only the person looking at it can judge.
 * Rather than bury the numbers in the code, they are adjustable here and the
 * rail shows the reason each pair was accepted.
 */
function RulesPanel(
  { rules, setRules, onClose }:
  { rules: MatchRules; setRules: (r: MatchRules) => void; onClose: () => void }
) {
  const anchorKeys = Object.keys(rules.anchors)
  const [newPrefix, setNewPrefix] = useState('')

  const setAnchor = (k: string, v: number | null) => {
    const next = { ...rules.anchors }
    if (v == null) delete next[k]
    else next[k] = v
    setRules({ ...rules, anchors: next })
  }

  return (
    <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Like-name matching</h4>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Cards pair on <span className="font-mono">PREFIX-BASE-IDX1/IDX2</span>. The prefix must be
            identical and the base — the part&apos;s own number — is ignored, since it differs by
            definition between two products. An anchored prefix must lead with its fixed index on both
            sides; every other prefix compares the first index within tolerance.
          </p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        <label className="block">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            First index tolerance
          </span>
          <input type="number" min={0} max={20} value={rules.idx1Tolerance}
            onChange={e => setRules({ ...rules, idx1Tolerance: Math.max(0, Number(e.target.value) || 0) })}
            className="w-24 px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Second index tolerance
          </span>
          <input type="number" min={0} max={20} value={rules.idx2Tolerance}
            onChange={e => setRules({ ...rules, idx2Tolerance: Math.max(0, Number(e.target.value) || 0) })}
            className="w-24 px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
        </label>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Anchored prefixes
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {anchorKeys.map(k => (
              <span key={k} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg pl-2 pr-1 py-1 text-sm">
                <span className="font-mono">{k}</span>
                <span className="text-slate-400">lead</span>
                <input type="number" min={0} max={99} value={rules.anchors[k]}
                  onChange={e => setAnchor(k, Math.max(0, Number(e.target.value) || 0))}
                  className="w-12 px-1 py-0.5 text-sm border border-slate-200 rounded tabular-nums" />
                <button onClick={() => setAnchor(k, null)} title={`Stop anchoring ${k}`}
                  className="text-slate-300 hover:text-red-600 p-0.5"><X size={12} /></button>
              </span>
            ))}
            <span className="inline-flex items-center gap-1">
              <input value={newPrefix} onChange={e => setNewPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                placeholder="S" maxLength={3}
                className="w-14 px-2 py-1 text-sm border border-slate-300 rounded-lg font-mono" />
              <button onClick={() => { if (newPrefix) { setAnchor(newPrefix, 1); setNewPrefix('') } }}
                disabled={!newPrefix}
                className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40">
                anchor
              </button>
            </span>
          </div>
        </div>

        <button onClick={() => setRules(DEFAULT_MATCH_RULES)}
          className="px-2.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
          Reset
        </button>
      </div>

      {/* ── suffix parts: P-76443-UPA1 ── */}
      <div className="pt-3 border-t border-blue-200/60">
        <p className="text-xs text-slate-600 mb-2 max-w-2xl">
          Parts numbered <span className="font-mono">PREFIX-BASE-UPxN</span> — adhesives and
          coverlays — match on the letter run and its number instead. UPA is a different material
          from UPC, so by default the run must be identical and the number exact:
          <span className="font-mono"> UPA1</span> pairs only with <span className="font-mono">UPA1</span>.
        </p>
        <div className="flex items-end gap-4 flex-wrap">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer pb-1.5">
            <input type="checkbox" checked={rules.suffixGroupMustMatch}
              onChange={e => setRules({ ...rules, suffixGroupMustMatch: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            Letter run must match (UPA ≠ UPC)
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
              Suffix number tolerance
            </span>
            <input type="number" min={0} max={20} value={rules.suffixNumTolerance}
              onChange={e => setRules({ ...rules, suffixNumTolerance: Math.max(0, Number(e.target.value) || 0) })}
              className="w-24 px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
              Description fallback
            </span>
            <select value={String(rules.descriptionFallback)}
              onChange={e => setRules({ ...rules, descriptionFallback: Number(e.target.value) })}
              className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg bg-white">
              <option value="0">off</option>
              <option value="0.3">loose (30%)</option>
              <option value="0.5">normal (50%)</option>
              <option value="0.7">strict (70%)</option>
            </select>
          </label>
          <p className="text-xs text-slate-500 pb-1.5 max-w-xs">
            Pairs BOM lines no naming rule can relate — a purchased label against a purchased
            label — on how alike their descriptions are.
          </p>
        </div>
      </div>
    </div>
  )
}
