import { clerkMiddleware } from '@clerk/nextjs/server';

export const proxy = clerkMiddleware();

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