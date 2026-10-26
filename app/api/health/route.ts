import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint that validates:
 * - Database connectivity
 * - Required database tables exist (InstitutionChangeRequest, Notification, etc.)
 * - Clerk environment variables are configured
 * - Whether test keys are in use (warning for production)
 */
export async function GET() {
  const start = Date.now();

  let database = 'unknown';
  let databaseDetails: string | null = null;
  let redis = 'unknown';
  const tableChecks: Record<string, 'ok' | 'missing'> = {};
  const envChecks: Record<string, 'ok' | 'missing'> = {};
  let clerkKeyMode: 'test' | 'production' | 'unknown' = 'unknown';

  // Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'ok';
  } catch (err: any) {
    database = 'error';
    databaseDetails = err?.message?.slice(0, 200) || 'Connection failed';
  }

  // Check required tables exist
  if (database === 'ok') {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tableNames = tables.map((t) => t.table_name);

    const requiredTables = [
      'InstitutionChangeRequest',
      'Notification',
      'NotificationSeen',
      'OrganizationMembership',
      'TutorApplication',
      'User',
      'Institution',
    ];

    for (const table of requiredTables) {
      tableChecks[table] = tableNames.includes(table) ? 'ok' : 'missing';
    }
  }

  // Check Clerk environment variables
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  envChecks['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] = clerkPublishableKey ? 'ok' : 'missing';
  envChecks['CLERK_SECRET_KEY'] = clerkSecretKey ? 'ok' : 'missing';

  // Detect test vs production keys
  if (clerkPublishableKey) {
    if (clerkPublishableKey.startsWith('pk_test_')) {
      clerkKeyMode = 'test';
    } else if (clerkPublishableKey.startsWith('pk_live_')) {
      clerkKeyMode = 'production';
    }
  }

  // Check other important env vars
  envChecks['DATABASE_URL'] = process.env.DATABASE_URL ? 'ok' : 'missing';
  envChecks['NEXT_PUBLIC_SITE_URL'] = process.env.NEXT_PUBLIC_SITE_URL ? 'ok' : 'missing';

  const missingTables = Object.entries(tableChecks)
    .filter(([, status]) => status === 'missing')
    .map(([name]) => name);

  const missingEnv = Object.entries(envChecks)
    .filter(([, status]) => status === 'missing')
    .map(([name]) => name);

  const elapsed = Date.now() - start;

  // Determine overall status
  let status = 'ok';
  if (database === 'error' || missingEnv.includes('DATABASE_URL')) {
    status = 'critical';
  } else if (missingTables.length > 0 || missingEnv.length > 0 || clerkKeyMode === 'test') {
    status = 'warning';
  }

  return NextResponse.json({
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database,
      databaseDetails,
      redis,
      tables: tableChecks,
      environment: envChecks,
      clerkKeyMode,
    },
    warnings: [
      ...missingTables.map((t) => `Missing database table: ${t}. Run "npx prisma db push" to sync schema.`),
      ...missingEnv.map((e) => `Missing environment variable: ${e}`),
      clerkKeyMode === 'test' ? 'Clerk is using test keys (pk_test_). Some features may be limited in production.' : null,
    ].filter(Boolean) as string[],
    responseTime: `${elapsed}ms`,
  });
}
