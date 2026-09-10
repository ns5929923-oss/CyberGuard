"""
Risk engine — calculates a security score and risk level from scan findings.

Scoring logic:
  Start at 100 points.
  Deductions per finding:
    critical      → -30
    high          → -20
    medium        → -10
    low           → -5
    informational → 0

Score is clamped to a minimum of 0.

Risk levels:
  80-100 → LOW
  60-79  → MODERATE
  40-59  → HIGH
  0-39   → CRITICAL
"""

DEDUCTIONS = {
    "critical": 30,
    "high": 20,
    "medium": 10,
    "low": 5,
    "informational": 0,
    # Tolerate the scanner's legacy "info" label
    "info": 0,
}

RISK_LEVELS = [
    (80, "LOW"),
    (60, "MODERATE"),
    (40, "HIGH"),
    (0, "CRITICAL"),
]


def calculate_risk(findings: list) -> dict:
    """
    Calculate score, risk_level, and severity_counts from a list of finding dicts.

    Each finding dict must contain a 'severity' key.

    Returns:
        {
          "score":           int   (0-100),
          "risk_level":      str,
          "severity_counts": dict  (severity → count),
        }
    """
    severity_counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "informational": 0,
    }

    score = 100
    for finding in findings:
        sev = (finding.get("severity") or "").lower()
        # Normalise legacy "info" → "informational"
        if sev == "info":
            sev = "informational"

        if sev in severity_counts:
            severity_counts[sev] += 1

        deduction = DEDUCTIONS.get(sev, 0)
        score -= deduction

    score = max(0, score)

    risk_level = "CRITICAL"
    for threshold, level in RISK_LEVELS:
        if score >= threshold:
            risk_level = level
            break

    return {
        "score": score,
        "risk_level": risk_level,
        "severity_counts": severity_counts,
    }
