/** Rate limit result returned by the limiter function */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

// ---------------------------------------------------------------------------
// Redis-backed rate limiter (multi-instance safe)
// ---------------------------------------------------------------------------

let redisClient: { incr: (key: string) => Promise<number>; expire: (key: string, ttl: number) => Promise<number> } | null = null;

try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    // Dynamic import to avoid crashing at module load if the package is missing
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({ url, token });
  }
} catch {
  // Package not available — fall through to in-memory
  redisClient = null;
}

function createRedisRateLimit({
  maxRequests = 10,
  windowMs = 60000,
  prefix = 'rl',
}: {
  maxRequests?: number;
  windowMs?: number;
  prefix?: string;
}) {
  return async function redisRateLimit(identifier: string): Promise<RateLimitResult> {
    if (!redisClient) {
      // Fallback to in-memory if Redis is unavailable — fail-safe, not fail-open
      return inMemoryRateLimitFn(identifier, maxRequests, windowMs);
    }

    const key = `${prefix}:${identifier}`;
    const count = await redisClient.incr(key);

    // Set TTL on first request in this window
    if (count === 1) {
      const ttlSec = Math.ceil(windowMs / 1000);
      await redisClient.expire(key, ttlSec);
    }

    const now = Date.now();
    const resetIn = windowMs - (now % windowMs);

    if (count > maxRequests) {
      return { allowed: false, remaining: 0, resetIn };
    }

    return { allowed: true, remaining: maxRequests - count, resetIn };
  };
}

// ---------------------------------------------------------------------------
// In-memory fallback (single-instance only)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

function inMemoryRateLimitFn(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimits.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetTime - now };
}

// ---------------------------------------------------------------------------
// Public API — auto-selects Redis or in-memory backend
// ---------------------------------------------------------------------------

export function createRateLimit({
  maxRequests = 10,
  windowMs = 60000, // 1 minute
  prefix = 'rl',
}: {
  maxRequests?: number;
  windowMs?: number;
  prefix?: string;
} = {}) {
  if (redisClient) {
    return createRedisRateLimit({ maxRequests, windowMs, prefix });
  }

  // In-memory fallback — synchronous for backwards compatibility
  return function rateLimit(identifier: string): RateLimitResult {
    return inMemoryRateLimitFn(identifier, maxRequests, windowMs);
  };
}

// Pre-configured rate limiters
export const changeRequestLimiter = createRateLimit({ maxRequests: 5, windowMs: 60000, prefix: 'cr' });
export const userUpdateLimiter = createRateLimit({ maxRequests: 20, windowMs: 60000, prefix: 'uu' });
