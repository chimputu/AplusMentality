import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Settings, User, Mail, Phone, MapPin, GraduationCap, CheckCircle, AlertCircle } from 'lucide-react';

export default async function TutorSettingsPage() {
  const { userId, user } = await requireAuth(['TUTOR', 'LECTURER']);

  // Fetch tutor profile and application
  let tutorProfile: any = null;
  let application: any = null;
  try {
    const dbUser = await prisma.user.findUnique({
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

    if (dbUser) {
      [tutorProfile, application] = await Promise.all([
        prisma.tutor.findFirst({
          where: { userId: dbUser.id },
          include: {
            specialties: {
              include: { course: true },
            },
          },
        }),
        prisma.tutorApplication.findUnique({
          where: { userId: dbUser.id },
          include: {
            offerings: {
              include: { course: true },
            },
            references: true,
          },
        }),
      ]);
    }
  } catch (err) {
    console.error('[TutorSettings] Failed to fetch data:', err);
  }

  const displayName = user?.firstName || user?.name || 'Tutor';
  const email = user?.email || '';
  const institutionName = user?.institution?.shortName || user?.institution?.name || null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Manage your tutor profile and account settings
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

      {/* Tutor Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Tutor Status
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Verification Status</span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              tutorProfile?.isVerified
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              {tutorProfile?.isVerified ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Pending
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active Status</span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              tutorProfile?.isActive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}>
              {tutorProfile?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Application Status</span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              application?.status === 'APPROVED'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : application?.status === 'REJECTED'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              {application?.status || 'Not Applied'}
            </span>
          </div>
        </div>
      </div>

      {/* Specialties Summary */}
      {tutorProfile?.specialties && tutorProfile.specialties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Specialties ({tutorProfile.specialties.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {tutorProfile.specialties.map((specialty: any) => (
              <span
                key={specialty.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
              >
                {specialty.course?.code}: {specialty.course?.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/tutor/specialties"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Manage Specialties</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Add or remove courses</p>
            </div>
          </a>
          <a
            href="/apply-as-tutor/status"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Application Status</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Check your application</p>
            </div>
          </a>
          <a
            href="/tutor/offerings"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Course Offerings</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">View your offerings</p>
            </div>
          </a>
          <a
            href="/tutor/reviews"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <User className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Reviews</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">See student feedback</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
