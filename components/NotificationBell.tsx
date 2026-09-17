// components/NotificationBell.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Megaphone,
  FileQuestion,
  FileCheck,
  ClipboardList,
  Check,
  Loader2,
} from 'lucide-react';

interface Notification {
  id: string;
  rawId: string;
  type: 'announcement' | 'test' | 'quiz' | 'assignment';
  title: string;
  description: string;
  createdAt: string;
  author: string;
  seen: boolean;
}

interface NotificationBellProps {
  role: 'ADMIN' | 'STUDENT';
}

const TYPE_CONFIG: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  announcement: {
    icon: Megaphone,
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    label: 'Announcement',
  },
  test: {
    icon: FileCheck,
    color:
      'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    label: 'Test',
  },
  quiz: {
    icon: FileQuestion,
    color:
      'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    label: 'Quiz',
  },
  assignment: {
    icon: ClipboardList,
    color: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    label: 'Assignment',
  },
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function NotificationBell({ role }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count || 0);
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAsSeen = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      // Optimistic UI update
      setItems((prev) =>
        prev.map((it) =>
          it.id === notificationId ? { ...it, seen: true } : it
        )
      );
      setCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark seen:', err);
    }
  };

  const markAllSeen = async () => {
    setMarking(true);
    try {
      await fetch('/api/notifications/mark-all-seen', { method: 'POST' });
      setItems((prev) => prev.map((it) => ({ ...it, seen: true })));
      setCount(0);
    } catch (err) {
      console.error('Failed to mark all seen:', err);
    } finally {
      setMarking(false);
    }
  };

  const getHref = (n: Notification) => {
    const prefix = role === 'ADMIN' ? '/admin' : '/student';
    switch (n.type) {
      case 'announcement':
        return `${prefix}/announcements`;
      case 'test':
        return `${prefix}/tests`;
      case 'quiz':
        return `${prefix}/quizzes`;
      case 'assignment':
        return `${prefix}/assignments`;
      default:
        return prefix;
    }
  };

  const handleItemClick = async (item: Notification) => {
    if (!item.seen) {
      await markAsSeen(item.id);
    }
    setIsOpen(false);
    router.push(getHref(item));
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button with Count Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />

        {/* ⭐ Facebook-style count badge */}
        {count > 0 && (
          <span
            className={`
              absolute -top-0.5 -right-0.5 
              min-w-[18px] h-[18px] px-1 
              flex items-center justify-center 
              bg-red-500 text-white text-[10px] font-bold 
              rounded-full border-2 border-white dark:border-gray-800
              ${count > 99 ? 'text-[9px]' : ''}
            `}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Notifications
              </h3>
              {count > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold rounded-full">
                  {count} new
                </span>
              )}
            </div>
            {count > 0 && (
              <button
                onClick={markAllSeen}
                disabled={marking}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {marking ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* Items list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <div>
                {items.map((item) => {
                  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.announcement;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full text-left p-3 border-b border-gray-50 dark:border-gray-700/50 
                        hover:bg-gray-50 dark:hover:bg-gray-700/50 transition last:border-b-0
                        ${!item.seen ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
                      `}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400">
                              {cfg.label}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {timeAgo(item.createdAt)}
                            </span>
                            {!item.seen && (
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p
                            className={`text-sm truncate ${
                              !item.seen
                                ? 'font-semibold text-gray-900 dark:text-gray-100'
                                : 'font-medium text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                              {item.description}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            by {item.author}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-center flex-shrink-0">
              <Link
                href={role === 'ADMIN' ? '/admin' : '/student'}
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                View all in dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}