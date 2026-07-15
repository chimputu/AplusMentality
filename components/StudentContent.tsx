'use client';
import { useState } from 'react';
import { Megaphone, Video, Search, Calendar, User, Play, Film, BookOpen, GraduationCap } from 'lucide-react';
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

interface StudentContentProps {
  announcements: Announcement[];
  videos: Video[];
  displayName: string;
  searchQuery?: string;
  enrolledCourses?: any[];
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

export default function StudentContent({
  announcements,
  videos,
  displayName,
  searchQuery = '',
  enrolledCourses = [],
}: StudentContentProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredAnnouncements = announcements.filter((announcement) =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isYouTube = (video: Video) => {
    if (video.source === 'youtube') return true;
    if (video.youtubeId) return true;
    return video.url?.includes('youtube.com') || video.url?.includes('youtu.be');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Welcome back, {displayName}! 👋</h1>
        <p className="text-blue-100 mt-1">Stay updated with the latest announcements and videos.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{filteredAnnouncements.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Announcements</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{filteredVideos.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Videos</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{enrolledCourses.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{displayName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search announcements and videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Announcements Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Announcements</h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
            {filteredAnnouncements.length} total
          </span>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No announcements match your search.' : 'No announcements yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition"
              >
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
                  {announcement.title}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {announcement.author.name || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Videos Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Videos</h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
            {filteredVideos.length} total
          </span>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No videos match your search.' : 'No videos available yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVideos.map((video) => {
              const isYoutube = isYouTube(video);
              const youtubeId = video.youtubeId || extractYouTubeId(video.url);

              return (
                <div
                  key={video.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  {isYoutube && youtubeId ? (
                    <div className="relative w-full aspect-video bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full aspect-video bg-black">
                      <video
                        controls
                        preload="metadata"
                        className="w-full h-full"
                      >
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="text-sm md:text-lg font-semibold text-gray-800 dark:text-gray-100 break-words">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm mt-1">
                        {video.description}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-1">
                      {isYoutube && (
                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          YouTube
                        </span>
                      )}
                      <span>
                        Uploaded by {video.uploader?.name || 'Unknown'} •{' '}
                        {new Date(video.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}