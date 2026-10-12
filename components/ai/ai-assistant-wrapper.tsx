'use client';

// Error boundary wrapper for AI Assistant — isolates AI component crashes
// so they never crash the parent page (admin dashboard, student dashboard, etc.)
import { Component, ReactNode } from 'react';
import { AIAssistant } from './ai-assistant';

class AIErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error('[ai-assistant] Crashed:', error);
    // Report to Sentry but don't crash the parent
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      // Fail silently — parent page keeps working
      return null;
    }
    return this.props.children;
  }
}

export function AIAssistantWrapper(props: any) {
  return (
    <AIErrorBoundary>
      <AIAssistant {...props} />
    </AIErrorBoundary>
  );
}
