export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth';
import { getScopeContext, isResourceInScope } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, PlayCircle, Video, Presentation, FileQuestion, FileCheck, Users, BarChart3 } from 'lucide-react';

interface PageProps {
  params: Promise<{ courseId: string }>;  // ✅ Changed from 'id' to 'courseId'
}

export default async function StudentCourseDetailPage({ params }: PageProps) {
  const { userId } = await requireAuth(['STUDENT']);
  const { courseId } = await params;

  // SECURITY: Resolve user's academic scope to prevent IDOR
  const scope = await getScopeContext();

  // Check if student is enrolled with error handling
  let enrollmentData: any = null;
  try {
    enrollmentData = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });
  } catch (err) {
    console.error('[StudentCourseDetail] Failed to fetch enrollment:', err);
  }

  if (!enrollmentData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Not Enrolled</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          You need to enroll in this course to access the content.
        </p>
        <Link
          href="/student/courses"
          className="inline-block mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Courses
        </Link>
      </div>
    );
  }

  let courseData: any = null;
  try {
    courseData = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                video: true,
                slides: true,
                quiz: true,
              },
            },
          },
        },
        creator: {
          select: { name: true },
        },
      },
    });
  } catch (err) {
    console.error('[StudentCourseDetail] Failed to fetch course:', err);
  }

  if (!courseData || !courseData.isPublished) {
    notFound();
  }

  // SECURITY: Block if the course is not in the user's scope
  if (!isResourceInScope(scope, courseData.universityId ?? null)) {
    notFound();
  }

  // Convert dates to strings with null safety
  const course = {
    ...courseData,
    createdAt: courseData.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: courseData.updatedAt?.toISOString() ?? new Date().toISOString(),
    modules: (Array.isArray(courseData.modules) ? courseData.modules : []).map((module: any) => ({
      ...module,
      createdAt: module.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: module.updatedAt?.toISOString() ?? new Date().toISOString(),
      lessons: (Array.isArray(module.lessons) ? module.lessons : []).map((lesson: any) => ({
        ...lesson,
        createdAt: lesson.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: lesson.updatedAt?.toISOString() ?? new Date().toISOString(),
      })),
    })),
  };

  const enrollment = {
    ...enrollmentData,
    enrolledAt: enrollmentData.enrolledAt?.toISOString() ?? new Date().toISOString(),
  };

  const totalLessons = course.modules.reduce(
    (acc: number, module: any) => acc + module.lessons.length,
    0
  );

  // Fetch assessments for this course with error handling
  let assessments: any[] = [];
  try {
    assessments = await prisma.assessment.findMany({
      where: { courseId, isPublished: true },
      select: {
        id: true,
        title: true,
        type: true,
        mode: true,
        timeLimit: true,
        openAt: true,
        closeAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('[StudentCourseDetail] Failed to fetch assessments:', err);
  }

  // Fetch student's attempts for this course's assessments with error handling
  let studentAttempts: any[] = [];
  try {
    studentAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        userId,
        assessment: { courseId },
      },
      select: {
        id: true,
        assessmentId: true,
        score: true,
        totalPoints: true,
        percentage: true,
        submittedAt: true,
      },
    });
  } catch (err) {
    console.error('[StudentCourseDetail] Failed to fetch attempts:', err);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Courses
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                {course.code}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {enrollment.progress || 0}% Complete
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                {course.description}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {course.creator.name || 'Unknown'}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {course.modules.length} modules • {totalLessons} lessons
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Course Progress</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {enrollment.progress || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${enrollment.progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Course Content</h2>

        {course.modules.map((module: any, index: number) => (
          <div
            key={module.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                      Module {index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      {module.lessons.length} lessons
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-1">
                    {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {module.description}
                    </p>
                  )}
                </div>
              </div>

              {module.lessons.length > 0 && (
                <div className="mt-4 space-y-2">
                  {module.lessons.map((lesson: any) => (
                    <Link
                      key={lesson.id}
                      href={`/student/lessons/${lesson.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          {lesson.order + 1}.
                        </span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {lesson.title}
                        </span>
                        <div className="flex items-center gap-1">
                          {lesson.video && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Video
                            </span>
                          )}
                          {lesson.slides && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded flex items-center gap-1">
                              <Presentation className="w-3 h-3" />
                              Slides
                            </span>
                          )}
                          {lesson.quiz && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded flex items-center gap-1">
                              <FileQuestion className="w-3 h-3" />
                              Quiz
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          View →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assessments Section */}
      {assessments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Assessments
          </h2>
          <div className="space-y-3">
            {assessments.map((a) => {
              const attempt = studentAttempts.find((at) => at.assessmentId === a.id);
              return (
                <div
                  key={a.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {a.title}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {a.type.replace(/_/g, ' ')}
                      </span>
                      {a.mode === 'GOOGLE_FORM' && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          External
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {a.timeLimit ? `${a.timeLimit} min · ` : ''}
                      Max {a.mode === 'NATIVE' ? 'native' : 'external'} assessment
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {attempt ? (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Scored {attempt.percentage}%
                      </span>
                    ) : null}
                    <Link
                      href={`/assessments/${a.id}`}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {attempt ? 'Review' : 'Start'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}