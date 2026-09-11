"""
Admin API routes — all endpoints require JWT + admin role.
Normal users receive HTTP 403 Forbidden.

Endpoints:
  GET  /api/admin/dashboard
  GET  /api/admin/dashboard/charts
  GET  /api/admin/users
  GET  /api/admin/users/<id>
  GET  /api/admin/users/<id>/activity
  PUT  /api/admin/users/<id>
  PATCH /api/admin/users/<id>/status
  DELETE /api/admin/users/<id>
  GET  /api/admin/scans
  GET  /api/admin/findings
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.middleware.auth import admin_required
from app.services import admin_service

admin_bp = Blueprint("admin", __name__)


# ── Dashboard ────────────────────────────────────────────────────────────────

@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def dashboard():
    stats = admin_service.get_dashboard_stats()
    return jsonify(stats), 200


@admin_bp.route("/dashboard/charts", methods=["GET"])
@admin_required
def dashboard_charts():
    return jsonify({
        "users_over_time": admin_service.get_users_over_time(),
        "scans_over_time": admin_service.get_scans_over_time(),
        "findings_by_severity": admin_service.get_findings_by_severity(),
        "risk_level_distribution": admin_service.get_risk_level_distribution(),
    }), 200


# ── Users ─────────────────────────────────────────────────────────────────────

@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    args = request.args
    search = (args.get("search") or "").strip() or None
    role = args.get("role") or None
    is_active_raw = args.get("is_active")
    is_active = None
    if is_active_raw == "true":
        is_active = True
    elif is_active_raw == "false":
        is_active = False

    sort_by = args.get("sort_by", "created_at")
    order = args.get("order", "desc")
    page = max(int(args.get("page", 1)), 1)
    per_page = min(int(args.get("per_page", 20)), 100)

    result = admin_service.list_users(
        search=search,
        role=role,
        is_active=is_active,
        sort_by=sort_by,
        order=order,
        page=page,
        per_page=per_page,
    )
    return jsonify(result), 200


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required
def get_user(user_id):
    user = admin_service.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": user}), 200


@admin_bp.route("/users/<int:user_id>/activity", methods=["GET"])
@admin_required
def get_user_activity(user_id):
    activity = admin_service.get_user_activity(user_id)
    if activity is None:
        return jsonify({"error": "User not found."}), 404
    return jsonify(activity), 200


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    data = request.get_json(silent=True) or {}
    current_admin_id = int(get_jwt_identity())
    user, error = admin_service.update_user(user_id, data, current_admin_id)
    if error:
        return jsonify({"error": error}), 404 if error == "User not found." else 422
    return jsonify({"user": user}), 200


@admin_bp.route("/users/<int:user_id>/status", methods=["PATCH"])
@admin_required
def set_user_status(user_id):
    data = request.get_json(silent=True) or {}
    is_active = data.get("is_active")
    if not isinstance(is_active, bool):
        return jsonify({"error": "is_active must be a boolean."}), 422

    current_admin_id = int(get_jwt_identity())
    user, error = admin_service.set_user_status(user_id, is_active, current_admin_id)
    if error:
        status_code = 403 if "own account" in error else 404
        return jsonify({"error": error}), status_code
    return jsonify({"user": user}), 200


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    current_admin_id = int(get_jwt_identity())
    success, error = admin_service.delete_user(user_id, current_admin_id)
    if not success:
        status_code = 403 if "own account" in error else 404
        return jsonify({"error": error}), status_code
    return jsonify({"message": "User deleted successfully."}), 200


# ── Scans (all users) ─────────────────────────────────────────────────────────

@admin_bp.route("/scans", methods=["GET"])
@admin_required
def list_scans():
    args = request.args
    user_id = args.get("user_id", type=int)
    risk_level = args.get("risk_level") or None
    date_from = args.get("date_from") or None
    date_to = args.get("date_to") or None
    page = max(int(args.get("page", 1)), 1)
    per_page = min(int(args.get("per_page", 20)), 100)

    result = admin_service.list_all_scans(
        user_id=user_id,
        risk_level=risk_level,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
    )
    return jsonify(result), 200


# ── Findings (all users) ──────────────────────────────────────────────────────

@admin_bp.route("/findings", methods=["GET"])
@admin_required
def list_findings():
    args = request.args
    severity = args.get("severity") or None
    user_id = args.get("user_id", type=int)
    page = max(int(args.get("page", 1)), 1)
    per_page = min(int(args.get("per_page", 20)), 100)

    result = admin_service.list_all_findings(
        severity=severity,
        user_id=user_id,
        page=page,
        per_page=per_page,
    )
    return jsonify(result), 200
