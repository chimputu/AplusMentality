'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ActionButton {
  label: string;
  href: string;
}

interface DataSelectProps<T> {
  // Data
  value: string | undefined;
  onChange: (value: string) => void;

  // Fetching
  fetchFn: () => Promise<T[]>;
  dependencies?: any[];

  // Rendering
  getValue: (item: T) => string;
  getLabel: (item: T) => string;
  getGroup?: (item: T) => string;

  // States
  placeholder?: string;
  prerequisiteMessage?: string;
  prerequisiteMet?: boolean;
  emptyMessage?: string;
  emptyAction?: ActionButton;
  errorMessage?: string;

  // Behavior
  disabled?: boolean;
  loading?: boolean;
  autoSelectFirst?: boolean;
  className?: string;
  label?: string;
  error?: string; // External validation error

  // Search filtering
  search?: string;
  filter?: (items: T[], query: string) => T[];
}

export function DataSelect<T>({
  value,
  onChange,
  fetchFn,
  dependencies = [],
  getValue,
  getLabel,
  getGroup,
  placeholder = 'Select...',
  prerequisiteMessage = 'Select parent first',
  prerequisiteMet = true,
  emptyMessage = 'No items found.',
  emptyAction,
  errorMessage = "Couldn't load items.",
  disabled = false,
  loading: externalLoading = false,
  autoSelectFirst = false,
  className = '',
  label,
  error: externalError,
  search,
  filter,
}: DataSelectProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (prerequisiteMet === false) {
      setItems([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let data = await fetchFn();
      // Ensure the fetch result is always an array
      if (!Array.isArray(data)) {
        data = [];
      }
      setItems(data);
      if (autoSelectFirst && data.length > 0 && !value) {
        onChange(getValue(data[0]));
      }
    } catch (e: any) {
      const errorMsg = e.message ?? 'Failed to load';
      console.error('[DataSelect] Fetch error:', errorMsg, e);
      setError(errorMsg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, prerequisiteMet, autoSelectFirst, value, onChange, getValue]);

  useEffect(() => {
    load();
  }, [load, ...dependencies]);

  const isLoading = loading || externalLoading;

  // Apply search filtering
  const filteredItems = search && search.trim() !== ''
    ? (typeof filter === 'function'
        ? filter(items, search.trim())
        : items.filter((item) => getLabel(item).toLowerCase().includes(search.trim().toLowerCase())))
    : items;

  // Group items if getGroup is provided
  const groupedItems = getGroup
    ? filteredItems.reduce<Record<string, T[]>>((acc, item) => {
        const group = getGroup(item) || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
      }, {})
    : null;

  // ─── Prerequisite not met ───
  if (prerequisiteMet === false) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            disabled
            className="w-full border border-border rounded-lg px-3 py-2 bg-muted dark:bg-card text-muted-foreground cursor-not-allowed text-sm"
          >
            <option value="">{prerequisiteMessage}</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isLoading}
          className="w-full border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {isLoading ? 'Loading...' : placeholder}
          </option>

          {/* ERROR STATE */}
          {error && (
            <option disabled>
              ⚠ {errorMessage} (click to retry)
            </option>
          )}

          {/* EMPTY STATE */}
          {!error && !isLoading && filteredItems.length === 0 && (
            <option disabled>
              {search && search.trim() !== '' ? 'No matches found.' : emptyMessage}
            </option>
          )}

          {/* GROUPED ITEMS */}
          {groupedItems &&
            Object.entries(groupedItems).map(([group, groupItems]) => (
              <optgroup key={group} label={group}>
                {groupItems.map((item) => (
                  <option key={getValue(item)} value={getValue(item)}>
                    {getLabel(item)}
                  </option>
                ))}
              </optgroup>
            ))}

          {/* FLAT ITEMS */}
          {!groupedItems &&
            filteredItems.map((item) => (
              <option key={getValue(item)} value={getValue(item)}>
                {getLabel(item)}
              </option>
            ))}
        </select>

        {/* Loading spinner overlay */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {/* Error state with retry button */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-card border border-red-200 dark:border-red-700 rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Empty state with CTA */}
      {!error && !isLoading && filteredItems.length === 0 && (
        <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
          <p className="text-amber-700 dark:text-amber-400 mb-2">
            {search && search.trim() !== '' ? 'No matches found.' : emptyMessage}
          </p>
          {emptyAction && (
            <Link
              href={emptyAction.href}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-card border border-amber-200 dark:border-amber-700 rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <Plus className="h-3 w-3" />
              {emptyAction.label}
            </Link>
          )}
        </div>
      )}

      {/* External validation error */}
      {externalError && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{externalError}</p>
      )}
    </div>
  );
}
