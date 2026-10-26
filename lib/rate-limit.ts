// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function createRateLimit({
  maxRequests = 10,
  windowMs = 60000, // 1 minute
}: {
  maxRequests?: number;
  windowMs?: number;
} = {}) {
  return function rateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
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
  };
}

// Pre-configured rate limiters
export const changeRequestLimiter = createRateLimit({ maxRequests: 5, windowMs: 60000 });
export const userUpdateLimiter = createRateLimit({ maxRequests: 20, windowMs: 60000 });
