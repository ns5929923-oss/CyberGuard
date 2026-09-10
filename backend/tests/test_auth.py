"""
Tests for authentication routes: /api/auth/register, /api/auth/login, /api/auth/me
"""
import sys
import os
import unittest

# Ensure the backend/ directory is on sys.path so that `from app import ...` works
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app import create_app, db  # noqa: E402


class AuthTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    # ── Helper ────────────────────────────────────────────────────────────────

    def _register(self, name="Alice", email="alice@example.com", password="password123"):
        return self.client.post(
            "/api/auth/register",
            json={"name": name, "email": email, "password": password},
        )

    def _login(self, email="alice@example.com", password="password123"):
        return self.client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )

    # ── Registration ──────────────────────────────────────────────────────────

    def test_register_success(self):
        rv = self._register()
        self.assertEqual(rv.status_code, 201)
        data = rv.get_json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "alice@example.com")

    def test_register_missing_name(self):
        rv = self._register(name="")
        self.assertEqual(rv.status_code, 422)
        self.assertIn("name", rv.get_json().get("errors", {}))

    def test_register_invalid_email(self):
        rv = self._register(email="not-an-email")
        self.assertEqual(rv.status_code, 422)
        self.assertIn("email", rv.get_json().get("errors", {}))

    def test_register_short_password(self):
        rv = self._register(password="short")
        self.assertEqual(rv.status_code, 422)
        self.assertIn("password", rv.get_json().get("errors", {}))

    def test_register_duplicate_email(self):
        self._register()
        rv = self._register()  # second registration with same email
        self.assertEqual(rv.status_code, 409)

    # ── Login ────────────────────────────────────────────────────────────────

    def test_login_success(self):
        self._register()
        rv = self._login()
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "alice@example.com")

    def test_login_wrong_password(self):
        self._register()
        rv = self._login(password="wrongpassword")
        self.assertEqual(rv.status_code, 401)

    def test_login_unknown_email(self):
        rv = self._login(email="nobody@example.com")
        self.assertEqual(rv.status_code, 401)

    def test_login_missing_fields(self):
        rv = self.client.post("/api/auth/login", json={})
        self.assertEqual(rv.status_code, 422)

    # ── Protected route /api/auth/me ─────────────────────────────────────────

    def test_me_authenticated(self):
        self._register()
        token = self._login().get_json()["token"]
        rv = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.get_json()["user"]["email"], "alice@example.com")

    def test_me_unauthenticated(self):
        rv = self.client.get("/api/auth/me")
        self.assertEqual(rv.status_code, 401)

    def test_me_invalid_token(self):
        rv = self.client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        self.assertEqual(rv.status_code, 422)


if __name__ == "__main__":
    unittest.main()
