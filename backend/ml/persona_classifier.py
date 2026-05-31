"""
Spending DNA / Persona Classifier
===================================
Hybrid approach: k-means clustering with rule-based overrides.

Method:
  1. Build a 6-dimensional feature vector from transaction data
  2. Compare against 7 pre-defined cluster centroids (no training data needed)
  3. Classify by minimum Euclidean distance
  4. Apply rule-based overrides for edge cases
  5. Return persona with confidence score, traits, and radar chart data

Feature Vector:
  [dining_ratio, shopping_ratio, savings_rate, sub_density, spending_variance, essentials_ratio]
"""

import numpy as np
from collections import defaultdict


# Pre-defined cluster centroids (reference spending profiles)
# Each centroid represents a persona archetype
CENTROIDS = {
    "The Food Enthusiast": {
        "centroid": [0.40, 0.12, 0.15, 0.3, 0.5, 0.30],
        "icon": "🍔",
        "description": "Over 35% of spending goes to dining and food delivery. Social eating drives your budget.",
        "color": "#F59E0B",
        "advice": "Try meal prepping 3 days a week to cut dining costs by 40%."
    },
    "The Impulse Buyer": {
        "centroid": [0.15, 0.40, 0.10, 0.4, 0.8, 0.25],
        "icon": "💸",
        "description": "High variance retail spending with frequent spikes. Emotional spending patterns detected.",
        "color": "#EF4444",
        "advice": "Implement a 48-hour rule: wait 2 days before any purchase over ₹2,000."
    },
    "The Subscription Hoarder": {
        "centroid": [0.18, 0.15, 0.20, 0.9, 0.3, 0.35],
        "icon": "📺",
        "description": "Multiple recurring charges eating into savings. Many subscriptions show low usage.",
        "color": "#8B5CF6",
        "advice": "Audit subscriptions monthly. Cancel anything unused in the last 30 days."
    },
    "The Disciplined Saver": {
        "centroid": [0.12, 0.10, 0.40, 0.2, 0.2, 0.50],
        "icon": "🏦",
        "description": "Consistent savings with low bloat and controlled spending across categories.",
        "color": "#10B981",
        "advice": "You're doing great! Consider investing your surplus for compound growth."
    },
    "The Balanced Spender": {
        "centroid": [0.20, 0.18, 0.22, 0.3, 0.4, 0.40],
        "icon": "⚖️",
        "description": "Moderate spending across categories with reasonable savings. Room for optimization.",
        "color": "#3B82F6",
        "advice": "You're stable but not growing. Automate an extra 5% savings transfer."
    },
    "The Essentials-First": {
        "centroid": [0.10, 0.08, 0.30, 0.15, 0.2, 0.65],
        "icon": "🏠",
        "description": "Majority of spending on essentials (utilities, groceries, transport). Very practical.",
        "color": "#06B6D4",
        "advice": "Look for better rates on utilities and insurance to free up more savings."
    },
    "The High Roller": {
        "centroid": [0.25, 0.35, 0.05, 0.5, 0.9, 0.15],
        "icon": "🎰",
        "description": "Spending exceeds sustainable levels with high variance and low savings.",
        "color": "#DC2626",
        "advice": "Urgent: Set hard spending limits. Your trajectory is unsustainable."
    }
}


def _build_feature_vector(transactions: list, monthly_income: float) -> np.ndarray:
    """
    Build a 6-dimensional normalized feature vector from transaction data.
    """
    if not transactions or monthly_income <= 0:
        return np.array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2])

    total_spend = sum(t.get("amount", 0) for t in transactions if t.get("amount", 0) > 0)
    if total_spend == 0:
        return np.array([0, 0, 1.0, 0, 0, 0])

    # Category aggregation
    by_category = defaultdict(float)
    sub_count = 0
    unique_vendors = set()
    amounts = []

    for t in transactions:
        amt = t.get("amount", 0)
        if amt > 0:
            cat = t.get("category", "other").lower()
            by_category[cat] += amt
            amounts.append(amt)
            unique_vendors.add(t.get("vendor", ""))
            if cat == "subscription" or t.get("isSubscription"):
                sub_count += 1

    # Feature 1: Dining ratio
    dining = by_category.get("dining", 0) / total_spend

    # Feature 2: Shopping ratio
    shopping = by_category.get("shopping", 0) / total_spend

    # Feature 3: Savings rate
    savings_rate = max(0, min(1, (monthly_income - total_spend / 6) / monthly_income))

    # Feature 4: Subscription density (normalized to 0-1, 10+ subs = 1.0)
    sub_density = min(sub_count / 60, 1.0)  # 10 subs/month × 6 months = 60

    # Feature 5: Spending variance (CoV normalized)
    if len(amounts) > 1:
        mean_amt = np.mean(amounts)
        std_amt = np.std(amounts)
        variance = min(std_amt / mean_amt, 1.0) if mean_amt > 0 else 0
    else:
        variance = 0

    # Feature 6: Essentials ratio (groceries + utilities + transport)
    essentials = (
        by_category.get("groceries", 0) +
        by_category.get("utilities", 0) +
        by_category.get("transport", 0)
    ) / total_spend

    return np.array([dining, shopping, savings_rate, sub_density, variance, essentials])


def _compute_radar_data(transactions: list, monthly_income: float) -> list:
    """Generate radar chart data from actual transaction categories."""
    by_category = defaultdict(float)
    total_spend = 0

    for t in transactions:
        amt = t.get("amount", 0)
        if amt > 0:
            cat = t.get("category", "other").lower()
            by_category[cat] += amt
            total_spend += amt

    if total_spend == 0:
        return []

    # Normalize to 0-100 scale for radar
    max_category_spend = max(by_category.values()) if by_category else 1

    radar_categories = {
        "Dining": by_category.get("dining", 0),
        "Shopping": by_category.get("shopping", 0),
        "Subscriptions": by_category.get("subscription", 0),
        "Groceries": by_category.get("groceries", 0),
        "Transport": by_category.get("transport", 0),
        "Entertainment": by_category.get("entertainment", 0),
        "Utilities": by_category.get("utilities", 0),
    }

    # Savings as inverse of total spend ratio
    savings_ratio = max(0, (monthly_income * 6 - total_spend) / (monthly_income * 6))
    radar_categories["Savings"] = savings_ratio * max_category_spend

    radar_data = []
    for name, value in radar_categories.items():
        normalized = round((value / max_category_spend) * 100, 1) if max_category_spend > 0 else 0
        radar_data.append({
            "subject": name,
            "A": normalized,
            "fullMark": 100
        })

    return radar_data


def classify_persona(transactions: list, monthly_income: float) -> dict:
    """
    Classify user's spending persona using hybrid k-means + rule-based approach.

    Args:
        transactions: List of transaction dicts
        monthly_income: Monthly income value

    Returns:
        Dict with persona name, description, icon, confidence, traits, radar data
    """
    # Edge case: no data
    if not transactions or monthly_income <= 0:
        return {
            "persona": "The Unknown",
            "description": "Not enough data to classify your spending DNA.",
            "icon": "❓",
            "color": "#6B7280",
            "confidence": 0,
            "traits": [],
            "radar_data": [],
            "advice": "Start logging transactions to discover your financial personality."
        }

    total_spend = sum(t.get("amount", 0) for t in transactions if t.get("amount", 0) > 0)
    if total_spend == 0:
        return {
            "persona": "The Ghost",
            "description": "No spending detected. Either you're extremely frugal or data is missing.",
            "icon": "👻",
            "color": "#9CA3AF",
            "confidence": 100,
            "traits": ["Minimal Spender", "Data Gap"],
            "radar_data": [],
            "advice": "Log your transactions to get personalized insights."
        }

    # Build feature vector
    user_vector = _build_feature_vector(transactions, monthly_income)

    # Compute Euclidean distances to all centroids
    distances = {}
    for persona_name, persona_data in CENTROIDS.items():
        centroid = np.array(persona_data["centroid"])
        dist = np.linalg.norm(user_vector - centroid)
        distances[persona_name] = dist

    # Find closest centroid
    closest = min(distances, key=distances.get)
    closest_dist = distances[closest]

    # Confidence: inverse distance ratio (normalized)
    all_dists = list(distances.values())
    max_dist = max(all_dists)
    if max_dist > 0:
        confidence = round((1 - closest_dist / max_dist) * 100, 1)
    else:
        confidence = 50.0

    confidence = max(30, min(99, confidence))  # Clamp to reasonable range

    # Generate traits based on feature vector
    traits = []
    if user_vector[0] > 0.25:
        traits.append("Food Lover")
    if user_vector[1] > 0.25:
        traits.append("Retail Therapy")
    if user_vector[2] > 0.30:
        traits.append("Strong Saver")
    elif user_vector[2] < 0.10:
        traits.append("Low Savings")
    if user_vector[3] > 0.5:
        traits.append("Sub Heavy")
    if user_vector[4] > 0.6:
        traits.append("Volatile Spender")
    elif user_vector[4] < 0.25:
        traits.append("Consistent")
    if user_vector[5] > 0.5:
        traits.append("Practical")

    if not traits:
        traits = ["Balanced", "Moderate"]

    # Get radar data
    radar_data = _compute_radar_data(transactions, monthly_income)

    persona_info = CENTROIDS[closest]

    return {
        "persona": closest,
        "description": persona_info["description"],
        "icon": persona_info["icon"],
        "color": persona_info["color"],
        "confidence": confidence,
        "traits": traits,
        "radar_data": radar_data,
        "advice": persona_info["advice"],
        "feature_vector": {
            "dining_ratio": round(float(user_vector[0]), 3),
            "shopping_ratio": round(float(user_vector[1]), 3),
            "savings_rate": round(float(user_vector[2]), 3),
            "sub_density": round(float(user_vector[3]), 3),
            "spending_variance": round(float(user_vector[4]), 3),
            "essentials_ratio": round(float(user_vector[5]), 3)
        }
    }
