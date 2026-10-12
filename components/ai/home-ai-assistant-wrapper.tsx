'use client';

// Error boundary wrapper for Home AI Assistant
import { Component, ReactNode } from 'react';
import { HomeAIAssistant } from './home-ai-assistant';

class HomeAIErrorBoundary extends Component<
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
    console.error('[home-ai-assistant] Crashed:', error);
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export function HomeAIAssistantWrapper() {
  return (
    <HomeAIErrorBoundary>
      <HomeAIAssistant />
    </HomeAIErrorBoundary>
  );
}
