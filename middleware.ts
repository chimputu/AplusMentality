import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Map Clerk org roles to app roles
const ORG_ROLE_MAP: Record<string, string> = {
  'org:admin': 'ADMIN',
  'org:tutor': 'TUTOR',
  'org:lecturer': 'LECTURER',
  'org:member': 'STUDENT',
};

// Routes that don't require authentication
const publicRoutePatterns = [
  '/sign-in',
  '/sign-up',
  '/api/webhooks',
  '/api/health',
  '/api/debug',
  '/api/fix-user',
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

function isPublicRoute(pathname: string): boolean {
  return publicRoutePatterns.some((pattern) => pathname.startsWith(pattern));
}

function getRouteRoleRequirement(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(routeRoleRequirements)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  return null;
}

export default clerkMiddleware(async (auth, request) => {
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

  // Get the user's org role and map to app role
  const orgRole = authObj.orgRole ?? null;
  const appRole = orgRole ? (ORG_ROLE_MAP[orgRole] || 'STUDENT') : 'STUDENT';

  // Check role-based route protection
  const requiredRoles = getRouteRoleRequirement(pathname);
  if (requiredRoles && !requiredRoles.includes(appRole)) {
    console.warn(
      `[Middleware] Role mismatch: user has role=${appRole} (orgRole=${orgRole}), required=${requiredRoles.join(', ')}, path=${pathname}`,
    );
    return NextResponse.redirect(new URL('/unauthorized?reason=role_mismatch', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip internal routes and static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|tar|gz)))',
  ],
};
