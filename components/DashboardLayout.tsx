'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Megaphone,
  Video,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  XCircle,
  Mic,
  BookOpen,
  FileText,
  ClipboardList,
  GraduationCap,
  Settings,
  HelpCircle,
  LogOut,
  Presentation,
  FileQuestion,
  FileCheck,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'STUDENT';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function DashboardLayout({ 
  children, 
  role,
  searchQuery = '',
  onSearchChange,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (localSearch.length >= 2) {
      const fetchResults = async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(localSearch)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
          }
        } catch (error) {
          console.error('Search error:', error);
        }
      };
      
      const timer = setTimeout(fetchResults, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [localSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Admin Navigation Items - Complete
  const adminNavItems = [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      section: 'Overview'
    },
    { 
      href: '/admin/announcements', 
      label: 'Announcements', 
      icon: Megaphone,
      section: 'Communication'
    },
    { 
      href: '/admin/videos', 
      label: 'Videos', 
      icon: Video,
      section: 'Content'
    },
    { 
      href: '/admin/lecture-slides', 
      label: 'Lecture Slides', 
      icon: Presentation,
      section: 'Content'
    },
    { 
      href: '/admin/quizzes', 
      label: 'Quizzes', 
      icon: FileQuestion,
      section: 'Assessments'
    },
    { 
      href: '/admin/tests', 
      label: 'Tests', 
      icon: FileCheck,
      section: 'Assessments'
    },
    { 
      href: '/admin/assignments', 
      label: 'Assignments', 
      icon: ClipboardList,
      section: 'Assessments'
    },
    { 
      href: '/admin/courses', 
      label: 'Courses', 
      icon: BookOpen,
      section: 'Content'
    },
    { 
      href: '/admin/users', 
      label: 'Users', 
      icon: Users,
      section: 'Management'
    },
    { 
      href: '/admin/settings', 
      label: 'Settings', 
      icon: Settings,
      section: 'System'
    },
  ];

  // Student Navigation Items - Complete
  const studentNavItems = [
    { 
      href: '/student', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      section: 'Overview'
    },
    { 
      href: '/student/announcements', 
      label: 'Announcements', 
      icon: Megaphone,
      section: 'Communication'
    },
    { 
      href: '/student/videos', 
      label: 'Videos', 
      icon: Video,
      section: 'Content'
    },
    { 
      href: '/student/lecture-slides', 
      label: 'Lecture Slides', 
      icon: Presentation,
      section: 'Content'
    },
    { 
      href: '/student/quizzes', 
      label: 'Quizzes', 
      icon: FileQuestion,
      section: 'Assessments'
    },
    { 
      href: '/student/tests', 
      label: 'Tests', 
      icon: FileCheck,
      section: 'Assessments'
    },
    { 
      href: '/student/assignments', 
      label: 'Assignments', 
      icon: ClipboardList,
      section: 'Assessments'
    },
    { 
      href: '/student/courses', 
      label: 'My Courses', 
      icon: GraduationCap,
      section: 'Learning'
    },
  ];

  const navItems = role === 'ADMIN' ? adminNavItems : studentNavItems;

  // Group navigation items by section
  const groupedNavItems = navItems.reduce((acc, item) => {
    const section = item.section || 'General';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const userName = user?.fullName || user?.firstName || 'Student';

  const handleClearSearch = () => {
    setLocalSearch('');
    setSearchResults([]);
    if (onSearchChange) {
      onSearchChange('');
    }
    setIsSearchFocused(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch) {
      window.location.href = `/${role.toLowerCase()}?search=${encodeURIComponent(localSearch)}`;
    }
  };

  const announcementResults = searchResults.filter((r: any) => r.type === 'announcement');
  const videoResults = searchResults.filter((r: any) => r.type === 'video');
  const totalResults = searchResults.length;

  return (
    // ✅ Updated with dark mode classes
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6">
        {/* Left Section - Logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-900 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:block">
              Mentality
            </span>
          </Link>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block" />
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden lg:block">
            {navItems.find(item => item.href === pathname || (item.href.includes('#') && pathname === item.href.split('#')[0]))?.label || 'Dashboard'}
          </h1>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex items-center flex-1 max-w-2xl mx-6" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search..."
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  }
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-4 pr-12 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-full rounded-r-none focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 text-sm transition text-gray-800 dark:text-gray-100"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-full hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </form>

          {/* Search Results Dropdown */}
          {isSearchFocused && localSearch.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-[70vh] overflow-y-auto z-50">
              {totalResults === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No results found</p>
                </div>
              ) : (
                <div>
                  {announcementResults.length > 0 && (
                    <div className="p-3">
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-1.5">
                        Announcements ({announcementResults.length})
                      </div>
                      {announcementResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/${role.toLowerCase()}/announcements`}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setLocalSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.content}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {videoResults.length > 0 && (
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-1.5">
                        Videos ({videoResults.length})
                      </div>
                      {videoResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/${role.toLowerCase()}/videos`}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setLocalSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                              <Video className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
                    <Link
                      href={`/${role.toLowerCase()}?search=${encodeURIComponent(localSearch)}`}
                      className="flex items-center justify-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-1.5 transition"
                      onClick={() => setIsSearchFocused(false)}
                    >
                      <Search className="w-4 h-4" />
                      <span>View all {totalResults} results</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <NotificationBell role={role} />
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            {role === 'ADMIN' ? 'Admin' : 'Student'}
          </span>
          <UserButton />
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}
      >
        <div className="flex flex-col h-full">
          {/* Role Badge */}
          <div className={`px-4 py-4 border-b border-gray-100 dark:border-gray-700 ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isCollapsed && <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</span>}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ${isCollapsed ? 'text-[10px] px-2' : ''}`}>
                {role}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            {Object.entries(groupedNavItems).map(([section, items]) => (
              <div key={section} className="mb-4">
                {!isCollapsed && (
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {section}
                  </div>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive = pathname === item.href || 
                                    (item.href.includes('#') && pathname === item.href.split('#')[0]);
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                          ${isCollapsed ? 'justify-center px-2' : ''}
                          ${isActive 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                          }
                          group relative
                        `}
                        title={isCollapsed ? item.label : ''}
                      >
                        <Icon className={`
                          transition-all duration-200 flex-shrink-0
                          ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
                          ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}
                        `} />
                        {!isCollapsed && <span className="text-sm">{item.label}</span>}
                        {isCollapsed && (
                          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="px-2 py-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`
                flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition
                ${isCollapsed ? 'justify-center' : 'justify-between'}
              `}
            >
              {!isCollapsed && <span className="text-xs text-gray-500 dark:text-gray-400">Collapse</span>}
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>

          {/* User Info */}
          <div className={`px-2 py-4 border-t border-gray-100 dark:border-gray-700 ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <UserButton />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{role}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`pt-16 transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}