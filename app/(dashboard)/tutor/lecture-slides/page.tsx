import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildCourseResourceScopeWhere } from '@/lib/auth/scope';
import { Presentation, Calendar, Users, FileText } from 'lucide-react';

export default async function TutorLectureSlidesPage() {
  const { user } = await requireAuth(['TUTOR']);

  const scope = {
    userId: user.id,
    role: user.role,
    universityId: user.universityId,
    institutionId: user.institutionId,
    year: user.year,
    period: user.period,
    mode: (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'ADMIN' : 'OWN',
    readOnly: false,
  };
  const where = buildCourseResourceScopeWhere(scope);

  let slidesData: any[] = [];
  try {
    slidesData = await prisma.lectureSlide.findMany({
      where,
      include: {
        course: {
          select: { code: true, title: true },
        },
        creator: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (err) {
    console.error('[TutorLectureSlides] Failed to fetch slides:', err);
  }

  const slides = (Array.isArray(slidesData) ? slidesData : []).map((s: any) => ({
    ...s,
    createdAt: s.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lecture Slides</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          View published lecture slides you can reference for tutoring
        </p>
      </div>

      {slides.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Presentation className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No lecture slides available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Lecture slides will appear here when they are published
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slides.map((slide: any) => (
            <div
              key={slide.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Presentation className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                      {slide.course?.code}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {slide.course?.title}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {slide.title}
                  </h3>
                  {slide.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {slide.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {slide.creator?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(slide.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
