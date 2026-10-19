import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const start = Date.now();

  let database = 'unknown';
  let redis = 'unknown';

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'ok';
  } catch {
    database = 'error';
  }

  const elapsed = Date.now() - start;

  return NextResponse.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: { database, redis },
    responseTime: `${elapsed}ms`,
  });
}
