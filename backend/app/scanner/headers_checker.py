"""
Security headers checker — passive, non-destructive.

Checks for the presence and basic validity of key security response headers.
"""

# Each entry: id, header name, severity when missing, description, recommendation
SECURITY_HEADERS = [
    {
        "id": "CSP_MISSING",
        "header": "Content-Security-Policy",
        "severity": "high",
        "title": "Content-Security-Policy header missing",
        "description": (
            "Content-Security-Policy (CSP) is not set. Without CSP the browser allows "
            "resources from any origin, increasing the risk of cross-site scripting (XSS) attacks."
        ),
        "recommendation": (
            "Add a Content-Security-Policy header with a restrictive policy, "
            "e.g. \"default-src 'self'\"."
        ),
    },
    {
        "id": "HSTS_MISSING",
        "header": "Strict-Transport-Security",
        "severity": "high",
        "title": "Strict-Transport-Security header missing",
        "description": (
            "HTTP Strict Transport Security (HSTS) is not set. Without HSTS, browsers "
            "may connect over plain HTTP and are vulnerable to downgrade attacks."
        ),
        "recommendation": (
            "Add Strict-Transport-Security: max-age=31536000; includeSubDomains"
        ),
    },
    {
        "id": "XCTO_MISSING",
        "header": "X-Content-Type-Options",
        "severity": "medium",
        "title": "X-Content-Type-Options header missing",
        "description": (
            "X-Content-Type-Options is not set. Without this header, some browsers "
            "may MIME-sniff responses, which can lead to security vulnerabilities."
        ),
        "recommendation": "Add X-Content-Type-Options: nosniff",
    },
    {
        "id": "RP_MISSING",
        "header": "Referrer-Policy",
        "severity": "low",
        "title": "Referrer-Policy header missing",
        "description": (
            "Referrer-Policy is not set. The browser may send the full URL in the "
            "Referer header to third-party sites, potentially leaking sensitive information."
        ),
        "recommendation": (
            "Add Referrer-Policy: strict-origin-when-cross-origin or no-referrer."
        ),
    },
    {
        "id": "PP_MISSING",
        "header": "Permissions-Policy",
        "severity": "low",
        "title": "Permissions-Policy header missing",
        "description": (
            "Permissions-Policy is not set. This header controls which browser features "
            "(camera, microphone, geolocation, etc.) can be used by the page."
        ),
        "recommendation": (
            "Add a Permissions-Policy header that restricts unnecessary browser features."
        ),
    },
]


def check_headers(response_headers: dict) -> dict:
    """
    Evaluate the response headers against the expected security headers list.

    Args:
        response_headers: case-insensitive dict (from requests.Response.headers)

    Returns:
        {
          "checks": list[dict],   – one entry per header checked
          "findings": list[dict], – only headers that are missing / problematic
        }
    """
    checks = []
    findings = []

    for spec in SECURITY_HEADERS:
        header_name = spec["header"]
        present = header_name.lower() in {k.lower() for k in response_headers}
        value = _get_header(response_headers, header_name)

        check = {
            "check": "headers",
            "header": header_name,
            "present": present,
            "value": value,
        }
        checks.append(check)

        if not present:
            findings.append({
                "check": "headers",
                "id": spec["id"],
                "severity": spec["severity"],
                "title": spec["title"],
                "description": spec["description"],
                "recommendation": spec["recommendation"],
            })

    return {"checks": checks, "findings": findings}


def _get_header(headers: dict, name: str):
    """Case-insensitive header lookup, returns None if absent."""
    for k, v in headers.items():
        if k.lower() == name.lower():
            return v
    return None
