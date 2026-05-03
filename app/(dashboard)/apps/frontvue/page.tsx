'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ExternalLink, Maximize2, AlertTriangle, RefreshCw } from 'lucide-react'

const FRONTVUE_BASE_URL = '/frontVue'

function FrontVueContent() {
  const searchParams = useSearchParams()
  const jobParam = searchParams.get('job')

  // Build iframe URL with job parameter if provided
  const iframeUrl = jobParam
    ? `${FRONTVUE_BASE_URL}?job=${encodeURIComponent(jobParam)}`
    : FRONTVUE_BASE_URL

  const [iframeError, setIframeError] = useState(false)

  const openInNewTab = () => {
    window.open(iframeUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">FrontVue</h2>
          <span className="text-xs text-slate-400">— ODB++ PCB Viewer</span>
          {jobParam && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-mono">
              Job: {jobParam}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openInNewTab}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            title="Open in new tab"
          >
            <ExternalLink size={13} />
            Open in New Tab
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('frontvue-frame')
              if (el) el.requestFullscreen?.()
            }}
            className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
            title="Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Iframe or fallback */}
      {iframeError ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-md">
            <AlertTriangle size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Unable to embed FrontVue</h3>
            <p className="text-sm text-slate-600 mb-4">
              The application cannot be embedded in an iframe due to security restrictions.
            </p>
            <button
              onClick={openInNewTab}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 mx-auto"
            >
              <ExternalLink size={18} />
              Open FrontVue in New Tab
            </button>
          </div>
        </div>
      ) : (
        <iframe
          id="frontvue-frame"
          src={iframeUrl}
          className="flex-1 w-full border-0"
          onError={() => setIframeError(true)}
          allow="fullscreen"
          title="FrontVue"
        />
      )}
    </div>
  )
}

export default function FrontVuePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full py-20">
        <RefreshCw size={24} className="animate-spin text-blue-600 mr-3" />
      </div>
    }>
      <FrontVueContent />
    </Suspense>
  )
}
