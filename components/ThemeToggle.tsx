// components/ThemeToggle.tsx
'use client';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function ThemeToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [synced, setSynced] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const { isSignedIn } = useUser();

  // Sync theme from DB once, after hydration
  useEffect(() => {
    if (!isSignedIn || synced || theme === undefined) return;

    let cancelled = false;
    const loadTheme = async () => {
      try {
        const res = await fetch('/api/users/me/theme');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.theme && data.theme !== theme) {
          setTheme(data.theme);
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
      } finally {
        if (!cancelled) setSynced(true);
      }
    };
    loadTheme();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, synced, theme]);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    setIsOpen(false);

    if (!isSignedIn) return;

    setSaving(true);
    try {
      await fetch('/api/users/me/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (err) {
      console.error('Failed to save theme:', err);
    } finally {
      setSaving(false);
    }
  };

  // ⏳ next-themes returns undefined until hydrated
  if (theme === undefined) {
    return (
      <button className="p-2 rounded-full hover:bg-gray-100 transition">
        <div className="w-5 h-5" />
      </button>
    );
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        aria-label="Theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : theme === 'system' ? (
          <Monitor className="w-5 h-5 text-blue-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="p-2">
              {themes.map((t) => {
                const Icon = t.icon;
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{t.label}</span>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
            {isSignedIn && saving && (
              <div className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700">
                Saving…
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}