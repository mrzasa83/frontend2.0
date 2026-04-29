'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Terminal, Copy, Check, ExternalLink, Download, Monitor } from 'lucide-react'

// Xpra connection config
const XPRA_HOST = 'wstest1apc'
const XPRA_PROXY = 'apc.local'
const XPRA_APP = 'xfce4-terminal'

// Xpra HTML5 web client — if your Xpra server exposes a websocket port
// Set to null if not available, or to the URL like 'http://wstest1apc:14500'
const XPRA_WEB_URL: string | null = null

export default function TerminalPage() {
  const { data: session } = useSession()
  const username = session?.user?.username || session?.user?.name || 'username'
  const [copied, setCopied] = useState<string | null>(null)

  const sshCommand = `xpra start ssh://${username}@${XPRA_PROXY}@${XPRA_HOST}/ --start="${XPRA_APP}" --ssh="ssh -o GSSAPIAuthentication=yes -o GSSAPIDelegateCredentials=yes" --start-env="SSH_AUTH_SOCK="`

  const batContent = `@echo off
title Xpra - ${XPRA_HOST}
"C:\\Users\\${username}\\applications\\Xpra-x86_64_6.4.3-r0\\Xpra_cmd.exe" start ssh://${username}@${XPRA_PROXY}@${XPRA_HOST}/ ^
  --start="${XPRA_APP}" ^
  --ssh="C:\\Windows\\System32\\OpenSSH\\ssh.exe -o GSSAPIAuthentication=yes -o GSSAPIDelegateCredentials=yes" ^
  --start-env="SSH_AUTH_SOCK="
pause`

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadBat = () => {
    const blob = new Blob([batContent], { type: 'application/bat' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xpra-${XPRA_HOST}.bat`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
          <Terminal className="text-green-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Terminal</h1>
          <p className="text-sm text-slate-600">
            Remote desktop session on <span className="font-mono">{XPRA_HOST}</span> via Xpra
          </p>
        </div>
      </div>

      {/* Web client launch (if available) */}
      {XPRA_WEB_URL && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Monitor size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">Browser Session</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Open a terminal session directly in your browser using the Xpra HTML5 client.
          </p>
          <a
            href={XPRA_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <ExternalLink size={16} />
            Launch in Browser
          </a>
        </div>
      )}

      {/* Desktop client */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Terminal size={20} className="text-green-600" />
          <h3 className="text-lg font-semibold text-slate-800">Desktop Client</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Launch a remote terminal using the Xpra desktop client. Requires Xpra installed locally.
        </p>

        {/* Download .bat */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={downloadBat}
            className="px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium flex items-center gap-2"
          >
            <Download size={16} />
            Download .bat Launcher
          </button>
        </div>

        {/* Connection details */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Connection Details</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Host</p>
              <p className="font-mono text-slate-800">{XPRA_HOST}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">SSH Proxy</p>
              <p className="font-mono text-slate-800">{XPRA_PROXY}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">User</p>
              <p className="font-mono text-slate-800">{username}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Application</p>
              <p className="font-mono text-slate-800">{XPRA_APP}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Authentication</p>
              <p className="text-sm text-slate-800">Kerberos (GSSAPI)</p>
            </div>
          </div>
        </div>

        {/* Command line */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Command</span>
            <button
              onClick={() => copyToClipboard(sshCommand, 'cmd')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {copied === 'cmd' ? <Check size={12} /> : <Copy size={12} />}
              {copied === 'cmd' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap break-all">
            {sshCommand}
          </pre>
        </div>
      </div>

      {/* Help */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-2">Prerequisites</p>
        <p>
          Xpra desktop client must be installed. The .bat launcher assumes the default install
          path at <span className="font-mono text-xs">C:\Users\{username}\applications\Xpra-x86_64_6.4.3-r0\</span>.
          SSH must be configured with Kerberos credentials for the <span className="font-mono text-xs">{XPRA_PROXY}</span> proxy.
        </p>
      </div>
    </div>
  )
}
