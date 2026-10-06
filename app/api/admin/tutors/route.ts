import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list all tutors (admin only)
export async function GET(req: NextRequest) {
  const admin = getAuthUser(['ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const universityId = searchParams.get('universityId');
  const active = searchParams.get('active');

  try {
    const tutors = await prisma.tutor.findMany({
      where: {
        ...(universityId && { universityId }),
        ...(active !== null && { isActive: active === 'true' }),
      },
      include: {
        university: { select: { code: true, name: true } },
        programme: { select: { name: true, shortName: true } },
        specialties: {
          include: { course: { select: { code: true, title: true } } },
        },
        _count: { select: { requests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tutors);
  } catch (err) {
    console.error('Failed to list tutors:', err);
    return NextResponse.json({ error: 'Failed to list tutors' }, { status: 500 });
  }
}

// POST — create a tutor (admin only)
export async function POST(req: NextRequest) {
  const admin = getAuthUser(['ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      bio,
      avatarUrl,
      universityId,
      programmeId,
      branchId,
      yearsExperience,
      availability,
      mode,
      isVerified,
      isActive,
      specialties,
    } = body;

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const tutor = await prisma.tutor.create({
      data: {
        fullName,
        email,
        phone,
        bio,
        avatarUrl,
        universityId,
        programmeId,
        branchId,
        yearsExperience: yearsExperience || 0,
        availability,
        mode: mode || 'online',
        isVerified: isVerified || false,
        isActive: isActive !== undefined ? isActive : true,
        specialties: specialties
          ? {
              create: specialties.map((s: any) => ({
                courseId: s.courseId,
                personalEnabled: s.personalEnabled ?? true,
                personalRate: s.personalRate ? parseFloat(s.personalRate) : null,
                groupEnabled: s.groupEnabled ?? false,
                groupRate: s.groupRate ? parseFloat(s.groupRate) : null,
                groupMinSize: s.groupMinSize,
                groupMaxSize: s.groupMaxSize,
                currency: s.currency || 'ZMW',
                notes: s.notes,
              })),
            }
          : undefined,
      },
      include: {
        specialties: { include: { course: { select: { code: true, title: true } } } },
        university: { select: { code: true, name: true } },
      },
    });

    return NextResponse.json(tutor, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create tutor:', err);
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create tutor' }, { status: 500 });
  }
}
