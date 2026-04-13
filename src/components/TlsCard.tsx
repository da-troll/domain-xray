import type { TlsInfo } from '../types'

function daysColor(days?: number) {
  if (days == null) return 'text-slate-400'
  if (days > 60) return 'text-green-400'
  if (days > 14) return 'text-yellow-400'
  return 'text-red-400'
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function TlsCard({ data }: { data: TlsInfo }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">TLS Certificate</h2>

      {data.error ? (
        <p className="text-red-400 text-sm">{data.error}</p>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-slate-200">{data.subject}</div>
              <div className="text-xs text-slate-500 mt-0.5">{data.issuer}</div>
              {data.protocol && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border bg-indigo-900/30 text-indigo-300 border-indigo-800">
                  {data.protocol}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${daysColor(data.days_remaining)}`}>
                {data.days_remaining != null ? data.days_remaining : '—'}
              </div>
              <div className="text-xs text-slate-500">days left</div>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <Row label="Valid from" value={fmtDate(data.valid_from)} />
            <Row label="Expires" value={fmtDate(data.valid_to)} />
          </div>

          {data.sans && data.sans.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-slate-500 mb-1.5">SANs ({data.sans.length})</div>
              <div className="flex flex-wrap gap-1">
                {data.sans.slice(0, 12).map(san => (
                  <span key={san} className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                    {san}
                  </span>
                ))}
                {data.sans.length > 12 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded">
                    +{data.sans.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-800/50">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300">{value}</span>
    </div>
  )
}
