import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, BookOpen, GraduationCap, Presentation, FileText,
  Video, ClipboardList, FileQuestion, ChevronRight
} from 'lucide-react';
import { getProgrammeForExploration } from '@/lib/queries/exploration';

interface PageProps {
  params: { slug: string; code: string };
}

export default async function ProgrammePage({ params }: PageProps) {
  const programme = await getProgrammeForExploration(params.slug, params.code);

  if (!programme) {
    notFound();
  }

  // Group courses by year
  const coursesByYear: Record<number, typeof programme.courses> = {};
  for (const course of programme.courses) {
    const year = course.yearNumber || 0;
    if (!coursesByYear[year]) coursesByYear[year] = [];
    coursesByYear[year].push(course);
  }
  const sortedYears = Object.keys(coursesByYear)
    .map(Number)
    .filter((y) => y > 0)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/explore" className="hover:text-gray-900 dark:hover:text-gray-100">
          Explore
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link
          href={`/explore/${params.slug}`}
          className="hover:text-gray-900 dark:hover:text-gray-100"
        >
          {programme.institution.shortName || programme.institution.name}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 dark:text-gray-100">{programme.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          {programme.institution.logoUrl && (
            <img
              src={programme.institution.logoUrl}
              alt={programme.institution.name}
              className="w-12 h-12 rounded-xl object-contain bg-gray-50 dark:bg-gray-700 p-1"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {programme.name}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
              {programme.code && <span className="font-mono">{programme.code}</span>}
              {programme.faculty && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {programme.faculty.name}
                </span>
              )}
            </div>
          </div>
        </div>
        {programme.description && (
          <p className="mt-4 text-gray-600 dark:text-gray-300">{programme.description}</p>
        )}
      </div>

      {/* Courses by Year */}
      {sortedYears.length === 0 && programme.courses.length > 0 ? (
        <CourseList courses={programme.courses} institutionSlug={params.slug} label="All Courses" />
      ) : (
        <div className="space-y-8">
          {sortedYears.map((year) => (
            <CourseList
              key={year}
              courses={coursesByYear[year]}
              institutionSlug={params.slug}
              label={`Year ${year}`}
            />
          ))}
          {/* Courses without year */}
          {programme.courses.filter((c) => !c.yearNumber).length > 0 && (
            <CourseList
              courses={programme.courses.filter((c) => !c.yearNumber)}
              institutionSlug={params.slug}
              label="Other Courses"
            />
          )}
        </div>
      )}

      {programme.courses.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No courses yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Courses for this programme will appear here once added.
          </p>
        </div>
      )}
    </div>
  );
}

function CourseList({
  courses,
  institutionSlug,
  label,
}: {
  courses: Array<{
    id: string;
    code: string;
    title: string;
    description: string | null;
    _count: {
      lectureSlides: number;
      tutorialSheets: number;
      pastPapers: number;
      tests: number;
      assignments: number;
      quizzes: number;
      videos: number;
    };
  }>;
  institutionSlug: string;
  label: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{label}</h2>
      <div className="space-y-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/explore/${institutionSlug}/courses/${course.code}`}
            className="block p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  {course.code}: {course.title}
                </h3>
                {course.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-3">
                  {course._count.lectureSlides > 0 && (
                    <span className="flex items-center gap-1">
                      <Presentation className="w-3 h-3" />
                      {course._count.lectureSlides} slides
                    </span>
                  )}
                  {course._count.pastPapers > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {course._count.pastPapers} papers
                    </span>
                  )}
                  {course._count.videos > 0 && (
                    <span className="flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      {course._count.videos} videos
                    </span>
                  )}
                  {course._count.assignments > 0 && (
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" />
                      {course._count.assignments} assignments
                    </span>
                  )}
                  {course._count.quizzes > 0 && (
                    <span className="flex items-center gap-1">
                      <FileQuestion className="w-3 h-3" />
                      {course._count.quizzes} quizzes
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex-shrink-0 ml-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
