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

    // Fetch recent items from all 4 content types + seen records
    const [announcements, tests, quizzes, assignments, seenRecords] =
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