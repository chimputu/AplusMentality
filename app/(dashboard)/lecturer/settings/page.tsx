import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { User, Mail, MapPin, BookOpen, Video, Presentation, FileText, FileQuestion, Megaphone, Users, ClipboardList } from 'lucide-react';

export default async function LecturerSettingsPage() {
  const { userId, user } = await requireAuth(['LECTURER']);

  // Fetch lecturer profile
  let dbUser: any = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        name: true,
        institution: {
          select: {
            shortName: true,
            name: true,
          },
        },
      },
    });
  } catch (err) {
    console.error('[LecturerSettings] Failed to fetch data:', err);
  }

  // Fetch lecturer stats
  let stats: { courses: number; enrollments: number; assessments: number } = {
    courses: 0,
    enrollments: 0,
    assessments: 0,
  };
  try {
    if (dbUser) {
      const [coursesCount, enrollmentsCount, assessmentsCount] = await Promise.all([
        prisma.course.count({ where: { createdBy: dbUser.id } }),
        prisma.enrollment.count({ where: { course: { createdBy: dbUser.id } } }),
        prisma.assessment.count({ where: { createdBy: dbUser.id } }),
      ]);
      stats = {
        courses: coursesCount,
        enrollments: enrollmentsCount,
        assessments: assessmentsCount,
      };
    }
  } catch (err) {
    console.error('[LecturerSettings] Failed to fetch stats:', err);
  }

  const displayName = user?.firstName || user?.name || 'Lecturer';
  const email = user?.email || '';
  const institutionName = user?.institution?.shortName || user?.institution?.name || null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Manage your lecturer profile and account settings
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Information
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Full Name
              </label>
              <p className="text-gray-900 dark:text-gray-100">{displayName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {email}
              </p>
            </div>
          </div>

          {institutionName && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Institution
                </label>
                <p className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {institutionName}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lecturer Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Teaching Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.courses}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Courses</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.enrollments}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enrollments</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.assessments}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assessments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/lecturer/courses"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">My Courses</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your courses</p>
            </div>
          </a>
          <a
            href="/lecturer/videos"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Video className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Videos</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upload and manage videos</p>
            </div>
          </a>
          <a
            href="/lecturer/lecture-slides"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Presentation className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Lecture Slides</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Share lecture materials</p>
            </div>
          </a>
          <a
            href="/lecturer/past-papers"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Past Papers</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upload exam papers</p>
            </div>
          </a>
          <a
            href="/lecturer/quizzes"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <FileQuestion className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Quizzes & Tests</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Create assessments</p>
            </div>
          </a>
          <a
            href="/lecturer/announcements"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Announcements</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Post to students</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
