"""
HTTPS / TLS checker — passive, non-destructive.

Checks:
- Whether the target URL uses HTTPS
- Whether the HTTPS connection succeeds
- Basic TLS certificate information (subject, issuer, expiry) via ssl module
"""

import ssl
import socket
from urllib.parse import urlparse
import time


def check_https(target: str, timeout: int = 10) -> dict:
    """
    Return a dict with:
      present       – bool: target uses https://
      reachable     – bool: TLS handshake succeeded
      cert_info     – dict | None: basic cert fields (no sensitive data)
      error         – str | None: human-readable error message
      findings      – list[dict]: finding objects
    """
    findings = []
    parsed = urlparse(target)
    uses_https = parsed.scheme.lower() == "https"

    result = {
        "present": uses_https,
        "reachable": False,
        "cert_info": None,
        "error": None,
        "findings": findings,
    }

    if not uses_https:
        findings.append({
            "check": "https",
            "id": "NO_HTTPS",
            "severity": "high",
            "title": "HTTPS not used",
            "description": "The target URL does not use HTTPS. Traffic is transmitted in plaintext.",
            "recommendation": "Use HTTPS for all connections to protect data in transit.",
        })
        return result

    host = parsed.hostname
    port = parsed.port or 443

    ctx = ssl.create_default_context()
    try:
        t0 = time.monotonic()
        with socket.create_connection((host, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                elapsed = time.monotonic() - t0
                cert = ssock.getpeercert()

                # Extract only safe, non-sensitive certificate fields
                cert_info = {
                    "tls_version": ssock.version(),
                    "cipher": ssock.cipher()[0] if ssock.cipher() else None,
                    "subject": _rdn_to_str(cert.get("subject", ())),
                    "issuer": _rdn_to_str(cert.get("issuer", ())),
                    "not_after": cert.get("notAfter"),
                    "tls_handshake_ms": round(elapsed * 1000),
                }
                result["reachable"] = True
                result["cert_info"] = cert_info

    except ssl.SSLCertVerificationError as exc:
        result["error"] = f"TLS certificate verification failed: {exc.reason}"
        findings.append({
            "check": "https",
            "id": "CERT_INVALID",
            "severity": "high",
            "title": "Invalid TLS certificate",
            "description": f"The server's TLS certificate could not be verified: {exc.reason}",
            "recommendation": "Ensure a valid, trusted certificate is installed on the server.",
        })
    except ssl.SSLError as exc:
        result["error"] = f"TLS error: {exc}"
        findings.append({
            "check": "https",
            "id": "TLS_ERROR",
            "severity": "high",
            "title": "TLS connection error",
            "description": f"A TLS error occurred while connecting: {exc}",
            "recommendation": "Review the server's TLS configuration.",
        })
    except (socket.timeout, TimeoutError):
        result["error"] = "Connection timed out."
    except OSError as exc:
        result["error"] = f"Connection failed: {exc}"

    return result


def _rdn_to_str(rdn_seq) -> str:
    """Flatten an RDN sequence from peercert into a readable string."""
    parts = []
    for rdn in rdn_seq:
        for key, value in rdn:
            parts.append(f"{key}={value}")
    return ", ".join(parts)
