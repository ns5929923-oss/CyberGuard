"""
Auth middleware / decorators for CyberGuard.

Provides:
  - token_required  : requires a valid JWT (convenience wrapper)
  - admin_required  : requires valid JWT + role=="admin" + is_active==True
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt

from app import db
from app.models.user import User


def admin_required(fn):
    """
    Decorator that:
      1. Validates the JWT token.
      2. Loads the user from the database.
      3. Checks role == "admin".
      4. Checks is_active == True.
      5. Returns 401/403 with safe error messages on failure.

    Usage::

        @admin_bp.route("/dashboard")
        @admin_required
        def dashboard():
            ...
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # 1. Verify JWT (returns 401 if missing/invalid)
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({"error": "Authentication required."}), 401

        # 2. Load user from DB (never trust only the token payload)
        user_id = get_jwt_identity()
        user = db.session.get(User, int(user_id))
        if not user:
            return jsonify({"error": "Authentication required."}), 401

        # 3. Check account is active
        if not user.is_active:
            return jsonify({"error": "Your account has been deactivated."}), 403

        # 4. Check role (case-sensitive; stored as lowercase "admin")
        claims = get_jwt()
        # Double-check: verify role from DB, not just the token claim
        if user.role != "admin":
            return jsonify({"error": "Administrator access required."}), 403

        return fn(*args, **kwargs)
    return wrapper
