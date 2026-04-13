import type { LookupResult } from './types'

// Use relative path so Caddy's strip_prefix routes it correctly
const API_BASE = 'api'

export async function lookupDomain(domain: string): Promise<LookupResult> {
  const res = await fetch(`${API_BASE}/lookup?domain=${encodeURIComponent(domain)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<LookupResult>
}
