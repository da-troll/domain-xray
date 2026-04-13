"""
Domain X-Ray — FastAPI backend
Serves the React frontend (out/) + /api/lookup endpoint
"""
import asyncio
import os
import socket
import ssl
from datetime import datetime, timezone
from pathlib import Path

import httpx
import dns.resolver
import whois as whois_lib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

app = FastAPI(title="Domain X-Ray")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

DNS_TIMEOUT = 6
TLS_TIMEOUT = 8
HTTP_TIMEOUT = 12
WHOIS_TIMEOUT = 15


def clean_domain(raw: str) -> str:
    d = raw.strip().lower()
    for prefix in ("https://", "http://"):
        if d.startswith(prefix):
            d = d[len(prefix):]
    return d.split("/")[0].split("?")[0].split("#")[0]


async def get_whois(domain: str) -> dict:
    try:
        w = await asyncio.wait_for(
            asyncio.to_thread(whois_lib.whois, domain),
            timeout=WHOIS_TIMEOUT,
        )

        def fmt_date(val):
            if isinstance(val, list):
                val = val[0] if val else None
            if isinstance(val, datetime):
                return val.replace(tzinfo=timezone.utc).isoformat() if val.tzinfo is None else val.isoformat()
            return str(val) if val else None

        ns = w.name_servers or []
        if isinstance(ns, str):
            ns = [ns]
        ns = sorted(set(n.lower().rstrip(".") for n in ns if n))

        status = w.status or []
        if isinstance(status, str):
            status = [status]
        status = list(set(str(s).split()[0] for s in status))

        return {
            "registrar": str(w.registrar).strip() if w.registrar else None,
            "created": fmt_date(w.creation_date),
            "expires": fmt_date(w.expiration_date),
            "updated": fmt_date(w.updated_date),
            "nameservers": ns[:8],
            "status": status[:6],
            "registrant_country": str(w.country).strip() if getattr(w, "country", None) else None,
        }
    except asyncio.TimeoutError:
        return {"error": "WHOIS timed out"}
    except Exception as e:
        return {"error": str(e)[:120]}


async def get_dns(domain: str) -> dict:
    resolver = dns.resolver.Resolver()
    resolver.timeout = DNS_TIMEOUT
    resolver.lifetime = DNS_TIMEOUT

    async def query(rtype: str):
        try:
            answer = await asyncio.wait_for(
                asyncio.to_thread(resolver.resolve, domain, rtype),
                timeout=DNS_TIMEOUT + 1,
            )
            if rtype == "MX":
                return sorted(
                    [{"priority": r.preference, "exchange": str(r.exchange).rstrip(".")} for r in answer],
                    key=lambda x: x["priority"],
                )
            return [str(r).strip('"').rstrip(".") for r in answer]
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            return []
        except asyncio.TimeoutError:
            return None
        except Exception:
            return []

    record_types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"]
    results = await asyncio.gather(*[query(rt) for rt in record_types])
    return dict(zip(record_types, results))


async def get_tls(domain: str) -> dict:
    try:
        ctx = ssl.create_default_context()

        def _fetch_cert():
            with socket.create_connection((domain, 443), timeout=TLS_TIMEOUT) as sock:
                with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                    return ssock.getpeercert(), ssock.version()

        cert, protocol = await asyncio.wait_for(
            asyncio.to_thread(_fetch_cert), timeout=TLS_TIMEOUT + 2
        )

        not_before = datetime.strptime(cert["notBefore"], "%b %d %H:%M:%S %Y %Z")
        not_after = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
        days_remaining = (not_after - datetime.utcnow()).days

        subject = dict(x[0] for x in cert.get("subject", []))
        issuer = dict(x[0] for x in cert.get("issuer", []))

        sans = [v for t, v in cert.get("subjectAltName", []) if t == "DNS"]

        return {
            "subject": subject.get("commonName", domain),
            "issuer": issuer.get("organizationName", issuer.get("commonName", "Unknown")),
            "issuer_cn": issuer.get("commonName"),
            "valid_from": not_before.isoformat(),
            "valid_to": not_after.isoformat(),
            "days_remaining": days_remaining,
            "sans": sans[:20],
            "protocol": protocol,
        }
    except asyncio.TimeoutError:
        return {"error": "TLS connection timed out"}
    except ssl.SSLCertVerificationError as e:
        return {"error": f"Cert verification failed: {getattr(e, 'reason', str(e))}"}
    except ConnectionRefusedError:
        return {"error": "Port 443 not reachable"}
    except Exception as e:
        return {"error": str(e)[:120]}


async def get_email_security(domain: str) -> dict:
    resolver = dns.resolver.Resolver()
    resolver.timeout = DNS_TIMEOUT
    resolver.lifetime = DNS_TIMEOUT

    async def resolve_txt(name: str) -> list[str]:
        try:
            answer = await asyncio.wait_for(
                asyncio.to_thread(resolver.resolve, name, "TXT"),
                timeout=DNS_TIMEOUT + 1,
            )
            return [str(r).strip('"') for r in answer]
        except Exception:
            return []

    txt_records, dmarc_records = await asyncio.gather(
        resolve_txt(domain),
        resolve_txt(f"_dmarc.{domain}"),
    )

    # SPF
    spf_list = [r for r in txt_records if r.lower().startswith("v=spf1")]
    spf_record = spf_list[0] if spf_list else None
    spf: dict = {"exists": bool(spf_record), "record": spf_record}
    if spf_record:
        parts = spf_record.split()
        spf["mechanisms"] = [p for p in parts[1:] if not p.startswith("~") and not p.startswith("-") and not p.startswith("+") or ":" in p or "/" in p]
        spf["all_qualifier"] = next((p for p in parts if p in ("~all", "-all", "+all", "?all")), None)
        spf["includes"] = [p.split(":", 1)[1] for p in parts if p.startswith("include:")]

    # DMARC
    dmarc_record = next((r for r in dmarc_records if r.upper().startswith("V=DMARC1")), None)
    dmarc: dict = {"exists": bool(dmarc_record), "record": dmarc_record}
    if dmarc_record:
        tags = {}
        for part in dmarc_record.split(";"):
            part = part.strip()
            if "=" in part:
                k, v = part.split("=", 1)
                tags[k.strip().lower()] = v.strip()
        dmarc["policy"] = tags.get("p", "none")
        dmarc["subdomain_policy"] = tags.get("sp")
        dmarc["pct"] = tags.get("pct", "100")
        dmarc["rua"] = tags.get("rua")

    return {"spf": spf, "dmarc": dmarc}


async def get_response(domain: str) -> dict:
    try:
        start = asyncio.get_event_loop().time()
        async with httpx.AsyncClient(
            timeout=HTTP_TIMEOUT,
            follow_redirects=True,
            verify=False,
            headers={"User-Agent": "Mozilla/5.0 (Domain X-Ray)"},
        ) as client:
            resp = await client.get(f"https://{domain}")
            elapsed_ms = round((asyncio.get_event_loop().time() - start) * 1000)

            redirect_chain = [str(r.url) for r in resp.history]

            return {
                "status": resp.status_code,
                "final_url": str(resp.url),
                "time_ms": elapsed_ms,
                "redirect_chain": redirect_chain,
                "server": resp.headers.get("server"),
                "content_type": resp.headers.get("content-type", "").split(";")[0].strip(),
                "hsts": "strict-transport-security" in resp.headers,
                "x_frame": resp.headers.get("x-frame-options"),
            }
    except httpx.TimeoutException:
        return {"error": "Request timed out"}
    except Exception as e:
        return {"error": str(e)[:120]}


@app.get("/api/lookup")
async def lookup(domain: str):
    domain = clean_domain(domain)
    if not domain or "." not in domain:
        return JSONResponse({"error": "Invalid domain"}, status_code=400)

    whois_r, dns_r, tls_r, email_r, resp_r = await asyncio.gather(
        get_whois(domain),
        get_dns(domain),
        get_tls(domain),
        get_email_security(domain),
        get_response(domain),
        return_exceptions=True,
    )

    def safe(r):
        if isinstance(r, Exception):
            return {"error": str(r)[:120]}
        return r or {}

    return {
        "domain": domain,
        "whois": safe(whois_r),
        "dns": safe(dns_r),
        "tls": safe(tls_r),
        "email_security": safe(email_r),
        "response": safe(resp_r),
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Mount frontend static build — must be last
_out = Path(__file__).parent / "out"
if _out.exists():
    app.mount("/", StaticFiles(directory=str(_out), html=True), name="static")
else:
    @app.get("/{path:path}")
    async def not_built(path: str):
        return JSONResponse({"error": "Frontend not built. Run: npm run build && mv dist out"}, status_code=503)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3465))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
