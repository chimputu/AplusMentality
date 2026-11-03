'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, PlayCircle, GraduationCap, Search, User } from 'lucide-react';
import { LiquidGlass } from '@/components/ui/liquid-glass';
import { motion } from 'motion/react';

const tabs = [
  { href: '/student', label: 'Home', icon: Home },
  { href: '/student/videos', label: 'Videos', icon: PlayCircle },
  { href: '/student/courses', label: 'Course', icon: GraduationCap },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/student/profile', label: 'Profile', icon: User },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/student') {
      return pathname === '/student' || pathname === '/student/' || pathname.startsWith('/student/');
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-4 left-4 right-4 z-[60] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <LiquidGlass radius={999} bevelDepth={10} scale={28} aberration={2} tint={0.55} className="liquid-glass-fallback">
        <div className="flex items-center justify-around" style={{ height: 'max(3.5rem, calc(3.5rem + env(safe-area-inset-bottom, 0px)))' }}>
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[48px] min-w-[48px] transition-colors ${
                  active
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-muted-foreground'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="liquid-glass-tab"
                    className="absolute inset-1 bg-white/40 dark:bg-white/15 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon className="w-6 h-6" />
                </span>
                <span className="relative z-10 text-xs font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </LiquidGlass>
    </nav>
  );
}
