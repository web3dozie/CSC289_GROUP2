from datetime import datetime, timedelta
from typing import Any, Optional

class SimpleCache:
    """Simple in-memory cache with expiration"""
    def __init__(self):
        self._cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key in self._cache:
            value, expiry = self._cache[key]
            if datetime.now() < expiry:
                return value
            else:
                del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Store value in cache with time-to-live (5 minutes default)"""
        expiry = datetime.now() + timedelta(seconds=ttl_seconds)
        self._cache[key] = (value, expiry)
    
    def clear(self, key: str = None):
        """Clear specific key or entire cache"""
        if key:
            self._cache.pop(key, None)
        else:
            self._cache.clear()

cache = SimpleCache()
