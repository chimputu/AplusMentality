'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Megaphone, Video, Calendar, Clock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Role } from '@/generated/prisma/client';

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

interface SearchHandlerProps {
  announcements: Announcement[];
  videos: Video[];
  totalAnnouncements: number;
  totalVideos: number;
  thisWeekAnnouncements: number;
  userName: string;
  role: Role;
}

// Component that actually uses useSearchParams
function SearchContent({
  announcements,
  videos,
  totalAnnouncements,
  totalVideos,
  thisWeekAnnouncements,
  userName,
  role,
}: SearchHandlerProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('search') || '';

  // Filter based on search query
  const displayAnnouncements = searchQuery
    ? announcements.filter((a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : announcements;

  const displayVideos = searchQuery
    ? videos.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : videos;

  const noResults = searchQuery && displayAnnouncements.length === 0 && displayVideos.length === 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      {!searchQuery && (
        <div className="mb-8 bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-medium text-yellow-400">Welcome Back</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Hello, {userName}! 👋
              </h1>
              <p className="text-slate-300 text-sm max-w-lg">
                Stay updated with the latest announcements and videos from your mentors.
                {totalAnnouncements > 0 && ` You have ${totalAnnouncements} new announcements to read.`}
              </p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2 bg-card/10 rounded-full px-4 py-1.5">
                  <span className="text-sm text-white">
                    {thisWeekAnnouncements} new this week
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-card/10 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Header */}
      {searchQuery && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Search Results</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Found {displayAnnouncements.length + displayVideos.length} results for "{searchQuery}"
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {!searchQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAnnouncements}</p>
                <p className="text-sm text-muted-foreground">Announcements</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Megaphone className="w-5 h-5 text-foreground" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{totalVideos}</p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Video className="w-5 h-5 text-foreground" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{thisWeekAnnouncements}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Calendar className="w-5 h-5 text-foreground" />
              </div>
            </div>
          </div>
        </div>
      )}

      {noResults && (
        <div className="mt-2 p-3 bg-muted rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            No results found for "<span className="font-medium">{searchQuery}</span>". Try a different search term.
          </p>
        </div>
      )}

      {/* Announcements Section */}
      {displayAnnouncements.length > 0 && (
        <section className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                {searchQuery ? `Announcements (${displayAnnouncements.length})` : 'Latest Announcements'}
              </h2>
            </div>
            {!searchQuery && announcements.length > 3 && (
              <Link
                href="/student#announcements"
                className="text-sm text-muted-foreground hover:text-foreground transition flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {displayAnnouncements.slice(0, searchQuery ? 20 : 3).map((announcement) => (
              <div key={announcement.id} className="py-4 first:pt-0 last:pb-0">
                <h3 className="font-medium text-foreground">{announcement.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{announcement.content}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{announcement.author.name || 'Unknown'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(announcement.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Videos Section */}
      {displayVideos.length > 0 && (
        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                {searchQuery ? `Videos (${displayVideos.length})` : 'Available Videos'}
              </h2>
            </div>
            {!searchQuery && videos.length > 2 && (
              <Link
                href="/student#videos"
                className="text-sm text-muted-foreground hover:text-foreground transition flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayVideos.slice(0, searchQuery ? 20 : 2).map((video) => (
              <div key={video.id} className="border border-border rounded-lg overflow-hidden hover:shadow-md transition">
                <video
                  controls
                  src={video.url}
                  className="w-full aspect-video bg-black"
                />
                <div className="p-3">
                  <h3 className="font-medium text-foreground text-sm">{video.title}</h3>
                  {video.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{video.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Uploaded by {video.uploader.name || 'Unknown'} • {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!searchQuery && displayAnnouncements.length === 0 && displayVideos.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No content yet</h3>
          <p className="text-muted-foreground text-sm">Check back later for announcements and videos from your mentors.</p>
        </div>
      )}
    </div>
  );
}

// Main exported component with Suspense boundary
export default function SearchHandler(props: SearchHandlerProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <SearchContent {...props} />
    </Suspense>
  );
}