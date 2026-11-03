// Breadcrumbs component — shows navigation path on detail pages
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Link
        href="/"
        className="p-1 rounded hover:text-foreground dark:hover:text-foreground transition"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          {item.href ? (
            <Link
              href={item.href}
              className="p-1 rounded hover:text-foreground dark:hover:text-foreground transition"
            >
              {item.label}
            </Link>
          ) : (
            <span className="p-1 font-medium text-foreground">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Helper to build breadcrumbs from pathname
export function useBreadcrumbsFromPath() {
  // Predefined breadcrumb maps for common routes
  const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
    '/admin/assessments': [
      { label: 'Admin', href: '/admin' },
      { label: 'Assessments' },
    ],
    '/admin/questions': [
      { label: 'Admin', href: '/admin' },
      { label: 'Questions' },
    ],
    '/admin/questions/new': [
      { label: 'Admin', href: '/admin' },
      { label: 'Questions', href: '/admin/questions' },
      { label: 'New Question' },
    ],
    '/admin/assessments/new': [
      { label: 'Admin', href: '/admin' },
      { label: 'Assessments', href: '/admin/assessments' },
      { label: 'New Assessment' },
    ],
    '/student/assessments': [
      { label: 'Dashboard', href: '/student' },
      { label: 'Assessments' },
    ],
  };

  return breadcrumbMap;
}
