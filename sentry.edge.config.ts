// Sentry Edge Configuration
// Captures errors from Middleware and Edge Runtime Route Handlers
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  spotlight: process.env.NODE_ENV === 'development',
});
