'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Search, Plus, Trash2, Download, RefreshCw, AlertTriangle, CheckCircle2,
  FileArchive, Info, Copy, Check,
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type DataType = 'CAM' | 'PCB'

type Revision = {
  rev: string
  date: string
  at: string | null
  released: boolean
  bytes: number
  downloadName: string
  uncPath: string | null
}

type SearchResult = {
  job: string
  type: DataType
  releasedRev: string | null
  releasedNote: string | null
  revisions: Revision[]
  shareConfigured: boolean
}

type Picked = {
  job: string
  type: DataType
  rev: string
  name: string
  bytes: number
  released: boolean
  uncPath: string | null
}

const mb = (n: number) => n >= 1048576
  ? `${(n / 1048576).toFixed(1)} MB`
  : n > 0 ? `${Math.max(1, Math.round(n / 1024))} KB` : '—'

export default function DataViewPage() {
  const [job, setJob] = useState('')
  const [type, setType] = useState<DataType>('CAM')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [rev, setRev] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const [picked, setPicked] = useState<Picked[]>([])
  const [copied, setCopied] = useState('')

  const search = useCallback(async (j: string, t: DataType) => {
    const trimmed = j.trim()
    if (!trimmed) return
    setSearching(true); setError(''); setResult(null); setRev('')
    try {
      const res = await fetch(getApiUrl(
        `/api/apps/dataview/search?job=${encodeURIComponent(trimmed)}&type=${t}`))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Search failed (${res.status})`)
      setResult(data)
      // Released is the default, which is what the floor wants almost every time.
      setRev(data.releasedRev || data.revisions[0]?.rev || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setSearching(false) }
  }, [])

  // Re-run when the CAM/PCB toggle flips on an already-searched job.
  useEffect(() => {
    if (result && result.job === job.trim() && result.type !== type) search(job, type)
  }, [type]) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = result?.revisions.find(r => r.rev === rev) || null

  const add = () => {
    if (!result || !selected) return
    const item: Picked = {
      job: result.job, type: result.type, rev: selected.rev,
      name: selected.downloadName, bytes: selected.bytes,
      released: selected.released, uncPath: selected.uncPath,
    }
    setPicked(prev => prev.some(p => p.name === item.name) ? prev : [...prev, item])
  }

  const alreadyPicked = !!(selected && picked.some(p =>
    p.job === result?.job && p.type === result?.type && p.rev === selected.rev))

  const totalBytes = picked.reduce((n, p) => n + p.bytes, 0)

  const fileUrl = (p: Picked) => getApiUrl(
    `/api/apps/dataview/fetch?job=${encodeURIComponent(p.job)}&type=${p.type}&rev=${encodeURIComponent(p.rev)}`)

  /**
   * Ordinary browser downloads, one anchor click each, spaced out so the
   * browser does not treat a burst as a popup. Nothing is scripted on the PC.
   */
  const downloadAll = () => {
    picked.forEach((p, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = fileUrl(p)
        a.download = p.name
        document.body.appendChild(a); a.click(); a.remove()
      }, i * 700)
    })
  }

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch { /* clipboard blocked; the path is on screen to read */ }
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800">DataView</h1>
        <p className="text-sm text-slate-600 mt-1">
          Find released job data in the archive and download it, named for the job and
          revision. Open the downloaded file in the ODB++ Viewer.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 break-words">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── find ── */}
        <section className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Search size={15} /> Find a job
          </h2>

          <form onSubmit={e => { e.preventDefault(); search(job, type) }}
            className="flex items-end gap-2 mb-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Job number</label>
              <input value={job} onChange={e => setJob(e.target.value)}
                placeholder="75336" autoFocus
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono
                  focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Data</label>
              <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                {(['CAM', 'PCB'] as DataType[]).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`px-3 py-2 text-sm ${type === t
                      ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={searching || !job.trim()}
              className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900
                disabled:opacity-50 inline-flex items-center gap-1.5">
              {searching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </form>

          {result && !result.revisions.length && (
            <p className="text-sm text-slate-500 py-4">
              {result.releasedNote || `No ${result.type} revisions for job ${result.job}.`}
            </p>
          )}

          {result && !!result.revisions.length && (
            <>
              <label className="block text-xs text-slate-500 mb-1">Version</label>
              <select value={rev} onChange={e => setRev(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white mb-2">
                {result.revisions.map(r => (
                  <option key={r.rev} value={r.rev}>
                    {r.released ? 'Released — ' : ''}{r.rev}
                    {r.bytes ? ` · ${mb(r.bytes)}` : ' · no data.tgz'}
                  </option>
                ))}
              </select>

              {result.releasedNote && (
                <p className="flex items-start gap-1.5 text-xs text-amber-700 mb-2">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span>{result.releasedNote}</span>
                </p>
              )}

              {selected && (
                <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-slate-800 truncate">{selected.downloadName}</div>
                    <div className="text-xs text-slate-500">
                      {result.job} · {result.type} · {selected.rev}
                      {selected.released && ' · released'}
                    </div>
                  </div>
                  <button onClick={add} disabled={alreadyPicked || !selected.bytes}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700
                      disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shrink-0">
                    {alreadyPicked ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                    {alreadyPicked ? 'Added' : 'Add'}
                  </button>
                </div>
              )}
            </>
          )}

          <p className="flex items-start gap-1.5 text-xs text-slate-500 mt-3">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>
              Same archive and the same released-revision rule FrontVue uses. Search as
              many jobs as you need — each one you add joins the list on the right.
            </span>
          </p>
        </section>

        {/* ── selection ── */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FileArchive size={15} /> To download
            {!!picked.length && (
              <span className="text-xs font-normal text-slate-500">
                {picked.length} file{picked.length > 1 ? 's' : ''} · {mb(totalBytes)}
              </span>
            )}
          </h2>

          {!picked.length ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Nothing selected yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 mb-3 max-h-80 overflow-auto">
              {picked.map(p => (
                <li key={p.name} className="py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-slate-800 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        {p.job} · {p.type} · {p.rev}{p.released && ' · released'} · {mb(p.bytes)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={fileUrl(p)} download={p.name} title="Download this one"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded">
                        <Download size={15} />
                      </a>
                      <button onClick={() => setPicked(prev => prev.filter(x => x.name !== p.name))}
                        title="Remove"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {p.uncPath && (
                    <button onClick={() => copy(p.uncPath!, p.name)}
                      title="Copy the share path and paste it into the viewer's File ▸ Open"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400
                        hover:text-slate-700 font-mono truncate max-w-full">
                      {copied === p.name ? <Check size={11} /> : <Copy size={11} />}
                      {copied === p.name ? 'Copied' : p.uncPath}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto pt-2">
            <button onClick={downloadAll} disabled={!picked.length}
              className="w-full px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700
                disabled:opacity-50 inline-flex items-center justify-center gap-2">
              <Download size={15} />
              {picked.length > 1 ? `Download ${picked.length} files` : 'Download'}
            </button>
            <p className="text-xs text-slate-500 mt-2">
              Saves to your browser&apos;s download folder on C:. Then open the ODB++ Viewer and
              use <b>File ▸ Open</b> on the downloaded <span className="font-mono">.tgz</span> —
              the viewer unpacks it into its own local folder.
            </p>
            {picked.length > 1 && (
              <p className="text-xs text-slate-400 mt-1">
                Your browser may ask once whether to allow multiple downloads.
              </p>
            )}
            {picked.some(p => p.uncPath) && (
              <p className="text-xs text-slate-500 mt-2">
                Or skip the download entirely: copy a share path above and paste it into
                File ▸ Open. The viewer reads the one file over the network and still
                unpacks locally.
              </p>
            )}
          </div>
        </section>
      </div>

      <p className="text-xs text-slate-400 mt-5">
        Downloads only. Nothing is installed or run on your PC.
      </p>
    </div>
  )
}
