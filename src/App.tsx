import { useState, useRef } from 'react'
import type { LookupResult } from './types'
import { lookupDomain } from './api'
import { WhoisCard } from './components/WhoisCard'
import { DnsPanel } from './components/DnsPanel'
import { TlsCard } from './components/TlsCard'
import { EmailSecCard } from './components/EmailSecCard'
import { ResponseCard } from './components/ResponseCard'

const QUICK_DOMAINS = [
  'trollefsen.com',
  'clawdash.trollefsen.com',
  'mvp.trollefsen.com',
  'podda.trollefsen.com',
]

export default function App() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LookupResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function lookup(d?: string) {
    const target = (d ?? domain).trim()
    if (!target) return
    if (d) setDomain(d)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await lookupDomain(target)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') lookup()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Domain X-Ray</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">WHOIS · DNS · TLS · SPF/DMARC · Response</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={onKey}
              placeholder="Enter a domain, e.g. example.com"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
              disabled={loading}
            />
            <button
              onClick={() => lookup()}
              disabled={loading || !domain.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Scanning…' : 'Scan'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_DOMAINS.map(d => (
              <button
                key={d}
                onClick={() => lookup(d)}
                disabled={loading}
                className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-md transition-colors disabled:opacity-40"
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-40 animate-pulse" />
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-32 animate-pulse" />
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Domain heading */}
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold text-slate-200">{result.domain}</h2>
              <span className="text-xs text-slate-500">Scan complete</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResponseCard data={result.response} />
              <TlsCard data={result.tls} />
              <WhoisCard data={result.whois} />
              <EmailSecCard data={result.email_security} />
            </div>

            <DnsPanel data={result.dns} />
          </>
        )}
      </main>

      {/* Footer */}
      {!result && !loading && !error && (
        <div className="fixed bottom-6 inset-x-0 text-center text-xs text-slate-700">
          Lookup runs DNS · WHOIS · TLS · HTTP in parallel — results in ~3s
        </div>
      )}
    </div>
  )
}
