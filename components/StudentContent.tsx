'use client';
import { Megaphone, Video, Calendar, Clock, User, ArrowRight, Sparkles, Bell } from 'lucide-react';
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
  searchQuery: string;
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

function isYouTubeVideo(video: Video): boolean {
  if (video.source === 'youtube') return true;
  if (video.youtubeId) return true;
  return video.url?.includes('youtube.com') || video.url?.includes('youtu.be');
}

export default function StudentContent({
  announcements,
  videos,
  displayName,
  searchQuery,
}: StudentContentProps) {
  // Filter client-side for search
  const displayAnnouncements = searchQuery
    ? announcements.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : announcements;

  const displayVideos = searchQuery
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (v.description &&
            v.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : videos;

  const totalAnnouncements = announcements.length;
  const totalVideos = videos.length;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekAnnouncements = announcements.filter(
    (a) => new Date(a.createdAt) >= startOfWeek
  ).length;

  const noResults =
    searchQuery &&
    displayAnnouncements.length === 0 &&
    displayVideos.length === 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Hero */}
      {!searchQuery && (
        <div className="mb-8 bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Welcome Back</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Hello, {displayName}! 👋</h1>
              <p className="text-gray-300 text-sm max-w-lg">
                Stay updated with the latest announcements and videos from your mentors.
                {totalAnnouncements > 0 &&
                  ` You have ${totalAnnouncements} announcements to read.`}
              </p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-1.5">
                  <Bell className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-300">
                    {thisWeekAnnouncements} new this week
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Header */}
      {searchQuery && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Search Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Found {displayAnnouncements.length + displayVideos.length} results for "{searchQuery}"
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {!searchQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalAnnouncements}</p>
                <p className="text-sm text-gray-500">Announcements</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Megaphone className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalVideos}</p>
                <p className="text-sm text-gray-500">Videos</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Video className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{thisWeekAnnouncements}</p>
                <p className="text-sm text-gray-500">This Week</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {noResults && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            No results found for "<span className="font-medium">{searchQuery}</span>". Try a different search term.
          </p>
        </div>
      )}

      {/* Announcements */}
      {displayAnnouncements.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-800">
                {searchQuery ? `Announcements (${displayAnnouncements.length})` : 'Latest Announcements'}
              </h2>
            </div>
            {!searchQuery && announcements.length > 3 && (
              <Link href="/student#announcements" className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center space-x-1">
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {displayAnnouncements.slice(0, searchQuery ? 20 : 3).map((a) => (
              <div key={a.id} className="py-4 first:pt-0 last:pb-0">
                <h3 className="font-medium text-gray-800">{a.title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{a.content}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{a.author.name || 'Unknown'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Videos */}
      {displayVideos.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-800">
                {searchQuery ? `Videos (${displayVideos.length})` : 'Available Videos'}
              </h2>
            </div>
            {!searchQuery && videos.length > 2 && (
              <Link href="/student#videos" className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center space-x-1">
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayVideos.slice(0, searchQuery ? 20 : 2).map((video) => {
              const youtube = isYouTubeVideo(video);
              const youtubeId = video.youtubeId || extractYouTubeId(video.url);

              return (
                <div key={video.id} className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition">
                  {youtube && youtubeId ? (
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
                    <video controls src={video.url} className="w-full aspect-video bg-black" />
                  )}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 text-sm">{video.title}</h3>
                    {video.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{video.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      {youtube && (
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-medium">YouTube</span>
                      )}
                      <p className="text-xs text-gray-400">
                        Uploaded by {video.uploader.name || 'Unknown'} • {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!searchQuery && displayAnnouncements.length === 0 && displayVideos.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No content yet</h3>
          <p className="text-gray-500 text-sm">Check back later for announcements and videos from your mentors.</p>
        </div>
      )}
    </div>
  );
}