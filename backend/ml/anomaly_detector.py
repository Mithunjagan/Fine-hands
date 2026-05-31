"""
Anomaly Detection Engine
=========================
Category-aware Modified Z-Score with IQR fallback.

Unlike naive global z-score, this engine:
  1. Groups transactions by category before computing statistics
  2. Uses Modified Z-Score (median + MAD based) for robustness against outliers
  3. Falls back to IQR method when category has < 10 samples
  4. Returns severity levels: warning (2σ), alert (2.5σ), critical (3σ+)
  5. Generates human-readable explanations

Reference: Boris Iglewicz and David Hoaglin, "Volume 16: How to Detect and Handle Outliers"
"""

import numpy as np
from collections import defaultdict
from datetime import datetime


def _modified_z_score(value: float, median: float, mad: float) -> float:
    """
    Modified Z-Score using Median Absolute Deviation.
    More robust than standard z-score against outlier contamination.
    The 0.6745 constant is the 0.75th quartile of the standard normal distribution.
    """
    if mad == 0:
        return 0.0
    return 0.6745 * (value - median) / mad


def _iqr_outlier_check(value: float, q1: float, q3: float) -> tuple[bool, float]:
    """
    IQR-based outlier detection for small samples (< 10).
    Returns (is_outlier, severity_multiplier).
    """
    iqr = q3 - q1
    if iqr == 0:
        return False, 0.0

    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    if value > upper_bound:
        # How many IQRs above Q3
        severity = (value - q3) / iqr
        return True, severity
    elif value < lower_bound:
        severity = (q1 - value) / iqr
        return True, severity

    return False, 0.0


def _get_severity(z_score: float) -> str:
    """Map z-score magnitude to severity level."""
    abs_z = abs(z_score)
    if abs_z >= 3.0:
        return "critical"
    elif abs_z >= 2.5:
        return "alert"
    elif abs_z >= 2.0:
        return "warning"
    return "normal"


def _generate_explanation(transaction: dict, z_score: float, category_mean: float, is_spike: bool) -> str:
    """Generate a human-readable explanation for the anomaly."""
    vendor = transaction.get("vendor", "Unknown")
    amount = transaction.get("amount", 0)
    category = transaction.get("category", "other")

    if is_spike:
        return (
            f"This ₹{amount:,.0f} {vendor} purchase is {abs(z_score):.1f}σ above "
            f"your average {category} spend of ₹{category_mean:,.0f}. "
            f"This is {amount / category_mean:.1f}x your typical transaction in this category."
        )
    else:
        return (
            f"This ₹{amount:,.0f} at {vendor} is unusually low for {category} "
            f"(avg: ₹{category_mean:,.0f}). Could indicate a partial payment or error."
        )


def detect_anomalies(transactions: list, threshold: float = 2.0) -> list:
    """
    Detect anomalous transactions using category-aware statistical methods.

    Args:
        transactions: List of transaction dicts
        threshold: Z-score threshold for flagging (default 2.0 for broader coverage)

    Returns:
        List of anomaly dicts sorted by severity (most severe first)
    """
    if not transactions:
        return []

    # Group transactions by category
    by_category: dict[str, list] = defaultdict(list)
    for t in transactions:
        amt = t.get("amount", 0)
        if amt > 0:
            cat = t.get("category", "other")
            by_category[cat].append(t)

    anomalies = []

    for category, cat_transactions in by_category.items():
        amounts = [t.get("amount", 0) for t in cat_transactions]

        if len(amounts) < 3:
            continue  # Skip categories with too few transactions

        amounts_arr = np.array(amounts)
        median = np.median(amounts_arr)
        mean = np.mean(amounts_arr)
        mad = np.median(np.abs(amounts_arr - median))

        for t in cat_transactions:
            amt = t.get("amount", 0)

            if len(amounts) >= 10:
                # Use Modified Z-Score for larger samples
                z = _modified_z_score(amt, median, mad)
                is_anomaly = abs(z) > threshold
            else:
                # Use IQR method for small samples
                q1 = np.percentile(amounts_arr, 25)
                q3 = np.percentile(amounts_arr, 75)
                is_anomaly, iqr_severity = _iqr_outlier_check(amt, q1, q3)
                # Map IQR severity to approximate z-score
                z = iqr_severity * 1.5 if is_anomaly else 0.0
                if amt < median:
                    z = -z

            if is_anomaly and abs(z) > threshold:
                severity = _get_severity(z)
                is_spike = amt > median

                anomalies.append({
                    "transaction": t,
                    "z_score": round(abs(z), 2),
                    "sigma": round(abs(z), 1),
                    "severity": severity,
                    "is_spike": is_spike,
                    "category": category,
                    "category_mean": round(mean, 2),
                    "category_median": round(median, 2),
                    "explanation": _generate_explanation(t, z, mean, is_spike)
                })

    # Sort by severity (critical first) then by z_score magnitude
    severity_order = {"critical": 0, "alert": 1, "warning": 2}
    anomalies.sort(key=lambda a: (severity_order.get(a["severity"], 3), -a["z_score"]))

    return anomalies


def get_anomaly_summary(transactions: list) -> dict:
    """
    Returns a summary of anomaly detection results for the notification engine.
    """
    anomalies = detect_anomalies(transactions)

    critical_count = sum(1 for a in anomalies if a["severity"] == "critical")
    alert_count = sum(1 for a in anomalies if a["severity"] == "alert")
    warning_count = sum(1 for a in anomalies if a["severity"] == "warning")
    total_anomaly_amount = sum(a["transaction"].get("amount", 0) for a in anomalies)

    return {
        "total_anomalies": len(anomalies),
        "critical": critical_count,
        "alerts": alert_count,
        "warnings": warning_count,
        "total_anomaly_amount": round(total_anomaly_amount, 2),
        "top_anomalies": anomalies[:5]  # Top 5 most severe
    }
