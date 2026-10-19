import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GraduationCap, BookOpen, Clock, Users } from 'lucide-react';

export default async function TutorOfferingsPage() {
  const { userId } = await requireAuth(['TUTOR']);

  // Fetch tutor profile and application with offerings
  let tutorProfile: any = null;
  let application: any = null;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
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
          },
        }),
      ]);
    }
  } catch (err) {
    console.error('[TutorOfferings] Failed to fetch data:', err);
  }

  if (!tutorProfile && !application) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <GraduationCap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No offerings found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Complete your tutor application to start managing course offerings.
          </p>
        </div>
      </div>
    );
  }

  const offerings = application?.offerings || [];
  const specialties = tutorProfile?.specialties || [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Offerings</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Manage your course offerings and tutoring availability
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Course Offerings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{offerings.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Specialties</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{specialties.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">
                {application?.status || 'N/A'}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Offerings List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Course Offerings
        </h2>

        {offerings.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No course offerings yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Your course offerings from your application will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offerings.map((offering: any) => (
              <div
                key={offering.id}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {offering.course?.code}: {offering.course?.title}
                    </p>
                    {offering.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {offering.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {offering.hourlyRate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ${offering.hourlyRate}/hr
                    </span>
                  )}
                  {offering.availability && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {offering.availability}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Your Specialties
          </h2>
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty: any) => (
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
