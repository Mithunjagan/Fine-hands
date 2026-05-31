from fastapi import APIRouter, Request
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/goals", tags=["goals"])

# In-memory goal store with pre-seeded demo data
_goal_store: list = [
    {
        "id": "g1",
        "title": "Emergency Fund",
        "target": 50000,
        "current": 32500,
        "deadline": "2026-12-31",
        "icon": "🛡️",
        "color": "#10B981",
        "created_at": "2026-01-15"
    },
    {
        "id": "g2",
        "title": "Japan Trip",
        "target": 120000,
        "current": 28000,
        "deadline": "2027-04-01",
        "icon": "✈️",
        "color": "#3B82F6",
        "created_at": "2026-03-01"
    },
    {
        "id": "g3",
        "title": "New Laptop",
        "target": 80000,
        "current": 45000,
        "deadline": "2026-09-15",
        "icon": "💻",
        "color": "#8B5CF6",
        "created_at": "2026-02-10"
    }
]

_next_id = 4


def _enrich_goal(goal: dict) -> dict:
    """Add computed fields to a goal with smart feasibility metrics."""
    target = goal.get("target", 1)
    current = goal.get("current", 0)
    deadline_str = goal.get("deadline", "")

    # Progress percentage
    progress = round((current / target) * 100, 1) if target > 0 else 0

    # Days remaining
    try:
        # Handle cases where deadline contains ISO timestamps (YYYY-MM-DDTHH:MM:SS...)
        if "T" in deadline_str:
            deadline_str_parsed = deadline_str.split("T")[0]
        else:
            deadline_str_parsed = deadline_str
        deadline = datetime.strptime(deadline_str_parsed.strip(), "%Y-%m-%d")
        days_remaining = max(0, (deadline - datetime.now()).days)
    except (ValueError, TypeError):
        days_remaining = 0

    # Amount remaining
    remaining = max(0, target - current)

    # Required monthly savings to hit goal
    months_remaining = max(1, days_remaining / 30)
    required_monthly = round(remaining / months_remaining, 2)

    # On-track status
    if progress >= 100:
        status = "completed"
    elif days_remaining <= 0:
        status = "overdue"
    elif required_monthly <= 0:
        status = "completed"
    else:
        # Simple linear projection check
        created_str = goal.get("created_at", deadline_str)
        try:
            if "T" in created_str:
                created_str_parsed = created_str.split("T")[0]
            else:
                created_str_parsed = created_str
            created = datetime.strptime(created_str_parsed.strip(), "%Y-%m-%d")
            total_days = max(1, (deadline - created).days)
            elapsed_days = max(1, (datetime.now() - created).days)
            expected_progress = (elapsed_days / total_days) * 100
            status = "on_track" if progress >= expected_progress * 0.85 else "behind"
        except (ValueError, TypeError):
            status = "on_track"

    # Smart Feasibility & Reschedule Engine
    # Assume a standard baseline monthly savings ability of ₹15,000 for realistic projections
    baseline_savings_rate = 15000.0
    suggested_months = max(3, int(remaining / baseline_savings_rate))
    
    # Marked not feasible if required monthly savings are extremely high (> ₹20,000/mo) or goal is overdue
    is_feasible = True
    if days_remaining <= 0 or required_monthly > 20000.0:
        is_feasible = False

    return {
        **goal,
        "progress": progress,
        "days_remaining": days_remaining,
        "remaining_amount": remaining,
        "required_monthly": required_monthly,
        "status": status,
        "is_feasible": is_feasible,
        "suggested_months": suggested_months
    }


@router.get("/")
async def get_goals():
    """List all goals with computed status fields."""
    enriched = [_enrich_goal(g) for g in _goal_store]
    return {"goals": enriched}


@router.post("/")
async def create_goal(request: Request):
    """Create a new financial goal."""
    global _next_id
    data = await request.json()

    goal = {
        "id": f"g{_next_id}",
        "title": data.get("title", "New Goal"),
        "target": data.get("target", 10000),
        "current": data.get("current", 0),
        "deadline": data.get("deadline", (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d")),
        "icon": data.get("icon", "🎯"),
        "color": data.get("color", "#6366F1"),
        "created_at": datetime.now().strftime("%Y-%m-%d")
    }

    _next_id += 1
    _goal_store.append(goal)
    return {"status": "created", "goal": _enrich_goal(goal)}


@router.put("/{goal_id}")
async def update_goal(goal_id: str, request: Request):
    """Update a goal's progress or details."""
    data = await request.json()

    for i, goal in enumerate(_goal_store):
        if goal["id"] == goal_id:
            # Update provided fields
            if "current" in data:
                _goal_store[i]["current"] = data["current"]
            if "target" in data:
                _goal_store[i]["target"] = data["target"]
            if "title" in data:
                _goal_store[i]["title"] = data["title"]
            if "deadline" in data:
                _goal_store[i]["deadline"] = data["deadline"]

            return {"status": "updated", "goal": _enrich_goal(_goal_store[i])}

    return {"status": "not_found"}


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str):
    """Delete a goal."""
    global _goal_store
    _goal_store = [g for g in _goal_store if g["id"] != goal_id]
    return {"status": "deleted"}
