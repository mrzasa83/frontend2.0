'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ExternalLink, Maximize2, AlertTriangle, RefreshCw } from 'lucide-react'

const FRONTVUE_BASE_URL = '/frontVue'

function FrontVueContent() {
  const searchParams = useSearchParams()
  const jobParam = searchParams.get('job')
  const typeParam = searchParams.get('type') || (jobParam ? 'pcb' : '')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeError, setIframeError] = useState(false)
  const [populated, setPopulated] = useState(false)

  const iframeUrl = FRONTVUE_BASE_URL

  const openInNewTab = () => {
    window.open(iframeUrl, '_blank', 'noopener,noreferrer')
  }

  // After iframe loads, try to populate the job number field
  const handleIframeLoad = useCallback(() => {
    if (!jobParam || populated) return

    // Retry a few times — the React app inside may take a moment to render
    let attempts = 0
    const tryPopulate = () => {
      attempts++
      try {
        const iframeDoc = iframeRef.current?.contentWindow?.document
        if (!iframeDoc) return

        // Find input fields — look for job/part number input by placeholder or name
        const inputs = iframeDoc.querySelectorAll('input[type="text"], input[type="search"], input:not([type])')
        let filled = false

        for (const input of inputs) {
          const el = input as HTMLInputElement
          const placeholder = (el.placeholder || '').toLowerCase()
          const name = (el.name || '').toLowerCase()
          const id = (el.id || '').toLowerCase()

          if (placeholder.includes('job') || placeholder.includes('part') || 
              name.includes('job') || name.includes('part') ||
              id.includes('job') || id.includes('part')) {
            // Set value and trigger React's onChange
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            )?.set
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(el, jobParam)
              el.dispatchEvent(new Event('input', { bubbles: true }))
              el.dispatchEvent(new Event('change', { bubbles: true }))
              filled = true
              setPopulated(true)
              break
            }
          }
        }

        // If no matching input found by name, try the first visible text input
        if (!filled && inputs.length > 0) {
          const el = inputs[0] as HTMLInputElement
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          )?.set
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, jobParam)
            el.dispatchEvent(new Event('input', { bubbles: true }))
            el.dispatchEvent(new Event('change', { bubbles: true }))
            setPopulated(true)
          }
        }

        // Also try to select PCB type if there's a select/dropdown
        if (typeParam === 'pcb') {
          const selects = iframeDoc.querySelectorAll('select')
          for (const select of selects) {
            const sel = select as HTMLSelectElement
            for (const opt of sel.options) {
              if (opt.text.toLowerCase().includes('pcb') || opt.value.toLowerCase().includes('pcb')) {
                sel.value = opt.value
                sel.dispatchEvent(new Event('change', { bubbles: true }))
                break
              }
            }
          }
        }

      } catch (e) {
        // Cross-origin or timing issue
        console.log('FrontVue populate attempt', attempts, e)
      }

      // Retry up to 10 times with increasing delay
      if (!populated && attempts < 10) {
        setTimeout(tryPopulate, 500 * attempts)
      }
    }

    // Start trying after a short delay for the React app to mount
    setTimeout(tryPopulate, 1000)
  }, [jobParam, typeParam, populated])

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
          {jobParam && !populated && (
            <span className="text-xs text-orange-500">Populating...</span>
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
              The application cannot be embedded due to security restrictions.
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
          ref={iframeRef}
          id="frontvue-frame"
          src={iframeUrl}
          className="flex-1 w-full border-0"
          onLoad={handleIframeLoad}
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
