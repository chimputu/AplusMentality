'use client';
import { Megaphone, Video, Users, Sparkles } from 'lucide-react';
import CreateAnnouncementForm from './CreateAnnouncementForm';
import AnnouncementList from './AnnouncementList';
import VideoUploadForm from './VideoUploadForm';
import VideoList from './VideoList';
import UserManagement from '@/components/UserManagement';

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
}

interface AdminContentProps {
  announcements: Announcement[];
  videos: Video[];
  users: User[];
  activeTab: string;
  displayName: string;
  role: 'ADMIN' | 'STUDENT';
}

export default function AdminContent({
  announcements,
  videos,
  users,
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
  // (We'll use useEffect but it's safe here)
  if (typeof window !== 'undefined' && activeTab !== 'dashboard') {
    // Use setTimeout to let DOM render
    setTimeout(() => scrollToSection(activeTab), 200);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div id="dashboard" className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-lg scroll-mt-20">
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold">Welcome back, {displayName}! 👑</h1>
        </div>
        <p className="text-gray-300 text-sm">
          Manage announcements, upload videos, and keep your students engaged.
        </p>
        <div className="flex gap-4 mt-4">
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
        </div>
      </div>

      {/* Announcements Section */}
      <section id="announcements" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
          </div>
          <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {announcements.length} total
          </span>
        </div>
        <CreateAnnouncementForm />
        <div className="mt-8">
          <AnnouncementList announcements={announcements} isAdmin />
        </div>
      </section>

      {/* Videos Section */}
      <section id="videos" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-800">Videos</h2>
          </div>
          <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {videos.length} total
          </span>
        </div>
        <VideoUploadForm />
        <div className="mt-8">
          <VideoList videos={videos} isAdmin />
        </div>
      </section>

      {/* Users Section */}
      <section id="users" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-800">Users</h2>
          </div>
          <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {users.length} total
          </span>
        </div>
        <UserManagement users={users} />
      </section>
    </div>
  );
}