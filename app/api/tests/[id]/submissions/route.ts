// app/api/tests/[id]/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN']);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        submissions: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                clerkId: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    return NextResponse.json(test);
  } catch (error) {
    console.error('[test-submissions] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}