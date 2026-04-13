export interface WhoisInfo {
  registrar?: string
  created?: string
  expires?: string
  updated?: string
  nameservers?: string[]
  status?: string[]
  registrant_country?: string
  error?: string
}

export interface MxRecord {
  priority: number
  exchange: string
}

export interface DnsRecords {
  A?: string[]
  AAAA?: string[]
  MX?: MxRecord[]
  NS?: string[]
  TXT?: string[]
  CNAME?: string[]
  error?: string
}

export interface TlsInfo {
  subject?: string
  issuer?: string
  issuer_cn?: string
  valid_from?: string
  valid_to?: string
  days_remaining?: number
  sans?: string[]
  protocol?: string
  error?: string
}

export interface SpfInfo {
  exists: boolean
  record?: string
  all_qualifier?: string
  includes?: string[]
}

export interface DmarcInfo {
  exists: boolean
  record?: string
  policy?: string
  subdomain_policy?: string
  pct?: string
  rua?: string
}

export interface EmailSecurity {
  spf?: SpfInfo
  dmarc?: DmarcInfo
  error?: string
}

export interface ResponseInfo {
  status?: number
  final_url?: string
  time_ms?: number
  redirect_chain?: string[]
  server?: string
  content_type?: string
  hsts?: boolean
  x_frame?: string
  error?: string
}

export interface LookupResult {
  domain: string
  whois: WhoisInfo
  dns: DnsRecords
  tls: TlsInfo
  email_security: EmailSecurity
  response: ResponseInfo
}
