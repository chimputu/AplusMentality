import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint — pings the database to verify connectivity.
 * Useful for monitoring and load balancer health checks.
 */
export async function GET() {
  const start = Date.now();

  // Check critical environment variables
  const envChecks = {
    databaseUrl: !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '',
    clerkSecretKey: !!process.env.CLERK_SECRET_KEY,
    clerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  };

  const missingEnv = Object.entries(envChecks)
    .filter(([, ok]) => !ok)
    .map(([key]) => key);

  if (missingEnv.length > 0) {
    return NextResponse.json(
      {
        status: 'degraded',
        database: 'unknown',
        missingEnvVars: missingEnv,
        warning: `Missing environment variables: ${missingEnv.join(', ')}. API routes will fail.`,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      latencyMs: Date.now() - start,
      envChecks,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        error: err.message,
        code: err.code,
        envChecks,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
