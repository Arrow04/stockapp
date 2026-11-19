"""Small in-memory TTL cache used by the market REST endpoints."""
import time


class MarketCache:
    """Key/value store whose entries expire after ``ttl_seconds``."""

    def __init__(self, ttl_seconds: float = 5.0):
        self.ttl_seconds = ttl_seconds
        self._store: dict = {}

    def get(self, key: tuple):
        """Return a fresh cached payload, or None (and evict stale entries)."""
        entry = self._store.get(key)
        if entry is None:
            return None
        expiry, payload = entry
        if time.monotonic() < expiry:
            return payload
        self._store.pop(key, None)
        return None

    def set(self, key: tuple, payload) -> None:
        self._store[key] = (time.monotonic() + self.ttl_seconds, payload)

    def clear(self) -> None:
        self._store.clear()
