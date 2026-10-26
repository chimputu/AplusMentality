import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Minimal public health check endpoint.
 * Returns only a basic status indicator without exposing internal details.
 * Detailed health checks are available at /api/health/detailed (admin-only).
 */
export async function GET() {
  const start = Date.now();

  // Minimal check: just verify database connectivity
  let database = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'error';
  }

  const elapsed = Date.now() - start;

  const status = database === 'ok' ? 'ok' : 'critical';

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    responseTime: `${elapsed}ms`,
  });
}
