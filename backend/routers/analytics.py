from fastapi import APIRouter, Request
from ml.health_score import compute_health_score
from ml.anomaly_detector import detect_anomalies, get_anomaly_summary
from ml.persona_classifier import classify_persona
from ml.monte_carlo import monte_carlo_savings
from services.cache import get_cached, set_cache, cache_key
from collections import defaultdict
from datetime import datetime

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/health-score")
async def get_health_score(request: Request):
    """Compute the multi-dimensional Financial Health Score."""
    data = await request.json()
    transactions = data.get("transactions", [])
    current_savings = data.get("current_savings", 10000)
    monthly_income = data.get("monthly_income", 5000)

    # Check cache
    ck = cache_key("health_score", len(transactions), current_savings, monthly_income)
    cached = get_cached(ck, max_age_seconds=120)
    if cached:
        return cached

    score = compute_health_score(transactions, current_savings, monthly_income)
    set_cache(ck, score)
    return score


@router.post("/anomalies")
async def get_anomalies(request: Request):
    """Detect anomalous transactions using category-aware z-score analysis."""
    data = await request.json()
    transactions = data.get("transactions", [])
    threshold = data.get("threshold", 2.0)

    anomalies = detect_anomalies(transactions, threshold)
    return {"anomalies": anomalies, "total": len(anomalies)}


@router.post("/anomaly-summary")
async def get_anomaly_summary_endpoint(request: Request):
    """Get a high-level summary of anomaly detection results."""
    data = await request.json()
    transactions = data.get("transactions", [])
    return get_anomaly_summary(transactions)


@router.post("/persona")
async def get_persona(request: Request):
    """Classify the user's spending persona using k-means hybrid clustering."""
    data = await request.json()
    transactions = data.get("transactions", [])
    monthly_income = data.get("monthly_income", 5000)

    # Check cache
    ck = cache_key("persona", len(transactions), monthly_income)
    cached = get_cached(ck, max_age_seconds=300)
    if cached:
        return cached

    persona = classify_persona(transactions, monthly_income)
    set_cache(ck, persona)
    return persona


@router.post("/simulate")
async def simulate_savings(request: Request):
    """Run Monte Carlo savings simulation with probabilistic bands."""
    data = await request.json()
    current_savings = data.get("current_savings", 10000)
    monthly_rate = data.get("monthly_savings_rate", 1000)
    expense = data.get("expense", 0)
    months = data.get("months", 6)
    goal_target = data.get("goal_target", 0)
    planned_expenses = data.get("planned_expenses", [])

    result = monte_carlo_savings(
        current_savings=current_savings,
        monthly_savings_rate=monthly_rate,
        expense=expense,
        months=months,
        goal_target=goal_target,
        planned_expenses=planned_expenses
    )
    return result


@router.post("/heatmap-data")
async def get_heatmap_data(request: Request):
    """
    Aggregate daily spending for calendar heatmap visualization.
    Returns array of {date, total, count, categories} for each day with transactions.
    """
    data = await request.json()
    transactions = data.get("transactions", [])

    daily = defaultdict(lambda: {"total": 0, "count": 0, "categories": defaultdict(float)})

    for t in transactions:
        amt = t.get("amount", 0)
        if amt > 0:
            date_str = t.get("date", "")
            try:
                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                day_key = dt.strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                continue

            daily[day_key]["total"] += amt
            daily[day_key]["count"] += 1
            cat = t.get("category", "other")
            daily[day_key]["categories"][cat] += amt

    result = []
    for date, info in sorted(daily.items()):
        result.append({
            "date": date,
            "total": round(info["total"], 2),
            "count": info["count"],
            "topCategory": max(info["categories"], key=info["categories"].get) if info["categories"] else "none"
        })

    return {"days": result}


@router.post("/net-worth")
async def get_net_worth(request: Request):
    """
    Compute net worth with trend analysis.
    Net Worth = Assets (savings + investments) - Liabilities
    """
    data = await request.json()
    current_savings = data.get("current_savings", 10000)
    investments = data.get("investments", 0)
    liabilities = data.get("liabilities", 0)
    transactions = data.get("transactions", [])
    monthly_income = data.get("monthly_income", 5000)

    net_worth = current_savings + investments - liabilities

    # Simulate 6-month historical net worth trend
    # (In production this would come from stored snapshots)
    amounts = [t.get("amount", 0) for t in transactions if t.get("amount", 0) > 0]
    avg_monthly_spend = sum(amounts) / 6 if amounts else 3000
    monthly_savings = monthly_income - avg_monthly_spend

    history = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    now = datetime.now()

    for i in range(5, -1, -1):
        month_idx = (now.month - 1 - i) % 12
        past_nw = net_worth - (monthly_savings * i)
        history.append({
            "month": month_names[month_idx],
            "value": round(max(0, past_nw), 2)
        })

    # Month-over-month change
    if len(history) >= 2:
        prev = history[-2]["value"]
        curr = history[-1]["value"]
        mom_change = round(curr - prev, 2)
        mom_pct = round((mom_change / prev) * 100, 1) if prev > 0 else 0
    else:
        mom_change = 0
        mom_pct = 0

    return {
        "net_worth": round(net_worth, 2),
        "breakdown": {
            "savings": round(current_savings, 2),
            "investments": round(investments, 2),
            "liabilities": round(liabilities, 2)
        },
        "trend": history,
        "month_over_month": {
            "change": mom_change,
            "percentage": mom_pct,
            "direction": "up" if mom_change > 0 else "down" if mom_change < 0 else "flat"
        }
    }
