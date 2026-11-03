import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list all tutor requests (admin only)
export async function GET(req: NextRequest) {
  const admin = getAuthUser(['ADMIN', 'SUPER_ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const sessionType = searchParams.get('sessionType');

  try {
    const requests = await prisma.tutorRequest.findMany({
      where: {
        ...(status && { status }),
        ...(sessionType && { sessionType }),
      },
      include: {
        tutor: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (err) {
    console.error('Failed to list tutor requests:', err);
    return NextResponse.json({ error: 'Failed to list requests' }, { status: 500 });
  }
}
