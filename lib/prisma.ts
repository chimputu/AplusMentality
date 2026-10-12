import './env'; // Validate environment variables at startup

import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback to .env

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("⚠️ DATABASE_URL is not set. Database operations will fail.");
} else if (process.env.NODE_ENV !== "production") {
  const host = connectionString.split("@")[1]?.split("/")[0];
  console.log(`🔌 Prisma connecting to: ${host}`);
}

/**
 * Detect whether a Prisma error is transient and safe to retry.
 */
function isTransientError(error: unknown): boolean {
  const err = error as any;
  const message = err?.message?.toLowerCase() ?? '';
  const code = err?.code ?? '';

  // Prisma / Postgres transient error codes
  const transientCodes = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2025', 'P2028', 'P2030', 'P2034'];
  if (transientCodes.includes(code)) {
    return true;
  }

  // Transient error message patterns
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
    'retry',
    'lock wait timeout',
    'deadlock',
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

/**
 * Retry an async operation with exponential backoff for transient errors.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 100): Promise<T> {
  let lastError: unknown;
  let delay = delayMs;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      if (!isTransientError(err)) throw err;
      if (i === attempts - 1) throw err;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Prisma retry] Attempt ${i + 1} failed, retrying in ${delay}ms...`, (err as any)?.message);
      }

      await new Promise((r) => setTimeout(r, delay));
      delay *= 2; // Exponential backoff: 100ms → 200ms → 400ms
    }
  }

  throw lastError;
}

// Prisma 7.x requires either an adapter or an accelerateUrl.
// - accelerateUrl: only for Prisma Accelerate HTTP connections (prisma:// or prisma+postgres:// protocol)
// - adapter: for all standard PostgreSQL TCP connections including Prisma Postgres pooled (pooled.db.prisma.io)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only use accelerateUrl if the URL actually starts with prisma:// or prisma+postgres://
const isAccelerate = connectionString?.startsWith('prisma://') ?? connectionString?.startsWith('prisma+postgres://') ?? false;

let basePrisma: PrismaClient;
if (isAccelerate) {
  console.log('🔌 Prisma using Accelerate (HTTP) via accelerateUrl');
  basePrisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      accelerateUrl: connectionString,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
} else {
  // Standard PostgreSQL TCP connection, including Prisma Postgres pooled (pooled.db.prisma.io)
  const adapterType = connectionString?.includes('pooled.db.prisma.io') ? 'Pooled TCP' : 'Direct TCP';
  console.log(`🔌 Prisma using ${adapterType} via @prisma/adapter-pg`);
  basePrisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter: new PrismaPg({ connectionString: connectionString! }),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}

// Cache the client globally for ALL environments, not just development.
// In production, without this, each serverless invocation creates a new client
// and exhausts the connection pool.
globalForPrisma.prisma = basePrisma;

// Prisma v7 removed $use middleware. Use $extends with $allOperations instead.
// This adds automatic retry to ALL Prisma queries, protecting every DB query
// in the app from transient failures (connection pool, timeout, network errors).
export const prisma = basePrisma.$extends({
  query: {
    $allOperations: async ({ model, operation, args, query }: {
      model?: string;
      operation: string;
      args: any;
      query: (args: any) => Promise<any>;
    }) => {
      // Skip retry for transaction queries — they have their own retry logic
      if (args?._transactionId) {
        return query(args);
      }

      // Retry all non-transaction queries on transient failures
      return withRetry(
        () => query(args),
        3, // 3 attempts
        100 // Start with 100ms delay (100ms → 200ms → 400ms)
      );
    },
  },
});