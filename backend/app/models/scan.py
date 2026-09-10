from app import db
from datetime import datetime, timezone


class Scan(db.Model):
    __tablename__ = "scans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    target = db.Column(db.String(2048), nullable=False)
    score = db.Column(db.Integer, nullable=True)
    risk_level = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="completed")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    findings = db.relationship("Finding", backref="scan", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_findings=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "target": self.target,
            "score": self.score,
            "risk_level": self.risk_level,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "findings_count": len(self.findings),
        }
        if include_findings:
            data["findings"] = [f.to_dict() for f in self.findings]
        return data
