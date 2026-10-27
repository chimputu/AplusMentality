'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, PlayCircle, FileText, Search, User } from 'lucide-react';

const tabs = [
  { href: '/student', label: 'Home', icon: Home },
  { href: '/student/videos', label: 'Videos', icon: PlayCircle },
  { href: '/student/materials', label: 'Materials', icon: FileText },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/student/profile', label: 'Profile', icon: User },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/student') {
      return pathname === '/student' || pathname === '/student/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[48px] transition-colors ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
