"""
Financial Health Score (FHS) Engine
====================================
Novel Contribution: Multi-dimensional composite scoring with temporal trend decay.
Unlike static budget-ratio scores (Mint, CRED), FHS penalizes *worsening trajectories*
more heavily than static overspending via an exponentially-weighted moving average
of weekly spend slopes.

Factors (7):
  1. Savings Rate          (0.20) — income minus expenditure ratio
  2. Emergency Fund        (0.15) — months of expenses covered by savings  
  3. Subscription Bloat    (0.10) — unused subscription ratio penalty
  4. Spending Consistency   (0.10) — coefficient of variation per category
  5. Category Diversity     (0.10) — Shannon entropy of spending distribution
  6. Anomaly Impact        (0.15) — proportion of spend in statistical outliers
  7. Trend Direction       (0.20) — EWMA slope of weekly spend (novel)

Score range: 300–850 (credit-score inspired scale)
"""

import numpy as np
import math
from collections import defaultdict
from datetime import datetime, timedelta


def _parse_date(date_str: str) -> datetime:
    """Parse ISO date string to datetime, handling multiple formats."""
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return datetime.now()


def _savings_rate_factor(transactions: list, monthly_income: float) -> float:
    """Factor 1: What fraction of income is saved."""
    total_spend = sum(t.get("amount", 0) for t in transactions if t.get("amount", 0) > 0)
    # Normalize to per-month if we have multi-month data
    dates = [_parse_date(t.get("date", "")) for t in transactions]
    if dates:
        span_days = max((max(dates) - min(dates)).days, 1)
        months = max(span_days / 30.0, 1.0)
        avg_monthly_spend = total_spend / months
    else:
        avg_monthly_spend = total_spend

    rate = max(0, (monthly_income - avg_monthly_spend) / monthly_income) if monthly_income > 0 else 0
    return min(rate, 1.0)


def _emergency_fund_factor(current_savings: float, transactions: list) -> float:
    """Factor 2: How many months of expenses the savings cover (capped at 6)."""
    amounts = [t.get("amount", 0) for t in transactions if t.get("amount", 0) > 0]
    if not amounts:
        return 1.0

    dates = [_parse_date(t.get("date", "")) for t in transactions]
    span_days = max((max(dates) - min(dates)).days, 1) if dates else 30
    months = max(span_days / 30.0, 1.0)
    monthly_expenses = sum(amounts) / months

    if monthly_expenses <= 0:
        return 1.0

    months_covered = current_savings / monthly_expenses
    return min(months_covered / 6.0, 1.0)


def _subscription_bloat_factor(transactions: list) -> float:
    """Factor 3: Ratio of actively-used subscriptions to total."""
    subs = [t for t in transactions if t.get("category") == "subscription" or t.get("isSubscription")]
    if not subs:
        return 1.0  # No subscriptions = no bloat

    # Deduplicate by vendor to avoid counting monthly recurrences
    vendors = {}
    for s in subs:
        vendor = s.get("vendor", "unknown")
        if vendor not in vendors:
            vendors[vendor] = s.get("status", "active")

    unused = sum(1 for status in vendors.values() if status == "unused")
    total = len(vendors)
    return 1.0 - (unused / total) if total > 0 else 1.0


def _spending_consistency_factor(transactions: list) -> float:
    """Factor 4: Low coefficient of variation = consistent spending = good."""
    # Group by category and compute CoV per category
    by_category = defaultdict(list)
    for t in transactions:
        amt = t.get("amount", 0)
        if amt > 0:
            cat = t.get("category", "other")
            by_category[cat].append(amt)

    if not by_category:
        return 1.0

    covs = []
    for cat, amounts in by_category.items():
        if len(amounts) >= 3:
            mean = np.mean(amounts)
            std = np.std(amounts)
            if mean > 0:
                covs.append(std / mean)

    if not covs:
        return 1.0

    avg_cov = np.mean(covs)
    return max(0, 1.0 - min(avg_cov, 1.0))


def _category_diversity_factor(transactions: list) -> float:
    """
    Factor 5: Shannon entropy of spending distribution.
    Higher diversity = more balanced spending = healthier.
    Normalized to [0, 1] by dividing by max possible entropy.
    """
    by_category = defaultdict(float)
    for t in transactions:
        amt = t.get("amount", 0)
        if amt > 0:
            cat = t.get("category", "other")
            by_category[cat] += amt

    if len(by_category) <= 1:
        return 0.5  # Single category = neutral

    total = sum(by_category.values())
    if total <= 0:
        return 0.5

    # Shannon entropy
    entropy = 0
    for amount in by_category.values():
        p = amount / total
        if p > 0:
            entropy -= p * math.log2(p)

    max_entropy = math.log2(len(by_category))
    return entropy / max_entropy if max_entropy > 0 else 0.5


def _anomaly_impact_factor(transactions: list) -> float:
    """
    Factor 6: What fraction of total spend is in anomalous transactions.
    Uses modified z-score (median-based) for robustness.
    """
    amounts = [t.get("amount", 0) for t in transactions if t.get("amount", 0) > 0]
    if len(amounts) < 5:
        return 1.0  # Not enough data

    median = np.median(amounts)
    mad = np.median(np.abs(np.array(amounts) - median))
    if mad == 0:
        return 1.0

    total_spend = sum(amounts)
    anomaly_spend = 0
    for amt in amounts:
        modified_z = 0.6745 * (amt - median) / mad
        if abs(modified_z) > 2.5:
            anomaly_spend += amt

    return max(0, 1.0 - (anomaly_spend / total_spend)) if total_spend > 0 else 1.0


def _trend_direction_factor(transactions: list) -> float:
    """
    Factor 7 (NOVEL): Exponentially-weighted moving average of weekly spending.
    A downward trend (spending decreasing) scores high.
    An upward trend (spending increasing) scores low.
    Uses EWMA with span=4 weeks for smoothing.
    """
    if not transactions:
        return 0.5

    # Aggregate spending by week
    weekly_spend = defaultdict(float)
    for t in transactions:
        date = _parse_date(t.get("date", ""))
        # ISO week number as key
        week_key = date.isocalendar()[1] + date.year * 100
        amt = t.get("amount", 0)
        if amt > 0:
            weekly_spend[week_key] += amt

    if len(weekly_spend) < 3:
        return 0.5  # Not enough weeks for trend

    # Sort by week and get values
    sorted_weeks = sorted(weekly_spend.keys())
    values = [weekly_spend[w] for w in sorted_weeks]

    # EWMA with span=4
    alpha = 2 / (4 + 1)  # span=4
    ewma = [values[0]]
    for v in values[1:]:
        ewma.append(alpha * v + (1 - alpha) * ewma[-1])

    # Compute slope of EWMA (normalized)
    if len(ewma) >= 2:
        # Linear regression slope on EWMA values
        x = np.arange(len(ewma))
        slope = np.polyfit(x, ewma, 1)[0]

        # Normalize: negative slope (decreasing spend) = good
        mean_spend = np.mean(values)
        if mean_spend > 0:
            normalized_slope = slope / mean_spend  # dimensionless
            # Map: -0.2 or less → 1.0, +0.2 or more → 0.0
            trend_score = max(0, min(1, 0.5 - normalized_slope * 2.5))
            return trend_score

    return 0.5


def compute_health_score(transactions: list, current_savings: float, monthly_income: float) -> dict:
    """
    Computes the multi-dimensional Financial Health Score (FHS).

    Args:
        transactions: List of transaction dicts with amount, category, date, vendor, status
        current_savings: Current savings balance
        monthly_income: Monthly income

    Returns:
        Dict with score (300-850), grade, per-factor breakdown, and metadata
    """
    if not transactions or monthly_income <= 0:
        return {
            "score": 500,
            "grade": "C",
            "factors": {},
            "metrics": {"savings_rate": 0, "bloat_index": 1.0, "months_covered": 0},
            "trend": "stable"
        }

    # Compute all 7 factors
    factors = {
        "savings_rate": {
            "value": round(_savings_rate_factor(transactions, monthly_income), 3),
            "weight": 0.20,
            "label": "Savings Rate",
            "description": "Fraction of income saved after expenses"
        },
        "emergency_fund": {
            "value": round(_emergency_fund_factor(current_savings, transactions), 3),
            "weight": 0.15,
            "label": "Emergency Fund",
            "description": "Months of expenses covered by savings"
        },
        "subscription_bloat": {
            "value": round(_subscription_bloat_factor(transactions), 3),
            "weight": 0.10,
            "label": "Subscription Health",
            "description": "Ratio of actively-used subscriptions"
        },
        "spending_consistency": {
            "value": round(_spending_consistency_factor(transactions), 3),
            "weight": 0.10,
            "label": "Spending Consistency",
            "description": "How stable your category spending is"
        },
        "category_diversity": {
            "value": round(_category_diversity_factor(transactions), 3),
            "weight": 0.10,
            "label": "Category Diversity",
            "description": "Shannon entropy of spending distribution"
        },
        "anomaly_impact": {
            "value": round(_anomaly_impact_factor(transactions), 3),
            "weight": 0.15,
            "label": "Anomaly Impact",
            "description": "How much outlier transactions affect your total"
        },
        "trend_direction": {
            "value": round(_trend_direction_factor(transactions), 3),
            "weight": 0.20,
            "label": "Spending Trend",
            "description": "EWMA slope of weekly spending trajectory"
        }
    }

    # Weighted sum
    raw_score = sum(f["value"] * f["weight"] for f in factors.values())

    # Scale to 300-850
    final_score = int(300 + (raw_score * 550))
    final_score = max(300, min(850, final_score))

    # Grade mapping
    if final_score >= 780:
        grade = "A+"
    elif final_score >= 720:
        grade = "A"
    elif final_score >= 660:
        grade = "B+"
    elif final_score >= 600:
        grade = "B"
    elif final_score >= 540:
        grade = "C+"
    elif final_score >= 480:
        grade = "C"
    elif final_score >= 420:
        grade = "D"
    else:
        grade = "F"

    # Determine trend
    trend_val = factors["trend_direction"]["value"]
    if trend_val > 0.6:
        trend = "improving"
    elif trend_val < 0.4:
        trend = "declining"
    else:
        trend = "stable"

    # Legacy metrics for backward compatibility
    savings_rate_pct = round(factors["savings_rate"]["value"] * 100, 1)
    bloat_val = round(factors["subscription_bloat"]["value"], 2)

    amounts = [t.get("amount", 0) for t in transactions if t.get("amount", 0) > 0]
    dates = [_parse_date(t.get("date", "")) for t in transactions]
    span_days = max((max(dates) - min(dates)).days, 1) if dates else 30
    months = max(span_days / 30.0, 1.0)
    monthly_expenses = sum(amounts) / months if amounts else 1000
    months_covered = round(current_savings / monthly_expenses, 1) if monthly_expenses > 0 else 0

    return {
        "score": final_score,
        "grade": grade,
        "trend": trend,
        "factors": factors,
        "metrics": {
            "savings_rate": savings_rate_pct,
            "bloat_index": bloat_val,
            "months_covered": months_covered
        }
    }
