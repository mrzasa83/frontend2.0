'use client'

import { useState, useEffect } from 'react'
import { buildInfo, appEnv, versionLine, isDirtyBuild } from '@/lib/config/appEnv'
import { getApiUrl } from '@/lib/api'

/**
 * The footer is the one thing on screen at all times, so it's where "which
 * system am I on, and what code is it running?" belongs. DEV is deliberately
 * loud — running a test against production because both tabs look identical is
 * an easy and expensive mistake.
 */
export default function Footer() {
  const [debugMode, setDebugMode] = useState(false)
  const [server, setServer] = useState<any>(null)
  const info = buildInfo()
  const env = appEnv()

  useEffect(() => {
    if (!debugMode || server) return
    fetch(getApiUrl('/api/system/info'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setServer(d) })
      .catch(() => {})
  }, [debugMode, server])

  const envStyle =
    env === 'DEV' ? 'bg-amber-400 text-amber-950'
    : env === 'PROD' ? 'bg-slate-700 text-slate-300'
    : 'bg-slate-600 text-slate-200'

  return (
    <div className={`h-10 text-xs flex items-center justify-between px-6 ${
      env === 'DEV' ? 'bg-amber-900/90 text-amber-100' : 'bg-slate-800 text-slate-400'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`px-1.5 py-0.5 rounded font-semibold tracking-wide ${envStyle}`}>
          {env}
        </span>
        <span title={info.gitSha ? `commit ${info.gitSha}` : undefined}>
          {versionLine()}
        </span>
        {isDirtyBuild() && (
          <span className="px-1.5 py-0.5 rounded bg-red-900 text-red-200"
            title="Built from a working tree with uncommitted changes">
            uncommitted
          </span>
        )}
      </div>

      {debugMode && (
        <div className="flex gap-4 items-center overflow-hidden">
          {info.buildTime && <span>built {new Date(info.buildTime).toLocaleString()}</span>}
          {info.gitDescribe && <span title="git describe">{info.gitDescribe}</span>}
          {server?.node && <span>node {server.node}</span>}
          {server?.uptimeSeconds != null && (
            <span>up {Math.floor(server.uptimeSeconds / 60)}m</span>
          )}
          {server?.memoryMB != null && <span>mem {server.memoryMB}MB</span>}
        </div>
      )}

      <button
        onClick={() => setDebugMode(!debugMode)}
        className={env === 'DEV' ? 'text-amber-300 hover:text-amber-100' : 'text-slate-500 hover:text-slate-300'}
      >
        {debugMode ? 'Hide' : 'Show'} Debug
      </button>
    </div>
  )
}
