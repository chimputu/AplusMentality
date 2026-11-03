'use client';

import Link from 'next/link';
import {
  Users,
  MessageSquare,
  BookOpen,
  CheckCircle,
  Clock,
  Star,
  Settings,
  GraduationCap,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface TutorContentProps {
  displayName: string;
  tutorProfile: any;
  requests: any[];
  application: any;
  stats: {
    pendingRequests: number;
    acceptedRequests: number;
    totalRequests: number;
    specialtyCount: number;
    isVerified: boolean;
    isActive: boolean;
    applicationStatus: string | null;
  };
  institutionId?: string;
  institutionName: string | null;
}

export default function TutorContent({
  displayName,
  tutorProfile,
  requests,
  application,
  stats,
  institutionName,
}: TutorContentProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-black rounded-2xl p-6">
        {/* Decorative glow effect */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-blue-400 text-sm font-medium uppercase tracking-wider">Welcome back</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">{displayName}!</h1>
            <p className="text-slate-300 mt-2">
              {institutionName ? `Teaching at ${institutionName}` : 'Manage your tutoring sessions'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.isVerified && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-white/15 transition-colors">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Verified
              </span>
            )}
            {stats.isActive && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-white/15 transition-colors">
                <Clock className="w-4 h-4 text-blue-400" />
                Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Application Status Banner */}
      {application && application.status === 'PENDING' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">
              Application Under Review
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
              Your tutor application is currently being reviewed. You&apos;ll be notified once it&apos;s approved.
            </p>
          </div>
        </div>
      )}

      {application && application.status === 'REJECTED' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              Application Rejected
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
              {application.rejectionReason || 'Your tutor application was not approved. Please contact support for more information.'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Pending Requests"
          value={stats.pendingRequests}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Accepted Sessions"
          value={stats.acceptedRequests}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Requests"
          value={stats.totalRequests}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Specialties"
          value={stats.specialtyCount}
          color="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickActionCard
            icon={<MessageSquare className="w-5 h-5" />}
            title="View Requests"
            description="Manage student tutoring requests"
            href="/tutor/requests"
          />
          <QuickActionCard
            icon={<BookOpen className="w-5 h-5" />}
            title="My Specialties"
            description="Courses you offer tutoring for"
            href="/tutor/specialties"
          />
          <QuickActionCard
            icon={<Settings className="w-5 h-5" />}
            title="Profile Settings"
            description="Update your tutor profile"
            href="/tutor/settings"
          />
          <QuickActionCard
            icon={<FileText className="w-5 h-5" />}
            title="Application Status"
            description="Check your application progress"
            href="/apply-as-tutor/status"
          />
          <QuickActionCard
            icon={<Star className="w-5 h-5" />}
            title="Ratings & Reviews"
            description="See student feedback"
            href="/tutor/reviews"
          />
          <QuickActionCard
            icon={<GraduationCap className="w-5 h-5" />}
            title="My Offerings"
            description="Manage your course offerings"
            href="/tutor/offerings"
          />
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Requests
          </h2>
          <Link
            href="/tutor/requests"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-foreground dark:text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tutoring requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Students will appear here when they request your help
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 5).map((request: any) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-muted dark:bg-background rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {request.studentName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.courseNeeded || 'General tutoring'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(request.status)}`}>
                    {request.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specialties */}
      {tutorProfile?.specialties?.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Your Specialties
          </h2>
          <div className="flex flex-wrap gap-2">
            {tutorProfile.specialties.map((specialty: any) => (
              <span
                key={specialty.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
              >
                <BookOpen className="w-4 h-4" />
                {specialty.course?.code}: {specialty.course?.title}
              </span>
            ))}
          </div>
        </div>
      )}
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
      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
        {icon}
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'ACCEPTED':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'REJECTED':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'COMPLETED':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    default:
      return 'bg-muted dark:bg-card text-foreground';
  }
}
