"""
Smart Notification Engine
==========================
Generates contextual, prioritized alerts from transaction analysis,
goal progress, health score changes, and subscription monitoring.
"""

from fastapi import APIRouter, Request
from datetime import datetime
from ml.anomaly_detector import detect_anomalies
from ml.health_score import compute_health_score

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _generate_notifications(transactions: list, goals: list, health_data: dict) -> list:
    """
    Generate smart notifications based on current financial state.
    Each notification has: id, type, severity, title, body, timestamp, read
    """
    notifications = []
    now = datetime.now().isoformat()

    # 1. Anomaly alerts
    anomalies = detect_anomalies(transactions)
    for i, anomaly in enumerate(anomalies[:3]):  # Top 3
        t = anomaly.get("transaction", {})
        notifications.append({
            "id": f"anomaly-{i}",
            "type": "anomaly_alert",
            "severity": anomaly.get("severity", "warning"),
            "title": f"Unusual {t.get('category', 'spending')} detected",
            "body": anomaly.get("explanation", f"₹{t.get('amount', 0):,.0f} at {t.get('vendor', 'Unknown')}"),
            "icon": "🚨",
            "timestamp": now,
            "read": False
        })

    # 2. Subscription warnings
    unused_subs = [t for t in transactions
                   if (t.get("category") == "subscription" or t.get("isSubscription"))
                   and t.get("status") == "unused"]
    # Deduplicate by vendor
    seen_vendors = set()
    unique_unused = []
    for s in unused_subs:
        v = s.get("vendor", "")
        if v not in seen_vendors:
            seen_vendors.add(v)
            unique_unused.append(s)

    if unique_unused:
        total_waste = sum(s.get("amount", 0) for s in unique_unused)
        notifications.append({
            "id": "sub-waste",
            "type": "subscription_warning",
            "severity": "warning",
            "title": f"{len(unique_unused)} unused subscriptions",
            "body": f"You're wasting ₹{total_waste:,.0f}/month on subscriptions you don't use. Consider cancelling {', '.join(s.get('vendor', '') for s in unique_unused[:3])}.",
            "icon": "📺",
            "timestamp": now,
            "read": False
        })

    # 3. Health score alerts
    score = health_data.get("score", 500)
    trend = health_data.get("trend", "stable")

    if score < 500:
        notifications.append({
            "id": "health-low",
            "type": "score_change",
            "severity": "alert",
            "title": "Financial Health Score is low",
            "body": f"Your FHS is {score}/850 (Grade {health_data.get('grade', 'C')}). Focus on reducing discretionary spending and building your emergency fund.",
            "icon": "📉",
            "timestamp": now,
            "read": False
        })
    elif trend == "declining":
        notifications.append({
            "id": "health-declining",
            "type": "score_change",
            "severity": "warning",
            "title": "Spending trend is worsening",
            "body": "Your weekly spending is on an upward trajectory. Consider reviewing recent purchases.",
            "icon": "📊",
            "timestamp": now,
            "read": False
        })

    # 4. Goal milestones
    for goal in goals:
        progress = goal.get("progress", 0)
        status = goal.get("status", "on_track")
        title = goal.get("title", "Goal")

        if progress >= 100:
            notifications.append({
                "id": f"goal-done-{goal.get('id', '')}",
                "type": "goal_milestone",
                "severity": "success",
                "title": f"🎉 Goal achieved: {title}!",
                "body": f"You've reached your target of ₹{goal.get('target', 0):,.0f}. Amazing discipline!",
                "icon": "🏆",
                "timestamp": now,
                "read": False
            })
        elif progress >= 75:
            notifications.append({
                "id": f"goal-75-{goal.get('id', '')}",
                "type": "goal_milestone",
                "severity": "info",
                "title": f"Almost there: {title}",
                "body": f"You're {progress:.0f}% towards your goal. Only ₹{goal.get('remaining_amount', 0):,.0f} to go!",
                "icon": "🔥",
                "timestamp": now,
                "read": False
            })
        elif status == "behind":
            notifications.append({
                "id": f"goal-behind-{goal.get('id', '')}",
                "type": "goal_milestone",
                "severity": "warning",
                "title": f"Falling behind on: {title}",
                "body": f"You need ₹{goal.get('required_monthly', 0):,.0f}/month to stay on track. {goal.get('days_remaining', 0)} days remaining.",
                "icon": "⚠️",
                "timestamp": now,
                "read": False
            })

    # 5. Savings tips (always include one)
    savings_rate = health_data.get("metrics", {}).get("savings_rate", 0)
    if savings_rate < 20:
        notifications.append({
            "id": "tip-savings",
            "type": "savings_tip",
            "severity": "info",
            "title": "💡 Savings tip",
            "body": f"Your savings rate is {savings_rate}%. The recommended minimum is 20%. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
            "icon": "💡",
            "timestamp": now,
            "read": False
        })
    else:
        notifications.append({
            "id": "tip-invest",
            "type": "savings_tip",
            "severity": "info",
            "title": "💡 Investment tip",
            "body": f"Great {savings_rate}% savings rate! Consider putting surplus into index funds for 12-15% annual returns.",
            "icon": "💡",
            "timestamp": now,
            "read": False
        })

    # Sort by severity
    severity_order = {"critical": 0, "alert": 1, "warning": 2, "success": 3, "info": 4}
    notifications.sort(key=lambda n: severity_order.get(n["severity"], 5))

    return notifications


@router.post("/")
async def get_notifications(request: Request):
    """
    Generate smart notifications based on current financial data.
    Accepts transactions, goals, and health data to compute alerts.
    """
    data = await request.json()
    transactions = data.get("transactions", [])
    goals = data.get("goals", [])
    health_data = data.get("health_data", {})

    # If health data not provided, compute it
    if not health_data and transactions:
        health_data = compute_health_score(
            transactions,
            data.get("current_savings", 10000),
            data.get("monthly_income", 5000)
        )

    notifications = _generate_notifications(transactions, goals, health_data)

    return {
        "notifications": notifications,
        "unread_count": len([n for n in notifications if not n["read"]]),
        "has_critical": any(n["severity"] in ("critical", "alert") for n in notifications)
    }
