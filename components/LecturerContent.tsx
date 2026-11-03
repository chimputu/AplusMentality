'use client';

import Link from 'next/link';
import {
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  Video,
  Presentation,
  FileQuestion,
  Megaphone,
  TrendingUp,
  GraduationCap,
  CheckCircle,
} from 'lucide-react';

interface LecturerContentProps {
  displayName: string;
  stats: {
    courses: number;
    enrollments: number;
    assessments: number;
    submissions: number;
  };
  submissions: any[];
  enrollments: any[];
  institutionName: string | null;
}

export default function LecturerContent({
  displayName,
  stats,
  submissions,
  enrollments,
  institutionName,
}: LecturerContentProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-black rounded-2xl p-6">
        {/* Decorative glow effect */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-indigo-400 text-sm font-medium uppercase tracking-wider">Welcome back</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">{displayName}!</h1>
            <p className="text-slate-300 mt-2">
              {institutionName
                ? `Lecturing at ${institutionName}`
                : 'Manage your courses and assessments'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-white/15 transition-colors">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              Lecturer
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="My Courses"
          value={stats.courses}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Enrollments"
          value={stats.enrollments}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Assessments"
          value={stats.assessments}
          color="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="Submissions"
          value={stats.submissions}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickActionCard
            icon={<BookOpen className="w-5 h-5" />}
            title="My Courses"
            description="Manage your courses"
            href="/lecturer/courses"
          />
          <QuickActionCard
            icon={<Video className="w-5 h-5" />}
            title="Videos"
            description="Upload and manage videos"
            href="/lecturer/videos"
          />
          <QuickActionCard
            icon={<Presentation className="w-5 h-5" />}
            title="Lecture Slides"
            description="Share lecture materials"
            href="/lecturer/lecture-slides"
          />
          <QuickActionCard
            icon={<FileText className="w-5 h-5" />}
            title="Past Papers"
            description="Upload exam papers"
            href="/lecturer/past-papers"
          />
          <QuickActionCard
            icon={<FileQuestion className="w-5 h-5" />}
            title="Quizzes & Tests"
            description="Create assessments"
            href="/lecturer/quizzes"
          />
          <QuickActionCard
            icon={<Megaphone className="w-5 h-5" />}
            title="Announcements"
            description="Post to students"
            href="/lecturer/announcements"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Submissions</h2>
            <Link
              href="/lecturer/grades"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all
            </Link>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-foreground dark:text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No submissions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Student submissions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission: any) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 bg-muted dark:bg-background rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {submission.user?.name || 'Student'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {submission.assessment?.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground">
                      {submission.percentage !== null ? `${submission.percentage}%` : 'Pending'}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Enrollments</h2>
            <Link
              href="/lecturer/enrollments"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-foreground dark:text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No enrollments yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Students enrolled in your courses will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 bg-muted dark:bg-background rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {enrollment.user?.name || 'Student'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.course?.code}: {enrollment.course?.title}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 ${bgColor} ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, href }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-4 bg-muted dark:bg-background rounded-lg hover:bg-muted dark:hover:bg-card transition group"
    >
      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
        {icon}
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
