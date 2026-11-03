'use client';

import dynamic from 'next/dynamic';

// Dynamically import the AI assistant to avoid blocking the initial page load.
// The AI SDK bundle is ~500KB and is not needed for the initial render.
const AIAssistantWrapperDynamic = dynamic(
  () => import('@/components/ai/ai-assistant-wrapper').then((mod) => mod.AIAssistantWrapper),
  {
    ssr: false,
    loading: () => null, // No placeholder needed — AI assistant is a floating widget
  },
);

export function AIAssistantLazy(props: {
  userFirstName: string | null;
  userRole: string | null;
  userInstitution: string | null;
}) {
  return <AIAssistantWrapperDynamic {...props} />;
}
