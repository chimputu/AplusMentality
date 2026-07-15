'use client';
import { Megaphone, Video, Users, Sparkles, BookOpen, FileText, GraduationCap } from 'lucide-react';
import CreateAnnouncementForm from './CreateAnnouncementForm';
import AnnouncementList from './AnnouncementList';
import VideoUploadForm from './VideoUploadForm';
import VideoList from './VideoList';
import UserManagement from '@/components/UserManagement';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { name: string | null };
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source?: string | null;
  youtubeId?: string | null;
  createdAt: string;
  uploader: { name: string | null };
}

interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'STUDENT';
  createdAt: string;
  enrollments?: any[];
  courses?: any[];
  _count?: {
    enrollments: number;
    courses: number;
    announcements: number;
    videos: number;
    quizzes: number;
    tests: number;
    assignments: number;
  };
}

interface AdminContentProps {
  announcements: Announcement[];
  videos: Video[];
  users: User[];
  courses?: any[];
  activeTab: string;
  displayName: string;
  role: 'ADMIN' | 'STUDENT';
}

export default function AdminContent({
  announcements,
  videos,
  users,
  courses = [],
  activeTab,
  displayName,
  role,
}: AdminContentProps) {
  // Scroll to section when tab changes
  const scrollToSection = (tab: string) => {
    if (tab !== 'dashboard') {
      const element = document.getElementById(tab);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Trigger scroll on mount if tab is not dashboard
  if (typeof window !== 'undefined' && activeTab !== 'dashboard') {
    setTimeout(() => scrollToSection(activeTab), 200);
  }

  // Calculate course stats
  const totalModules = courses.reduce((acc: number, c: any) => acc + (c.modules?.length || 0), 0);
  const totalLessons = courses.reduce((acc: number, c: any) => 
    acc + c.modules?.reduce((a: number, m: any) => a + (m.lessons?.length || 0), 0) || 0, 0
  );
  const totalStudents = courses.reduce((acc: number, c: any) => acc + (c.enrollments?.length || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div id="dashboard" className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 text-white shadow-lg scroll-mt-20">
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold">Welcome back, {displayName}! 👑</h1>
        </div>
        <p className="text-gray-300 text-sm">
          Manage announcements, upload videos, and keep your students engaged.
        </p>
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Announcements</span>
            <p className="text-xl font-bold text-white">{announcements.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Videos</span>
            <p className="text-xl font-bold text-white">{videos.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Users</span>
            <p className="text-xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Courses</span>
            <p className="text-xl font-bold text-white">{courses.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats - Courses Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{courses.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalModules}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Modules</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalLessons}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lessons</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalStudents}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled Students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/admin/courses"
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl p-4 text-center transition border border-gray-100 dark:border-gray-700"
        >
          <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Courses</span>
        </Link>
        <Link
          href="/admin/quizzes"
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl p-4 text-center transition border border-gray-100 dark:border-gray-700"
        >
          <FileText className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Quizzes</span>
        </Link>
        <Link
          href="/admin/users"
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl p-4 text-center transition border border-gray-100 dark:border-gray-700"
        >
          <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Users</span>
        </Link>
        <Link
          href="/admin/settings"
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl p-4 text-center transition border border-gray-100 dark:border-gray-700"
        >
          <Sparkles className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
        </Link>
      </div>

      {/* Announcements Section */}
      <section id="announcements" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Announcements</h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
            {announcements.length} total
          </span>
        </div>
        <CreateAnnouncementForm />
        <div className="mt-8">
          <AnnouncementList announcements={announcements} isAdmin={true} />
        </div>
      </section>

      {/* Videos Section */}
      <section id="videos" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Videos</h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
            {videos.length} total
          </span>
        </div>
        <VideoUploadForm />
        <div className="mt-8">
          <VideoList videos={videos} isAdmin={true} />
        </div>
      </section>

      {/* Users Section */}
      <section id="users" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Users</h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
            {users.length} total
          </span>
        </div>
        <UserManagement users={users} />
      </section>
    </div>
  );
}