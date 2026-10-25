// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getScopeContext, buildCourseScopeWhere, buildCourseResourceScopeWhere } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json([], { status: 200 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    const isAdmin = auth.role === 'ADMIN';
    const prefix = isAdmin ? '/admin' : '/student';

    // SECURITY: Resolve user's academic scope to filter search results
    const scope = await getScopeContext();
    const courseScope = buildCourseScopeWhere(scope);
    const resourceScope = buildCourseResourceScopeWhere(scope);

    // Run all searches in parallel
    const [
      announcements,
      videos,
      pastPapers,
      courses,
      lectureSlides,
      quizzes,
      tests,
      assignments,
    ] = await Promise.all([
      // Announcements (global, not scoped)
      prisma.announcement.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, content: true },
      }),

      // Videos — scoped to user's university courses
      prisma.video.findMany({
        where: {
          ...resourceScope,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, description: true },
      }),

      // Past Papers — scoped to user's university courses
      prisma.pastPaper.findMany({
        where: {
          ...resourceScope,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { courseCode: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          courseCode: true,
          category: true,
        },
      }),

      // Courses — scoped to user's university, year, semester
      prisma.course.findMany({
        where: {
          ...(isAdmin ? {} : courseScope),
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, code: true, description: true },
      }),

      // Lecture Slides — scoped to user's university courses
      prisma.lectureSlide.findMany({
        where: {
          ...resourceScope,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, description: true },
      }),

      // Quizzes — scoped to user's university courses
      prisma.quiz.findMany({
        where: {
          ...(isAdmin ? {} : { isPublished: true }),
          ...resourceScope,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, description: true },
      }),

      // Tests — scoped to user's university courses
      prisma.test.findMany({
        where: {
          ...(isAdmin ? {} : { isPublished: true }),
          ...resourceScope,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, description: true },
      }),

      // Assignments — scoped to user's university courses
      prisma.assignment.findMany({
        where: {
          ...(isAdmin ? {} : { isPublished: true }),
          ...resourceScope,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, description: true },
      }),
    ]);

    // Format all results into a unified shape
    const results = [
      ...announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        type: 'announcement',
        href: `${prefix}/announcements`,
      })),

      ...videos.map((v) => ({
        id: v.id,
        title: v.title,
        content: v.description,
        type: 'video',
        href: `${prefix}/videos`,
      })),

      ...pastPapers.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.courseCode
          ? `${p.courseCode} · ${p.category}`
          : p.category,
        type: 'past_paper',
        href: `${prefix}/past-papers`,
      })),

      ...courses.map((c) => ({
        id: c.id,
        title: c.title,
        content: c.code,
        type: 'course',
        href: isAdmin ? `/admin/courses/${c.id}` : `/student/courses/${c.id}`,
      })),

      ...lectureSlides.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.description,
        type: 'lecture_slide',
        href: isAdmin
          ? `/admin/lecture-slides/${s.id}`
          : `/student/lecture-slides/${s.id}`,
      })),

      ...quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        content: q.description,
        type: 'quiz',
        href: isAdmin ? `/admin/quizzes/${q.id}` : `/student/quizzes/${q.id}`,
      })),

      ...tests.map((t) => ({
        id: t.id,
        title: t.title,
        content: t.description,
        type: 'test',
        href: isAdmin ? `/admin/tests/${t.id}` : `/student/tests/${t.id}`,
      })),

      ...assignments.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.description,
        type: 'assignment',
        href: isAdmin
          ? `/admin/assignments/${a.id}`
          : `/student/assignments/${a.id}`,
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json([], { status: 200 });
  }
}