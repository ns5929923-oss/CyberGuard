"""
Tests for the scanner modules:
  - URL validation in scanner_engine
  - https_checker (unit-level, no network)
  - headers_checker
  - cookie_checker
"""
import sys
import os
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")


# ── https_checker ─────────────────────────────────────────────────────────────

class TestHttpsChecker(unittest.TestCase):
    def _check(self, url):
        from app.scanner.https_checker import check_https
        return check_https(url, timeout=5)

    def test_http_url_generates_finding(self):
        result = self._check("http://example.com")
        self.assertFalse(result["present"])
        ids = [f["id"] for f in result["findings"]]
        self.assertIn("NO_HTTPS", ids)

    def test_https_url_is_present(self):
        # We patch the actual socket connection to avoid network calls
        import ssl, socket
        fake_cert = {
            "subject": ((("commonName", "example.com"),),),
            "issuer": ((("organizationName", "Let's Encrypt"),),),
            "notAfter": "Jan  1 00:00:00 2099 GMT",
        }
        mock_ssock = MagicMock()
        mock_ssock.version.return_value = "TLSv1.3"
        mock_ssock.cipher.return_value = ("TLS_AES_256_GCM_SHA384", "TLSv1.3", 256)
        mock_ssock.getpeercert.return_value = fake_cert
        mock_ssock.__enter__ = lambda s: s
        mock_ssock.__exit__ = MagicMock(return_value=False)

        mock_sock = MagicMock()
        mock_sock.__enter__ = lambda s: s
        mock_sock.__exit__ = MagicMock(return_value=False)

        with patch("socket.create_connection", return_value=mock_sock), \
             patch("ssl.SSLContext.wrap_socket", return_value=mock_ssock):
            result = self._check("https://example.com")

        self.assertTrue(result["present"])

    def test_no_https_finding_severity(self):
        result = self._check("http://example.com")
        finding = next((f for f in result["findings"] if f["id"] == "NO_HTTPS"), None)
        self.assertIsNotNone(finding)
        self.assertEqual(finding["severity"], "high")


# ── headers_checker ───────────────────────────────────────────────────────────

class TestHeadersChecker(unittest.TestCase):
    def _check(self, headers):
        from app.scanner.headers_checker import check_headers
        return check_headers(headers)

    def test_all_headers_present(self):
        headers = {
            "Content-Security-Policy": "default-src 'self'",
            "Strict-Transport-Security": "max-age=31536000",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
            "Permissions-Policy": "geolocation=()",
        }
        result = self._check(headers)
        self.assertEqual(len(result["findings"]), 0)
        for check in result["checks"]:
            self.assertTrue(check["present"])

    def test_missing_csp_generates_high_finding(self):
        result = self._check({})
        ids = [f["id"] for f in result["findings"]]
        self.assertIn("CSP_MISSING", ids)
        csp = next(f for f in result["findings"] if f["id"] == "CSP_MISSING")
        self.assertEqual(csp["severity"], "high")

    def test_missing_hsts_generates_high_finding(self):
        result = self._check({})
        ids = [f["id"] for f in result["findings"]]
        self.assertIn("HSTS_MISSING", ids)

    def test_case_insensitive_header_lookup(self):
        headers = {"content-security-policy": "default-src 'self'"}
        result = self._check(headers)
        csp_check = next((c for c in result["checks"] if c["header"] == "Content-Security-Policy"), None)
        self.assertIsNotNone(csp_check)
        self.assertTrue(csp_check["present"])

    def test_all_headers_missing_gives_five_findings(self):
        result = self._check({})
        self.assertEqual(len(result["findings"]), 5)


# ── cookie_checker ────────────────────────────────────────────────────────────

class TestCookieChecker(unittest.TestCase):
    def _check(self, raw_cookies):
        from app.scanner.cookie_checker import check_cookies
        # Build a simple dict-like object with getlist support
        class FakeHeaders:
            def __init__(self, cookies):
                self._cookies = cookies

            def getlist(self, name):
                if name.lower() == "set-cookie":
                    return self._cookies
                return []

            def items(self):
                return [("Set-Cookie", c) for c in self._cookies]

        return check_cookies(FakeHeaders(raw_cookies))

    def test_no_cookies(self):
        result = self._check([])
        self.assertEqual(result["cookies"], [])
        self.assertEqual(result["findings"], [])

    def test_secure_httponly_samesite_cookie_clean(self):
        result = self._check(["session=abc123; Secure; HttpOnly; SameSite=Strict"])
        self.assertEqual(len(result["findings"]), 0)
        self.assertEqual(result["cookies"][0]["name"], "session")
        self.assertTrue(result["cookies"][0]["secure"])
        self.assertTrue(result["cookies"][0]["httponly"])

    def test_missing_secure_flag(self):
        result = self._check(["session=abc; HttpOnly; SameSite=Lax"])
        ids = [f["id"] for f in result["findings"]]
        self.assertTrue(any("COOKIE_NO_SECURE" in fid for fid in ids))

    def test_missing_httponly_flag(self):
        result = self._check(["tracker=xyz; Secure; SameSite=Lax"])
        ids = [f["id"] for f in result["findings"]]
        self.assertTrue(any("COOKIE_NO_HTTPONLY" in fid for fid in ids))

    def test_missing_samesite(self):
        result = self._check(["token=val; Secure; HttpOnly"])
        ids = [f["id"] for f in result["findings"]]
        self.assertTrue(any("COOKIE_NO_SAMESITE" in fid for fid in ids))

    def test_samesite_none_without_secure(self):
        result = self._check(["token=val; HttpOnly; SameSite=None"])
        ids = [f["id"] for f in result["findings"]]
        self.assertTrue(any("SAMESITE_NONE_INSECURE" in fid for fid in ids))

    def test_cookie_value_not_stored(self):
        result = self._check(["secret=SuperSecretValue123; Secure; HttpOnly; SameSite=Strict"])
        # Cookie dict should only contain name, secure, httponly, samesite — no value
        cookie = result["cookies"][0]
        self.assertNotIn("value", cookie)
        self.assertEqual(cookie["name"], "secret")


# ── scanner_engine URL validation ─────────────────────────────────────────────

class TestScannerEngineUrlValidation(unittest.TestCase):
    def _run(self, url):
        from app.scanner.scanner_engine import run_scan
        return run_scan(url)

    def test_invalid_scheme_rejected(self):
        result = self._run("ftp://example.com")
        self.assertEqual(result["status"], "error")
        self.assertIsNotNone(result["error"])

    def test_missing_scheme_rejected(self):
        result = self._run("example.com")
        self.assertEqual(result["status"], "error")

    def test_empty_url_rejected(self):
        result = self._run("")
        self.assertEqual(result["status"], "error")

    def test_valid_http_url_accepted(self):
        # Patch requests.Session.get to avoid real network
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {
            "Content-Type": "text/html",
        }
        mock_response.history = []
        mock_response.url = "http://example.com"
        mock_response.raw = MagicMock()
        mock_response.raw.read.return_value = b""

        with patch("requests.Session.get", return_value=mock_response):
            result = self._run("http://example.com")

        # May be completed or have a findings-related status — just not an error from URL validation
        self.assertNotEqual(result.get("error"), "Invalid URL. Please provide a full URL starting with http:// or https://")


if __name__ == "__main__":
    unittest.main()
