// Sentry Server Configuration
// Captures server-side errors from Server Components, Server Actions, and Route Handlers
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN for server-side. Uses SENTRY_DSN env var (not NEXT_PUBLIC_).
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production
  tracesSampleRate: 1,

  // Enable Spotlight in development
  spotlight: process.env.NODE_ENV === 'development',

  // Ignore certain errors
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'Script error.',
  ],

  // Auto-instrument Server Actions
  // Captures errors and performance data from 'use server' functions
  integrations: [
    Sentry.httpIntegration(),
  ],
});
