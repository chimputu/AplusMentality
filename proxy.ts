import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutePatterns = [
  '/',
  '/about',
  '/features',
  '/pricing',
  '/search',
  '/sign-in',
  '/sign-up',
  '/join',
  '/onboarding',
  '/download',
  '/api/webhooks',
  '/api/health',
  '/api/user/role',
  '/api/institutions/picker',
  '/api/institutions/',
  '/api/admin/levels',
  '/api/admin/periods',
  '/api/admin/branches',
  '/api/users/me',
  '/favicon.ico',
  '/manifest.json',
  '/sitemap.xml',
  '/robots.txt',
];

// Map route prefixes to allowed app roles
const routeRoleRequirements: Record<string, string[]> = {
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/tutor': ['TUTOR', 'LECTURER'],
  '/lecturer': ['LECTURER'],
  '/student': ['STUDENT'],
};

// Map Prisma roles to default dashboard paths
// Used when a user accesses a route they don't have permission for
const ROLE_TO_DEFAULT_DASHBOARD: Record<string, string> = {
  STUDENT: '/student',
  TUTOR: '/tutor',
  LECTURER: '/lecturer',
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin',
};

function isPublicRoute(pathname: string): boolean {
  return publicRoutePatterns.some((pattern) => {
    // Exact match for '/' to avoid matching all routes
    if (pattern === '/') return pathname === '/';
    return pathname.startsWith(pattern);
  });
}

function getRouteRoleRequirement(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(routeRoleRequirements)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  return null;
}

export const proxy = clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  // Allow public routes without auth
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Skip internal Next.js routes and static assets
  if (pathname.startsWith('/_next') || pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js)$/)) {
    return NextResponse.next();
  }

  const authObj = await auth();

  // Require authentication for all other routes
  if (!authObj.userId) {
    return authObj.redirectToSignIn();
  }

  // Prisma-first auth: Always fetch the user's role from the database.
  // Clerk is used only for authentication (who you are), not authorization (what you can do).
  // This ensures role changes in the admin dashboard take effect instantly on the next page load.
  let appRole: string | null = null;
  let hasInstitution = false;
  try {
    const baseUrl = request.nextUrl.origin;
    const cookieHeader = request.headers.get('cookie') || '';
    const dbRoleRes = await fetch(`${baseUrl}/api/user/role`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (dbRoleRes.ok) {
      const dbRoleData = await dbRoleRes.json();
      if (dbRoleData?.role) {
        appRole = dbRoleData.role;
      }
      hasInstitution = !!dbRoleData?.hasInstitution;
    }
  } catch (err) {
    console.error('[Proxy] DB role lookup failed:', err);
  }

  // If we couldn't get the role from DB, default to STUDENT for safety
  if (!appRole) {
    appRole = 'STUDENT';
  }

  // Onboarding enforcement: redirect un-onboarded non-admin users to /onboarding
  // ADMIN and SUPER_ADMIN can access their dashboards without being tied to an institution
  const exemptFromOnboarding = appRole === 'ADMIN' || appRole === 'SUPER_ADMIN';
  if (!exemptFromOnboarding && !hasInstitution && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Check role-based route protection
  const requiredRoles = getRouteRoleRequirement(pathname);
  if (requiredRoles && !requiredRoles.includes(appRole)) {
    console.warn(
      `[Proxy] Role mismatch: user has role=${appRole}, required=${requiredRoles.join(', ')}, path=${pathname}`,
    );
    // Redirect to the user's default dashboard based on their Prisma role
    const defaultDashboard = ROLE_TO_DEFAULT_DASHBOARD[appRole] || '/student';
    return NextResponse.redirect(new URL(defaultDashboard, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Clerk auto-proxy path — required for *.vercel.app domains
    '/(__clerk)(.*)',
    // All non-static file routes
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API and tRPC routes
    '/(api|trpc)(.*)',
  ],
};