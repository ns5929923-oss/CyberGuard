"""
Tests for the Admin Panel.
Covers:
  - Authentication: user, admin, inactive, invalid
  - Authorization: user blocked from admin endpoints, admin allowed
  - User management: view, search, filter, activate/deactivate, delete, self-delete prevention
  - Data security: password hash never returned, secrets never returned
  - Dashboard stats match database
"""
import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app import create_app, db   # noqa: E402
from app.models.user import User  # noqa: E402


class AdminTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            # Regular user
            self.user = User(name="Alice", email="alice@example.com", role="user", is_active=True)
            self.user.set_password("password123")
            db.session.add(self.user)
            # Admin user
            self.admin = User(name="Admin", email="admin@example.com", role="admin", is_active=True)
            self.admin.set_password("adminpass123")
            db.session.add(self.admin)
            # Inactive user
            self.inactive = User(name="Inactive", email="inactive@example.com", role="user", is_active=False)
            self.inactive.set_password("password123")
            db.session.add(self.inactive)
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _login(self, email, password):
        return self.client.post("/api/auth/login", json={"email": email, "password": password})

    def _token_for(self, email, password):
        rv = self._login(email, password)
        return rv.get_json().get("token")

    def _auth_header(self, token):
        return {"Authorization": f"Bearer {token}"}

    # ── AUTHENTICATION TESTS ─────────────────────────────────────────────────

    def test_valid_user_login(self):
        rv = self._login("alice@example.com", "password123")
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["role"], "user")

    def test_invalid_login(self):
        rv = self._login("alice@example.com", "wrongpassword")
        self.assertEqual(rv.status_code, 401)

    def test_valid_admin_login(self):
        rv = self._login("admin@example.com", "adminpass123")
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["role"], "admin")

    def test_inactive_user_login_blocked(self):
        rv = self._login("inactive@example.com", "password123")
        self.assertEqual(rv.status_code, 403)

    def test_invalid_password(self):
        rv = self._login("admin@example.com", "badpassword")
        self.assertEqual(rv.status_code, 401)

    # ── AUTHORIZATION TESTS ───────────────────────────────────────────────────

    def test_user_cannot_access_admin_dashboard(self):
        token = self._token_for("alice@example.com", "password123")
        rv = self.client.get("/api/admin/dashboard", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 403)

    def test_user_cannot_access_admin_users(self):
        token = self._token_for("alice@example.com", "password123")
        rv = self.client.get("/api/admin/users", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 403)

    def test_admin_can_access_admin_endpoints(self):
        token = self._token_for("admin@example.com", "adminpass123")
        rv = self.client.get("/api/admin/dashboard", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 200)

    def test_missing_jwt_returns_401(self):
        rv = self.client.get("/api/admin/dashboard")
        self.assertEqual(rv.status_code, 401)

    def test_invalid_jwt_returns_401(self):
        rv = self.client.get("/api/admin/dashboard", headers={"Authorization": "Bearer invalid.token.here"})
        self.assertEqual(rv.status_code, 401)

    # ── USER MANAGEMENT TESTS ─────────────────────────────────────────────────

    def test_admin_can_view_users(self):
        token = self._token_for("admin@example.com", "adminpass123")
        rv = self.client.get("/api/admin/users", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertIn("users", data)
        self.assertGreater(data["total"], 0)

    def test_admin_can_search_users(self):
        token = self._token_for("admin@example.com", "adminpass123")
        rv = self.client.get("/api/admin/users?search=alice", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        emails = [u["email"] for u in data["users"]]
        self.assertIn("alice@example.com", emails)

    def test_admin_can_filter_users_by_role(self):
        token = self._token_for("admin@example.com", "adminpass123")
        rv = self.client.get("/api/admin/users?role=admin", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        for u in data["users"]:
            self.assertEqual(u["role"], "admin")

    def test_admin_can_view_user_details(self):
        token = self._token_for("admin@example.com", "adminpass123")
        with self.app.app_context():
            uid = User.query.filter_by(email="alice@example.com").first().id
        rv = self.client.get(f"/api/admin/users/{uid}", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.get_json()["user"]["email"], "alice@example.com")

    def test_admin_can_deactivate_user(self):
        token = self._token_for("admin@example.com", "adminpass123")
        with self.app.app_context():
            uid = User.query.filter_by(email="alice@example.com").first().id
        rv = self.client.patch(
            f"/api/admin/users/{uid}/status",
            json={"is_active": False},
            headers=self._auth_header(token),
        )
        self.assertEqual(rv.status_code, 200)
        self.assertFalse(rv.get_json()["user"]["is_active"])

    def test_admin_can_activate_user(self):
        token = self._token_for("admin@example.com", "adminpass123")
        with self.app.app_context():
            uid = User.query.filter_by(email="inactive@example.com").first().id
        rv = self.client.patch(
            f"/api/admin/users/{uid}/status",
            json={"is_active": True},
            headers=self._auth_header(token),
        )
        self.assertEqual(rv.status_code, 200)
        self.assertTrue(rv.get_json()["user"]["is_active"])

    def test_admin_cannot_delete_own_account(self):
        token = self._token_for("admin@example.com", "adminpass123")
        with self.app.app_context():
            admin_id = User.query.filter_by(email="admin@example.com").first().id
        rv = self.client.delete(
            f"/api/admin/users/{admin_id}",
            headers=self._auth_header(token),
        )
        self.assertEqual(rv.status_code, 403)
        self.assertIn("own account", rv.get_json()["error"])

    def test_admin_can_delete_other_user(self):
        token = self._token_for("admin@example.com", "adminpass123")
        with self.app.app_context():
            uid = User.query.filter_by(email="inactive@example.com").first().id
        rv = self.client.delete(
            f"/api/admin/users/{uid}",
            headers=self._auth_header(token),
        )
        self.assertEqual(rv.status_code, 200)

    # ── DATA SECURITY TESTS ───────────────────────────────────────────────────

    def test_password_hash_never_returned(self):
        token = self._token_for("admin@example.com", "adminpass123")
        rv = self.client.get("/api/admin/users", headers=self._auth_header(token))
        raw = rv.data.decode()
        self.assertNotIn("password_hash", raw)
        self.assertNotIn("password", raw)

    def test_login_response_no_password(self):
        rv = self._login("alice@example.com", "password123")
        raw = rv.data.decode()
        self.assertNotIn("password_hash", raw)

    def test_dashboard_stats_match_database(self):
        token = self._token_for("admin@example.com", "adminpass123")
        rv = self.client.get("/api/admin/dashboard", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        # Must contain all expected keys
        for key in ("total_users", "active_users", "inactive_users", "total_scans",
                    "total_findings", "high_risk_scans", "critical_findings"):
            self.assertIn(key, data)
        # Values are integers
        self.assertIsInstance(data["total_users"], int)
        self.assertEqual(data["total_users"], 3)  # alice + admin + inactive
        self.assertEqual(data["active_users"], 2)
        self.assertEqual(data["inactive_users"], 1)

    def test_admin_cannot_self_deactivate(self):
        token = self._token_for("admin@example.com", "adminpass123")
        with self.app.app_context():
            admin_id = User.query.filter_by(email="admin@example.com").first().id
        rv = self.client.patch(
            f"/api/admin/users/{admin_id}/status",
            json={"is_active": False},
            headers=self._auth_header(token),
        )
        self.assertEqual(rv.status_code, 403)

    def test_normal_registration_creates_user_role(self):
        rv = self.client.post("/api/auth/register", json={
            "name": "NewUser", "email": "newuser@example.com", "password": "password123"
        })
        self.assertEqual(rv.status_code, 201)
        self.assertEqual(rv.get_json()["user"]["role"], "user")

    def test_admin_can_view_all_scans(self):
        token = self._token_for("admin@example.com", "adminpass123")
        rv = self.client.get("/api/admin/scans", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 200)
        self.assertIn("scans", rv.get_json())

    def test_admin_can_view_all_findings(self):
        token = self._token_for("admin@example.com", "adminpass123")
        rv = self.client.get("/api/admin/findings", headers=self._auth_header(token))
        self.assertEqual(rv.status_code, 200)
        self.assertIn("findings", rv.get_json())


if __name__ == "__main__":
    unittest.main()
