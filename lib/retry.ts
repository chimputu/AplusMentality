/**
 * Retry an async operation with exponential backoff.
 * Only retries on transient errors (connection, timeout, pool exhaustion, etc.)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    attempts?: number;
    delayMs?: number;
    backoff?: number;
    onRetry?: (attempt: number, error: Error) => void;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    attempts = 3,
    delayMs = 500,
    backoff = 2,
    onRetry,
    shouldRetry = isTransientError,
  } = options;

  let lastError: unknown;
  let delay = delayMs;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      // Don't retry non-transient errors
      if (!shouldRetry(err)) throw err;

      // Don't retry on last attempt
      if (i === attempts - 1) throw err;

      onRetry?.(i + 1, err instanceof Error ? err : new Error(String(err)));

      // Wait before retrying
      await new Promise((r) => setTimeout(r, delay));
      delay *= backoff;
    }
  }

  // This should not be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Detect whether an error is transient and safe to retry.
 * Covers Prisma/Postgres transient errors and network errors.
 */
export function isTransientError(error: unknown): boolean {
  const message = (error as any)?.message?.toLowerCase() ?? '';
  const code = (error as any)?.code ?? '';

  // Prisma / Postgres transient errors
  const prismaTransientCodes = ['P1001', 'P1002', 'P1008', 'P1017'];
  if (prismaTransientCodes.includes(code)) {
    return true;
  }

  const transientKeywords = [
    'connection',
    'timed out',
    'timeout',
    'econnreset',
    'econnrefused',
    'cannot reach',
    'terminated',
    'pool',
    'too many clients',
  ];

  if (transientKeywords.some((kw) => message.includes(kw))) {
    return true;
  }

  // Network errors
  if (message.includes('fetch failed') || message.includes('network')) {
    return true;
  }

  return false;
}
