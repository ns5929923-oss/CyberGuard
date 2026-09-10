from app import db


class Finding(db.Model):
    __tablename__ = "findings"

    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey("scans.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=True)
    severity = db.Column(db.String(20), nullable=False)
    recommendation = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="open")

    def to_dict(self):
        return {
            "id": self.id,
            "scan_id": self.scan_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "severity": self.severity,
            "recommendation": self.recommendation,
            "status": self.status,
        }
