// app/api/notifications/mark-all-seen/route.ts
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the same items that /api/notifications returns
    const [announcements, tests, quizzes, assignments] = await Promise.all([
      prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true },
      }),
      prisma.test.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true },
      }),
      prisma.quiz.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true },
      }),
      prisma.assignment.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true },
      }),
    ]);

    // Build prefixed IDs (matching the format used in /api/notifications)
    const allIds = [
      ...announcements.map((a) => `announcement_${a.id}`),
      ...tests.map((t) => `test_${t.id}`),
      ...quizzes.map((q) => `quiz_${q.id}`),
      ...assignments.map((a) => `assignment_${a.id}`),
    ];

    // Insert all as seen. skipDuplicates avoids errors for items already seen.
    await prisma.notificationSeen.createMany({
      data: allIds.map((notificationId) => ({
        userId: auth.userId,
        notificationId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      ok: true,
      marked: allIds.length,
    });
  } catch (error) {
    console.error('[mark-all-seen] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark all as seen' },
      { status: 500 }
    );
  }
}