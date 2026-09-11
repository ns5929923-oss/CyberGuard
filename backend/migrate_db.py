"""
Safe database migration script for CyberGuard.

Adds new columns to the 'users' table:
  - role        TEXT NOT NULL DEFAULT 'user'
  - is_active   INTEGER NOT NULL DEFAULT 1  (SQLite boolean)
  - updated_at  DATETIME
  - last_login  DATETIME

Run once from the backend directory:
    python migrate_db.py

Safe to run multiple times (checks column existence first).
"""
import os
import sys
import sqlite3

# Allow running from both backend/ and project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "instance", "cyberguard.db")

if not os.path.exists(DB_PATH):
    print(f"[INFO] Database not found at {DB_PATH} – nothing to migrate.")
    print("       The app will create it with the correct schema on first run.")
    sys.exit(0)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Fetch existing columns
cursor.execute("PRAGMA table_info(users)")
existing_cols = {row[1] for row in cursor.fetchall()}

migrations = [
    ("role",       "TEXT NOT NULL DEFAULT 'user'"),
    ("is_active",  "INTEGER NOT NULL DEFAULT 1"),
    ("updated_at", "DATETIME"),
    ("last_login", "DATETIME"),
]

for col_name, col_def in migrations:
    if col_name not in existing_cols:
        sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"
        cursor.execute(sql)
        print(f"[OK] Added column: {col_name}")
    else:
        print(f"[SKIP] Column already exists: {col_name}")

conn.commit()
conn.close()
print("[DONE] Migration complete.")
