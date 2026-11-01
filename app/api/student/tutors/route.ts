import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET — browse tutors (public, students can filter)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const universityId = searchParams.get('universityId');
  const course = searchParams.get('course');
  const sessionType = searchParams.get('sessionType');

  try {
    const tutors = await prisma.tutor.findMany({
      where: {
        isActive: true,
        ...(universityId && { institutionId: universityId }),
        ...(sessionType && {
          specialties: {
            some: {
              ...(sessionType === 'PERSONAL' && { personalEnabled: true }),
              ...(sessionType === 'GROUP' && { groupEnabled: true }),
            },
          },
        }),
      },
      include: {
        institution: { select: { name: true } },
        programme: { select: { name: true, shortName: true } },
        specialties: {
          include: { course: { select: { code: true, title: true } } },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    // Filter by course if specified
    let filtered = tutors;
    if (course) {
      filtered = tutors.filter((t) =>
        t.specialties.some((s) =>
          s.course.code.toLowerCase().includes(course.toLowerCase()) ||
          s.course.title.toLowerCase().includes(course.toLowerCase())
        )
      );
    }

    return NextResponse.json(filtered);
  } catch (err) {
    console.error('Failed to list tutors:', err);
    return NextResponse.json({ error: 'Failed to list tutors' }, { status: 500 });
  }
}
