'use client';

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl border border-border p-6 ${className}`}>
      <div className="h-4 bg-gray-200 dark:bg-muted rounded w-1/4 mb-4"></div>
      <div className="h-3 bg-gray-200 dark:bg-muted rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-muted rounded w-1/2"></div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-200 dark:bg-muted rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 p-4 border border-border rounded-xl">
          <div className="h-10 w-10 bg-gray-200 dark:bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-muted rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-muted rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`animate-spin rounded-full ${sizes[size]} border-b-2 border-blue-600`}></div>
    </div>
  );
}
