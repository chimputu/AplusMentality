'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    icon?: ReactNode;
  };
  backLink?: {
    href: string;
    label: string;
  };
}

export default function PageHeader({ title, description, action, backLink }: PageHeaderProps) {
  return (
    <div>
      {/* Back Link */}
      {backLink && (
        <Link
          href={backLink.href}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLink.label}
        </Link>
      )}

      {/* Header with consistent styling */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
          >
            {action.icon || <Plus className="w-4 h-4" />}
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}