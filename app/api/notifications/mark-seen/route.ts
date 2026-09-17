// app/api/notifications/mark-seen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    // Insert a seen record. If it already exists, do nothing.
    await prisma.notificationSeen.upsert({
      where: {
        userId_notificationId: {
          userId: auth.userId,
          notificationId,
        },
      },
      create: {
        userId: auth.userId,
        notificationId,
      },
      update: {}, // no-op if already seen
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[mark-seen] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark as seen' },
      { status: 500 }
    );
  }
}