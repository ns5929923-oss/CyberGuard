from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from urllib.parse import urlparse

from app import db
from app.models.scan import Scan
from app.models.finding import Finding
from app.scanner.scanner_engine import run_scan
from app.services.risk_engine import calculate_risk

scans_bp = Blueprint("scans", __name__)

MAX_TARGET_LEN = 2048

# Mapping from scanner checker category keys to human-readable category names
CATEGORY_MAP = {
    "headers": "Security Headers",
    "cookies": "Cookie Security",
    "https": "HTTPS & TLS",
    "http": "HTTP",
}


# ── POST /api/scans ───────────────────────────────────────────────────────────

@scans_bp.route("", methods=["POST"])
@jwt_required()
def create_scan():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    target = (data.get("target") or "").strip()
    authorization_confirmed = data.get("authorization_confirmed", False)

    # ── Validation ────────────────────────────────────────────────────────────
    errors = {}

    if not target:
        errors["target"] = "Target URL is required."
    elif len(target) > MAX_TARGET_LEN:
        errors["target"] = "Target URL is too long."
    else:
        parsed = urlparse(target)
        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            errors["target"] = "Enter a valid URL starting with http:// or https://"

    if not authorization_confirmed:
        errors["authorization_confirmed"] = (
            "You must confirm that you own or have explicit permission to assess this target."
        )

    if errors:
        return jsonify({"errors": errors}), 422

    # ── Run scan ──────────────────────────────────────────────────────────────
    scan_result = run_scan(target)

    # ── Persist to database ───────────────────────────────────────────────────
    raw_findings = scan_result.get("findings", [])
    risk = calculate_risk(raw_findings)

    scan = Scan(
        user_id=user_id,
        target=target,
        score=risk["score"],
        risk_level=risk["risk_level"],
        status=scan_result.get("status", "completed"),
    )
    db.session.add(scan)
    db.session.flush()  # get scan.id before adding findings

    for f in raw_findings:
        raw_sev = (f.get("severity") or "").lower()
        # Normalise legacy "info" → "informational"
        sev = "informational" if raw_sev == "info" else raw_sev
        category = CATEGORY_MAP.get(f.get("check", ""), f.get("check", ""))
        finding = Finding(
            scan_id=scan.id,
            title=f.get("title", ""),
            description=f.get("description", ""),
            category=category,
            severity=sev,
            recommendation=f.get("recommendation", ""),
            status="open",
        )
        db.session.add(finding)

    db.session.commit()

    # Attach risk data to the response so the frontend can display it immediately
    scan_result["id"] = scan.id
    scan_result["score"] = risk["score"]
    scan_result["risk_level"] = risk["risk_level"]
    scan_result["severity_counts"] = risk["severity_counts"]

    return jsonify(scan_result), 200


# ── GET /api/scans ────────────────────────────────────────────────────────────

@scans_bp.route("", methods=["GET"])
@jwt_required()
def list_scans():
    user_id = int(get_jwt_identity())
    scans = (
        Scan.query
        .filter_by(user_id=user_id)
        .order_by(Scan.created_at.desc())
        .all()
    )
    return jsonify([s.to_dict() for s in scans]), 200


# ── GET /api/scans/<id> ───────────────────────────────────────────────────────

@scans_bp.route("/<int:scan_id>", methods=["GET"])
@jwt_required()
def get_scan(scan_id):
    user_id = int(get_jwt_identity())
    scan = db.session.get(Scan, scan_id)
    if not scan or scan.user_id != user_id:
        return jsonify({"error": "Scan not found."}), 404
    return jsonify(scan.to_dict(include_findings=True)), 200


# ── DELETE /api/scans/<id> ────────────────────────────────────────────────────

@scans_bp.route("/<int:scan_id>", methods=["DELETE"])
@jwt_required()
def delete_scan(scan_id):
    user_id = int(get_jwt_identity())
    scan = db.session.get(Scan, scan_id)
    if not scan or scan.user_id != user_id:
        return jsonify({"error": "Scan not found."}), 404
    db.session.delete(scan)
    db.session.commit()
    return jsonify({"message": "Scan deleted."}), 200
