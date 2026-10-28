'use client';
import { Megaphone, Video, Users, Settings, BookOpen, FileText, GraduationCap, ListTodo } from 'lucide-react';
import CreateAnnouncementForm from './CreateAnnouncementForm';
import AnnouncementList from './AnnouncementList';
import VideoUploadForm from './VideoUploadForm';
import VideoList from './VideoList';
import UserManagement from '@/components/UserManagement';
import Link from 'next/link';
import BannerCarousel from '@/components/banner-carousel';
import type { Role } from '@/generated/prisma/client';

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
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  imageUrl: string | null;
  role: Role;
  institutionId: string | null;
  facultyId: string | null;
  programmeId: string | null;
  branchId: string | null;
  year: number | null;
  period: string | null;
  onboarded: boolean;
  institution?: { id: string; name: string; shortName: string } | null;
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
  role: Role;
  institutionId?: string;
}

export default function AdminContent({
  announcements,
  videos,
  users,
  courses = [],
  activeTab,
  displayName,
  role,
  institutionId,
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

  // Calculate course stats from lightweight _count fields
  const totalModules = courses.reduce((acc: number, c: any) => acc + (c._count?.modules || 0), 0);
  const totalLessons = 0; // Not fetched on dashboard to keep query lightweight
  const totalStudents = courses.reduce((acc: number, c: any) => acc + (c._count?.enrollments || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Banners */}
      <BannerCarousel placement="DASHBOARD" institutionId={institutionId} />

      {/* Welcome Section */}
      <div id="dashboard" className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 text-white shadow-lg scroll-mt-20">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-2xl font-bold">Welcome back, {displayName}! </h1>
        </div>
        <p className="text-slate-300 text-sm">
          Manage announcements, upload videos, and keep your students engaged.
        </p>
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="bg-card/10 rounded-lg px-4 py-2">
            <span className="text-sm text-white">Announcements</span>
            <p className="text-xl font-bold text-white">{announcements.length}</p>
          </div>
          <div className="bg-card/10 rounded-lg px-4 py-2">
            <span className="text-sm text-white">Videos</span>
            <p className="text-xl font-bold text-white">{videos.length}</p>
          </div>
          <div className="bg-card/10 rounded-lg px-4 py-2">
            <span className="text-sm text-white">Users</span>
            <p className="text-xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-card/10 rounded-lg px-4 py-2">
            <span className="text-sm text-white">Courses</span>
            <p className="text-xl font-bold text-white">{courses.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats - Courses Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Total Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalModules}</p>
              <p className="text-sm text-muted-foreground">Modules</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalLessons}</p>
              <p className="text-sm text-muted-foreground">Lessons</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">Enrolled Students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/admin/submissions"
          className="bg-card hover:bg-muted  rounded-xl p-4 text-center transition border border-border"
        >
          <ListTodo className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <span className="text-sm font-medium text-foreground">View Submissions</span>
        </Link>
        <Link
          href="/admin/courses"
          className="bg-card hover:bg-muted  rounded-xl p-4 text-center transition border border-border"
        >
          <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <span className="text-sm font-medium text-foreground">Manage Courses</span>
        </Link>
        <Link
          href="/admin/quizzes"
          className="bg-card hover:bg-muted  rounded-xl p-4 text-center transition border border-border"
        >
          <FileText className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <span className="text-sm font-medium text-foreground">Manage Quizzes</span>
        </Link>
        <Link
          href="/admin/users"
          className="bg-card hover:bg-muted  rounded-xl p-4 text-center transition border border-border"
        >
          <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <span className="text-sm font-medium text-foreground">Manage Users</span>
        </Link>
        <Link
          href="/admin/settings"
          className="bg-card hover:bg-muted  rounded-xl p-4 text-center transition border border-border"
        >
          <Settings className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <span className="text-sm font-medium text-foreground">Settings</span>
        </Link>
      </div>

      {/* Announcements Section */}
      <section id="announcements" className="bg-card rounded-2xl shadow-sm border border-border p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Announcements</h2>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {announcements.length} total
          </span>
        </div>
        <CreateAnnouncementForm />
        <div className="mt-8">
          <AnnouncementList announcements={announcements} isAdmin={true} />
        </div>
      </section>

      {/* Videos Section */}
      <section id="videos" className="bg-card rounded-2xl shadow-sm border border-border p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Videos</h2>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {videos.length} total
          </span>
        </div>
        <VideoUploadForm />
        <div className="mt-8">
          <VideoList videos={videos} isAdmin={true} />
        </div>
      </section>

      {/* Users Section */}
      <section id="users" className="bg-card rounded-2xl shadow-sm border border-border p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Users</h2>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {users.length} total
          </span>
        </div>
        <UserManagement users={users} />
      </section>
    </div>
  );
}