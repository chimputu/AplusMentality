'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserButton, useUser, OrganizationSwitcher } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';
import {
  Activity,
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
  ListTodo,
  Award,
  Upload,
  MessageSquare,
  Sparkles,
  Building2,
  Compass,
  Star,
  User,
  Download,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import MobileTabBar from './mobile-tab-bar';
import { OfflineDetector } from './offline-detector';
import { LiquidGlass } from '@/components/ui/liquid-glass';
import { Logo } from '@/components/Logo';
import type { Role } from '@/generated/prisma/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: Role;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  roles?: string[];
}

export default function DashboardLayout({ 
  children, 
  role,
  searchQuery = '',
  onSearchChange,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useUser();

  // Sentry: Set user context so errors are associated with the logged-in user
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        username: user.username ?? undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

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
            setSearchResults(Array.isArray(data) ? data : []);
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

  // Admin Navigation Items
  const adminNavItems: NavItem[] = [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      section: 'Overview'
    },
    { 
      href: '/admin/banners', 
      label: 'Banners', 
      icon: Megaphone,
      section: 'Communication'
    },
    { 
      href: '/admin/announcements', 
      label: 'Announcements', 
      icon: Megaphone,
      section: 'Communication'
    },
    { 
      href: '/admin/courses', 
      label: 'Courses', 
      icon: BookOpen,
      section: 'Content'
    },
    { 
      href: '/admin/uploads', 
      label: 'Uploads', 
      icon: Upload,
      section: 'Content'
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
      href: '/admin/past-papers', 
      label: 'Past Papers', 
      icon: FileText,
      section: 'Content'
    },
    { 
      href: '/admin/assessments', 
      label: 'Assessments', 
      icon: FileCheck,
      section: 'Assessments'
    },
    { 
      href: '/admin/questions', 
      label: 'Questions', 
      icon: HelpCircle,
      section: 'Assessments'
    },
    { 
      href: '/admin/assignments', 
      label: 'Assignments', 
      icon: ClipboardList,
      section: 'Assessments'
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
      icon: FileText,
      section: 'Assessments'
    },
    { 
      href: '/admin/submissions', 
      label: 'Submissions', 
      icon: ListTodo,
      section: 'Assessments'
    },
    { 
      href: '/admin/tutors', 
      label: 'Tutors', 
      icon: Users,
      section: 'Management'
    },
    { 
      href: '/admin/tutor-requests', 
      label: 'Tutor Requests', 
      icon: MessageSquare,
      section: 'Management'
    },
    { 
      href: '/admin/tutor-applications', 
      label: 'Tutor Applications', 
      icon: GraduationCap,
      section: 'Management'
    },
    { 
      href: '/admin/institutions', 
      label: 'Institutions', 
      icon: Building2,
      section: 'Management',
      roles: ['SUPER_ADMIN'],
    },
    { 
      href: '/admin/programmes', 
      label: 'Programmes', 
      icon: GraduationCap,
      section: 'Management'
    },
    { 
      href: '/admin/users', 
      label: 'Users', 
      icon: Users,
      section: 'Management'
    },
    { 
      href: '/admin/change-requests', 
      label: 'Change Requests', 
      icon: ClipboardList,
      section: 'Management'
    },
    { 
      href: '/admin/analytics', 
      label: 'Analytics', 
      icon: Compass,
      section: 'Management'
    },
    { 
      href: '/admin/organizations', 
      label: 'Organizations', 
      icon: Building2,
      section: 'Management',
      roles: ['SUPER_ADMIN'],
    },
    { 
      href: '/admin/system-health', 
      label: 'System Health', 
      icon: Activity,
      section: 'System'
    },
    { 
      href: '/admin/settings', 
      label: 'Settings', 
      icon: Settings,
      section: 'System'
    },
  ];

  // Student Navigation Items
  const studentNavItems: NavItem[] = [
    { 
      href: '/student', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      section: 'Overview'
    },
    { 
      href: '/student/profile', 
      label: 'My Profile', 
      icon: User,
      section: 'Overview'
    },
    { 
      href: '/student/announcements', 
      label: 'Announcements', 
      icon: Megaphone,
      section: 'Communication'
    },
    { 
      href: '/student/courses', 
      label: 'My Courses', 
      icon: GraduationCap,
      section: 'Learning'
    },
    { 
      href: '/student/find-tutor', 
      label: 'Find Tutors', 
      icon: Users,
      section: 'Learning'
    },
    { 
      href: '/apply-as-tutor', 
      label: 'Apply as Tutor', 
      icon: GraduationCap,
      section: 'Learning'
    },
    {
      href: '/student/lessons',
      label: 'Lessons',
      icon: Video,
      section: 'Learning'
    },
    { 
      href: '/student/ai', 
      label: 'AI Assistant', 
      icon: Sparkles,
      section: 'Learning'
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
      href: '/student/past-papers', 
      label: 'Past Papers', 
      icon: FileText,
      section: 'Content'
    },
    { 
      href: '/student/assessments', 
      label: 'Assessments', 
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
      href: '/student/quizzes', 
      label: 'Quizzes', 
      icon: FileQuestion,
      section: 'Assessments'
    },
    { 
      href: '/student/tests', 
      label: 'Tests', 
      icon: FileText,
      section: 'Assessments'
    },
    { 
      href: '/student/results', 
      label: 'Results', 
      icon: Award,
      section: 'Assessments'
    },
    { 
      href: '/student/books', 
      label: 'Books', 
      icon: BookOpen,
      section: 'Learning'
    },
    { 
      href: '/explore', 
      label: 'Explore Universities', 
      icon: Compass,
      section: 'Discovery'
    },
    { 
      href: '/download', 
      label: 'Download App', 
      icon: Download,
      section: 'General'
    },
    { 
      href: '/student/settings', 
      label: 'Settings', 
      icon: Settings,
      section: 'System'
    },
  ];

  // Lecturer Navigation Items
  const lecturerNavItems: NavItem[] = [
    { 
      href: '/lecturer', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      section: 'Overview'
    },
    { 
      href: '/lecturer/courses', 
      label: 'Courses', 
      icon: BookOpen,
      section: 'Content'
    },
    { 
      href: '/lecturer/videos', 
      label: 'Videos', 
      icon: Video,
      section: 'Content'
    },
    { 
      href: '/lecturer/lecture-slides', 
      label: 'Lecture Slides', 
      icon: Presentation,
      section: 'Content'
    },
    { 
      href: '/lecturer/past-papers', 
      label: 'Past Papers', 
      icon: FileText,
      section: 'Content'
    },
    { 
      href: '/lecturer/quizzes', 
      label: 'Quizzes', 
      icon: FileQuestion,
      section: 'Assessments'
    },
    { 
      href: '/lecturer/tests', 
      label: 'Tests', 
      icon: FileText,
      section: 'Assessments'
    },
    { 
      href: '/lecturer/assignments', 
      label: 'Assignments', 
      icon: ClipboardList,
      section: 'Assessments'
    },
    { 
      href: '/lecturer/grades', 
      label: 'Student Grades', 
      icon: FileCheck,
      section: 'Students'
    },
    { 
      href: '/lecturer/enrollments', 
      label: 'Enrollments', 
      icon: Users,
      section: 'Students'
    },
    { 
      href: '/lecturer/announcements', 
      label: 'Announcements', 
      icon: Megaphone,
      section: 'Communication'
    },
    { 
      href: '/lecturer/settings', 
      label: 'Settings', 
      icon: Settings,
      section: 'Account'
    },
  ];

  // Tutor Navigation Items
  const tutorNavItems: NavItem[] = [
    { 
      href: '/tutor', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      section: 'Overview'
    },
    { 
      href: '/tutor/requests', 
      label: 'Tutor Requests', 
      icon: MessageSquare,
      section: 'Tutoring'
    },
    { 
      href: '/tutor/specialties', 
      label: 'My Specialties', 
      icon: BookOpen,
      section: 'Tutoring'
    },
    { 
      href: '/tutor/offerings', 
      label: 'My Offerings', 
      icon: GraduationCap,
      section: 'Tutoring'
    },
    { 
      href: '/tutor/reviews', 
      label: 'Reviews', 
      icon: Star,
      section: 'Tutoring'
    },
    { 
      href: '/tutor/courses', 
      label: 'Courses', 
      icon: BookOpen,
      section: 'Content'
    },
    { 
      href: '/tutor/announcements', 
      label: 'Announcements', 
      icon: Megaphone,
      section: 'Content'
    },
    { 
      href: '/tutor/videos', 
      label: 'Videos', 
      icon: Video,
      section: 'Content'
    },
    { 
      href: '/tutor/lecture-slides', 
      label: 'Lecture Slides', 
      icon: Presentation,
      section: 'Content'
    },
    { 
      href: '/tutor/past-papers', 
      label: 'Past Papers', 
      icon: FileText,
      section: 'Content'
    },
    { 
      href: '/tutor/assignments', 
      label: 'Assignments', 
      icon: ClipboardList,
      section: 'Assessments'
    },
    { 
      href: '/tutor/quizzes', 
      label: 'Quizzes', 
      icon: FileQuestion,
      section: 'Assessments'
    },
    { 
      href: '/tutor/tests', 
      label: 'Tests', 
      icon: FileText,
      section: 'Assessments'
    },
    { 
      href: '/apply-as-tutor/status', 
      label: 'Application Status', 
      icon: FileText,
      section: 'Account'
    },
    { 
      href: '/tutor/settings', 
      label: 'Settings', 
      icon: Settings,
      section: 'Account'
    },
  ];

  // Format raw role enum values to human-readable labels
  const roleLabel = (r: string) => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Platform Owner',
      ADMIN: 'Admin',
      LECTURER: 'Lecturer',
      TUTOR: 'Tutor',
      STUDENT: 'Student',
    };
    return labels[r] ?? r;
  };

  let navItems: NavItem[];
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    navItems = adminNavItems;
  } else if (role === 'LECTURER') {
    navItems = lecturerNavItems;
  } else if (role === 'TUTOR') {
    navItems = tutorNavItems;
  } else {
    navItems = studentNavItems;
  }

  // Filter nav items by role requirements (e.g., SUPER_ADMIN only)
  // Items without `roles` are visible to all roles within that nav set.
  // Items with `roles: ['SUPER_ADMIN']` are hidden from ADMIN.
  navItems = navItems.filter((item) => !item.roles || item.roles.includes(role));

  // Group navigation items by section
  const groupedNavItems = navItems.reduce((acc, item) => {
    const section = item.section || 'General';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const userName = user?.fullName || user?.firstName || 'User';

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

  // Filter results by type
  const announcementResults = searchResults.filter((r: any) => r.type === 'announcement');
  const videoResults = searchResults.filter((r: any) => r.type === 'video');
  const pastPaperResults = searchResults.filter((r: any) => r.type === 'past_paper');
  const courseResults = searchResults.filter((r: any) => r.type === 'course');
  const lectureSlideResults = searchResults.filter((r: any) => r.type === 'lecture_slide');
  const quizResults = searchResults.filter((r: any) => r.type === 'quiz');
  const testResults = searchResults.filter((r: any) => r.type === 'test');
  const assignmentResults = searchResults.filter((r: any) => r.type === 'assignment');
  const totalResults = searchResults.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Detection Banner */}
      <OfflineDetector />

      {/* Top Navbar — liquid glass on mobile, fixed on desktop */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <LiquidGlass radius={24} bevelDepth={10} scale={28} tint={0.35} className="w-full liquid-glass-fallback shadow-[0_4px_20px_rgb(0_0_0/0.08),inset_0_1px_0_rgb(255_255_255/0.6)]">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left Section - Logo & Hamburger (mobile only) */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-muted transition"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <Logo />
          <div className="h-6 w-px border-border bg-border hidden lg:block" />
          <h1 className="text-sm md:text-lg font-semibold text-foreground hidden lg:block truncate max-w-[200px]">
            {navItems.find(item => item.href === pathname || (item.href.includes('#') && pathname === item.href.split('#')[0]))?.label || 'Dashboard'}
          </h1>
        </div>

        {/* Center Section - Search (hidden on mobile) */}
        <div className="hidden md:flex items-center flex-1 max-w-2xl mx-6 relative" ref={searchRef}>
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
                className="w-full pl-4 pr-12 py-2 bg-muted border border-border rounded-l-full rounded-r-none focus:outline-none focus:border-blue-500 focus:bg-card text-sm transition text-foreground"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground dark:hover:text-foreground transition"
                  aria-label="Clear search"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-muted border border-l-0 border-border rounded-r-full hover:bg-accent transition flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
          </form>

          {/* Search Results Dropdown */}
          {isSearchFocused && localSearch.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl max-h-[70vh] overflow-y-auto z-50">
              {totalResults === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-muted-foreground text-sm font-medium">No results found</p>
                </div>
              ) : (
                <div>
                  {/* ANNOUNCEMENTS */}
                  {announcementResults.length > 0 && (
                    <div className="p-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        Announcements ({announcementResults.length})
                      </div>
                      {announcementResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={item.href || `/${role.toLowerCase()}/announcements`}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-card-hover rounded-lg transition"
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
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{item.content}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* VIDEOS */}
                  {videoResults.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        Videos ({videoResults.length})
                      </div>
                      {videoResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={item.href || `/${role.toLowerCase()}/videos`}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-card-hover rounded-lg transition"
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
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{item.content}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* PAST PAPERS */}
                  {pastPaperResults.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        Past Papers ({pastPaperResults.length})
                      </div>
                      {pastPaperResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-card-hover rounded-lg transition"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setLocalSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{item.content}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* COURSES */}
                  {courseResults.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        Courses ({courseResults.length})
                      </div>
                      {courseResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-card-hover rounded-lg transition"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setLocalSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{item.content}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* LECTURE SLIDES */}
                  {lectureSlideResults.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        Lecture Slides ({lectureSlideResults.length})
                      </div>
                      {lectureSlideResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-card-hover rounded-lg transition"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setLocalSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                              <Presentation className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{item.content}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* QUIZZES */}
                  {quizResults.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        Quizzes ({quizResults.length})
                      </div>
                      {quizResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-card-hover rounded-lg transition"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setLocalSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <FileQuestion className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{item.content}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* TESTS */}
                  {testResults.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        Tests ({testResults.length})
                      </div>
                      {testResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-card-hover rounded-lg transition"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setLocalSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                              <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{item.content}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* ASSIGNMENTS */}
                  {assignmentResults.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                        Assignments ({assignmentResults.length})
                      </div>
                      {assignmentResults.slice(0, 5).map((item: any) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-start space-x-3 px-3 py-2.5 hover:bg-card-hover rounded-lg transition"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setLocalSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 bg-pink-50 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                              <ClipboardList className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{item.content}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* VIEW ALL */}
                  <div className="p-3 border-t border-border bg-muted rounded-b-xl">
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

        {/* Right Section — Profile icon visible on mobile, full controls on desktop */}
        <div className="flex items-center space-x-1 md:space-x-2">
          <ThemeToggle />
          <NotificationBell role={role} />
          <span className="text-xs md:text-sm text-muted-foreground hidden md:block">
            {roleLabel(role)}
          </span>
          <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
            <UserButton
              appearance={{
                variables: {
                  colorPrimary: 'var(--primary)',
                  colorBackground: 'var(--card)',
                  colorForeground: 'var(--foreground)',
                },
              }}
            />
          </div>
          </div>
          </div>
        </LiquidGlass>
      </header>

      {/* Mobile Search Overlay */}
      {isSearchFocused && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60"
            onClick={() => {
              setIsSearchFocused(false);
              setLocalSearch('');
            }}
          />
          <div className="relative bg-card pt-4 px-4 pb-4">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 mb-4"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search courses, videos, quizzes..."
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    if (onSearchChange) {
                      onSearchChange(e.target.value);
                    }
                  }}
                  autoFocus
                  className="w-full pl-10 pr-10 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-blue-500 focus:bg-card text-base transition text-foreground"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                {localSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSearchFocused(false);
                  setLocalSearch('');
                }}
                className="p-2 text-muted-foreground text-muted-foreground hover:text-foreground"
                aria-label="Close search"
              >
                <X className="w-6 h-6" />
              </button>
            </form>

            {/* Mobile Search Results */}
            {localSearch.length >= 2 && (
              <div className="max-h-[60vh] overflow-y-auto">
                {totalResults === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-muted-foreground text-sm">
                      No results found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcementResults.slice(0, 3).map((item: any) => (
                      <Link
                        key={item.id}
                        href={item.href || `/${role.toLowerCase()}/announcements`}
                        className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                        onClick={() => {
                          setIsSearchFocused(false);
                          setLocalSearch('');
                        }}
                      >
                        <Megaphone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.content}
                          </p>
                        </div>
                      </Link>
                    ))}
                    {videoResults.slice(0, 3).map((item: any) => (
                      <Link
                        key={item.id}
                        href={item.href || `/${role.toLowerCase()}/videos`}
                        className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                        onClick={() => {
                          setIsSearchFocused(false);
                          setLocalSearch('');
                        }}
                      >
                        <Video className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                    {courseResults.slice(0, 3).map((item: any) => (
                      <Link
                        key={item.id}
                        href={item.href || `/${role.toLowerCase()}/courses`}
                        className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                        onClick={() => {
                          setIsSearchFocused(false);
                          setLocalSearch('');
                        }}
                      >
                        <BookOpen className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.title || item.code}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar — liquid glass on desktop, hidden on mobile */}
      <aside
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)]
          transition-all duration-300 ease-in-out
          hidden md:block
          ${isCollapsed ? 'md:w-16' : 'md:w-64'}
        `}
      >
        <LiquidGlass radius={0} bevelDepth={6} scale={20} tint={0.5} className="h-full liquid-glass-fallback">
          <div className="flex flex-col h-full">
          {/* Role Badge */}
          <div className={`px-4 py-4 border-b border-border ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isCollapsed && <span className="text-xs font-medium text-muted-foreground">Role</span>}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-muted text-foreground ${isCollapsed ? 'text-[10px] px-2' : ''}`}>
                {roleLabel(role)}
              </span>
            </div>
          </div>

          {/* Organization Switcher - Visible to all authenticated users */}
          {!isCollapsed && (
            <div className="px-3 py-3 border-b border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Organization
              </div>
              <OrganizationSwitcher
                hidePersonal={true}
                createOrganizationUrl={role === 'SUPER_ADMIN' ? '/admin/organizations' : ''}
                appearance={{
                  elements: {
                    OrganizationSwitcherTrigger: 'w-full',
                    OrganizationSwitcherOrganizationIcon: 'w-6 h-6',
                  },
                }}
              />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            {Object.entries(groupedNavItems).map(([section, items]) => (
              <div key={section} className="mb-4">
                {!isCollapsed && (
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:text-foreground'
                          }
                          group relative
                        `}
                        title={isCollapsed ? item.label : ''}
                      >
                        <Icon className={`
                          transition-all duration-200 flex-shrink-0
                          ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground group-hover:text-foreground dark:group-hover:text-foreground'}
                          ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}
                        `} />
                        {!isCollapsed && <span className="text-sm">{item.label}</span>}
                        {isCollapsed && (
                          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
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
          <div className="px-2 py-3 border-t border-border">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`
                flex items-center w-full px-3 py-2 rounded-lg hover:bg-muted transition
                ${isCollapsed ? 'justify-center' : 'justify-between'}
              `}
            >
              {!isCollapsed && <span className="text-xs text-muted-foreground">Collapse</span>}
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* User Info */}
          <div className={`px-2 py-4 border-t border-border ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <UserButton
                appearance={{
                  variables: {
                    colorPrimary: 'var(--primary)',
                    colorBackground: 'var(--card)',
                    colorForeground: 'var(--foreground)',
                  },
                }}
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{role}</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </LiquidGlass>
      </aside>

      {/* Main Content — solid background so glass sidebar has something to blur against */}
      <div className="pt-16 pb-28 md:pb-0 transition-all duration-300 md:ml-64 bg-gray-50 dark:bg-[#0a0a0a]">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />

      {/* Mobile Navigation Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 bottom-0 w-64 max-w-[80vw] bg-card border-r border-border overflow-y-auto shadow-2xl">
            {/* Role Badge */}
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-foreground">
                {roleLabel(role)}
              </span>
            </div>
            {/* Mobile Nav Items */}
            <nav className="p-2 space-y-1">
              {Object.entries(groupedNavItems).map(([section, items]) => (
                <div key={section} className="mb-3">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section}
                  </div>
                  {items.map((item) => {
                    const isActive = pathname === item.href ||
                                    (item.href.includes('#') && pathname === item.href.split('#')[0]);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all min-h-[44px]
                          ${isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:text-foreground'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}