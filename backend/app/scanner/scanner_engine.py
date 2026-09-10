"""
Scanner engine — orchestrates all passive, non-destructive checks.

Safety constraints enforced here:
  - Connection timeout: 10 seconds
  - Response size limit: 1 MB
  - Maximum redirects: 5
  - Only HTTP GET — no destructive methods
  - No exploitation, injection, brute-force, or DoS behaviour
"""

import time
from urllib.parse import urlparse

import requests
from requests.exceptions import (
    ConnectionError as ReqConnectionError,
    Timeout,
    TooManyRedirects,
    SSLError,
    InvalidURL,
)

from app.scanner.https_checker import check_https
from app.scanner.headers_checker import check_headers
from app.scanner.cookie_checker import check_cookies

TIMEOUT = 10          # seconds
MAX_RESPONSE_BYTES = 1 * 1024 * 1024   # 1 MB
MAX_REDIRECTS = 5


def run_scan(target: str) -> dict:
    """
    Run all passive checks against *target* and return a structured result.

    Returns:
        {
          "target":   str,
          "status":   "completed" | "error",
          "error":    str | None,
          "http_info": dict | None,
          "checks":   list[dict],
          "findings": list[dict],
        }
    """
    result = {
        "target": target,
        "status": "error",
        "error": None,
        "http_info": None,
        "checks": [],
        "findings": [],
    }

    # ── 1. Validate URL ───────────────────────────────────────────────────────
    parsed = urlparse(target)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        result["error"] = "Invalid URL. Please provide a full URL starting with http:// or https://"
        return result

    # ── 2. HTTPS check (TLS layer via ssl module, no full HTTP request) ───────
    https_result = check_https(target, timeout=TIMEOUT)
    result["findings"].extend(https_result.get("findings", []))
    result["checks"].append({
        "name": "https",
        "label": "HTTPS & TLS",
        "present": https_result["present"],
        "reachable": https_result["reachable"],
        "cert_info": https_result.get("cert_info"),
        "error": https_result.get("error"),
    })

    # ── 3. HTTP request (headers + cookies + basic info) ─────────────────────
    session = requests.Session()
    session.max_redirects = MAX_REDIRECTS

    try:
        t0 = time.monotonic()
        response = session.get(
            target,
            timeout=TIMEOUT,
            allow_redirects=True,
            stream=True,          # stream so we can cap response size
            headers={
                "User-Agent": "CyberGuard-Scanner/1.0 (security assessment; passive)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        )
        response_time_ms = round((time.monotonic() - t0) * 1000)

        # Read up to MAX_RESPONSE_BYTES — discard the rest
        _ = response.raw.read(MAX_RESPONSE_BYTES)
        response.close()

    except Timeout:
        result["error"] = "The connection timed out. The target may be down or unreachable."
        return result
    except SSLError as exc:
        result["error"] = f"SSL/TLS error: {_safe_exc(exc)}"
        return result
    except TooManyRedirects:
        result["error"] = f"Too many redirects (limit: {MAX_REDIRECTS})."
        return result
    except ReqConnectionError as exc:
        result["error"] = f"Connection failed: {_safe_exc(exc)}"
        return result
    except InvalidURL:
        result["error"] = "Invalid URL format."
        return result
    except Exception as exc:  # noqa: BLE001
        result["error"] = f"Unexpected error during request: {_safe_exc(exc)}"
        return result

    # ── 4. Basic HTTP info ────────────────────────────────────────────────────
    content_type = response.headers.get("Content-Type", "")
    server_header = response.headers.get("Server", None)

    # Collect redirect chain (URLs only — no credentials)
    redirect_chain = [
        _sanitise_url(r.url) for r in response.history
    ]

    result["http_info"] = {
        "status_code": response.status_code,
        "response_time_ms": response_time_ms,
        "content_type": content_type.split(";")[0].strip() if content_type else None,
        "final_url": _sanitise_url(response.url),
        "redirects": redirect_chain,
        "server": server_header,
    }

    # Note non-2xx/3xx but don't treat as scan failure
    if response.status_code >= 400:
        result["findings"].append({
            "check": "http",
            "id": f"HTTP_{response.status_code}",
            "severity": "info",
            "title": f"HTTP {response.status_code} response",
            "description": (
                f"The server returned HTTP {response.status_code}. "
                "Some checks may be limited."
            ),
            "recommendation": "Verify the URL is correct and the server is reachable.",
        })

    # ── 5. Security headers ───────────────────────────────────────────────────
    headers_result = check_headers(response.headers)
    result["checks"].extend(headers_result["checks"])
    result["findings"].extend(headers_result["findings"])

    # ── 6. Cookie security ────────────────────────────────────────────────────
    cookies_result = check_cookies(response.headers)
    result["checks"].append({
        "name": "cookies",
        "label": "Cookie Security",
        "cookies_found": len(cookies_result["cookies"]),
        "cookies": cookies_result["cookies"],
    })
    result["findings"].extend(cookies_result["findings"])

    result["status"] = "completed"
    return result


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_exc(exc: Exception) -> str:
    """Return a safe, short string representation of an exception (no stack traces)."""
    msg = str(exc)
    # Truncate to avoid leaking verbose internal details
    return msg[:200] if msg else type(exc).__name__


def _sanitise_url(url: str) -> str:
    """Strip userinfo (credentials) from a URL before including it in results."""
    try:
        p = urlparse(url)
        return p._replace(netloc=f"{p.hostname}{':' + str(p.port) if p.port else ''}").geturl()
    except Exception:  # noqa: BLE001
        return url
