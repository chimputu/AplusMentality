import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, ChevronRight, Presentation, FileText, Video,
  ClipboardList, FileQuestion, BookOpen, Lock, User, MessageSquare,
  GraduationCap
} from 'lucide-react';
import { getCourseForExploration } from '@/lib/queries/exploration';

interface PageProps {
  params: { slug: string; code: string };
}

export default async function CoursePreviewPage({ params }: PageProps) {
  const course = await getCourseForExploration(params.slug, params.code);

  if (!course) {
    notFound();
  }

  const isExploring = course.viewerIsExploring;
  const hasPreviewSlides = course.lectureSlides.length > 0;
  const hasPreviewTutorials = course.tutorialSheets.length > 0;
  const hasPreviewPapers = course.pastPapers.length > 0;
  const hasPreviewTests = course.tests.length > 0;
  const hasPreviewAssignments = course.assignments.length > 0;
  const hasPreviewQuizzes = course.quizzes.length > 0;
  const hasPreviewVideos = course.videos.length > 0;
  const hasAnyPreview = hasPreviewSlides || hasPreviewTutorials || hasPreviewPapers ||
    hasPreviewTests || hasPreviewAssignments || hasPreviewQuizzes || hasPreviewVideos;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/explore" className="hover:text-gray-900 dark:hover:text-gray-100">
          Explore
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link
          href={`/explore/${params.slug}`}
          className="hover:text-gray-900 dark:hover:text-gray-100"
        >
          {course.institution.shortName || course.institution.name}
        </Link>
        {course.programme && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/explore/${params.slug}/programmes/${course.programme.code || ''}`}
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              {course.programme.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 dark:text-gray-100">{course.code}</span>
      </nav>

      {/* Exploration banner */}
      {isExploring && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              You&apos;re exploring {course.institution.shortName || course.institution.name}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              You&apos;re viewing preview content from another institution. Only materials marked as preview are visible.
            </p>
          </div>
          <Link
            href="/student"
            className="text-xs text-amber-700 dark:text-amber-300 hover:underline flex-shrink-0"
          >
            Exit exploration
          </Link>
        </div>
      )}

      {/* Course header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          {course.institution.logoUrl && (
            <img
              src={course.institution.logoUrl}
              alt={course.institution.name}
              className="w-12 h-12 rounded-xl object-contain bg-gray-50 dark:bg-gray-700 p-1"
            />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {course.code}: {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
              {course.yearNumber && (
                <span>Year {course.yearNumber}</span>
              )}
              {course.faculty && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {course.faculty.name}
                </span>
              )}
            </div>
            {course.description && (
              <p className="mt-3 text-gray-600 dark:text-gray-300">{course.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tutors */}
      {course.tutorSpecialties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Tutors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.tutorSpecialties.map((ts, i) => {
              const tutor = ts.tutor;
              if (!tutor) return null;
              return (
                <div
                  key={ts.id || i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700"
                >
                  {tutor.imageUrl ? (
                    <img
                      src={tutor.imageUrl}
                      alt={`${tutor.firstName} ${tutor.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {tutor.firstName || ''} {tutor.lastName || ''}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{ts.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {isExploring && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Contact a tutor to request access to full course materials.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview Content */}
      {hasAnyPreview && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isExploring ? 'Preview Content' : 'Course Materials'}
          </h2>

          {/* Lecture Slides */}
          {hasPreviewSlides && (
            <MaterialSection
              title="Lecture Slides"
              icon={<Presentation className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              items={course.lectureSlides.map((s) => ({
                id: s.id,
                title: s.title,
                url: s.fileUrl || s.embedUrl || undefined,
              }))}
              totalCount={course._count.lectureSlides}
              previewCount={course.lectureSlides.length}
              isExploring={isExploring}
            />
          )}

          {/* Tutorial Sheets */}
          {hasPreviewTutorials && (
            <MaterialSection
              title="Tutorial Sheets"
              icon={<BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />}
              items={course.tutorialSheets.map((t) => ({
                id: t.id,
                title: t.title,
                url: t.url,
              }))}
              totalCount={course._count.tutorialSheets}
              previewCount={course.tutorialSheets.length}
              isExploring={isExploring}
            />
          )}

          {/* Past Papers */}
          {hasPreviewPapers && (
            <MaterialSection
              title="Past Papers"
              icon={<FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
              items={course.pastPapers.map((p) => ({
                id: p.id,
                title: p.title,
                url: p.fileUrl,
              }))}
              totalCount={course._count.pastPapers}
              previewCount={course.pastPapers.length}
              isExploring={isExploring}
            />
          )}

          {/* Videos */}
          {hasPreviewVideos && (
            <MaterialSection
              title="Videos"
              icon={<Video className="w-5 h-5 text-red-600 dark:text-red-400" />}
              items={course.videos.map((v) => ({
                id: v.id,
                title: v.title,
                url: v.url,
              }))}
              totalCount={course._count.videos}
              previewCount={course.videos.length}
              isExploring={isExploring}
            />
          )}

          {/* Tests */}
          {hasPreviewTests && (
            <MaterialSection
              title="Tests"
              icon={<FileQuestion className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
              items={course.tests.map((t) => ({
                id: t.id,
                title: t.title,
              }))}
              totalCount={course._count.tests}
              previewCount={course.tests.length}
              isExploring={isExploring}
            />
          )}

          {/* Assignments */}
          {hasPreviewAssignments && (
            <MaterialSection
              title="Assignments"
              icon={<ClipboardList className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
              items={course.assignments.map((a) => ({
                id: a.id,
                title: a.title,
              }))}
              totalCount={course._count.assignments}
              previewCount={course.assignments.length}
              isExploring={isExploring}
            />
          )}

          {/* Quizzes */}
          {hasPreviewQuizzes && (
            <MaterialSection
              title="Quizzes"
              icon={<FileQuestion className="w-5 h-5 text-pink-600 dark:text-pink-400" />}
              items={course.quizzes.map((q) => ({
                id: q.id,
                title: q.title,
              }))}
              totalCount={course._count.quizzes}
              previewCount={course.quizzes.length}
              isExploring={isExploring}
            />
          )}
        </div>
      )}

      {/* Locked section */}
      {isExploring && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            Locked Content
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LockedCount
              label="Lecture Slides"
              locked={course._count.lectureSlides - course.lectureSlides.length}
            />
            <LockedCount
              label="Tutorial Sheets"
              locked={course._count.tutorialSheets - course.tutorialSheets.length}
            />
            <LockedCount
              label="Past Papers"
              locked={course._count.pastPapers - course.pastPapers.length}
            />
            <LockedCount
              label="Videos"
              locked={course._count.videos - course.videos.length}
            />
            <LockedCount
              label="Tests"
              locked={course._count.tests - course.tests.length}
            />
            <LockedCount
              label="Assignments"
              locked={course._count.assignments - course.assignments.length}
            />
            <LockedCount
              label="Quizzes"
              locked={course._count.quizzes - course.quizzes.length}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      {isExploring && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/student"
            className="flex-1 text-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            Back to My Dashboard
          </Link>
          {course.tutorSpecialties.length > 0 && (
            <button
              type="button"
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Contact Tutor
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasAnyPreview && !isExploring && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No materials yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Materials for this course will appear here once uploaded.
          </p>
        </div>
      )}

      {!hasAnyPreview && isExploring && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Lock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No preview available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            This course doesn&apos;t have any preview materials. Contact a tutor to request access.
          </p>
        </div>
      )}
    </div>
  );
}

function MaterialSection({
  title,
  icon,
  items,
  totalCount,
  previewCount,
  isExploring,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ id: string; title: string; url?: string }>;
  totalCount: number;
  previewCount: number;
  isExploring: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          {icon}
          {title}
          {isExploring && (
            <span className="text-xs font-normal text-gray-400">
              ({previewCount} of {totalCount})
            </span>
          )}
        </h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{item.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function LockedCount({ label, locked }: { label: string; locked: number }) {
  if (locked <= 0) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <Lock className="w-4 h-4 text-gray-300 dark:text-gray-600" />
      <span>{locked} {label.toLowerCase()}</span>
    </div>
  );
}
