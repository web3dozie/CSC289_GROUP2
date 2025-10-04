from datetime import datetime, timedelta
from typing import Any, Optional

class SimpleCache:
    """Stores data temporarily in memory to avoid hitting the database"""
    def __init__(self):
        self._cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get something from cache if it's still fresh"""
        if key in self._cache:
            value, expiry = self._cache[key]
            if datetime.now() < expiry:
                return value
            else:
                # Too old, throw it away
                del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Save something in cache for a certain amount of time"""
        expiry = datetime.now() + timedelta(seconds=ttl_seconds)
        self._cache[key] = (value, expiry)
    
    def clear(self, key: str = None):
        """Delete one item or clear everything"""
        if key:
            self._cache.pop(key, None)
        else:
            self._cache.clear()

cache = SimpleCache()
