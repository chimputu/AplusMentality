'use client';

import {
  Megaphone,
  Video,
  Calendar,
  Bell,
  Film,
  Sparkles,
  User,
  ChevronRight,
  BookOpen,
  HelpCircle,
  ClipboardList,
  GraduationCap,
  School,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import BannerCarousel from '@/components/banner-carousel';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { name: string | null };
}

interface VideoItem {
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
  videos: VideoItem[];
  displayName: string;
  searchQuery?: string;
  institutionId?: string;
  universityName?: string | null;
  universityCode?: string | null;
  programmeName?: string | null;
  year?: number | null;
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

// ✅ Deterministic date formatter — same output on server and client
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ✅ Deterministic short date formatter for announcements
function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const isThisWeek = (dateString: string) => {
  const date = new Date(dateString);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo;
};

function StatCard({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex items-center justify-between">
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
      <div className="p-3 bg-muted rounded-xl">{icon}</div>
    </div>
  );
}

export default function StudentContent({
  announcements,
  videos,
  displayName,
  searchQuery,
  institutionId,
  universityName,
  universityCode,
  programmeName,
  year,
}: StudentContentProps) {
  const q = (searchQuery || '').toLowerCase();

  const filteredVideos = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(q) ||
      (v.description?.toLowerCase() || '').includes(q)
  );

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
  );

  const isYouTube = (video: VideoItem) => {
    if (video.source === 'youtube') return true;
    if (video.youtubeId) return true;
    return video.url?.includes('youtube.com') || video.url?.includes('youtu.be');
  };

  const newThisWeek =
    announcements.filter((a) => isThisWeek(a.createdAt)).length +
    videos.filter((v) => isThisWeek(v.createdAt)).length;

  const initial = displayName?.charAt(0)?.toUpperCase() || 'S';

  const actions = [
    {
      icon: <BookOpen className="w-6 h-6 text-blue-500" />,
      bg: 'bg-blue-50',
      title: 'My Courses',
      subtitle: 'Continue learning',
      href: '/student/courses',
    },
    {
      icon: <Video className="w-6 h-6 text-red-500" />,
      bg: 'bg-red-50',
      title: 'Watch Videos',
      subtitle: 'Learn visually',
      href: '/student/videos',
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-purple-500" />,
      bg: 'bg-purple-50',
      title: 'Take Quizzes',
      subtitle: 'Test your knowledge',
      href: '/student/quizzes',
    },
    {
      icon: <ClipboardList className="w-6 h-6 text-green-500" />,
      bg: 'bg-green-50',
      title: 'Assignments',
      subtitle: 'Submit your work',
      href: '/student/assignments',
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-emerald-500" />,
      bg: 'bg-emerald-50',
      title: 'Apply as Tutor',
      subtitle: 'Share your knowledge',
      href: '/apply-as-tutor',
    },
    {
      icon: <Compass className="w-6 h-6 text-indigo-500" />,
      bg: 'bg-indigo-50',
      title: 'Explore Universities',
      subtitle: 'Browse other institutions',
      href: '/explore',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Announcements Banner */}
      <BannerCarousel placement="DASHBOARD" institutionId={institutionId} />

      {/* Hero Banner */}
      <div className="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#1a2235] to-[#0f172a] p-8 md:p-10 text-foreground shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-yellow-400">
                Welcome Back
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Hello, {displayName}! 
            </h1>
            {(universityName || programmeName || year) && (
              <div className="mt-3 flex flex-wrap gap-3">
                {universityName && (
                  <div className="inline-flex items-center gap-2 bg-card/10 border border-white/10 px-3 py-1.5 rounded-lg">
                    <School className="w-4 h-4 text-blue-300" />
                    <span className="text-sm text-foreground">
                      {universityName}
                      {universityCode && (
                        <span className="text-muted-foreground ml-1">({universityCode})</span>
                      )}
                    </span>
                  </div>
                )}
                {programmeName && (
                  <div className="inline-flex items-center gap-2 bg-card/10 border border-white/10 px-3 py-1.5 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-green-300" />
                    <span className="text-sm text-foreground">{programmeName}</span>
                  </div>
                )}
                {year && (
                  <div className="inline-flex items-center gap-2 bg-card/10 border border-white/10 px-3 py-1.5 rounded-lg">
                    <BookOpen className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm text-foreground">Year {year}</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-foreground mt-3 text-sm md:text-base">
              Stay updated with the latest announcements and videos from your mentors.
            </p>
            <div className="inline-flex items-center gap-2 mt-5 bg-card/10 border border-white/10 px-4 py-2 rounded-full">
              <Bell className="w-4 h-4 text-foreground" />
              <span className="text-sm text-foreground">
                {newThisWeek} new this week
              </span>
            </div>
          </div>

          <div className="hidden sm:flex w-16 h-16 md:w-20 md:h-20 rounded-full bg-card/10 border border-white/10 items-center justify-center flex-shrink-0">
            <span className="text-2xl md:text-3xl font-bold">{initial}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          value={filteredAnnouncements.length}
          label="Announcements"
          icon={<Megaphone className="w-6 h-6 text-muted-foreground dark:text-foreground" />}
        />
        <StatCard
          value={filteredVideos.length}
          label="Videos"
          icon={<Video className="w-6 h-6 text-muted-foreground dark:text-foreground" />}
        />
        <StatCard
          value={newThisWeek}
          label="This Week"
          icon={<Calendar className="w-6 h-6 text-muted-foreground dark:text-foreground" />}
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="bg-card rounded-2xl p-5 shadow-sm border border-border hover:shadow-md hover:scale-[1.02] transition group"
          >
            <div
              className={`w-12 h-12 ${action.bg} rounded-xl flex items-center justify-center mb-3`}
            >
              {action.icon}
            </div>
            <h3 className="font-semibold text-foreground text-sm">
              {action.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {action.subtitle}
            </p>
          </Link>
        ))}
      </div>

      {/* Available Videos */}
      <section className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-foreground" />
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              Available Videos
            </h2>
          </div>
          <Link
            href="/student/videos"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
          >
            View all →
          </Link>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-3 text-foreground dark:text-muted-foreground" />
            <p>
              {searchQuery
                ? 'No videos match your search.'
                : 'No videos available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVideos.slice(0, 4).map((video) => {
              const yt = isYouTube(video);
              const ytId = video.youtubeId || extractYouTubeId(video.url);

              return (
                <div
                  key={video.id}
                  className="rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition"
                >
                  <div className="relative w-full aspect-video bg-black">
                    {yt && ytId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title={video.title}
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                      />
                    ) : (
                      <video
                        controls
                        src={video.url}
                        className="absolute top-0 left-0 w-full h-full"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-foreground line-clamp-1">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      {yt && (
                        <span className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded font-medium">
                          <Film className="w-3 h-3" />
                          YouTube
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {video.uploader?.name || 'Unknown'} •{' '}
                        {formatDate(video.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Latest Announcements */}
      <section className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-foreground" />
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              Latest Announcements
            </h2>
          </div>
          <Link
            href="/student/announcements"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
          >
            View all →
          </Link>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-foreground dark:text-muted-foreground" />
            <p>
              {searchQuery
                ? 'No announcements match your search.'
                : 'No announcements yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnouncements.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="border border-border rounded-xl p-4 hover:bg-muted /50 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {a.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {a.author.name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatShortDate(a.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-foreground mt-2 line-clamp-2">
                      {a.content}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground dark:text-muted-foreground group-hover:text-blue-500 transition flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}