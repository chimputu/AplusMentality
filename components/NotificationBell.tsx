'use client';
import { useState, useEffect } from 'react';
import { Bell, BellOff, Megaphone, X } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
  };
}

interface NotificationBellProps {
  role: 'ADMIN' | 'STUDENT';
}

export default function NotificationBell({ role }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/announcements?limit=5');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = () => {
    setUnreadCount(0);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
        <Bell className="w-5 h-5 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <>
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </>
        ) : (
          <BellOff className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} new announcements` : 'No new notifications'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  <BellOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={`/${role.toLowerCase()}#announcements`}
                    className="block px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Megaphone className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {notif.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <Link
                href={`/${role.toLowerCase()}/announcements`}
                className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all announcements
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}