from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from app import db
from app.models.user import User
from app.models.scan import Scan
from app.models.finding import Finding

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("", methods=["GET"])
@jwt_required()
def get_dashboard():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    # Total scans for this user
    total_scans = Scan.query.filter_by(user_id=user_id).count()

    # Total findings across all user scans
    total_findings = (
        db.session.query(func.count(Finding.id))
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(Scan.user_id == user_id)
        .scalar()
    ) or 0

    # High-risk findings (critical + high severity)
    high_risk_findings = (
        db.session.query(func.count(Finding.id))
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(
            Scan.user_id == user_id,
            Finding.severity.in_(["critical", "high"]),
        )
        .scalar()
    ) or 0

    # Most recent scan's score
    latest_scan = (
        Scan.query
        .filter_by(user_id=user_id)
        .order_by(Scan.created_at.desc())
        .first()
    )
    latest_score = latest_scan.score if latest_scan else None

    # Recent scans (last 5)
    recent_scans = (
        Scan.query
        .filter_by(user_id=user_id)
        .order_by(Scan.created_at.desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "total_scans": total_scans,
        "total_findings": total_findings,
        "high_risk_findings": high_risk_findings,
        "latest_score": latest_score,
        "recent_scans": [s.to_dict() for s in recent_scans],
    }), 200
