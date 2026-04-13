import type { ResponseInfo } from '../types'

function statusColor(code?: number) {
  if (!code) return 'text-slate-400'
  if (code < 300) return 'text-green-400'
  if (code < 400) return 'text-yellow-400'
  return 'text-red-400'
}

function latencyColor(ms?: number) {
  if (!ms) return 'text-slate-400'
  if (ms < 300) return 'text-green-400'
  if (ms < 800) return 'text-yellow-400'
  return 'text-red-400'
}

export function ResponseCard({ data }: { data: ResponseInfo }) {
  if (data.error) return (
    <Card title="Response">
      <p className="text-red-400 text-sm">{data.error}</p>
    </Card>
  )

  return (
    <Card title="Response">
      <div className="flex items-center gap-6 mb-4">
        <div>
          <div className={`text-3xl font-bold ${statusColor(data.status)}`}>{data.status ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-0.5">HTTP status</div>
        </div>
        <div>
          <div className={`text-3xl font-bold ${latencyColor(data.time_ms)}`}>
            {data.time_ms != null ? `${data.time_ms}ms` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">latency</div>
        </div>
        <div className="flex flex-col gap-1">
          {data.hsts && <Badge color="green">HSTS</Badge>}
          {data.x_frame && <Badge color="blue">{data.x_frame}</Badge>}
        </div>
      </div>

      {data.server && (
        <Row label="Server" value={data.server} />
      )}
      {data.content_type && (
        <Row label="Content-Type" value={data.content_type} />
      )}
      {data.redirect_chain && data.redirect_chain.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-slate-500 mb-1">Redirect chain</div>
          {data.redirect_chain.map((url, i) => (
            <div key={i} className="text-xs text-slate-400 truncate">↳ {url}</div>
          ))}
          <div className="text-xs text-slate-400 truncate">→ {data.final_url}</div>
        </div>
      )}
    </Card>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-900/40 text-green-400 border-green-800',
    blue: 'bg-blue-900/40 text-blue-400 border-blue-800',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[color] ?? colors.blue}`}>
      {children}
    </span>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs py-1 border-b border-slate-800/50">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 ml-4 text-right">{value}</span>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}
