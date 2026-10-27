// app/(dashboard)/student/materials/[category]/page.tsx
import { requireAuth } from '@/lib/auth';
import { getCoursesWithMaterials } from '@/lib/actions/materials';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Search, FileText, ArrowRight, Presentation, PlayCircle, BookOpen } from 'lucide-react';

const VALID_CATEGORIES = ['slides', 'videos', 'past-papers', 'tutorials'];

const CATEGORY_LABELS: Record<string, string> = {
  slides: 'Lecture Slides',
  videos: 'Videos',
  'past-papers': 'Past Papers',
  tutorials: 'Tutorials',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  slides: Presentation,
  videos: PlayCircle,
  'past-papers': FileText,
  tutorials: BookOpen,
};

// Client-side search form
function SearchForm({ initialQuery }: { initialQuery: string }) {
  return (
    <form action="" method="get" className="relative">
      <input
        type="search"
        name="search"
        defaultValue={initialQuery}
        placeholder="Search courses..."
        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    </form>
  );
}

export default async function CategoryCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  await requireAuth(['STUDENT']);

  const { category } = await params;
  const sp = await searchParams;
  const searchQuery = sp.search || '';

  // Validate category slug
  if (!VALID_CATEGORIES.includes(category)) {
    redirect('/student/materials');
  }

  const categoryLabel = CATEGORY_LABELS[category];
  const Icon = CATEGORY_ICONS[category];

  // Fetch courses with materials via server action
  let coursesData: any[] = [];
  try {
    coursesData = await getCoursesWithMaterials(category, searchQuery || undefined);
  } catch (err) {
    console.error(`[CategoryCoursePage] Failed to fetch courses for ${category}:`, err);
  }

  const courses = Array.isArray(coursesData) ? coursesData : [];

  // Get the count field name for this category
  const countFieldMap: Record<string, string> = {
    slides: 'lectureSlides',
    videos: 'videos',
    'past-papers': 'pastPapers',
    tutorials: 'tutorialSheets',
  };
  const countField = countFieldMap[category];

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/student/materials"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Materials
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {categoryLabel}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Browse {categoryLabel.toLowerCase()} organized by course
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchForm initialQuery={searchQuery} />
      </div>

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {searchQuery
              ? `No courses match your search`
              : `No courses with ${categoryLabel.toLowerCase()} for your current period`}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {searchQuery
              ? 'Try a different search term.'
              : `No ${categoryLabel.toLowerCase()} have been uploaded for your year and semester yet. Check back later.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const count = course._count?.[countField] || 0;
            return (
              <Link
                key={course.id}
                href={`/student/materials/${category}/${course.id}`}
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
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {course.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition flex items-center gap-1">
                      View files
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
