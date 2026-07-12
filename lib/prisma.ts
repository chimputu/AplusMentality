// lib/prisma.ts
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 1. Safeguard against empty strings during Next.js build optimization
const databaseUrl = process.env.DATABASE_URL;
const isBuilding = process.env.NEXT_PHASE === 'phase-production-build' || !databaseUrl;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Provide a dummy valid-looking protocol fallback ONLY when building
    accelerateUrl: isBuilding ? 'prisma://bootstrap-placeholder-string' : databaseUrl,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;