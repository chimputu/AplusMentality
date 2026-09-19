// app/api/users/me/theme/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — return current user's theme
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ theme: 'system' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
      select: { theme: true },
    });

    return NextResponse.json({
      theme: user?.theme || 'system',
    });
  } catch (error) {
    console.error('[theme GET] Error:', error);
    return NextResponse.json({ theme: 'system' });
  }
}

// PUT — save current user's theme
export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { theme } = body;

    if (!['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme. Must be "light", "dark", or "system".' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { clerkId: auth.userId },
      data: { theme },
    });

    return NextResponse.json({ ok: true, theme });
  } catch (error) {
    console.error('[theme PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    );
  }
}