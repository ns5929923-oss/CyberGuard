"""
Admin service: business logic for admin API endpoints.
All queries are done via SQLAlchemy ORM to prevent SQL injection.
Sensitive fields (password_hash) are never included in returned data.
"""
from datetime import datetime, timezone
from sqlalchemy import func

from app import db
from app.models.user import User
from app.models.scan import Scan
from app.models.finding import Finding


# ── Dashboard statistics ──────────────────────────────────────────────────────

def get_dashboard_stats() -> dict:
    """Return aggregated platform statistics from the database."""
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    inactive_users = User.query.filter_by(is_active=False).count()
    total_scans = Scan.query.count()
    total_findings = Finding.query.count()

    high_risk_scans = Scan.query.filter(
        Scan.risk_level.in_(["high", "critical"])
    ).count()

    critical_findings = Finding.query.filter_by(severity="critical").count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "total_scans": total_scans,
        "total_findings": total_findings,
        "high_risk_scans": high_risk_scans,
        "critical_findings": critical_findings,
    }


# ── Chart data ────────────────────────────────────────────────────────────────

def get_users_over_time() -> list:
    """Return user registrations grouped by date (last 30 days of data)."""
    rows = (
        db.session.query(
            func.strftime("%Y-%m-%d", User.created_at).label("date"),
            func.count(User.id).label("count"),
        )
        .group_by("date")
        .order_by("date")
        .all()
    )
    return [{"date": r.date, "count": r.count} for r in rows]


def get_scans_over_time() -> list:
    """Return scan counts grouped by date."""
    rows = (
        db.session.query(
            func.strftime("%Y-%m-%d", Scan.created_at).label("date"),
            func.count(Scan.id).label("count"),
        )
        .group_by("date")
        .order_by("date")
        .all()
    )
    return [{"date": r.date, "count": r.count} for r in rows]


def get_findings_by_severity() -> dict:
    """Return finding counts grouped by severity."""
    rows = (
        db.session.query(Finding.severity, func.count(Finding.id).label("count"))
        .group_by(Finding.severity)
        .all()
    )
    return {r.severity or "unknown": r.count for r in rows}


def get_risk_level_distribution() -> dict:
    """Return scan counts grouped by risk level."""
    rows = (
        db.session.query(Scan.risk_level, func.count(Scan.id).label("count"))
        .group_by(Scan.risk_level)
        .all()
    )
    return {r.risk_level or "unknown": r.count for r in rows}


# ── User management ───────────────────────────────────────────────────────────

def list_users(search=None, role=None, is_active=None, sort_by="created_at", order="desc", page=1, per_page=20):
    """Return paginated, filtered, sorted list of users (safe fields only)."""
    query = User.query

    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(User.name.ilike(like), User.email.ilike(like))
        )

    if role in ("user", "admin"):
        query = query.filter_by(role=role)

    if is_active is not None:
        query = query.filter_by(is_active=is_active)

    # Sorting
    sort_map = {
        "name": User.name,
        "created_at": User.created_at,
        "last_login": User.last_login,
        "email": User.email,
    }
    sort_col = sort_map.get(sort_by, User.created_at)
    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "users": [u.to_dict() for u in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "per_page": per_page,
        "pages": pagination.pages,
    }


def get_user_by_id(user_id: int) -> dict | None:
    """Return a single user's safe dict, or None."""
    user = db.session.get(User, user_id)
    if not user:
        return None
    return user.to_dict()


def get_user_activity(user_id: int) -> dict | None:
    """Return scan/finding activity for a user."""
    user = db.session.get(User, user_id)
    if not user:
        return None

    scans = (
        Scan.query
        .filter_by(user_id=user_id)
        .order_by(Scan.created_at.desc())
        .all()
    )

    total_findings = (
        db.session.query(func.count(Finding.id))
        .join(Scan, Finding.scan_id == Scan.id)
        .filter(Scan.user_id == user_id)
        .scalar()
    ) or 0

    risk_counts = {}
    for s in scans:
        lvl = s.risk_level or "unknown"
        risk_counts[lvl] = risk_counts.get(lvl, 0) + 1

    return {
        "total_scans": len(scans),
        "total_findings": total_findings,
        "risk_distribution": risk_counts,
        "recent_scans": [s.to_dict() for s in scans[:5]],
    }


def update_user(user_id: int, data: dict, current_admin_id: int) -> tuple[dict | None, str | None]:
    """
    Update name/email/role of a user.
    Returns (user_dict, error_message).
    """
    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found."

    allowed_fields = {"name", "email", "role"}
    for field in allowed_fields:
        if field in data:
            val = str(data[field]).strip()
            if field == "role" and val not in ("user", "admin"):
                return None, "Invalid role value. Must be 'user' or 'admin'."
            setattr(user, field, val)

    user.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return user.to_dict(), None


def set_user_status(user_id: int, is_active: bool, current_admin_id: int) -> tuple[dict | None, str | None]:
    """
    Activate or deactivate a user account.
    Admins cannot deactivate themselves.
    """
    if user_id == current_admin_id:
        return None, "You cannot change the status of your own account."

    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found."

    user.is_active = is_active
    user.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return user.to_dict(), None


def delete_user(user_id: int, current_admin_id: int) -> tuple[bool, str | None]:
    """
    Delete a user account.
    Admins cannot delete themselves.
    """
    if user_id == current_admin_id:
        return False, "You cannot delete your own account."

    user = db.session.get(User, user_id)
    if not user:
        return False, "User not found."

    db.session.delete(user)
    db.session.commit()
    return True, None


# ── Scans (all users) ─────────────────────────────────────────────────────────

def list_all_scans(user_id=None, risk_level=None, date_from=None, date_to=None, page=1, per_page=20):
    """Return paginated scans across all users with optional filters."""
    query = Scan.query

    if user_id:
        query = query.filter_by(user_id=user_id)

    if risk_level:
        query = query.filter_by(risk_level=risk_level)

    if date_from:
        query = query.filter(Scan.created_at >= date_from)

    if date_to:
        query = query.filter(Scan.created_at <= date_to)

    query = query.order_by(Scan.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    scans = []
    for s in pagination.items:
        d = s.to_dict()
        # Enrich with user name/email for the admin view
        owner = db.session.get(User, s.user_id)
        d["user_name"] = owner.name if owner else "Unknown"
        d["user_email"] = owner.email if owner else ""
        scans.append(d)

    return {
        "scans": scans,
        "total": pagination.total,
        "page": pagination.page,
        "per_page": per_page,
        "pages": pagination.pages,
    }


# ── Findings (all users) ──────────────────────────────────────────────────────

def list_all_findings(severity=None, user_id=None, page=1, per_page=20):
    """Return paginated findings across all users with optional filters."""
    query = (
        db.session.query(Finding)
        .join(Scan, Finding.scan_id == Scan.id)
    )

    if severity:
        query = query.filter(Finding.severity == severity)

    if user_id:
        query = query.filter(Scan.user_id == user_id)

    query = query.order_by(Finding.id.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    findings = []
    for f in pagination.items:
        d = f.to_dict()
        scan = db.session.get(Scan, f.scan_id)
        if scan:
            d["target"] = scan.target
            d["scan_created_at"] = scan.created_at.isoformat()
            owner = db.session.get(User, scan.user_id)
            d["user_name"] = owner.name if owner else "Unknown"
            d["user_email"] = owner.email if owner else ""
            d["user_id"] = scan.user_id
        findings.append(d)

    return {
        "findings": findings,
        "total": pagination.total,
        "page": pagination.page,
        "per_page": per_page,
        "pages": pagination.pages,
    }
