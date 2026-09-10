"""
Cookie security checker — passive, non-destructive.

Inspects Set-Cookie headers for security attributes:
  - Secure flag
  - HttpOnly flag
  - SameSite attribute

Cookie values are NEVER stored or returned.
Only attribute presence/absence is evaluated.
"""


def check_cookies(response_headers: dict) -> dict:
    """
    Parse Set-Cookie headers and check each cookie for security attributes.

    Args:
        response_headers: header dict from requests.Response.headers

    Returns:
        {
          "cookies": list[dict],  – per-cookie attribute summary (no values)
          "findings": list[dict], – issues found
        }
    """
    raw_cookies = _collect_set_cookie_headers(response_headers)

    if not raw_cookies:
        return {"cookies": [], "findings": []}

    cookies = []
    findings = []

    for raw in raw_cookies:
        name, attrs = _parse_set_cookie(raw)
        if not name:
            continue

        has_secure = attrs.get("secure", False)
        has_httponly = attrs.get("httponly", False)
        samesite = attrs.get("samesite")  # None | "strict" | "lax" | "none"

        cookie_summary = {
            "name": name,
            "secure": has_secure,
            "httponly": has_httponly,
            "samesite": samesite,
        }
        cookies.append(cookie_summary)

        # Secure flag missing
        if not has_secure:
            findings.append({
                "check": "cookies",
                "id": f"COOKIE_NO_SECURE_{_safe_id(name)}",
                "severity": "medium",
                "title": f"Cookie '{name}' missing Secure flag",
                "description": (
                    f"The cookie '{name}' does not have the Secure flag set. "
                    "It can be transmitted over unencrypted HTTP connections."
                ),
                "recommendation": "Set the Secure flag on all cookies.",
            })

        # HttpOnly flag missing
        if not has_httponly:
            findings.append({
                "check": "cookies",
                "id": f"COOKIE_NO_HTTPONLY_{_safe_id(name)}",
                "severity": "medium",
                "title": f"Cookie '{name}' missing HttpOnly flag",
                "description": (
                    f"The cookie '{name}' does not have the HttpOnly flag. "
                    "It is accessible via JavaScript and may be stolen by XSS attacks."
                ),
                "recommendation": "Set the HttpOnly flag on cookies that do not need JS access.",
            })

        # SameSite missing or set to 'None' without Secure
        if not samesite:
            findings.append({
                "check": "cookies",
                "id": f"COOKIE_NO_SAMESITE_{_safe_id(name)}",
                "severity": "low",
                "title": f"Cookie '{name}' missing SameSite attribute",
                "description": (
                    f"The cookie '{name}' does not have a SameSite attribute. "
                    "The browser may send it with cross-site requests, enabling CSRF attacks."
                ),
                "recommendation": "Set SameSite=Lax or SameSite=Strict on cookies.",
            })
        elif samesite.lower() == "none" and not has_secure:
            findings.append({
                "check": "cookies",
                "id": f"COOKIE_SAMESITE_NONE_INSECURE_{_safe_id(name)}",
                "severity": "medium",
                "title": f"Cookie '{name}' has SameSite=None without Secure",
                "description": (
                    f"The cookie '{name}' is set with SameSite=None but without the Secure flag. "
                    "Modern browsers will reject or ignore this combination."
                ),
                "recommendation": "Add the Secure flag when using SameSite=None.",
            })

    return {"cookies": cookies, "findings": findings}


# ── Internal helpers ──────────────────────────────────────────────────────────

def _collect_set_cookie_headers(headers: dict) -> list:
    """
    Collect all Set-Cookie header values from a response headers dict.
    requests merges multiple Set-Cookie headers with ', ' — we need the raw list.
    Use getlist if available (requests PreparedResponse), otherwise split heuristically.
    """
    # requests.structures.CaseInsensitiveDict exposes .getlist via the internal store
    if hasattr(headers, "getlist"):
        return headers.getlist("Set-Cookie")

    # Fallback: iterate all items looking for Set-Cookie keys
    values = []
    for k, v in headers.items():
        if k.lower() == "set-cookie":
            values.append(v)
    return values


def _parse_set_cookie(raw: str) -> tuple:
    """
    Parse a raw Set-Cookie header string.
    Returns (cookie_name, attrs_dict).
    Cookie value is discarded — only the name and attribute flags are kept.
    """
    parts = [p.strip() for p in raw.split(";")]
    if not parts:
        return None, {}

    # First part is name=value
    name_value = parts[0]
    if "=" in name_value:
        name = name_value.split("=", 1)[0].strip()
    else:
        name = name_value.strip()

    if not name:
        return None, {}

    attrs = {}
    for part in parts[1:]:
        lower = part.lower()
        if lower == "secure":
            attrs["secure"] = True
        elif lower == "httponly":
            attrs["httponly"] = True
        elif lower.startswith("samesite="):
            attrs["samesite"] = part.split("=", 1)[1].strip()
        elif lower.startswith("samesite"):
            attrs["samesite"] = ""

    return name, attrs


def _safe_id(name: str) -> str:
    """Make a cookie name safe for use in a finding ID."""
    return "".join(c if c.isalnum() else "_" for c in name).upper()
