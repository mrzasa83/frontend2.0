'use client'

import { useState, useRef, useEffect } from 'react'
import { KeyRound, Upload, Play, Square, CheckCircle, AlertTriangle, FileArchive } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

export default function ZipRecoveryPage() {
  const [file, setFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [lines, setLines] = useState<string[]>([])
  const [password, setPassword] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState('')
  const esRef = useRef<EventSource | null>(null)
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => { esRef.current?.close() }, [])
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight) }, [lines])

  const start = async () => {
    if (!file) return
    setError(''); setLines([]); setPassword(null); setStatus(''); setRunning(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(getApiUrl('/api/admin/zip-recovery/start'), { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start')
      setJobId(data.jobId)

      const es = new EventSource(getApiUrl(`/api/admin/zip-recovery/stream?id=${data.jobId}`))
      esRef.current = es
      es.onmessage = (e) => {
        if (e.data.startsWith('PASSWORD FOUND:')) setPassword(e.data.replace('PASSWORD FOUND:', '').trim())
        setLines(prev => [...prev, e.data])
      }
      es.addEventListener('done', (e: any) => {
        setStatus(e.data); setRunning(false); es.close()
      })
      es.onerror = () => { es.close(); setRunning(false) }
    } catch (e: any) {
      setError(e.message); setRunning(false)
    }
  }

  const abort = async () => {
    if (!jobId) return
    await fetch(getApiUrl('/api/admin/zip-recovery/abort'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: jobId }),
    })
    esRef.current?.close(); setRunning(false)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-1">
        <KeyRound size={22} className="text-blue-600" />
        <h1 className="text-xl font-bold text-slate-800">Zip Password Recovery</h1>
      </div>
      <p className="text-sm text-slate-500 mb-5">Recover the password of an encrypted zip archive you own, using John the Ripper (incremental mode). Admin only.</p>

      <div className="flex items-start gap-2 mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
        <span>For authorized recovery of files your organization owns. Incremental cracking can take a long time on strong passwords — use Abort to stop.</span>
      </div>

      {error && <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Upload + controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-sm">
            <Upload size={16} className="text-slate-500" />
            <span>{file ? 'Change file' : 'Choose .zip'}</span>
            <input type="file" accept=".zip" className="hidden" disabled={running}
              onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          {file && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <FileArchive size={15} className="text-slate-400" />
              {file.name} <span className="text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
            </span>
          )}
          <div className="flex-1" />
          {!running ? (
            <button onClick={start} disabled={!file} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              <Play size={16} /> Start Recovery
            </button>
          ) : (
            <button onClick={abort} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2">
              <Square size={16} /> Abort
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {password && (
        <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 font-medium mb-1"><CheckCircle size={18} /> Password found</div>
          <code className="text-lg font-mono text-green-900 bg-white px-3 py-1 rounded border border-green-200 inline-block select-all">{password}</code>
        </div>
      )}
      {status && !password && (
        <div className="p-3 mb-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
          Finished: {status === 'exhausted' ? 'no password found (keyspace exhausted or interrupted)' : status}
        </div>
      )}

      {/* Live console */}
      {(running || lines.length > 0) && (
        <div>
          <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-2">
            Live output {running && <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
          </div>
          <div ref={logRef} className="bg-slate-900 text-slate-100 rounded-lg p-3 h-72 overflow-y-auto font-mono text-xs leading-relaxed">
            {lines.map((l, i) => (
              <div key={i} className={l.startsWith('PASSWORD FOUND') ? 'text-green-400 font-bold'
                : l.startsWith('ERROR') ? 'text-red-400'
                : l.startsWith('status:') ? 'text-blue-300'
                : 'text-slate-300'}>{l}</div>
            ))}
            {running && <div className="text-slate-500">…</div>}
          </div>
        </div>
      )}
    </div>
  )
}
