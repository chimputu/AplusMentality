'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CreateAnnouncementForm from '@/components/CreateAnnouncementForm';
import AnnouncementList from '@/components/AnnouncementList';
import VideoUploadForm from '@/components/VideoUploadForm';
import VideoList from '@/components/VideoList';
import { Megaphone, Video, Sparkles } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
  };
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  createdAt: string;
  uploader: {
    name: string | null;
  };
}

export default function AdminDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'ADMIN' | 'STUDENT'>('ADMIN');

  // ✅ Get user's name from Clerk
  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || '';
  const displayName = firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Admin';

  // ✅ Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [announcementsRes, videosRes] = await Promise.all([
          fetch('/api/announcements'),
          fetch('/api/videos'),
        ]);

        const announcementsData = await announcementsRes.json();
        const videosData = await videosRes.json();

        setAnnouncements(announcementsData);
        setVideos(videosData);
        
        // Get user role from metadata
        const role = user?.publicMetadata?.role as string || 'ADMIN';
        setRole(role as 'ADMIN' | 'STUDENT');
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchData();
    }
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <h1 className="text-2xl font-bold">
              Welcome back, {displayName}! 👑
            </h1>
          </div>
          <p className="text-gray-300 text-sm">
            Manage announcements, upload videos, and keep your students engaged.
          </p>
        </div>

        {/* Announcements Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
      </div>
    </DashboardLayout>
  );
}