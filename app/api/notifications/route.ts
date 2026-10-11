// app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ count: 0, items: [] }, { status: 200 });
    }

    // Fetch recent items from all content types + tutor applications + seen records
    const [announcements, tests, quizzes, assignments, tutorApplications, seenRecords] =
      await Promise.all([
        prisma.announcement.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            author: { select: { name: true } },
          },
        }),

        prisma.test.findMany({
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            creator: { select: { name: true } },
          },
        }),

        prisma.quiz.findMany({
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            creator: { select: { name: true } },
          },
        }),

        prisma.assignment.findMany({
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            creator: { select: { name: true } },
          },
        }),

        // Tutor application notifications for the current user
        prisma.tutorApplication.findMany({
          where: { userId: auth.userId },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            rejectionReason: true,
            adminNotes: true,
            updatedAt: true,
          },
        }),

        // Get all IDs this user has already seen
        prisma.notificationSeen.findMany({
          where: { userId: auth.userId },
          select: { notificationId: true },
        }),
      ]);

    const seenSet = new Set(seenRecords.map((r) => r.notificationId));

    // Combine all items with prefixed IDs
    const allItems = [
      ...announcements.map((a) => ({
        id: `announcement_${a.id}`,
        rawId: a.id,
        type: 'announcement',
        title: a.title,
        description: a.content.slice(0, 120),
        createdAt: a.createdAt.toISOString(),
        author: a.author?.name || 'Admin',
      })),

      ...tests.map((t) => ({
        id: `test_${t.id}`,
        rawId: t.id,
        type: 'test',
        title: t.title,
        description: (t.description || '').slice(0, 120),
        createdAt: t.createdAt.toISOString(),
        author: t.creator?.name || 'Admin',
      })),

      ...quizzes.map((q) => ({
        id: `quiz_${q.id}`,
        rawId: q.id,
        type: 'quiz',
        title: q.title,
        description: (q.description || '').slice(0, 120),
        createdAt: q.createdAt.toISOString(),
        author: q.creator?.name || 'Admin',
      })),

      ...assignments.map((a) => ({
        id: `assignment_${a.id}`,
        rawId: a.id,
        type: 'assignment',
        title: a.title,
        description: (a.description || '').slice(0, 120),
        createdAt: a.createdAt.toISOString(),
        author: a.creator?.name || 'Admin',
      })),

      // Tutor application status notifications
      ...tutorApplications.map((ta) => {
        let title = 'Tutor Application';
        let description = '';
        switch (ta.status) {
          case 'PENDING':
            description = 'Your tutor application is pending review.';
            break;
          case 'UNDER_REVIEW':
            description = 'Your tutor application is under review.';
            break;
          case 'APPROVED':
            title = '🎉 Tutor Application Approved';
            description = 'Congratulations! Your tutor application has been approved.';
            break;
          case 'REJECTED':
            title = 'Tutor Application Update';
            description = ta.rejectionReason?.slice(0, 120) || 'Your application was not approved.';
            break;
          case 'WITHDRAWN':
            description = 'Your tutor application has been withdrawn.';
            break;
        }
        if (ta.adminNotes && ta.status === 'PENDING') {
          description = `Admin note: ${ta.adminNotes.slice(0, 120)}`;
        }
        return {
          id: `tutor_app_${ta.id}`,
          rawId: ta.id,
          type: 'tutor_application',
          title,
          description,
          createdAt: ta.updatedAt.toISOString(),
          author: 'A+ Mentality',
        };
      }),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 30); // show latest 30

    // Mark each item as seen/unseen
    const items = allItems.map((item) => ({
      ...item,
      seen: seenSet.has(item.id),
    }));

    // Count unseen
    const unseenCount = items.filter((i) => !i.seen).length;

    return NextResponse.json({
      count: unseenCount,
      items,
    });
  } catch (error) {
    console.error('[notifications GET] Error:', error);
    return NextResponse.json({ count: 0, items: [] }, { status: 500 });
  }
}