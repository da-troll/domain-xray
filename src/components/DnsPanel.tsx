import type { DnsRecords, MxRecord } from '../types'

const TYPE_COLORS: Record<string, string> = {
  A:     'bg-blue-900/40 text-blue-300 border-blue-800',
  AAAA:  'bg-indigo-900/40 text-indigo-300 border-indigo-800',
  MX:    'bg-purple-900/40 text-purple-300 border-purple-800',
  NS:    'bg-cyan-900/40 text-cyan-300 border-cyan-800',
  TXT:   'bg-amber-900/40 text-amber-300 border-amber-800',
  CNAME: 'bg-green-900/40 text-green-300 border-green-800',
}

export function DnsPanel({ data }: { data: DnsRecords }) {
  if (data.error) return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">DNS Records</h2>
      <p className="text-red-400 text-sm">{data.error}</p>
    </div>
  )

  const types = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'] as const
  const hasAny = types.some(t => {
    const val = data[t]
    return Array.isArray(val) && val.length > 0
  })

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">DNS Records</h2>
      {!hasAny ? (
        <p className="text-slate-500 text-sm">No records found</p>
      ) : (
        <div className="space-y-3">
          {types.map(rtype => {
            const records = data[rtype]
            if (!records || records.length === 0) return null
            return (
              <div key={rtype} className="flex gap-3">
                <div className="pt-0.5">
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border min-w-[36px] text-center ${TYPE_COLORS[rtype] ?? ''}`}>
                    {rtype}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {rtype === 'MX' ? (
                    (records as MxRecord[]).map((r, i) => (
                      <div key={i} className="text-xs text-slate-300 py-0.5 flex gap-2">
                        <span className="text-slate-500 w-6 text-right shrink-0">{r.priority}</span>
                        <span className="font-mono">{r.exchange}</span>
                      </div>
                    ))
                  ) : (
                    (records as string[]).map((r, i) => (
                      <div key={i} className="text-xs text-slate-300 font-mono py-0.5 break-all">
                        {r}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
