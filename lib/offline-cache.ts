/**
 * Offline-first data caching layer using IndexedDB (via the `idb` package).
 *
 * When a fetch succeeds, the response is stored in IndexedDB.
 * When a fetch fails due to no network, the cached data is returned instead.
 *
 * This ensures Zambian students can still view courses, past papers, videos,
 * and announcements even when they lose connectivity.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'amentality-cache';
const DB_VERSION = 1;
const STORE_NAME = 'api-responses';

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expiresIn: number; // milliseconds
}

interface AmentalityDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: CacheEntry;
    indexes: { timestamp: number };
  };
}

let dbPromise: Promise<IDBPDatabase<AmentalityDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AmentalityDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AmentalityDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Cache TTL defaults
 */
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const LONG_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Store a response in IndexedDB cache.
 */
export async function cacheResponse(
  key: string,
  data: any,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    const db = await getDB();
    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    };
    await db.put(STORE_NAME, entry);
  } catch (err) {
    console.warn('Failed to cache response:', err);
  }
}

/**
 * Retrieve a cached response from IndexedDB.
 * Returns null if not found or expired.
 */
export async function getCachedResponse(key: string): Promise<any | null> {
  try {
    const db = await getDB();
    const entry = await db.get(STORE_NAME, key);
    if (!entry) return null;

    // Check if the cache entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.expiresIn) {
      await db.delete(STORE_NAME, key);
      return null;
    }

    return entry.data;
  } catch (err) {
    console.warn('Failed to read cached response:', err);
    return null;
  }
}

/**
 * Clear all cached data.
 */
export async function clearCache(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (err) {
    console.warn('Failed to clear cache:', err);
  }
}

/**
 * Clear a specific cached entry.
 */
export async function clearCacheEntry(key: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, key);
  } catch (err) {
    console.warn('Failed to clear cache entry:', err);
  }
}

/**
 * Wrapper for fetch that automatically caches responses and returns cached data on failure.
 *
 * @param key - Unique cache key for this request
 * @param fetchFn - Async function that performs the actual fetch
 * @param ttl - Time-to-live in milliseconds (default: 5 minutes)
 * @returns The fetched data or cached data if the fetch fails
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T | null> {
  // Try to fetch fresh data
  try {
    const data = await fetchFn();
    if (data !== null && data !== undefined) {
      await cacheResponse(key, data, ttl);
    }
    return data;
  } catch (err) {
    console.warn('Fetch failed, trying cache:', err);

    // Fall back to cached data
    const cached = await getCachedResponse(key);
    if (cached !== null) {
      console.info('Served from cache:', key);
      return cached as T;
    }

    // No cache available, re-throw the error
    throw err;
  }
}

/**
 * Check if the browser is currently online.
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return window.navigator.onLine;
}

/**
 * Listen for online/offline events and call callbacks.
 */
export function onNetworkChange(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Predefined cache keys for common API endpoints.
 */
export const CacheKeys = {
  courses: 'courses',
  pastPapers: 'past-papers',
  videos: 'videos',
  announcements: 'announcements',
  banners: 'banners',
  quizzes: 'quizzes',
  assignments: 'assignments',
  books: 'books',
  enrollments: 'enrollments',
} as const;

/**
 * TTL presets for different types of data.
 */
export const CacheTTL = {
  short: 1 * 60 * 1000, // 1 minute — for frequently changing data
  medium: 5 * 60 * 1000, // 5 minutes — default
  long: LONG_TTL, // 24 hours — for rarely changing data (courses, past papers)
} as const;
