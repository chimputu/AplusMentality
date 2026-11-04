import { ReactNode } from 'react';

interface ExploreLayoutProps {
  children: ReactNode;
}

export default function ExploreLayout({ children }: ExploreLayoutProps) {
  // Explore page is publicly accessible — no auth required for browsing
  return <div className="min-h-screen">{children}</div>;
}
