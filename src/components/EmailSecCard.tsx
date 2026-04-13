import type { EmailSecurity } from '../types'

export function EmailSecCard({ data }: { data: EmailSecurity }) {
  const { spf, dmarc } = data

  const spfAllColor = (q?: string) => {
    if (q === '-all') return 'text-green-400'
    if (q === '~all') return 'text-yellow-400'
    return 'text-red-400'
  }

  const policyColor = (p?: string) => {
    if (p === 'reject') return 'bg-green-900/30 text-green-400 border-green-800'
    if (p === 'quarantine') return 'bg-yellow-900/30 text-yellow-400 border-yellow-800'
    return 'bg-red-900/30 text-red-400 border-red-800'
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Email Security</h2>

      {data.error ? (
        <p className="text-red-400 text-sm">{data.error}</p>
      ) : (
        <div className="space-y-4">
          {/* SPF */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusDot ok={spf?.exists} />
              <span className="text-sm font-medium text-slate-200">SPF</span>
              {spf?.exists && spf.all_qualifier && (
                <span className={`text-xs font-mono ${spfAllColor(spf.all_qualifier)}`}>
                  {spf.all_qualifier}
                </span>
              )}
            </div>
            {spf?.record ? (
              <div className="text-xs font-mono text-slate-400 bg-slate-800/50 rounded p-2 break-all leading-relaxed">
                {spf.record}
              </div>
            ) : spf?.note ? (
              <p className="text-xs text-slate-500 italic">{spf.note}</p>
            ) : (
              <p className="text-xs text-red-400">No SPF record found</p>
            )}
            {spf?.includes && spf.includes.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {spf.includes.map(inc => (
                  <span key={inc} className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                    include:{inc}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* DMARC */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusDot ok={dmarc?.exists} />
              <span className="text-sm font-medium text-slate-200">DMARC</span>
              {dmarc?.source_domain && (
                <span className="text-[10px] text-amber-500/80">via {dmarc.source_domain}</span>
              )}
              {dmarc?.policy && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${policyColor(dmarc.policy)}`}>
                  p={dmarc.policy}
                </span>
              )}
              {dmarc?.pct && dmarc.pct !== '100' && (
                <span className="text-xs text-slate-500">{dmarc.pct}%</span>
              )}
            </div>
            {dmarc?.record ? (
              <div className="text-xs font-mono text-slate-400 bg-slate-800/50 rounded p-2 break-all leading-relaxed">
                {dmarc.record}
              </div>
            ) : (
              <p className="text-xs text-red-400">No DMARC record found</p>
            )}
            {dmarc?.rua && (
              <div className="text-xs text-slate-500 mt-1">Reports → {dmarc.rua}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusDot({ ok }: { ok?: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
  )
}
