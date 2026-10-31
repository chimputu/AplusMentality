import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list students for dropdown (admin only)
export async function GET(req: NextRequest) {
  // SECURITY: Include SUPER_ADMIN in allowed roles
  const admin = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', data: [], count: 0 }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institutionId');

    const where: any = { role: 'STUDENT' };

    // SECURITY: ADMIN is scoped to their institution; SUPER_ADMIN can see all
    if (admin.role === 'SUPER_ADMIN') {
      if (institutionId) where.institutionId = institutionId;
    } else {
      // ADMIN can only see students in their own institution
      where.institutionId = admin.user.institutionId;
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json({ data: students, count: students.length });
  } catch (err) {
    console.error('[admin/students GET] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch students', data: [], count: 0 },
      { status: 500 }
    );
  }
}
