import type { WhoisInfo } from '../types'

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return iso }
}

function daysUntil(iso?: string) {
  if (!iso) return null
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 86400000)
  return diff
}

export function WhoisCard({ data }: { data: WhoisInfo }) {
  const expDays = daysUntil(data.expires)
  const expColor = expDays == null ? '' : expDays < 30 ? 'text-red-400' : expDays < 90 ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WHOIS</h2>
        {data.queried_domain && (
          <span className="text-[10px] text-amber-500/80">for {data.queried_domain}</span>
        )}
      </div>

      {data.error ? (
        <p className="text-red-400 text-sm">{data.error}</p>
      ) : (
        <>
          <div className="space-y-1 text-xs mb-4">
            <Row label="Registrar" value={data.registrar ?? '—'} />
            <Row label="Created" value={fmtDate(data.created)} />
            <Row
              label="Expires"
              value={data.expires ? `${fmtDate(data.expires)}${expDays != null ? ` (${expDays}d)` : ''}` : '—'}
              valueClass={expColor}
            />
            <Row label="Updated" value={fmtDate(data.updated)} />
            {data.registrant_country && <Row label="Country" value={data.registrant_country} />}
          </div>

          {data.nameservers && data.nameservers.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Nameservers</div>
              {data.nameservers.map(ns => (
                <div key={ns} className="text-xs text-slate-400 py-0.5">{ns}</div>
              ))}
            </div>
          )}

          {data.status && data.status.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {data.status.map(s => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                  {s}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-800/50">
      <span className="text-slate-500">{label}</span>
      <span className={`text-slate-300 ml-4 text-right ${valueClass}`}>{value}</span>
    </div>
  )
}
