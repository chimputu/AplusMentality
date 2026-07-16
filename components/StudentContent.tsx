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
  Play,
} from 'lucide-react';
import Link from 'next/link';

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
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      </div>
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">{icon}</div>
    </div>
  );
}

export default function StudentContent({
  announcements,
  videos,
  displayName,
  searchQuery = '',
}: StudentContentProps) {
  const q = searchQuery.toLowerCase();

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
      icon: <Play className="w-6 h-6 text-red-500" />,
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
  ];

  return (
    <div className="w-full space-y-6">
      {/* ── Hero Banner (Dark, like the black design) ── */}
      <div className="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#1a2235] to-[#0f172a] p-8 md:p-10 text-white shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">
                Welcome Back
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Hello, {displayName}! 👋
            </h1>
            <p className="text-gray-300 mt-2 text-sm md:text-base">
              Stay updated with the latest announcements and videos from your
              mentors.
            </p>
            <div className="inline-flex items-center gap-2 mt-5 bg-white/10 border border-white/10 px-4 py-2 rounded-full">
              <Bell className="w-4 h-4 text-gray-300" />
              <span className="text-sm text-gray-200">
                {newThisWeek} new this week
              </span>
            </div>
          </div>

          {/* Avatar circle with initial */}
          <div className="hidden sm:flex w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 border border-white/10 items-center justify-center flex-shrink-0">
            <span className="text-2xl md:text-3xl font-bold">{initial}</span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards (Outside hero, like the black design) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          value={filteredAnnouncements.length}
          label="Announcements"
          icon={<Megaphone className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
        />
        <StatCard
          value={filteredVideos.length}
          label="Videos"
          icon={<Video className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
        />
        <StatCard
          value={newThisWeek}
          label="This Week"
          icon={<Calendar className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
        />
      </div>

      {/* ── Action Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:scale-[1.02] transition group"
          >
            <div className={`w-12 h-12 ${action.bg} rounded-xl flex items-center justify-center mb-3`}>
              {action.icon}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {action.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {action.subtitle}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Available Videos ── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
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
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Video className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>{searchQuery ? 'No videos match your search.' : 'No videos available yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVideos.slice(0, 4).map((video) => {
              const yt = isYouTube(video);
              const ytId = video.youtubeId || extractYouTubeId(video.url);

              return (
                <div
                  key={video.id}
                  className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition"
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
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      {yt && (
                        <span className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded font-medium">
                          <Film className="w-3 h-3" />
                          YouTube
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {video.uploader?.name || 'Unknown'} •{' '}
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Latest Announcements ── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
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
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>{searchQuery ? 'No announcements match your search.' : 'No announcements yet.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnouncements.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {a.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {a.author.name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(a.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                      {a.content}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}