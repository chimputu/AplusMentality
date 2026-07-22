// lib/cache.ts
type CacheEntry = {
  value: string;
  expires: number;
};

class MemoryCache {
  private store = new Map<string, CacheEntry>();

  // Set a value with TTL (seconds)
  set(key: string, value: string, ttlSeconds: number = 3600): void {
    const expires = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expires });
  }

  // Get a value if it exists and hasn't expired
  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  // Optional: clear all cache
  clear(): void {
    this.store.clear();
  }

  // Optional: delete specific key
  delete(key: string): void {
    this.store.delete(key);
  }
}

// Singleton instance
export const cache = new MemoryCache();