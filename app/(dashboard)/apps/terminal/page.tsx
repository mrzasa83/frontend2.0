'use client'

import { useState } from 'react'
import { Terminal, ExternalLink, Maximize2, X } from 'lucide-react'

const TERMINAL_URL = '/terminal/'

export default function TerminalPage() {
  const [active, setActive] = useState(false)

  const openInNewTab = () => {
    window.open(TERMINAL_URL, '_blank', 'noopener,noreferrer')
  }

  if (!active) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
            <Terminal className="text-green-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Web Terminal</h2>
          <p className="text-slate-600 mb-6">
            Launch a terminal session in your browser. Use it to SSH into remote hosts
            or run commands on the server.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setActive(true)}
              className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium flex items-center gap-2"
            >
              <Terminal size={18} />
              Open Terminal
            </button>
            <button
              onClick={openInNewTab}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2"
            >
              <ExternalLink size={18} />
              New Tab
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-green-400" />
          <span className="text-sm font-medium text-slate-200">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={openInNewTab}
            className="px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded text-xs flex items-center gap-1"
            title="Open in new tab"
          >
            <ExternalLink size={13} />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('terminal-frame')
              if (el) el.requestFullscreen?.()
            }}
            className="px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
            title="Fullscreen"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={() => setActive(false)}
            className="px-2 py-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded ml-2"
            title="Close terminal"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ttyd iframe */}
      <iframe
        id="terminal-frame"
        src={TERMINAL_URL}
        className="flex-1 w-full border-0 bg-slate-900"
        allow="fullscreen"
        title="Web Terminal"
      />
    </div>
  )
}
