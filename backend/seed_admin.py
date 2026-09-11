"""
Seed script: Creates the initial admin account securely.

Reads credentials from environment variables:
  ADMIN_EMAIL    - admin email address
  ADMIN_PASSWORD - admin password (min 8 characters)

Usage (from the backend/ directory):
    python seed_admin.py

The script is idempotent: if an admin with ADMIN_EMAIL already exists
it will not create a duplicate.

NEVER hard-code credentials here. Use backend/.env or environment variables.
NEVER commit .env to version control.
"""
import os
import sys

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Must set env before importing app
os.environ.setdefault("DATABASE_URL", "sqlite:///cyberguard.db")

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").strip().lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "").strip()
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Administrator").strip()

if not ADMIN_EMAIL or not ADMIN_PASSWORD:
    print("[ERROR] ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.")
    print("        Set them in backend/.env or export them before running this script.")
    sys.exit(1)

if len(ADMIN_PASSWORD) < 8:
    print("[ERROR] ADMIN_PASSWORD must be at least 8 characters.")
    sys.exit(1)

from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    existing = User.query.filter_by(email=ADMIN_EMAIL).first()

    if existing:
        if existing.role == "admin":
            print(f"[SKIP] Admin account already exists: {ADMIN_EMAIL}")
        else:
            # Upgrade existing user to admin
            existing.role = "admin"
            existing.is_active = True
            db.session.commit()
            print(f"[UPDATED] Upgraded existing user to admin: {ADMIN_EMAIL}")
    else:
        admin = User(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            role="admin",
            is_active=True,
        )
        admin.set_password(ADMIN_PASSWORD)
        db.session.add(admin)
        db.session.commit()
        print(f"[OK] Admin account created: {ADMIN_EMAIL}")

print("[DONE]")
