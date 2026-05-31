"""
TTL-based In-Memory Cache Service
===================================
Provides hash-keyed caching with time-to-live expiration.
In production, replace with Redis. This implementation is demo-grade.
"""

import hashlib
import json
import time
from typing import Any, Optional


_cache: dict[str, dict] = {}


def cache_key(*args, **kwargs) -> str:
    """
    Generate a deterministic hash key from arbitrary inputs.
    Useful for caching API responses based on request body.
    """
    raw = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def get_cached(key: str, max_age_seconds: int = 300) -> Optional[Any]:
    """
    Retrieve a cached value if it exists and hasn't expired.

    Args:
        key: Cache key
        max_age_seconds: Maximum age in seconds (default 5 minutes)

    Returns:
        Cached value or None if expired/missing
    """
    entry = _cache.get(key)
    if entry is None:
        return None

    if time.time() - entry["timestamp"] > max_age_seconds:
        del _cache[key]
        return None

    return entry["value"]


def set_cache(key: str, value: Any) -> None:
    """Store a value in cache with current timestamp."""
    _cache[key] = {
        "value": value,
        "timestamp": time.time()
    }


def invalidate(key: str) -> None:
    """Remove a specific key from cache."""
    _cache.pop(key, None)


def clear_cache() -> None:
    """Clear entire cache."""
    _cache.clear()


def cache_stats() -> dict:
    """Return cache statistics."""
    now = time.time()
    total = len(_cache)
    expired = sum(1 for e in _cache.values() if now - e["timestamp"] > 300)
    return {
        "total_entries": total,
        "expired_entries": expired,
        "active_entries": total - expired
    }
