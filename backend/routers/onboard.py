from fastapi import APIRouter, Request
from ml.health_score import compute_health_score
from ml.persona_classifier import classify_persona

router = APIRouter(prefix="/api/onboard", tags=["onboard"])


@router.post("/")
async def onboard_user(request: Request):
    """
    Accept user financial profile and return initial analysis.
    This is the entry point for new users.
    """
    data = await request.json()

    name = data.get("name", "User")
    monthly_income = data.get("monthly_income", 5000)
    current_savings = data.get("current_savings", 10000)
    city = data.get("city", "Mumbai")
    spending_style = data.get("spending_style", "moderate")  # frugal, moderate, lavish

    # City cost-of-living multipliers (base = Mumbai at 1.0)
    city_multipliers = {
        "Mumbai": 1.0,
        "Delhi": 0.90,
        "Bangalore": 0.95,
        "Hyderabad": 0.80,
        "Chennai": 0.82,
        "Pune": 0.85,
        "Kolkata": 0.75,
        "Ahmedabad": 0.70,
        "Other": 0.80
    }

    style_multipliers = {
        "frugal": 0.5,
        "moderate": 0.65,
        "lavish": 0.85
    }

    cost_mult = city_multipliers.get(city, 0.80)
    style_mult = style_multipliers.get(spending_style, 0.65)

    # Estimated monthly spend
    estimated_spend = monthly_income * style_mult * cost_mult

    profile = {
        "name": name,
        "monthly_income": monthly_income,
        "current_savings": current_savings,
        "city": city,
        "spending_style": spending_style,
        "estimated_monthly_spend": round(estimated_spend, 2),
        "cost_of_living_multiplier": cost_mult
    }

    # Quick health score estimate (without transactions)
    estimated_savings_rate = max(0, (monthly_income - estimated_spend) / monthly_income)
    months_covered = current_savings / estimated_spend if estimated_spend > 0 else 0

    initial_assessment = {
        "estimated_savings_rate": round(estimated_savings_rate * 100, 1),
        "estimated_months_covered": round(months_covered, 1),
        "initial_tips": []
    }

    if estimated_savings_rate < 0.20:
        initial_assessment["initial_tips"].append(
            "Your estimated savings rate is below 20%. Consider tracking daily expenses."
        )
    if months_covered < 3:
        initial_assessment["initial_tips"].append(
            f"Your emergency fund covers only {months_covered:.1f} months. Aim for 6 months."
        )
    if spending_style == "lavish":
        initial_assessment["initial_tips"].append(
            "Your spending style is lavish. Small daily reductions compound significantly."
        )

    return {
        "status": "onboarded",
        "profile": profile,
        "initial_assessment": initial_assessment
    }
