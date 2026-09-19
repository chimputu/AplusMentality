// components/books/BookSearchBar.tsx
'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BookSearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export default function BookSearchBar({
  value,
  onChange,
  placeholder = 'Search books, authors, subjects...',
}: BookSearchBarProps) {
  const [local, setLocal] = useState(value);

  // Sync external value changes
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce — fires onChange 350ms after user stops typing
  useEffect(() => {
    if (local === value) return;

    const timer = setTimeout(() => {
      onChange(local);
    }, 350);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const clear = () => {
    setLocal('');
    onChange('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
      {local && (
        <button
          onClick={clear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}