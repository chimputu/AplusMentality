// Sentry Client Configuration
// Captures client-side errors, performance metrics, and user context
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN is required for Sentry to capture events. Set via env var SENTRY_DSN.
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Enable Spotlight in development for local testing
  spotlight: process.env.NODE_ENV === 'development',

  // Ignore certain errors that are not actionable
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'Script error.',
    'ResizeObserver loop limit exceeded',
  ],

  // Deny URL patterns to avoid capturing expected navigation errors
  denyUrls: [
    /extensions\//i,
    /chrome\.com\/.*/i,
    /github\.com\/.*/i,
  ],

  // Route-level performance monitoring
  // Auto-instruments Next.js App Router routes
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
});
