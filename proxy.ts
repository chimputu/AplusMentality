import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
// SECURITY: Admin routes are NOT public — they require auth in their handlers
// SECURITY: /api/user/role and /api/users/me are NOT public — they require auth
// NOTE: /api/chat is public for the landing page — it has rate limiting and message limits
const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/features(.*)',
  '/pricing(.*)',
  '/search(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/join(.*)',
  '/download(.*)',
  '/privacy-policy(.*)',
  '/terms-of-service(.*)',
  '/api/chat(.*)',
  '/api/webhooks(.*)',
  '/api/health(.*)',
  '/api/institutions(.*)',
]);

// Onboarding route — accessible without org, but requires auth
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);

// Protected dashboard routes — require auth + org
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/tutor(.*)',
  '/lecturer(.*)',
  '/student(.*)',
  '/explore(.*)',
]);

// Map route prefixes to allowed app roles
// SECURITY: TUTOR and LECTURER are NOT interchangeable — each has their own dashboard
const routeRoleRequirements: Record<string, string[]> = {
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/tutor': ['TUTOR'],
  '/lecturer': ['LECTURER'],
  '/student': ['STUDENT'],
};

// Map Prisma roles to default dashboard paths
const ROLE_TO_DEFAULT_DASHBOARD: Record<string, string> = {
  STUDENT: '/student',
  TUTOR: '/tutor',
  LECTURER: '/lecturer',
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin',
};

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

  // Let Clerk handshake URLs pass through
  if (request.nextUrl.searchParams.has('__clerk_handshake')) {
    return NextResponse.next();
  }

  // Skip static assets
  if (pathname.startsWith('/_next') || pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js)$/)) {
    return NextResponse.next();
  }

  // 1. Allow public routes without auth
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  const authObj = await auth();
  const { userId, orgId } = authObj;

  // 2. If not logged in, redirect to sign-in
  if (!userId) {
    return authObj.redirectToSignIn();
  }

  // 3. If logged in but NO organization, force them to onboarding
  if (userId && !orgId) {
    // CRITICAL: If they are ALREADY on onboarding, let them stay there!
    if (isOnboardingRoute(request)) {
      return NextResponse.next();
    }

    const onboardingUrl = new URL('/onboarding', request.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // 4. If logged in AND has org, they shouldn't be on onboarding anymore
  if (userId && orgId && isOnboardingRoute(request)) {
    const dashboardUrl = new URL('/student', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 5. Prisma-first role check for protected routes
  // SECURITY: Fail closed — if role lookup fails, deny access rather than redirecting
  if (isProtectedRoute(request)) {
    let appRole: string | null = null;
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
      }
    } catch (err) {
      console.error('[Proxy] DB role lookup failed:', err);
    }

    // SECURITY: Fail closed — if we cannot determine the role, deny access
    // Do not redirect to onboarding, as that would grant access to the protected route
    if (!appRole) {
      console.warn('[Proxy] Denying access: could not determine role for clerkId=%s, path=%s', userId, pathname);
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    const requiredRoles = getRouteRoleRequirement(pathname);
    if (requiredRoles && !requiredRoles.includes(appRole)) {
      console.warn(
        `[Proxy] Role mismatch: user has role=${appRole}, required=${requiredRoles.join(', ')}, path=${pathname}`,
      );
      const defaultDashboard = ROLE_TO_DEFAULT_DASHBOARD[appRole] || '/student';
      return NextResponse.redirect(new URL(defaultDashboard, request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Clerk auto-proxy path
    '/(__clerk)(.*)',
    // All non-static file routes, excluding public auth pages
    '/((?!_next|sign-in|sign-up|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API and tRPC routes
    '/(api|trpc)(.*)',
  ],
};