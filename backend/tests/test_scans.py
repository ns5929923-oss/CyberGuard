"""
Tests for scan routes: /api/scans (POST/GET), /api/scans/<id> (GET/DELETE)
Covers scan creation, retrieval, ownership enforcement, and deletion.
"""
import sys
import os
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app import create_app, db  # noqa: E402


# Minimal stub that run_scan returns so tests don't touch the network
MOCK_SCAN_RESULT = {
    "status": "completed",
    "target": "https://example.com",
    "error": None,
    "http_info": {
        "status_code": 200,
        "response_time_ms": 120,
        "content_type": "text/html",
        "final_url": "https://example.com",
        "redirects": [],
        "server": None,
    },
    "checks": [],
    "findings": [
        {
            "check": "headers",
            "id": "CSP_MISSING",
            "severity": "high",
            "title": "Content-Security-Policy header missing",
            "description": "CSP not set.",
            "recommendation": "Add CSP header.",
        }
    ],
}


class ScansTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

        # Register and log in user A
        self.token_a = self._register_and_login("alice@example.com", "AlicePass1")
        # Register and log in user B (for ownership tests)
        self.token_b = self._register_and_login("bob@example.com", "BobPass123")

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _register_and_login(self, email, password):
        name = email.split("@")[0].capitalize()
        self.client.post("/api/auth/register", json={"name": name, "email": email, "password": password})
        rv = self.client.post("/api/auth/login", json={"email": email, "password": password})
        return rv.get_json()["token"]

    def _auth(self, token):
        return {"Authorization": f"Bearer {token}"}

    def _create_scan(self, token=None, target="https://example.com"):
        token = token or self.token_a
        with patch("app.routes.scans.run_scan", return_value=MOCK_SCAN_RESULT):
            return self.client.post(
                "/api/scans",
                json={"target": target, "authorization_confirmed": True},
                headers=self._auth(token),
            )

    # ── Scan creation ─────────────────────────────────────────────────────────

    def test_create_scan_success(self):
        rv = self._create_scan()
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertIn("id", data)
        self.assertEqual(data["status"], "completed")

    def test_create_scan_without_auth(self):
        rv = self.client.post("/api/scans", json={"target": "https://example.com", "authorization_confirmed": True})
        self.assertEqual(rv.status_code, 401)

    def test_create_scan_missing_target(self):
        with patch("app.routes.scans.run_scan", return_value=MOCK_SCAN_RESULT):
            rv = self.client.post(
                "/api/scans",
                json={"authorization_confirmed": True},
                headers=self._auth(self.token_a),
            )
        self.assertEqual(rv.status_code, 422)
        self.assertIn("target", rv.get_json().get("errors", {}))

    def test_create_scan_without_authorization_confirmation(self):
        with patch("app.routes.scans.run_scan", return_value=MOCK_SCAN_RESULT):
            rv = self.client.post(
                "/api/scans",
                json={"target": "https://example.com", "authorization_confirmed": False},
                headers=self._auth(self.token_a),
            )
        self.assertEqual(rv.status_code, 422)
        self.assertIn("authorization_confirmed", rv.get_json().get("errors", {}))

    def test_create_scan_invalid_url(self):
        with patch("app.routes.scans.run_scan", return_value=MOCK_SCAN_RESULT):
            rv = self.client.post(
                "/api/scans",
                json={"target": "not-a-url", "authorization_confirmed": True},
                headers=self._auth(self.token_a),
            )
        self.assertEqual(rv.status_code, 422)
        self.assertIn("target", rv.get_json().get("errors", {}))

    def test_create_scan_stores_findings(self):
        rv = self._create_scan()
        self.assertEqual(rv.status_code, 200)
        scan_id = rv.get_json()["id"]

        rv2 = self.client.get(f"/api/scans/{scan_id}", headers=self._auth(self.token_a))
        self.assertEqual(rv2.status_code, 200)
        data = rv2.get_json()
        self.assertGreater(data.get("findings_count", 0), 0)

    # ── Scan listing ─────────────────────────────────────────────────────────

    def test_list_scans_empty(self):
        rv = self.client.get("/api/scans", headers=self._auth(self.token_a))
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.get_json(), [])

    def test_list_scans_after_creation(self):
        self._create_scan()
        rv = self.client.get("/api/scans", headers=self._auth(self.token_a))
        self.assertEqual(rv.status_code, 200)
        scans = rv.get_json()
        self.assertEqual(len(scans), 1)
        self.assertEqual(scans[0]["target"], "https://example.com")

    def test_list_scans_only_own(self):
        """User A's scans should not appear in User B's list."""
        self._create_scan(token=self.token_a)
        rv = self.client.get("/api/scans", headers=self._auth(self.token_b))
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.get_json(), [])

    def test_list_scans_without_auth(self):
        rv = self.client.get("/api/scans")
        self.assertEqual(rv.status_code, 401)

    # ── Scan retrieval ────────────────────────────────────────────────────────

    def test_get_scan_success(self):
        scan_id = self._create_scan().get_json()["id"]
        rv = self.client.get(f"/api/scans/{scan_id}", headers=self._auth(self.token_a))
        self.assertEqual(rv.status_code, 200)
        self.assertIn("findings", rv.get_json())

    def test_get_scan_ownership_enforced(self):
        """User B cannot retrieve User A's scan."""
        scan_id = self._create_scan(token=self.token_a).get_json()["id"]
        rv = self.client.get(f"/api/scans/{scan_id}", headers=self._auth(self.token_b))
        self.assertEqual(rv.status_code, 404)

    def test_get_nonexistent_scan(self):
        rv = self.client.get("/api/scans/999999", headers=self._auth(self.token_a))
        self.assertEqual(rv.status_code, 404)

    # ── Scan deletion ─────────────────────────────────────────────────────────

    def test_delete_scan_success(self):
        scan_id = self._create_scan().get_json()["id"]
        rv = self.client.delete(f"/api/scans/{scan_id}", headers=self._auth(self.token_a))
        self.assertEqual(rv.status_code, 200)

        # Verify it's gone
        rv2 = self.client.get(f"/api/scans/{scan_id}", headers=self._auth(self.token_a))
        self.assertEqual(rv2.status_code, 404)

    def test_delete_scan_ownership_enforced(self):
        """User B cannot delete User A's scan."""
        scan_id = self._create_scan(token=self.token_a).get_json()["id"]
        rv = self.client.delete(f"/api/scans/{scan_id}", headers=self._auth(self.token_b))
        self.assertEqual(rv.status_code, 404)

    def test_delete_nonexistent_scan(self):
        rv = self.client.delete("/api/scans/999999", headers=self._auth(self.token_a))
        self.assertEqual(rv.status_code, 404)

    def test_delete_without_auth(self):
        scan_id = self._create_scan().get_json()["id"]
        rv = self.client.delete(f"/api/scans/{scan_id}")
        self.assertEqual(rv.status_code, 401)


if __name__ == "__main__":
    unittest.main()
