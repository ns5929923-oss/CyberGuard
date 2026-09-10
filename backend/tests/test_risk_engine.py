"""
Tests for the risk engine: score calculation and risk level assignment.
"""
import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app.services.risk_engine import calculate_risk  # noqa: E402


class TestRiskEngine(unittest.TestCase):

    # ── Score calculation ─────────────────────────────────────────────────────

    def test_no_findings_gives_score_100(self):
        result = calculate_risk([])
        self.assertEqual(result["score"], 100)
        self.assertEqual(result["risk_level"], "LOW")

    def test_single_critical_finding(self):
        result = calculate_risk([{"severity": "critical"}])
        self.assertEqual(result["score"], 70)

    def test_single_high_finding(self):
        result = calculate_risk([{"severity": "high"}])
        self.assertEqual(result["score"], 80)

    def test_single_medium_finding(self):
        result = calculate_risk([{"severity": "medium"}])
        self.assertEqual(result["score"], 90)

    def test_single_low_finding(self):
        result = calculate_risk([{"severity": "low"}])
        self.assertEqual(result["score"], 95)

    def test_informational_finding_no_deduction(self):
        result = calculate_risk([{"severity": "informational"}])
        self.assertEqual(result["score"], 100)

    def test_legacy_info_severity_no_deduction(self):
        result = calculate_risk([{"severity": "info"}])
        self.assertEqual(result["score"], 100)

    def test_score_clamped_at_zero(self):
        # 5 critical findings = -150 points; should clamp at 0
        findings = [{"severity": "critical"}] * 5
        result = calculate_risk(findings)
        self.assertEqual(result["score"], 0)

    def test_mixed_severities(self):
        findings = [
            {"severity": "high"},    # -20
            {"severity": "medium"},  # -10
            {"severity": "low"},     # -5
        ]
        result = calculate_risk(findings)
        self.assertEqual(result["score"], 65)  # 100 - 35

    # ── Risk levels ───────────────────────────────────────────────────────────

    def test_risk_level_low_at_80(self):
        findings = [{"severity": "high"}]  # score=80
        result = calculate_risk(findings)
        self.assertEqual(result["risk_level"], "LOW")

    def test_risk_level_low_at_100(self):
        result = calculate_risk([])
        self.assertEqual(result["risk_level"], "LOW")

    def test_risk_level_moderate(self):
        # score = 100 - 40 = 60
        findings = [{"severity": "high"}, {"severity": "high"}]
        result = calculate_risk(findings)
        self.assertEqual(result["risk_level"], "MODERATE")

    def test_risk_level_high(self):
        # score = 100 - 60 = 40
        findings = [{"severity": "high"}] * 3
        result = calculate_risk(findings)
        self.assertEqual(result["risk_level"], "HIGH")

    def test_risk_level_critical(self):
        # score = 100 - 80 = 20
        findings = [{"severity": "high"}] * 4
        result = calculate_risk(findings)
        self.assertEqual(result["risk_level"], "CRITICAL")

    def test_risk_level_critical_at_zero(self):
        findings = [{"severity": "critical"}] * 5
        result = calculate_risk(findings)
        self.assertEqual(result["risk_level"], "CRITICAL")

    # ── Severity counts ───────────────────────────────────────────────────────

    def test_severity_counts_correct(self):
        findings = [
            {"severity": "critical"},
            {"severity": "high"},
            {"severity": "high"},
            {"severity": "medium"},
            {"severity": "informational"},
        ]
        result = calculate_risk(findings)
        counts = result["severity_counts"]
        self.assertEqual(counts["critical"], 1)
        self.assertEqual(counts["high"], 2)
        self.assertEqual(counts["medium"], 1)
        self.assertEqual(counts["low"], 0)
        self.assertEqual(counts["informational"], 1)

    def test_unknown_severity_ignored(self):
        """Unknown severity strings should not crash and should have no deduction."""
        result = calculate_risk([{"severity": "unknown_level"}])
        self.assertEqual(result["score"], 100)


if __name__ == "__main__":
    unittest.main()
