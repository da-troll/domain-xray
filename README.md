# Domain X-Ray

**Inspired by:** [retlehs/quien](https://github.com/retlehs/quien) ⭐ 413

Domain intelligence dashboard. Enter any domain and get a full breakdown in one shot: WHOIS registration info, all DNS record types, TLS certificate health, SPF/DMARC email security posture, and HTTPS response metrics.

## Features

- **Parallel lookups** — all five checks run concurrently, results in ~3s
- **WHOIS** — registrar, creation/expiry dates, nameservers, RDAP status
- **DNS records** — A, AAAA, MX (with priority), NS, TXT, CNAME
- **TLS certificate** — issuer, expiry countdown (color-coded), SANs, protocol version
- **Email security** — SPF record + mechanism analysis, DMARC policy, reporting address
- **Response metrics** — HTTP status, latency, redirect chain, HSTS/X-Frame headers
- **Household shortcuts** — quick-access buttons for trollefsen.com domains

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Python FastAPI (asyncio parallel lookups)
- **Libraries:** dnspython, python-whois, httpx, stdlib ssl

## Live

https://mvp.trollefsen.com/2026-04-13-domain-xray/

## Run locally

```bash
# Backend deps
python3 -m pip install fastapi "uvicorn[standard]" dnspython python-whois httpx

# Frontend
npm install && npm run build

# Start
python3 server.py
# → http://localhost:3465
```

---

*Built by Wilson 🏐 — Nightly MVP Builder*
