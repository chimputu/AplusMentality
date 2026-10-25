import { requireAuth } from '@/lib/auth';
import { getScopeContext, buildCourseScopeWhere } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Search, Video, PlayCircle, ArrowRight } from 'lucide-react';

// Client-side search form that navigates with URL query params
function SearchForm({ initialQuery }: { initialQuery: string }) {
  return (
    <form action="/student/videos" method="get" className="relative">
      <input
        type="search"
        name="search"
        defaultValue={initialQuery}
        placeholder="Search courses... (e.g. Python, Math, Physics)"
        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    </form>
  );
}

export default async function StudentVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ university?: string; search?: string }>;
}) {
  await requireAuth(['STUDENT']);
  const scope = await getScopeContext();
  const params = await searchParams;
  const universityId = params.university || null;
  const searchQuery = params.search || '';

  // Fetch distinct courses that have at least one video, scoped to the student's university/year/period
  let coursesData: any[] = [];
  try {
    const scopeWhere = buildCourseScopeWhere(scope);
    coursesData = await prisma.course.findMany({
      where: {
        ...scopeWhere,
        ...(universityId ? { universityId } : {}),
        ...(searchQuery
          ? {
              OR: [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { code: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
              ],
            }
          : {}),
        videos: { some: {} }, // only courses with at least one video
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        _count: { select: { videos: true } },
      },
      orderBy: { title: 'asc' },
    });
  } catch (err) {
    console.error('[StudentVideos] Failed to fetch courses:', err);
  }

  const courses = Array.isArray(coursesData) ? coursesData : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Videos</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Browse videos organized by course
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchForm initialQuery={searchQuery} />
      </div>

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No videos available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Check back later for new video content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/student/videos/${course.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                      {course.code}
                    </span>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-3 line-clamp-2">
                      {course.title}
                    </h3>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                    <PlayCircle className="w-5 h-5 text-white" />
                  </div>
                </div>

                {course.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <Video className="w-4 h-4" />
                    {course._count.videos} {course._count.videos === 1 ? 'video' : 'videos'}
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition flex items-center gap-1">
                    View videos
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}