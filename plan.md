# Domain X-Ray — Build Plan

## What it does
A web-based domain intelligence dashboard. Enter any domain and get a comprehensive single-view breakdown: WHOIS registration data, all DNS record types, TLS certificate health, SPF/DMARC email security posture, and HTTPS response timing. Everything in one fast lookup.

## Where it fits
**Standalone useful app** — particularly for Daniel managing the household VPS infrastructure across multiple domains (trollefsen.com, clawdash, mvp, podda, n8n). When debugging DNS propagation, cert expiry, or email deliverability, this beats juggling six CLI tools.

## Scoped MVP
- Domain input + household domain shortcuts
- WHOIS: registrar, created/expires dates, nameservers
- DNS: A, AAAA, MX, NS, TXT, CNAME records
- TLS: issuer, expiry, days remaining (color-coded), SANs, protocol version
- Email security: SPF record + validity, DMARC policy
- Response: HTTPS status, latency, redirect chain, server header

## Architecture
- **Backend:** Python FastAPI — async parallel lookups (dns.resolver, python-whois, ssl socket, httpx)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Deployment:** FastAPI serves the built frontend static files + API on same process/port. pm2 via mvp-deploy.sh.

## API path note
Caddy does `uri strip_prefix /2026-04-13-domain-xray` before reverse-proxying. Frontend uses relative API path `api/lookup` (no leading slash) so it resolves through the prefix correctly.

## Build tasks
1. server.py — FastAPI with 5 async lookup functions
2. Vite scaffold + Tailwind
3. React components: DomainInput, DnsPanel, WhoisCard, TlsCard, EmailSecCard, ResponseCard
4. npm run build → out/
5. pm2 deploy + Caddy reload
